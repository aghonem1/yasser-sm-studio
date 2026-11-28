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

# Track B · B03 Al-hamdu lillahi Rabb al-'alamin (1:2) — cues follow remotion/src/trackb/B03_Alhamdulillah.tsx (storyboard in its header).
# VERSE windows (the hook's ٱلۡحَمۡدُ لِلَّهِ, line 2 = the whole verse, line 7 "Lord of all worlds" with رَبِّ ٱلۡعَٰلَمِينَ on screen,
# line 15 = ٱلۡحَمۡدُ لِلَّهِ): no music, and no SFX other than whooshes (separate buffer; everything else is muted there).
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
def rainnoise(d):
    n = bp(rng.standard_normal(int(d * SR)), 1200, 7000); tt = t_(d)
    drops = (rng.random(len(tt)) > 0.9993).astype(float); drops = bp(drops, 2000, 6000) * 6
    return (n * 0.12 + drops) * np.minimum(1, tt / 0.25) * np.minimum(1, (d - tt) / 0.35)
def popdown(g=1.0):
    tt = t_(0.3); f = 700 * np.exp(-tt * 9) + 160
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 14) * 0.35 * g
def inout(x): x = min(1, max(0, x)); return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2
sfx = np.zeros(N); sfw = np.zeros(N)
T = dict(thank=wt(0, "thank"), allah=wt(0, "allah"), job=wt(3, "job"), deg=wt(3, "degree"), suc=wt(3, "success"), ret=wt(4, "returns"),
         frees=wt(5, "frees"), bl=wt(12, "blessings"), tr=wt(12, "trials"), gd=wt(12, "guidance"), ret14=wt(14, "return"), him=wt(14, "him"), back=wt(16, "back"))
crumble = ST[7] - 0.6; W12a, W12b = ST[12] - 0.45, ST[13] + 0.7
place(sfw, whoosh2(0.4), 0.0, 0.16)                                                              # frame 1: first motion
place(sfx, pop(1.0), T["thank"] - 0.12, 0.38); place(sfx, chime(1568, 0.7), T["thank"] - 0.05, 0.16)   # the small gift
place(sfx, shimmer(1.3), T["allah"] - 0.15, 0.3)                                                 # he looks up, the sun warms
for i, w in enumerate(("perfection", "acts", "wisdom", "gifts")):                                # the four signs
    place(sfx, pop(0.9), wt(1, w) - 0.1, 0.3); place(sfx, chime([1318.5, 1568, 1760, 2093][i], 0.8), wt(1, w) - 0.05, 0.2)
place(sfw, whoosh(1.2, up=True), ST[2] - 0.45, 0.3)                                              # big pull-back (verse: whoosh only)
place(sfw, whoosh(0.9, up=False), ST[3] - 0.5, 0.3)                                              # fly down
tJ, tD, tS = T["job"] - 0.3, T["deg"] - 0.32, T["suc"] - 0.25
place(sfx, knock(1.0), tJ + 0.34, 0.42); place(sfx, boom(0.6), tJ + 0.34, 0.3)                   # briefcase lands
place(sfx, knock(0.6), tD + 0.34, 0.3); place(sfx, pop(0.8), tD + 0.36, 0.25)                    # cap lands on his head
place(sfx, riser(0.5), tS - 0.2, 0.25); place(sfx, chime(2093, 1.0), tS + 0.2, 0.26)             # trophy rises
for i in range(3):                                                                               # returned to the Source
    place(sfw, whoosh2(0.9), T["ret"] + i * 0.28, 0.2); place(sfx, chime([1046.5, 1318.5, 1568][i], 1.0), T["ret"] + i * 0.28 + 0.85, 0.2)
place(sfx, shimmer(1.4), T["ret"] + 1.2, 0.3)
place(sfw, whoosh(0.6, up=True), ST[5] - 0.25, 0.26)                                             # push-in on the heart
for j in range(5): place(sfx, ring_clink() * 0.5, T["frees"] + 0.05 + j * 0.07, 0.16)            # the bars fall away
place(sfx, chime(1174.7, 1.3), T["frees"] + 0.35, 0.3)                                           # the heart, freed
for i in range(3): place(sfx, knock(1.0), ST[6] - 0.05 + 0.3 * (i + 1) - 0.08, 0.36)             # the stones slide in under him
place(sfx, rumble(0.8), crumble, 0.4); place(sfx, knock(0.9), crumble + 0.38, 0.34)              # the pedestal crumbles, he lands
place(sfw, whoosh(1.3, up=True), crumble + 0.15, 0.3)                                            # big pull-back: the worlds (verse: whoosh only)
place(sfw, whoosh(0.9, up=False), ST[8] - 0.35, 0.28)                                            # fly down
place(sfx, shimmer(1.5), ST[8] - 0.05, 0.3); place(sfx, shimmer(0.9), wt(8, "sustainer") - 0.1, 0.22)   # column of light, sprout
place(sfx, popdown(1.0), ST[9] - 0.25, 0.36)                                                     # he becomes a child
w0, w1 = ST[9] + 0.05, ST[10] - 0.15
for tx in (2230, 2500, 2950):                                                                    # trees grow as he passes
    for tt0 in np.arange(w0, w1, 1 / 30):
        if 1950 + (2800 - 1950) * inout((tt0 - w0) / (w1 - w0)) > tx - 220: place(sfx, shimmer(0.7), tt0, 0.16); break
