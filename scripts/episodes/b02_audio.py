import os
import numpy as np, soundfile as sf, json
from scipy.signal import butter, sosfilt, fftconvolve
SR = 48000
TL = json.load(open(os.environ["EP_DIR"] + "/timeline.json"))
LN = TL["lines"]
ST = [l["start"] for l in LN]; W = [l["words"] for l in LN]
VEND, TOTAL = TL["voice_end"], TL["total"]
N = int(TOTAL * SR) + SR
rng = np.random.default_rng(3)
def t_(d): return np.arange(int(d * SR)) / SR
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def place(buf, x, t, g=1.0):
    i = int(t * SR); j = min(len(buf), i + len(x));
    if i < 0: x = x[-i:]; i = 0
    buf[i:j] += g * x[:j - i]
def midi(n): return 440 * 2 ** ((n - 69) / 12)
def word_t(line, word):
    for w, s, e in W[line]:
        if w.lower().strip(",.?'“”:").startswith(word): return s
    raise KeyError((line, word))

# synthetic reverb IR
def ir(dur=2.4, damp=3000):
    tt = t_(dur); n = rng.standard_normal(len(tt)) * np.exp(-tt * 3.2)
    n = lp(n, damp); n[:int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))
    return n / np.sqrt((n ** 2).sum())
IR = ir()
def reverb(x, wet=0.3):
    y = fftconvolve(x, IR)[:len(x)]
    return (1 - wet) * x + wet * y * 3

# ---------------- SFX ----------------
def boom(d=1.6):
    tt = t_(d); f = 62 * np.exp(-tt * 1.4) + 34
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-tt * 3.0)
    click = lp(rng.standard_normal(len(tt)), 2500) * np.exp(-tt * 40) * 0.35
    return (s + click) * 0.9
def whoosh(d=0.6, up=True):
    tt = t_(d); n = rng.standard_normal(len(tt))
    env = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 2
    out = np.zeros_like(n); seg = 512
    for k in range(0, len(n), seg):
        frac = k / len(n); fc = (500 + 3500 * frac) if up else (4000 - 3500 * frac)
        out[k:k + seg] = bp(n[k:k + seg + 0], max(150, fc * 0.6), min(20000, fc * 1.6))[:len(n[k:k + seg])]
    out = lp(hp(n, 300), 6000) * 0.0 + out
    return out * env * 0.5
def whoosh2(d=0.55):
    # smoother: filtered noise with moving band via STFT-free approach (two crossfaded bands)
    tt = t_(d); n = rng.standard_normal(len(tt))
    lo = bp(n, 300, 1400); hi = bp(n, 1800, 7000)
    x = tt / d; env = np.sin(np.pi * x) ** 2
    return (lo * (1 - x) + hi * x) * env * 0.55
def chime(f0=1318.5, d=2.2, g=1.0):
    tt = t_(d); s = np.zeros_like(tt)
    for k, (r, a, dec) in enumerate([(1, 1, 2.2), (2.76, 0.45, 3.5), (5.4, 0.25, 5), (8.9, 0.12, 7)]):
        s += a * np.sin(2 * np.pi * f0 * r * tt + k) * np.exp(-tt * dec)
    s *= np.minimum(1, tt / 0.004)
    return s * 0.28 * g
def shimmer(d=1.4):
    out = np.zeros(int(d * SR))
    for k, n in enumerate([86, 90, 93, 98]):
        c = chime(midi(n), d - k * 0.06, 0.55); place(out, c, k * 0.06)
    return out
def page_flutter(d=0.7):
    tt = t_(d); n = bp(rng.standard_normal(len(tt)), 1500, 8000)
    am = (np.sin(2 * np.pi * 18 * tt) > 0.2).astype(float); am = lp(am, 60)
    env = np.sin(np.pi * tt / d) ** 1.5
    return n * am * env * 0.25
def riser(d=1.8):
    tt = t_(d); n = rng.standard_normal(len(tt)); x = tt / d
    y = bp(n, 800, 6000) * x ** 2.2 * 0.35
    f = 220 + 660 * x ** 2; tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * x ** 2 * 0.08
    return y + tone
def ring_clink():
    return chime(2093, 1.6, 0.8) + chime(2637, 1.6, 0.5)



def knock(g=1.0):
    tt = t_(0.35); f = 120 * np.exp(-tt * 25) + 70
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 18)
    clk = bp(rng.standard_normal(len(tt)), 1500, 5000) * np.exp(-tt * 90) * 0.4
    return (body + clk) * 0.6 * g

