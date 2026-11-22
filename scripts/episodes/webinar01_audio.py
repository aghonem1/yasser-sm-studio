"""Music and SFX for the webinar teaser (VARIANT=full|short). Same synthesised style as the reels; see ep04_audio.py."""
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




VARIANT = os.environ.get("VARIANT", "full")
sfx = np.zeros(N)
place(sfx, boom(1.2), 0.0, 0.7); place(sfx, chime(1318.5, 1.2), 0.02, 0.3)
place(sfx, whoosh(0.6, up=False), word_t(0, "trembling") - 0.5, 0.55); place(sfx, boom(0.8), word_t(0, "trembling") + 0.05, 0.6)
place(sfx, shimmer(1.2), ST[1] + 0.55, 0.4)
place(sfx, chime(1174.7, 1.0), ST[2] + 0.3, 0.3)
place(sfx, chime(1318.5, 1.4), ST[3] + 0.3, 0.45)
if VARIANT == "full":
    place(sfx, whoosh2(0.55), ST[4] - 0.5, 0.6); place(sfx, boom(1.0), ST[4] - 0.1, 0.55)
    place(sfx, boom(0.5), word_t(5, "guess") + 0.25, 0.5)
    place(sfx, whoosh2(0.5), ST[6] - 0.2, 0.4)
    place(sfx, chime(1174.7, 1.0), ST[7] - 0.1, 0.35); place(sfx, chime(1318.5, 1.0), ST[8] - 0.1, 0.35)
    place(sfx, whoosh2(0.55), ST[9] - 0.5, 0.6); place(sfx, boom(1.0), ST[10] - 0.25, 0.55); place(sfx, shimmer(1.4), ST[10] - 0.2, 0.4)
    place(sfx, whoosh2(0.55), ST[11] - 0.5, 0.6)
    for w in ("only", "one", "watching"): place(sfx, chime(1568.0, 0.6), word_t(11, w) - 0.1, 0.22)
    place(sfx, whoosh2(0.5), ST[12] - 0.45, 0.55)
    place(sfx, boom(0.6), word_t(13, "dispute") - 0.05, 0.55); place(sfx, boom(0.5), word_t(13, "black") - 0.1, 0.45)
    place(sfx, chime(1318.5, 1.2), ST[14] + 0.3, 0.4); place(sfx, shimmer(1.6), word_t(15, "share") - 0.3, 0.45)
    place(sfx, whoosh2(0.55), ST[16] - 0.5, 0.6); place(sfx, boom(1.2), ST[16] - 0.1, 0.6)
    place(sfx, whoosh2(0.5), ST[17] - 0.3, 0.45)
    place(sfx, chime(1174.7, 0.9), word_t(18, "truthful") - 0.1, 0.32); place(sfx, chime(1318.5, 0.9), word_t(18, "a") - 0.1, 0.32)
    place(sfx, whoosh2(0.5), ST[19] - 0.15, 0.35)                     # verse card on screen: a whoosh only
    place(sfx, chime(1568.0, 0.9), ST[20] + 0.3, 0.3)
    place(sfx, whoosh2(0.55), ST[21] - 0.5, 0.6)
    place(sfx, ring_clink(), word_t(22, "witnessed") + 0.5, 0.35); place(sfx, whoosh2(0.5), ST[23] - 0.35, 0.45); place(sfx, ring_clink(), word_t(24, "nawfal") + 0.4, 0.35)
    place(sfx, whoosh2(0.55), ST[25] - 0.5, 0.6); place(sfx, boom(0.7), ST[25] - 0.1, 0.5)
    for w, f in (("ali", 1174.7), ("zayd", 1318.5), ("abu", 1568.0)): place(sfx, chime(f, 0.8), word_t(26, w) - 0.1, 0.3)
    place(sfx, chime(1174.7, 0.7), ST[27] + 0.1, 0.22)
    place(sfx, boom(0.6), word_t(28, "first") - 0.4, 0.5); place(sfx, chime(880.0, 1.2), ST[29] + 0.2, 0.3)
    place(sfx, whoosh2(0.55), ST[30] - 0.5, 0.6); place(sfx, boom(0.9), ST[30] + 0.3, 0.55)
    place(sfx, whoosh2(0.5), ST[31] - 0.35, 0.5); place(sfx, whoosh2(0.45), ST[32] - 0.2, 0.4)
    place(sfx, boom(0.7), ST[33] - 0.1, 0.55); place(sfx, chime(1174.7, 1.0), ST[34], 0.28)
    place(sfx, whoosh(0.5, up=False), ST[35] - 0.3, 0.5); place(sfx, boom(0.8), ST[35] + 0.1, 0.55)
    place(sfx, whoosh2(0.55), ST[36] - 0.5, 0.6)
    for w, f in (("one", 1174.7), ("live", 1318.5), ("free", 1568.0)): place(sfx, chime(f, 0.9), word_t(36, w) - 0.1, 0.32)
    place(sfx, page_flutter(0.5), ST[37], 0.3); place(sfx, whoosh2(0.5), ST[38] - 0.3, 0.45)
    place(sfx, chime(1174.7, 0.8), word_t(39, "marketplace") - 0.2, 0.3); place(sfx, chime(1318.5, 0.8), word_t(39, "mountain") - 0.2, 0.3); place(sfx, chime(1568.0, 0.8), word_t(40, "first") - 0.2, 0.3)
    T, D, R = 41, 42, 43
    PULSE, DENSE = ST[4] - 0.3, ST[25]
    VERSE = [(ST[19] - 0.25, ST[20] + 0.05)]
