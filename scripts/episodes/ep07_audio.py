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

# ep07 ghuluw — cues follow the beats in remotion/src/episodes/Ep07_Ghuluw.tsx (storyboard in its header)
def tick(g=1.0):
    tt = t_(0.12); return bp(rng.standard_normal(len(tt)), 2500, 7000) * np.exp(-tt * 70) * 0.5 * g
def swipe(g=1.0):   # a strike-through being drawn
    return whoosh(0.3, up=False) * g
def thud(g=1.0):    # something red lands (cross, ban, hostile word)
    k_ = knock(1.2 * g); b_ = boom(0.45) * 0.5 * g; out = np.zeros(max(len(k_), len(b_))); out[:len(k_)] += k_; out[:len(b_)] += b_
    return out
wt = word_t
sfx = np.zeros(N)
place(sfx, boom(1.2), 0.0, 0.7); place(sfx, chime(1318.5, 1.2), 0.02, 0.3)                       # hook lands, frame 1
t1, tFar, tNot = ST[1], wt(1, "far"), wt(1, "not")
place(sfx, whoosh(1.0, up=True), t1 - 0.05, 0.32)                                                # the light walks forward
place(sfx, thud(0.9), t1 - 0.05 + (tFar - t1 + 0.55) * 0.5, 0.5)                                 # it crosses: the line turns red
place(sfx, chime(1174.7, 1.0), tFar + 0.05, 0.32)                                                # MORE FAITH?
place(sfx, swipe(), tNot - 0.05, 0.45)                                                           # struck on "not"
place(sfx, chime(1318.5, 1.2), wt(2, "word") - 0.25, 0.36)                                       # ONE WORD, camera pushes in
place(sfx, riser(0.55), ST[3] - 0.55, 0.55); place(sfx, boom(1.2), ST[3] - 0.08, 0.6); place(sfx, shimmer(1.4), ST[3] - 0.08, 0.42)   # zoom-through
place(sfx, whoosh(0.7, up=False), ST[3] - 0.05, 0.2)                                             # the pen writes the word
place(sfx, knock(0.9), ST[4] - 0.02, 0.45)                                                       # the boundary bar stands up
place(sfx, whoosh(0.9, up=True), wt(4, "beyond") - 0.25, 0.35); place(sfx, tick(1.2), wt(4, "beyond") + 0.05, 0.5)   # the arrow runs past it
place(sfx, chime(1046.5, 1.0), wt(4, "beyond") + 0.4, 0.28)                                      # PASSING BEYOND
place(sfx, whoosh2(0.6), ST[5] - 0.4, 0.5)                                                       # word flies into the card (verse window: whooshes only)
place(sfx, whoosh(0.7, up=True), ST[5] + 0.05, 0.2)                                              # the ring draws
place(sfx, whoosh(0.9, up=True), wt(6, "excess") - 0.1, 0.22); place(sfx, whoosh(0.5, up=False), wt(6, "excess") + 0.75, 0.2)   # arrow out, ban ring
place(sfx, whoosh2(0.6), ST[7] - 0.35, 0.45); place(sfx, tick(1.0), ST[7] + 0.1, 0.5); place(sfx, chime(1568, 0.9), ST[7] + 0.12, 0.3)   # ring rises, magnifier
place(sfx, whoosh(0.4, up=True), ST[8] - 0.05, 0.25)                                             # row: weaken
place(sfx, whoosh(0.6, up=False), wt(8, "weaken") - 0.05, 0.3)                                   # the light dims
place(sfx, thud(0.8), wt(8, "commitment") - 0.05, 0.45); place(sfx, swipe(), wt(8, "commitment") + 0.05, 0.35)   # ✗
place(sfx, chime(1318.5, 1.0), wt(8, "commitment") + 0.55, 0.28)                                 # it shines again
place(sfx, whoosh(0.4, up=True), ST[9] - 0.05, 0.25)                                             # row: don't cross
place(sfx, whoosh(0.5, up=True), wt(9, "cross") - 0.35, 0.3); place(sfx, knock(1.0), wt(9, "cross") + 0.15, 0.45)   # light meets the ring, held
place(sfx, chime(1568, 1.0), wt(9, "line") + 0.05, 0.38)                                         # ✓
place(sfx, whoosh2(0.6), ST[10] - 0.2, 0.45)                                                     # ring grows into the disc
for j in range(6): place(sfx, tick(0.9), ST[10] + 0.25 + j * 0.11 + 0.42, 0.42)                  # six pieces snap in
place(sfx, whoosh(0.5, up=True), wt(11, "piece") - 0.25, 0.32); place(sfx, chime(1318.5, 1.0), wt(11, "piece") - 0.05, 0.32)   # one piece pulls out
place(sfx, whoosh2(0.7), ST[12] - 0.05, 0.45); place(sfx, boom(0.6), ST[12] + 0.6, 0.4)          # held up, swells over the whole
place(sfx, whoosh2(0.5), ST[13] - 0.4, 0.45); place(sfx, tick(1.2), ST[13] + 0.08, 0.5); place(sfx, tick(1.0), ST[13] + 0.16, 0.45)   # viewfinder on one cloud
tW, tD = wt(14, "whole"), wt(14, "darkness")
place(sfx, whoosh(1.1, up=False), tW - 0.15, 0.4)                                               # pull back: the whole sky
for j, f in enumerate((1046.5, 1174.7, 1318.5)): place(sfx, chime(f, 1.0), tW + 0.65 + j * 0.12, 0.3)   # sunlight, stars, rain
place(sfx, swipe(), tD + 0.25, 0.45)                                                             # DARKNESS struck
place(sfx, whoosh2(0.5), ST[15] - 0.4, 0.5); place(sfx, boom(0.9), ST[15], 0.6)                  # push into the dark: THE HARD PART
tC, tTh, tPr = wt(16, "crosses"), wt(16, "thinking"), wt(16, "protecting")
place(sfx, whoosh(0.5, up=True), ST[16] - 0.25, 0.3); place(sfx, chime(1568, 0.8), ST[16] - 0.05, 0.26)   # ground returns, the shield
place(sfx, whoosh(1.2, up=True), tC - 0.25, 0.3); place(sfx, thud(0.8), tC - 0.25 + 0.7, 0.45)   # he walks over the line
place(sfx, tick(1.0), tTh - 0.2, 0.45); place(sfx, chime(1318.5, 1.0), tPr - 0.05, 0.3)          # thought bubble: I'M PROTECTING IT
place(sfx, thud(1.1), tPr + 0.45, 0.6)                                                           # red ✗ on the crossing
place(sfx, whoosh(0.6, up=False), ST[17] - 0.2, 0.35)                                            # a gold line down the screen
for j, w in enumerate(("intolerance", "condemnation", "hostility")):
    i = 17 + j
    place(sfx, tick(0.9), ST[i] - 0.1, 0.45)                                                     # word on the inside
    place(sfx, whoosh(0.55, up=True), wt(i, "becomes") - 0.05, 0.32)                             # it crosses the line
    place(sfx, thud(0.9), wt(i, w) - 0.05, 0.5)                                                  # and turns red