# Track B · B02 Bismillah (1:1) — cues follow remotion/src/trackb/B02_Bismillah.tsx (storyboard in its header).
# VERSE windows (the hook's بِسْمِ اللَّهِ, line 3 = the whole verse, line 14 = بِسْمِ اللَّهِ): no music, and no SFX
# other than whooshes (whooshes go to a separate buffer; everything else is hard-muted in those windows).
def tick(g=1.0):
    tt = t_(0.12); return bp(rng.standard_normal(len(tt)), 2500, 7000) * np.exp(-tt * 70) * 0.5 * g
def pop(g=1.0):
    tt = t_(0.18); f = 900 * np.exp(-tt * 30) + 300
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 28) * 0.35 * g
def rumble(d=1.8):
    tt = t_(d); n = lp(rng.standard_normal(len(tt)), 160) * 2.5
    return n * np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 1.5 * 0.5
def step(g=1.0):
    tt = t_(0.09); f = 140 * np.exp(-tt * 40) + 60
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 45) + lp(rng.standard_normal(len(tt)), 1800) * np.exp(-tt * 60) * 0.3) * 0.5 * g
def wind(d):
    n = bp(rng.standard_normal(int(d * SR)), 300, 1400); tt = t_(d)
    return n * (0.6 + 0.4 * np.sin(2 * np.pi * 0.35 * tt)) * np.minimum(1, tt / 0.5) * np.minimum(1, (d - tt) / 0.6) * 0.16
def wt(i, p):
    for w, s_, e_ in W[i]:
        if w.lower().replace("\u00a0", " ").strip(",.?'’“”:").startswith(p): return s_
    raise KeyError((i, p))
sfx = np.zeros(N); sfw = np.zeros(N)
tStrength = wt(0, "strength"); tDrop = ST[1] - 0.5
place(sfw, whoosh2(0.4), 0.0, 0.16)                                                           # frame 1: first motion
place(sfx, pop(0.9), tStrength - 0.15, 0.36); place(sfx, knock(0.7), tStrength - 0.05, 0.3)   # the dumbbell pops into his fist
place(sfw, whoosh(0.3, up=False), tDrop, 0.22); place(sfx, boom(0.8), tDrop + 0.32, 0.42); place(sfx, knock(1.0), tDrop + 0.33, 0.4)   # set down: thud
for i in range(6): place(sfx, knock(0.8), ST[1] + 0.05 + (i + 1) * 0.15, 0.28)               # books land one by one
for i, f in enumerate((1318.5, 1568, 2093)): place(sfx, chime(f, 0.6), ST[2] + 0.2 + i * 0.22, 0.22)   # three stars
place(sfw, whoosh(1.2, up=True), ST[3] - 0.45, 0.3)                                            # the big pull-back (verse: whoosh only)
place(sfw, whoosh(0.45, up=False), ST[4] - 0.25, 0.3); place(sfx, boom(1.2), ST[4] + 0.15, 0.48); place(sfx, rumble(1.0), ST[4] + 0.2, 0.3)   # the load drops on him
place(sfw, whoosh(1.0, up=True), ST[6] + 0.05, 0.3); place(sfx, shimmer(1.2), ST[6] + 0.3, 0.32)   # the load lifts off
tH, tB, tM = wt(7, "help"), wt(7, "blessing"), wt(7, "mercy")
place(sfw, whoosh2(0.4), tH - 0.35, 0.2); place(sfx, knock(0.6), tH + 0.15, 0.3); place(sfx, chime(1046.5, 0.9), tH + 0.15, 0.2)   # lantern lands
place(sfx, shimmer(0.9), tB - 0.1, 0.24)                                                       # sprout grows
place(sfx, chime(1174.7, 1.2), tM - 0.05, 0.28)                                                # heart lights
place(sfx, chime(784, 1.4), ST[8] + 0.05, 0.18)                                                # mercy swells
place(sfx, knock(0.6), ST[8] + 0.35, 0.25)                                                     # the door stands up
place(sfw, whoosh2(0.6), wt(9, "opens") - 0.05, 0.3); place(sfx, shimmer(1.4), wt(9, "opens") + 0.25, 0.36)   # the door opens, light
place(sfw, whoosh(1.2, up=True), ST[10] - 0.1, 0.3); place(sfx, wind(ST[11] + 0.6 - ST[10]), ST[10], 0.9)    # pull-back: the cold tower, wind
place(sfx, rumble(1.2), ST[11] - 0.15, 0.4); place(sfw, whoosh(1.1, up=False), ST[11] - 0.25, 0.26)        # tower sinks, push-in
place(sfx, shimmer(1.4), wt(11, "mercy") - 0.2, 0.36)                                          # the dome of mercy
place(sfx, chime(987.8, 1.6), ST[12] - 0.2, 0.18)                                              # night
tb = wt(12, "repeat") - 0.35; place(sfx, pop(1.0), tb + 0.05, 0.4)
tt0 = tb + 0.3
while tt0 < ST[13] - 0.1: place(sfx, tick(0.6), tt0, 0.18); tt0 += 0.22                        # the loop spins (from memory)
place(sfx, pop(1.2), ST[13] - 0.05, 0.45); place(sfx, chime(1568, 1.2), ST[13] + 0.05, 0.22)   # the bubble pops: conversation
for j in range(4): place(sfx, chime([1318.5, 1568, 1760, 2093][j], 0.7), ST[13] + 0.2 + j * 0.3, 0.12)   # small lights going up
place(sfw, whoosh2(0.45), ST[14] - 0.45, 0.28)                                                 # callback (verse: whoosh only)
place(sfx, knock(0.8), ST[15] - 0.05, 0.32); place(sfx, rumble(0.9), wt(15, "his") - 0.05, 0.32)   # the dumbbell appears, sinks
for w in ("strength", "experience", "worthiness"): place(sfx, pop(1.1), wt(16, w) - 0.1, 0.42)   # the three choices
place(sfx, riser(1.0), ST[18] - 1.0, 0.32); place(sfx, boom(1.4), ST[18] - 0.05, 0.38); place(sfx, shimmer(1.4), ST[18] - 0.02, 0.4)   # end card
for a_, b_, gap, g in ((ST[1] - 0.4, ST[1] + 0.35, 0.17, 0.9), (ST[2] - 0.3, ST[2] + 0.35, 0.17, 0.9), (ST[4] + 0.55, ST[6] - 0.1, 0.32, 1.15),
                       (ST[8] + 0.25, ST[9] + 0.05, 0.17, 0.9), (ST[10] + 0.2, ST[11] - 0.3, 0.2, 0.8)):
    tt0 = a_ + 0.08
    while tt0 < b_ - 0.05: place(sfx, step(g), tt0, 0.3); tt0 += gap
