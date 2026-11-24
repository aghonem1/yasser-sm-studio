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
        if w.lower().strip(",.?'") .startswith(word): return s
    return ST[line]

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

# ep06 birr v2 — cues follow the v2 motion beats in remotion/src/episodes/Ep06_Birr.tsx
def tick(g=1.0):
    tt = t_(0.12); return bp(rng.standard_normal(len(tt)), 2500, 7000) * np.exp(-tt * 70) * 0.5 * g
sfx = np.zeros(N)
place(sfx, boom(1.2), 0.0, 0.7); place(sfx, chime(1318.5, 1.2), 0.02, 0.3)              # hook lands, frame 1
place(sfx, ring_clink(), word_t(0, "stop") - 0.05, 0.35); place(sfx, whoosh(0.4, up=False), word_t(0, "stop"), 0.35)   # the rope unhooks and swings
place(sfx, whoosh(1.2, up=True), ST[1] - 0.05, 0.35)                                       # the point of light climbs
place(sfx, chime(1174.7, 1.0), word_t(1, "more") - 0.05, 0.35)                      # MORE
place(sfx, chime(1318.5, 1.2), word_t(2, "one") - 0.05, 0.38)                              # ONE WORD, the light swells
place(sfx, riser(0.55), ST[3] - 0.55, 0.55); place(sfx, boom(1.2), ST[3] - 0.08, 0.6); place(sfx, shimmer(1.4), ST[3] - 0.08, 0.45)   # zoom-through into the light
place(sfx, whoosh(0.7, up=False), ST[3] - 0.05, 0.2)                                      # the pen writes the word
place(sfx, chime(1568, 1.2), ST[4] + 0.05, 0.3)                                            # generous kindness
place(sfx, whoosh2(0.6), ST[5] - 0.45, 0.5)                                                # the word flies into the card (verse window: whooshes only)
place(sfx, whoosh(0.35, up=False), word_t(5, "forbid") + 0.08, 0.3)                       # FORBID struck
place(sfx, whoosh(0.4, up=True), word_t(5, "kindness") - 0.15, 0.22); place(sfx, whoosh(0.4, up=True), word_t(5, "justice") - 0.15, 0.22)
place(sfx, whoosh(0.4, up=True), ST[6] - 0.05, 0.2); place(sfx, whoosh(0.4, up=True), ST[7] - 0.05, 0.2)
place(sfx, whoosh2(0.7), ST[8] - 0.3, 0.55)                                                # tiles grow into panels
place(sfx, chime(1046.5, 1.0), word_t(9, "justice") - 0.05, 0.38); place(sfx, chime(1318.5, 1.0), word_t(10, "kindness") - 0.05, 0.38)
place(sfx, whoosh2(0.5), ST[11] - 0.45, 0.5)                                               # panels swap content
place(sfx, knock(0.9), word_t(11, "prevents") - 0.15, 0.45)                                 # the gold wall rises
place(sfx, whoosh(0.6, up=True), ST[11] + 0.1, 0.35)                                        # arrow of harm
place(sfx, knock(1.3), word_t(11, "harming") + 0.05, 0.6); place(sfx, boom(0.5), word_t(11, "harming") + 0.05, 0.45)   # it breaks on the wall
place(sfx, whoosh(0.8, up=True), word_t(12, "help") - 0.35, 0.4); place(sfx, chime(1568, 1.0), word_t(12, "help") + 0.5, 0.35)   # lifted up
place(sfx, whoosh(0.6, up=False), ST[13] - 0.55, 0.45)                                      # panels fold into the pans
for k in range(3): place(sfx, tick(0.8), ST[13] + 0.15 + k * 0.5, 0.45)                    # the beam rocks
place(sfx, knock(0.9), word_t(13, "straight") - 0.05, 0.45); place(sfx, chime(1174.7, 1.0), word_t(13, "straight") + 0.1, 0.38)   # level ✓
place(sfx, knock(0.7), word_t(14, "fills") + 0.2, 0.4); place(sfx, chime(1046.5, 0.8), word_t(14, "fills") + 0.2, 0.3)
place(sfx, knock(0.7), word_t(14, "fills") + 0.4, 0.4); place(sfx, chime(1318.5, 0.8), word_t(14, "fills") + 0.4, 0.3)   # hearts land in the pans
place(sfx, shimmer(1.6), word_t(14, "warmth") - 0.3, 0.4)                                   # warm light rises
place(sfx, whoosh2(0.5), ST[15] - 0.4, 0.5); place(sfx, boom(0.9), ST[15], 0.6)              # push into darkness: THE HARD PART
place(sfx, whoosh(0.5, up=True), word_t(16, "difference") - 0.25, 0.35)                     # two homes
place(sfx, whoosh(0.8, up=True), word_t(16, "kindness") - 0.4, 0.3)                         # the bridge, the heart sets out
place(sfx, boom(0.6), word_t(16, "wrong") + 0.02, 0.6); place(sfx, knock(1.3), word_t(16, "wrong") + 0.02, 0.5)   # the barrier slams down
place(sfx, knock(1.0), ST[17] + 0.25, 0.5); place(sfx, whoosh(0.5, up=False), ST[17] + 0.28, 0.4)   # it breaks and falls
place(sfx, chime(1318.5, 1.2), ST[17] + 0.75, 0.45); place(sfx, shimmer(1.4), ST[17] + 1.05, 0.4)   # PERMITS ✓, windows light up
place(sfx, whoosh2(0.6), ST[18] - 0.4, 0.55); place(sfx, chime(1174.7, 1.0), word_t(18, "just") + 0.05, 0.38)   # pull back: BE JUST ✓
place(sfx, whoosh(1.2, up=True), ST[19] - 0.05, 0.35)                                       # the light climbs again
for w, f in (("care", 1046.5), ("goodwill", 1174.7), ("active", 1318.5)): place(sfx, chime(f, 1.0), word_t(20, w) + 0.1, 0.36)   # ✓ ✓ ✓
place(sfx, whoosh2(0.5), ST[21] - 0.3, 0.45); place(sfx, boom(0.6), ST[21] - 0.05, 0.4)   # callback: DON'T STOP AT FAIR.
place(sfx, riser(1.0), VEND - 0.9, 0.5)
place(sfx, boom(1.4), VEND + 0.05, 0.6); place(sfx, shimmer(1.4), VEND + 0.08, 0.6)
sfx = reverb(sfx, 0.28)

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
while t < end_music - 0.1:
    ch = prog[bi % 4] if t < VEND - 0.2 else [50, 54, 57]   # resolve to D major at end card
    d = min(2 * bar, end_music - t)
    for n_ in ch: place(music, pad_note(midi(n_ + 12), d + 0.6), t, 1.0)
    place(music, sub(midi(ch[0] - 12), d), t, 1.0)
    # sparse pluck arpeggio (oud/harp-like), denser after the midpoint
    steps = [0, 2, 3, 5] if t < ST[11] else [0, 1, 2, 3, 4, 5, 6, 7]
    for s_ in steps:
        tt0 = t + s_ * beat
        if tt0 < end_music - 0.5:
            nn = ch[s_ % 3] + 24 + (12 if s_ in (5, 7) else 0)
            if ch == prog[3] and s_ == 3: nn = 46 + 24 + 12   # Bb over A: Hijaz b9 colour
            place(music, pluck(midi(nn)), tt0, 0.9)
    if t >= ST[2] - 0.3:   # pulse from the first answer onward
        for s_ in range(8):
            if t + s_ * beat < VEND - 0.3: place(music, softkick(), t + s_ * beat, 0.45 if s_ % 4 == 0 else 0.22)
    t += 2 * bar; bi += 1
music = reverb(music, 0.35)
d0, d1 = ST[15] - 0.25, ST[18] - 0.3
env = np.ones(len(music)); tt_ = np.arange(len(music)) / SR
env = np.where((tt_ > d0) & (tt_ < d1), 0.35, 1.0); env = np.convolve(env, np.ones(int(0.25 * SR)) / int(0.25 * SR), mode="same")
music *= env
def _wt(i, p):
    for w, s_, e_ in W[i]:
        if w.lower().strip(",.?'").startswith(p): return s_
    return ST[i]
# Qur'an rule: NO music while a verse is read (lines 5–7: 60:8, card on screen until ST[8] - 0.4)
VERSE = [(ST[5] - 0.3, ST[8] - 0.1)]
mask = np.ones(len(music))
for c0, c1 in VERSE: mask[int((c0 - 0.35) * SR):int(c1 * SR)] = 0.0
k = int(0.35 * SR); mask = np.convolve(mask, np.ones(k) / k, mode="same")
for c0, c1 in VERSE: mask[int(c0 * SR):int(c1 * SR)] = 0.0   # hard guarantee
music *= mask
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