else:
    place(sfx, whoosh2(0.55), ST[4] - 0.5, 0.6); place(sfx, boom(0.6), word_t(4, "guess") + 0.25, 0.5)
    place(sfx, whoosh2(0.5), ST[5] - 0.2, 0.4)
    place(sfx, chime(1174.7, 1.0), word_t(6, "trade") - 0.1, 0.35); place(sfx, chime(1318.5, 1.0), word_t(6, "marriage") - 0.1, 0.35)
    place(sfx, whoosh2(0.55), ST[7] - 0.5, 0.6); place(sfx, boom(1.0), word_t(7, "what") - 0.1, 0.55); place(sfx, shimmer(1.2), word_t(7, "seen") - 0.1, 0.4)
    place(sfx, whoosh2(0.5), ST[8] - 0.45, 0.55)
    for w, f in (("one", 1174.7), ("live", 1318.5), ("free", 1568.0)): place(sfx, chime(f, 0.9), word_t(8, w) - 0.1, 0.32)
    T, D, R = 9, 10, 11
    PULSE, DENSE = ST[4] - 0.3, ST[8]
    VERSE = []
place(sfx, riser(1.1), ST[T] - 1.15, 0.45); place(sfx, boom(1.4), ST[T] - 0.1, 0.6); place(sfx, shimmer(1.6), ST[T] - 0.05, 0.55)
place(sfx, chime(1318.5, 1.2), ST[D], 0.35); place(sfx, ring_clink(), ST[R], 0.4)
place(sfx, boom(1.2), VEND + 0.05, 0.5); place(sfx, shimmer(1.4), VEND + 0.08, 0.5)
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
    steps = [0, 2, 3, 5] if t < DENSE else [0, 1, 2, 3, 4, 5, 6, 7]
    for s_ in steps:
        tt0 = t + s_ * beat
        if tt0 < end_music - 0.5:
            nn = ch[s_ % 3] + 24 + (12 if s_ in (5, 7) else 0)
            if ch == prog[3] and s_ == 3: nn = 46 + 24 + 12   # Bb over A: Hijaz b9 colour
            place(music, pluck(midi(nn)), tt0, 0.9)
    if t >= PULSE:   # pulse from the first answer onward
        for s_ in range(8):
            if t + s_ * beat < VEND - 0.3: place(music, softkick(), t + s_ * beat, 0.45 if s_ % 4 == 0 else 0.22)
    t += 2 * bar; bi += 1
music = reverb(music, 0.35)
d0, d1 = -2.0, -1.0   # no dip in the teaser
env = np.ones(len(music)); tt_ = np.arange(len(music)) / SR
env = np.where((tt_ > d0) & (tt_ < d1), 0.35, 1.0); env = np.convolve(env, np.ones(int(0.25 * SR)) / int(0.25 * SR), mode="same")
music *= env
def _wt(i, p):
    for w, s_, e_ in W[i]:
        if w.lower().strip(",.?'").startswith(p): return s_
    return ST[i]
# Qur'an rule: NO music while a verse card is on screen (full version: 96:1 during lines 19–20)
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