place(sfw, whoosh(0.5, up=True), TOTAL - 0.6, 0.22)                                             # loop back to frame 1

# ---------------- music ----------------
BPM = 84; beat = 60 / BPM; bar = 4 * beat
# Hijaz-coloured progression in D: Dm | Bb | Gm | A(Hijaz V) repeated, final D
prog = [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]]
def saw(f, tt):
    return 2 * ((f * tt) % 1) - 1
def pad_note(f, d):
    tt = t_(d); s = np.zeros_like(tt)
    for det in (-0.08, 0.0, 0.07):
        s += saw(f * 2 ** (det / 12), tt)
    s = lp(s, 1400, 2)
    a = np.minimum(1, tt / 0.9); r = np.minimum(1, (d - tt) / 0.9); return s * a * r * 0.06
def pluck(f, d=1.6):
    n = int(SR / f); buf = rng.uniform(-1, 1, n); out = np.zeros(int(d * SR))
    for i in range(len(out)):
        out[i] = buf[i % n]; buf[i % n] = 0.996 * 0.5 * (buf[i % n] + buf[(i + 1) % n])
    return lp(out, 3500) * 0.22
def sub(f, d):
    tt = t_(d); return np.sin(2 * np.pi * f * tt) * np.minimum(1, tt / 0.3) * np.minimum(1, (d - tt) / 0.5) * 0.09
def softkick():
    tt = t_(0.5); f = 90 * np.exp(-tt * 18) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9) * 0.35
music = np.zeros(N)
t = 0.0; bi = 0
end_music = TOTAL
motif = [0, 3, 4, 7, 4, 3]  # relative scale steps feel: root, m3/aug2 colour
while t < end_music - 0.1 and os.environ.get("MUSIC", "hijaz") != "ambient":
    ch = prog[bi % 4] if t < VEND - 0.2 else [50, 54, 57]   # resolve to D major at end card
    d = min(2 * bar, end_music - t)
    for n_ in ch: place(music, pad_note(midi(n_ + 12), d + 0.6), t, 1.0)
    place(music, sub(midi(ch[0] - 12), d), t, 1.0)
    # sparse pluck arpeggio (oud/harp-like), denser after the midpoint
    steps = [0, 2, 3, 5] if t < ST[3] or t >= ST[11] - 0.5 else [0, 1, 2, 3, 4, 5, 6, 7]
    for s_ in steps:
        tt0 = t + s_ * beat
        if tt0 < end_music - 0.5:
            nn = ch[s_ % 3] + 24 + (12 if s_ in (5, 7) else 0)
            if ch == prog[3] and s_ == 3: nn = 46 + 24 + 12   # Bb over A: Hijaz b9 colour
            place(music, pluck(midi(nn)), tt0, 0.9)
    if ST[3] - 0.3 <= t < ST[11] - 0.5:   # gentle pulse while the five things compete; none in the prayer section
        for s_ in range(8):
            if t + s_ * beat < ST[11] - 0.5: place(music, softkick(), t + s_ * beat, 0.38 if s_ % 4 == 0 else 0.16)
    t += 2 * bar; bi += 1