t20 = ST[20]; e20 = LN[20]["end"]
place(sfx, whoosh(0.5, up=True), t20 - 0.2, 0.3); place(sfx, whoosh(1.0, up=True), t20 - 0.05, 0.28); place(sfx, thud(0.8), t20 + 0.55, 0.45)   # over the line again
place(sfx, chime(1174.7, 1.0), wt(20, "limit") + 0.1, 0.3); place(sfx, swipe(), wt(20, "not") - 0.05, 0.45)   # GREATER OBEDIENCE? struck
place(sfx, whoosh(0.8, up=False), e20 - 0.1, 0.3); place(sfx, chime(1318.5, 1.2), e20 + 0.45, 0.32)   # back inside, the line turns gold
place(sfx, whoosh2(0.5), ST[21] - 0.6, 0.4); place(sfx, boom(0.6), ST[21] - 0.32, 0.3)          # callback: EXTREME ISN'T FAITHFUL. (kept clear of the "Ex" onset)
place(sfx, knock(0.6), wt(21, "isn") + 0.05, 0.22); place(sfx, chime(1568, 1.0), wt(21, "faithful") + 0.05, 0.4)   # ✗ EXTREME, ✓ FAITHFUL
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
d0, d1 = ST[15] - 0.25, ST[17] - 0.3
env = np.ones(len(music)); tt_ = np.arange(len(music)) / SR
env = np.where((tt_ > d0) & (tt_ < d1), 0.35, 1.0); env = np.convolve(env, np.ones(int(0.25 * SR)) / int(0.25 * SR), mode="same")
music *= env
def _wt(i, p):
    for w, s_, e_ in W[i]:
        if w.lower().strip(",.?'").startswith(p): return s_
    return ST[i]
# Qur'an rule: NO music while a verse is read (lines 5–6: "God says:" + 4:171; card on screen until ST[7] - 0.3)
VERSE = [(ST[5] - 0.3, ST[7] - 0.1)]
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