tt0 = w0 + 0.08
while tt0 < w1 - 0.05: place(sfx, step(0.6), tt0, 0.26); tt0 += 0.15
place(sfw, whoosh(1.0, up=False), ST[10] - 0.2, 0.26); place(sfx, wind(ST[11] + 0.2 - (ST[10] - 0.1)), ST[10] - 0.1, 1.1)   # alone
place(sfw, whoosh(0.8, up=True), ST[11] - 0.2, 0.24); place(sfx, shimmer(1.6), ST[11], 0.3); place(sfx, chime(1174.7, 1.2), ST[11] + 0.15, 0.24)
place(sfx, shimmer(1.1), T["bl"] - 0.15, 0.32)                                                   # blessings
place(sfx, rumble(1.2), T["tr"] - 0.4, 0.34); place(sfx, rainnoise(1.3), T["tr"] - 0.15, 0.5)     # trials
place(sfw, whoosh2(0.5), T["gd"] - 0.35, 0.2); place(sfx, knock(0.7), T["gd"] + 0.2, 0.3); place(sfx, chime(1046.5, 1.0), T["gd"] + 0.25, 0.22)   # guidance
place(sfx, chime(987.8, 1.6), ST[13] - 0.2, 0.18)                                                # night
place(sfx, pop(1.0), T["ret14"] - 0.05, 0.36); place(sfw, whoosh2(0.9), T["him"] - 0.2, 0.2); place(sfx, shimmer(1.2), T["him"] + 0.3, 0.26)   # one gift returned
place(sfw, whoosh2(0.45), ST[15] - 0.45, 0.26)                                                   # callback (verse: whoosh only)
for i in range(3): place(sfx, pop(1.0), ST[16] + 0.05 + i * 0.18, 0.32); place(sfw, whoosh2(0.8), T["back"] - 0.15 + i * 0.2, 0.16)
place(sfx, shimmer(1.2), T["back"] + 0.5, 0.26)
for w in ("job", "degree", "success"): place(sfx, pop(1.1), wt(17, w) - 0.1, 0.42)              # the three choices
place(sfx, riser(1.0), ST[19] - 1.0, 0.32); place(sfx, boom(1.4), ST[19] - 0.05, 0.38); place(sfx, shimmer(1.4), ST[19] - 0.02, 0.4)   # end card
for a_, b_, gap, g in ((ST[1] - 0.35, ST[1] + 0.55, 0.17, 0.9), (ST[3] - 0.45, ST[3] + 0.25, 0.17, 0.9), (W12a, W12b, 0.2, 0.9)):
    tt0 = a_ + 0.08
    while tt0 < b_ - 0.05:
        if not (T["tr"] - 0.2 < tt0 < T["tr"] + 0.95): place(sfx, step(g), tt0, 0.3)
        else: place(sfx, step(g) + bp(rng.standard_normal(int(0.09 * SR)), 1500, 6000) * np.exp(-t_(0.09) * 40) * 0.2, tt0, 0.3)   # wet steps
        tt0 += gap
place(sfw, whoosh(0.5, up=True), TOTAL - 0.6, 0.22)                                              # loop back to frame 1

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
    music = ambient(TOTAL, [(0, "dawn"), (ST[1] - 0.2, "gold"), (ST[3] - 0.3, "dawn"), (ST[4] - 0.1, "gold"), (ST[5] - 0.1, "dusk"), (ST[7] - 0.05, "gold"),
                            (ST[10] - 0.1, "dusk"), (ST[11] - 0.1, "gold"), (ST[13] - 0.2, "night"), (ST[15] - 0.25, "dawn")], SR)
    music = np.concatenate([music, np.zeros(max(0, N - len(music)))])[:N]
    end_music = TOTAL
def _wt(i, p):
    for w, s_, e_ in W[i]:
        if w.lower().strip(",.?'").startswith(p): return s_
    return ST[i]
# Qur'an rule: NO music while a verse is read or shown: the hook's ٱلۡحَمۡدُ لِلَّهِ, line 2 (1:2), line 7 (رَبِّ ٱلۡعَٰلَمِينَ), line 15
VERSE = [(W[0][0][1], W[0][0][2]), (ST[2], LN[2]["end"]), (ST[7], LN[7]["end"]), (ST[15], LN[15]["end"])]
mask = np.ones(len(music))
for c0, c1 in VERSE: mask[int((c0 - 0.35) * SR):int(c1 * SR)] = 0.0
k = int(0.35 * SR); mask = np.convolve(mask, np.ones(k) / k, mode="same")
for c0, c1 in VERSE: mask[int(c0 * SR):int(c1 * SR)] = 0.0   # hard guarantee
music *= mask
sfx = reverb(sfx, 0.28); sfw = reverb(sfw, 0.2)
smask = np.ones(len(sfx))
for c0, c1 in VERSE:
    smask[int((c0 - 0.05) * SR):int((c1 + 0.05) * SR)] = 0.0
    r0 = int((c0 - 0.11) * SR); smask[r0:int((c0 - 0.05) * SR)] = np.minimum(smask[r0:int((c0 - 0.05) * SR)], np.linspace(1, 0, int((c0 - 0.05) * SR) - r0))
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