music = reverb(music, 0.35)
d0, d1 = ST[12] - 0.3, ST[14] - 0.3   # the prayer section is quieter
env = np.ones(len(music)); tt_ = np.arange(len(music)) / SR
env = np.where((tt_ > d0) & (tt_ < d1), 0.35, 1.0); env = np.convolve(env, np.ones(int(0.25 * SR)) / int(0.25 * SR), mode="same")
music *= env
# Track B music v2 (scripts/trackb_music.py): MUSIC=ambient (default from B02) replaces the Hijaz pluck/pulse score
if os.environ.get("MUSIC", "hijaz") == "ambient":
    import sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
    from trackb_music import ambient
    music = ambient(TOTAL, [(0, "dawn"), (ST[1] - 0.2, "dusk"), (ST[3] - 0.2, "gold"), (ST[4] - 0.2, "dusk"), (ST[6], "gold"), (ST[10], "dusk"),
                            (ST[11] - 0.1, "gold"), (ST[12] - 0.2, "night"), (ST[14] - 0.2, "dawn")], SR)
    music = np.concatenate([music, np.zeros(max(0, N - len(music)))])[:N]
    end_music = TOTAL
def _wt(i, p):
    for w, s_, e_ in W[i]:
        if w.lower().strip(",.?'").startswith(p): return s_
    return ST[i]
# Qur'an rule: NO music while a verse is read: the hook's بِسْمِ اللَّهِ, line 3 (1:1), line 14 (بِسْمِ اللَّهِ)
VERSE = [(W[0][0][1], W[0][0][2]), (ST[3], LN[3]["end"]), (ST[14], LN[14]["end"])]
mask = np.ones(len(music))
for c0, c1 in VERSE: mask[int((c0 - 0.35) * SR):int(c1 * SR)] = 0.0
k = int(0.35 * SR); mask = np.convolve(mask, np.ones(k) / k, mode="same")
for c0, c1 in VERSE: mask[int(c0 * SR):int(c1 * SR)] = 0.0   # hard guarantee
music *= mask
sfx = reverb(sfx, 0.28); sfw = reverb(sfw, 0.2)
smask = np.ones(len(sfx))
for c0, c1 in VERSE: smask[int((c0 - 0.05) * SR):int((c1 + 0.05) * SR)] = 0.0
sfx = sfx * smask + sfw
# fades
fi = int(0.02 * SR); music[:fi] *= np.linspace(0, 1, fi)
fe = int(end_music * SR); fo = int(0.5 * SR); music[fe - fo:fe] *= np.linspace(1, 0, fo); music[fe:] = 0
music = music[:int(TOTAL * SR)]; sfx = sfx[:int(TOTAL * SR)]
for name, x in (("music", music), ("sfx", sfx)):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.7
    sf.write(f"{os.environ['EP_DIR']}/{name}.wav", np.stack([x, x], 1).astype(np.float32), SR, subtype="FLOAT")
print("ok", TOTAL)

# verify the Qur'an rule on the file as written
m, _ = sf.read(f"{os.environ['EP_DIR']}/music.wav")
for c0, c1 in VERSE:
    seg = m[int(c0 * SR):int(c1 * SR)]
    print(f"verse window {c0:.2f}-{c1:.2f}: music peak {20*np.log10(np.abs(seg).max()+1e-12):.1f} dB")
open(f"{os.environ['EP_DIR']}/verse_windows.json", "w").write(json.dumps(VERSE))

s_, _ = sf.read(f"{os.environ['EP_DIR']}/sfx.wav")
for c0, c1 in VERSE:
    seg = s_[int(c0 * SR):int(c1 * SR)]
    print(f"verse window {c0:.2f}-{c1:.2f}: sfx peak {20*np.log10(np.abs(seg).max()+1e-12):.1f} dB (whooshes only)")
