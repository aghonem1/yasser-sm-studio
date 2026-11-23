"""Music and SFX for the paper-collage webinar teaser (composition web01v, episodes/webinar01v).
Explainer-style sound design: every paper drop, letter pop, tape, marker line and highlighter swipe is heard,
over a light, curious mallet-and-pizzicato bed with a Hijaz colour. Everything is synthesised here.
Qur'an rule: music is hard-muted and no tonal effect plays while the verse sheet (96:1) is on screen.
usage: EP_DIR=<abs path>/episodes/webinar01v python3 scripts/episodes/webinar01v_audio.py"""
import os, json
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve
SR = 48000
TL = json.load(open(os.environ["EP_DIR"] + "/timeline.json"))
LN = TL["lines"]; S = [l["start"] for l in LN]; W = [l["words"] for l in LN]
VEND, TOTAL = TL["voice_end"], TL["total"]
N = int(TOTAL * SR) + 2 * SR
rng = np.random.default_rng(11)
def t_(d): return np.arange(int(d * SR)) / SR
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def place(buf, x, t, g=1.0):
    i = int(t * SR)
    if i < 0: x = x[-i:]; i = 0
    j = min(len(buf), i + len(x))
    if j > i: buf[i:j] += g * x[:j - i]
def midi(n): return 440 * 2 ** ((n - 69) / 12)
def norm(s): return "".join(c for c in s.lower() if c not in ",.?'…“”:‘’")
def wt(i, w, nth=1):
    n = 0
    for x, s, e in W[i]:
        if norm(x).startswith(w):
            n += 1
            if n == nth: return s
    return S[i]
def ir(dur, damp, dec):
    tt = t_(dur); n = rng.standard_normal(len(tt)) * np.exp(-tt * dec); n = lp(n, damp)
    k = int(0.008 * SR); n[:k] *= np.linspace(0, 1, k); return n / np.sqrt((n ** 2).sum())
IR_ROOM, IR_HALL = ir(0.5, 5000, 11), ir(2.2, 3200, 3.2)
def reverb(x, IR, wet): return (1 - wet) * x + wet * 3 * fftconvolve(x, IR)[:len(x)]

# ---------------- paper, pen and tape ----------------
def thud(weight=1.0, bright=1.0):          # a piece of paper or card landing on the board
    tt = t_(0.32); f = 120 * np.exp(-tt * 30) + 62
    low = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 20) * 0.9 * weight
    slap = bp(rng.standard_normal(len(tt)), 250, 3200) * np.exp(-tt * 42) * 0.5 * bright
    rustle = bp(rng.standard_normal(len(tt)), 2500, 9000) * np.exp(-tt * 16) * 0.10 * bright
    return low + slap + rustle
def pop(f=520.0):                           # one cut-out letter going down
    tt = t_(0.11); fr = f * (1 + 0.7 * np.exp(-tt * 70))
    s = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt * 46)
    c = bp(rng.standard_normal(len(tt)), 900, 5000) * np.exp(-tt * 120) * 0.5
    return (s * 0.55 + c) * 0.8
def pops(buf, t, n, stagger, g=0.5, base=430.0):
    for i in range(n): place(buf, pop(base * (1 + 0.06 * i) * (1 + 0.08 * (rng.random() - 0.5))), t + i * stagger, g * (0.8 + 0.4 * rng.random()))
def slide(d=0.45, down=False):              # paper sliding across the board
    tt = t_(d); n = rng.standard_normal(len(tt)); x = tt / d
    lo, hi = bp(n, 350, 1800), bp(n, 1800, 7500)
    y = (lo * (x if down else 1 - x) + hi * ((1 - x) if down else x)) * np.sin(np.pi * x) ** 1.6
    cr = (rng.random(len(tt)) > 0.9965).astype(float) * rng.standard_normal(len(tt)); cr = bp(fftconvolve(cr, np.exp(-t_(0.004) * 900))[:len(tt)], 1500, 9000) * np.sin(np.pi * x)
    return y * 0.5 + cr * 0.6
def tear(d=0.62):                           # the torn sheet that wipes one scene away
    tt = t_(d); x = tt / d
    g = lp((rng.random(len(tt)) > 0.985).astype(float) * rng.uniform(0.3, 1, len(tt)), 2600) * 22
    rip = bp(rng.standard_normal(len(tt)), 900, 9500) * np.clip(g, 0, 1.6) * np.sin(np.pi * x) ** 0.8
    air = bp(rng.standard_normal(len(tt)), 250, 2400) * np.sin(np.pi * x) ** 2
    return rip * 0.55 + air * 0.5
def scribble(d=0.4, rate=15.0, heavy=1.0):  # felt marker on paper
    tt = t_(d); n = rng.standard_normal(len(tt))
    ph = 2 * np.pi * np.cumsum(rate * (1 + 0.3 * lp(rng.standard_normal(len(tt)), 6) * 40)) / SR
    am = 0.35 + 0.65 * np.abs(np.sin(ph)); env = np.minimum(1, tt / 0.012) * np.minimum(1, (d - tt) / 0.03)
    sq = np.sin(2 * np.pi * np.cumsum(2300 + 500 * np.sin(ph)) / SR) * 0.035
    return (bp(n, 1400, 6500) * 0.4 * heavy + bp(n, 300, 1100) * 0.2 * heavy + sq) * am * env
def write(d=0.6):                           # pencil handwriting
    tt = t_(d); n = bp(rng.standard_normal(len(tt)), 2600, 8000)
    am = np.clip(lp(rng.standard_normal(len(tt)), 9) * 60 + 0.45, 0.05, 1.3); env = np.minimum(1, tt / 0.02) * np.minimum(1, (d - tt) / 0.05)
    return n * am * env * 0.22
def swipe(d=0.3):                           # highlighter pulled across a word
    tt = t_(d); x = tt / d; n = rng.standard_normal(len(tt))
    return (bp(n, 2200, 5200) * (1 - x) + bp(n, 3800, 9000) * x) * np.sin(np.pi * x) ** 1.2 * 0.42
def zip_(d=0.28):                           # masking tape unrolled and pressed down
    tt = t_(d); x = tt / d; ph = 2 * np.pi * np.cumsum(70 + 110 * x) / SR
    y = bp(rng.standard_normal(len(tt)), 1100, 7000) * (np.sin(ph) > 0.1) * (0.4 + 0.6 * x) * np.minimum(1, (d - tt) / 0.01) * 0.4
    out = np.zeros(int((d + 0.2) * SR)); place(out, y, 0); place(out, thud(0.25, 0.7), d - 0.01, 0.5); return out
def tick(f=3200.0):
    tt = t_(0.03); return (np.sin(2 * np.pi * f * tt) * 0.5 + bp(rng.standard_normal(len(tt)), 2000, 9000) * 0.5) * np.exp(-tt * 230) * 0.5
def swell(d=1.0):                           # low air under a camera move
    tt = t_(d); x = tt / d; return (lp(rng.standard_normal(len(tt)), 420) * 1.6 + np.sin(2 * np.pi * 52 * tt) * 0.35) * np.sin(np.pi * x) ** 2 * 0.3
def rattle(d=2.4):                          # shaking paper letters
    tt = t_(d); am = lp((np.sin(2 * np.pi * 21 * tt + 3 * np.sin(2 * np.pi * 1.3 * tt)) > 0.25).astype(float), 90)
    return bp(rng.standard_normal(len(tt)), 1500, 8000) * am * (1 - tt / d) ** 1.3 * 0.2
def heart():                                # two low beats
    out = np.zeros(int(0.6 * SR))
    for dt, g in ((0, 1.0), (0.2, 0.7)):
        tt = t_(0.3); place(out, np.sin(2 * np.pi * np.cumsum(70 * np.exp(-tt * 12) + 40) / SR) * np.exp(-tt * 14) * g, dt)
    return out * 0.8
def low_hit(d=1.4):                         # weight under a heavy card
    tt = t_(d); return (np.sin(2 * np.pi * np.cumsum(58 * np.exp(-tt * 2) + 34) / SR) * np.exp(-tt * 3.4) + lp(rng.standard_normal(len(tt)), 1800) * np.exp(-tt * 40) * 0.3) * 0.9
# tonal accents (kept out of the verse window)
def marimba(f, d=1.1, bright=1.0):
    tt = t_(d); s = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 6.5) + 0.32 * bright * np.sin(2 * np.pi * f * 4 * tt) * np.exp(-tt * 22) + 0.1 * bright * np.sin(2 * np.pi * f * 9.2 * tt) * np.exp(-tt * 40)
    return (s * np.minimum(1, tt / 0.002) + bp(rng.standard_normal(len(tt)), 700, 3500) * np.exp(-tt * 180) * 0.25) * 0.4
def bell(f, d=1.8):
    tt = t_(d); s = sum(a * np.sin(2 * np.pi * f * r * tt + k) * np.exp(-tt * dec) for k, (r, a, dec) in enumerate([(1, 1, 2.6), (2.76, 0.4, 4.5), (5.4, 0.2, 7)]))
    return s * np.minimum(1, tt / 0.004) * 0.22

VERSE = (wt(26, 'opening') - 0.05, wt(27, 'then') + 0.6)   # verse sheet on screen (it leaves over the last 0.3 s)
dry, ton = np.zeros(N), np.zeros(N)              # dry = paper and pen, ton = pitched accents
def P(x, t, g=1.0): place(dry, x, t, g)
def T(x, t, g=1.0):
    if not (VERSE[0] - 0.4 < t < VERSE[1] + 0.05): place(ton, x, t, g)
def drop(t, weight=1.0, g=0.6, sl=True):
    if sl: P(slide(0.26), t - 0.02, 0.28 * g / 0.6)
    P(thud(weight), t + 0.26, g)                 # the piece settles ~0.3 s after it starts to move
def fall(t, g=0.3): P(slide(0.3, down=True), t, g)
def wipe(t): P(tear(0.62), t - 0.33, 0.85); P(swell(0.7), t - 0.4, 0.6); P(thud(0.5), t + 0.24, 0.3)
def hi(t): P(swipe(0.3), t, 0.7)
def tape(t): P(zip_(0.28), t, 0.6)
def note(t, d): P(write(d), t, 1.0)
def mark(t, d=0.35, heavy=1.0, g=0.7): P(scribble(d, heavy=heavy), t, g)
D4 = 62; HIJ = [62, 63, 66, 67, 69, 70, 72, 74]

# A · the walk home
P(swell(1.4), 0.0, 0.5); T(marimba(midi(50), 1.6), 0.08, 0.7); T(marimba(midi(62), 1.6), 0.1, 0.5)
note(0.5, 0.55); fall(S[1] - 0.2)
for dt, w in ((0.05, 1.2), (0.21, 1.0), (0.39, 0.6)): drop(S[1] + dt, w, 0.6)
P(swell(1.1), S[1] - 0.15, 0.7); tape(wt(2, 'cave') - 0.1)
for k in range(9): P(tick(2100 + 60 * k), S[2] + 0.55 + k * 0.16, 0.22)
pops(dry, wt(3, 'trembling') - 0.08, 10, 0.04, 0.4, 330.0)   # v3: the word lands and stays still; no rattle, no heartbeat
T(bell(midi(74), 2.4), S[4] + 0.2, 0.4); T(bell(midi(81), 2.4), S[4] + 0.4, 0.22)
drop(wt(4, 'first') - 0.1, 0.7); fall(S[5] + 0.1, 0.2); P(swell(1.2), S[5] - 0.3, 0.7)
for dt, w in ((0, 1.1), (0.14, 0.8), (0.26, 0.6), (0.36, 0.4)): drop(S[5] - 0.05 + dt, w, 0.5, sl=dt == 0)
for k in range(7): P(tick(2300 + 60 * k), S[5] + 0.1 + k * 0.15, 0.22)
tape(S[5] + 0.6); mark(S[5] + 1.1, 0.2); note(wt(6, 'first') - 0.1, 0.9); mark(wt(6, 'his') - 0.1, 0.3, 0.8, 0.5)
T(marimba(midi(69)), wt(6, 'wife'), 0.5)
# B · her name
wipe(S[7] - 0.28); tape(S[7] + 0.05); pops(dry, wt(7, 'khadijah') - 0.25, 8, 0.05, 0.6, 392.0)
for k, n in enumerate((62, 66, 69, 74)): T(marimba(midi(n), 1.6), wt(7, 'khadijah') + 0.1 + k * 0.05, 0.55)
drop(S[8] - 0.05, 0.9); hi(wt(8, 'reassures'))
# C1 · not a guess
wipe(S[9] - 0.28); note(S[9], 0.7); pops(dry, wt(9, 'so') - 0.08, 7, 0.05, 0.6, 440.0); T(marimba(midi(75)), wt(9, 'sure') + 0.1, 0.5)
tape(wt(10, 'her') - 0.05); drop(wt(10, 'answer') - 0.05, 1.0)
mark(wt(10, 'not') - 0.05, 0.35, 1.3, 0.85); P(low_hit(0.8), wt(10, 'not') + 0.3, 0.35)
# C2 · years
wipe(S[11] - 0.28); drop(S[11] - 0.05, 0.9); P(slide(0.9), wt(11, 'for') - 0.2, 0.6); hi(wt(11, 'years'))
for k in range(13): P(tick(2600 + 90 * k), wt(11, 'for') + 0.1 + k * 0.05, 0.3)
for i, n in ((12, 66), (13, 69)):
    drop(S[i] + 0.05, 1.2, 0.7); mark(S[i] + 0.32, 0.6, 0.6, 0.4); T(marimba(midi(n), 1.4), S[i] + 0.33, 0.6)
mark(S[12] + 0.3, 0.2, 0.8, 0.4); mark(S[13] + 0.2, 0.2, 0.8, 0.4); note(wt(12, 'trusted') - 0.2, 0.55); note(S[13] + 0.45, 0.45)
# D · the question
wipe(S[14] - 0.28); note(S[14] + 0.1, 1.6)
for dt, w in ((0, 1.0), (0.12, 0.7), (0.22, 0.4)): drop(wt(14, 'question') - 0.1 + dt, w, 0.55, sl=dt == 0)
pops(dry, S[15] - 0.08, 15, 0.04, 0.6, 350.0); mark(wt(15, 'seen'), 0.45, 1.2, 0.8); P(low_hit(1.6), wt(15, 'seen') + 0.1, 0.6); T(bell(midi(62), 2.6), wt(15, 'seen') + 0.1, 0.5)
# E · the Black Stone
wipe(S[16] + 0.05)
for k, tt in enumerate([S[16] + 0.36] + [max(S[16] + 0.42, wt(16, w) - 0.08) for w in ('not', 'only', 'one', 'watching')]):
    P(thud(0.5), tt + 0.26, 0.4); T(marimba(midi(HIJ[k] + 12), 0.6), tt + 0.26, 0.35)
drop(wt(16, 'only') + 0.1, 0.9); hi(wt(16, 'only') + 0.4); fall(S[17] - 0.3, 0.4)
tape(S[17]); drop(wt(17, 'quraysh') - 0.1, 0.9)
drop(wt(17, 'rebuilt') - 0.05, 1.8, 0.9); P(low_hit(1.5), wt(17, 'rebuilt') + 0.21, 0.6); P(slide(0.25), wt(17, 'rebuilt') + 0.3, 0.4); P(thud(0.4), wt(17, 'rebuilt') + 0.56, 0.4)
for k in range(4): drop(S[18] + k * 0.12, 0.8, 0.5, sl=k == 0)
for k in range(4): mark(wt(18, 'dispute') - 0.1 + k * 0.15, 0.4, 1.4, 0.75)
P(low_hit(1.2), wt(18, 'dispute'), 0.5)
drop(wt(19, 'black') - 0.25, 0.5, 0.4, sl=False); mark(wt(19, 'black'), 0.45, 1.1, 0.7); mark(S[19] + 0.1, 0.4, 0.9, 0.5); note(S[19] + 0.15, 0.8); P(swell(1.0), S[19] - 0.4, 0.7)
P(swell(1.0), S[20] - 0.3, 0.6); mark(wt(20, 'accepted'), 0.4, 1.3, 0.8); T(bell(midi(74), 2.2), wt(20, 'accepted') + 0.38, 0.55); T(bell(midi(78), 2.2), wt(20, 'accepted') + 0.44, 0.4)
drop(S[20] + 0.15, 0.9); hi(wt(20, 'accepted') + 0.2)
for k in range(4):
    mark(wt(21, 'every') - 0.05 + k * 0.1, 0.5, 0.9, 0.5); T(marimba(midi((62, 66, 69, 74)[k] + 12), 1.2), wt(21, 'every') + 0.45 + k * 0.1, 0.45)
drop(wt(21, 'shared') - 0.15, 0.9)
# F · Hira, step by step
# v3: this scene is kept quiet and slow, so the tone has already changed before the verse arrives
def soft_drop(t, g=0.3): P(slide(0.7), t, 0.2); P(thud(0.6, 0.5), t + 0.62, g)
P(tear(0.62), S[22] - 0.33, 0.5); P(swell(0.7), S[22] - 0.4, 0.5)
soft_drop(max(S[22] + 0.1, wt(22, 'hira') - 0.1), 0.25); soft_drop(S[22] + 0.32, 0.3)
soft_drop(S[23] - 0.02, 0.3); hi(wt(23, 'step')); fall(S[24] - 0.5, 0.25)
AT = [S[24] + 0.05, S[25] + 0.05, S[26] + 0.05, wt(27, 'return') - 0.3]
for k, tt in enumerate(AT):
    soft_drop(tt - 0.15, 0.32); T(marimba(midi((62, 66, 69, 74)[k] + 12), 1.8, 0.5), tt + 0.47, 0.4)
P(zip_(0.28), VERSE[1] - 0.1, 0.6)
P(slide(0.5), VERSE[0] - 0.05, 0.4); P(thud(0.8, 0.6), VERSE[0] + 0.28, 0.35); P(slide(0.35, down=True), VERSE[1] - 0.3, 0.3)   # the verse sheet: paper only
# G · two responses, kept closed
wipe(S[28] - 0.1); drop(S[28] + 0.26, 1.3, 0.7); tape(S[28] + 0.75); note(wt(29, 'from') - 0.1, 1.6)
drop(wt(29, 'witnessed') + 0.7, 1.0, 0.7); P(low_hit(0.7), wt(29, 'witnessed') + 0.96, 0.3)
drop(S[30] - 0.05, 1.3, 0.7); drop(wt(31, 'waraqah') - 0.1, 1.0, 0.6); T(marimba(midi(69), 1.4), wt(31, 'waraqah') + 0.17, 0.5)
drop(wt(31, 'nawfal') + 0.7, 1.0, 0.7); P(low_hit(0.7), wt(31, 'nawfal') + 0.96, 0.3)
# H · who believed next
wipe(S[32] - 0.28); pops(dry, S[32] - 0.08, 16, 0.035, 0.55, 370.0); drop(S[32] + 0.75, 0.9); T(marimba(midi(74), 1.2), S[32] + 1.02, 0.5); tape(S[32] + 1.1)
for k, w in enumerate(('ali', 'zayd', 'abu')):
    tt = wt(33, w); mark(tt - 0.3, 0.25, 0.8, 0.45); drop(tt - 0.08, 0.9, 0.6); T(marimba(midi((69, 67, 66)[k] + 12), 1.2), tt + 0.19, 0.5)
mark(S[34], 0.2, 0.8, 0.4); tape(S[34] + 0.1); mark(wt(35, 'who') - 0.2, 0.6, 1.4, 0.85); note(wt(35, 'who'), 0.8)
drop(S[36] + 0.05, 0.9); hi(wt(36, 'why'))
# I · two opposite answers
wipe(S[37] - 0.28); drop(S[37] - 0.05, 0.9); mark(S[37] + 0.2, 0.6, 0.6, 0.35); drop(S[37] + 0.25, 0.9); fall(S[38] - 0.15)
drop(S[38] + 0.1, 1.3, 0.7); T(marimba(midi(74), 1.4), S[38] + 0.37, 0.5); drop(wt(38, 'someone') - 0.05, 1.3, 0.7)
drop(wt(38, 'also') - 0.1, 0.5, 0.45, sl=False); T(marimba(midi(75), 0.9), wt(38, 'also') + 0.17, 0.45); note(wt(39, 'very') - 0.2, 0.9); fall(S[40] - 0.12)
drop(S[40] - 0.05, 1.8, 0.9); P(low_hit(1.8), S[40] + 0.21, 0.8)
drop(S[41] - 0.02, 0.9); hi(wt(41, 'knew'))
mark(S[42], 0.25, 1.0, 0.6); mark(S[42] + 0.22, 0.15, 1.0, 0.6); mark(wt(42, 'opposite'), 0.25, 1.2, 0.7); mark(wt(42, 'opposite') + 0.22, 0.15, 1.2, 0.7)
T(marimba(midi(74), 1.0), S[42] + 0.2, 0.4); T(marimba(midi(63), 1.2), wt(42, 'opposite') + 0.2, 0.5)
# J1 · the invitation and the route
wipe(S[43] - 0.28); note(S[43], 0.5)
drop(wt(43, 'one') - 0.1, 1.1, 0.7); T(marimba(midi(74), 1.4), wt(43, 'one') + 0.17, 0.5)
drop(S[44] - 0.02, 0.9); hi(wt(44, 'together')); fall(S[45] - 0.2, 0.4); note(S[45] + 0.1, 1.0)
for k in range(10): P(tick(2200 + 70 * k), S[45] + 0.35 + k * 0.16, 0.22)
STOPS = [wt(46, 'marketplace'), wt(46, 'mountain'), wt(47, 'first')]
for k, tt in enumerate(STOPS):
    drop(tt - 0.15, 1.0, 0.65); mark(tt + 0.12, 0.55, 0.6, 0.35); tape(tt + 0.25); T(marimba(midi((62, 67, 74)[k] + 12), 1.4), tt + 0.12, 0.6)
# J2 · the title
wipe(S[48] - 0.12); pops(dry, S[48] + 0.24, 7, 0.05, 0.6, 392.0)
K = max(S[48] + 0.5, wt(48, 'khadijah') - 0.12); pops(dry, K, 8, 0.05, 0.7, 330.0); pops(dry, wt(48, 'know') - 0.05, 5, 0.05, 0.7, 494.0)
P(low_hit(2.2), wt(48, 'know') + 0.2, 0.8)
for k, n in enumerate((50, 62, 66, 69, 74, 78)): T(marimba(midi(n), 2.4), wt(48, 'know') + 0.2 + k * 0.045, 0.6)
T(bell(midi(86), 2.8), wt(48, 'know') + 0.45, 0.35)
tape(wt(49, 'weekend') - 0.1); tape(wt(49, 'december') + 0.2); drop(S[50] + 0.2, 1.1, 0.7); T(marimba(midi(74), 1.6), S[50] + 0.47, 0.5)
note(VEND - 0.2, 0.5); mark(VEND + 0.2, 0.3, 0.9, 0.5); T(bell(midi(74), 2.6), VEND + 0.5, 0.4); T(bell(midi(81), 2.6), VEND + 0.6, 0.3)

# ---------------- music ----------------
BPM = 100; beat = 60 / BPM; st = beat / 4; bar = 4 * beat
CH = [([62, 66, 69], 38), ([62, 67, 70], 43), ([63, 67, 70], 39), ([62, 69, 72], 38)]   # D | Gm | Eb (Hijaz bII) | D7sus-ish
OST = [(0, 0), (3, 2), (6, 1), (8, 3), (11, 2), (14, 1)]                                 # 3-3-2 mallet figure: (step, chord-tone index)
def mode(t):
    if t >= S[48] - 0.12: return 'title'
    if t >= S[43] - 0.28: return 'full'
    if t >= S[40] - 0.1: return 'tense'
    if t >= S[32] - 0.28: return 'groove'
    if t >= S[27]: return 'soft'
    if t >= S[22]: return 'soft'
    if t >= S[20] - 0.05: return 'groove'
    if t >= wt(18, 'dispute') - 0.1: return 'tense'
    if t >= S[16] + 0.05: return 'groove'
    if t >= S[14] - 0.28: return 'hold'
    if t >= S[7] - 0.28: return 'light'
    return 'intro'
def pizz(f, d=0.9):
    tt = t_(d); s = sum(np.sin(2 * np.pi * k * f * tt) / k * np.exp(-tt * (5 + 2.4 * k)) for k in range(1, 9))
    return s * np.minimum(1, tt / 0.002) * 0.3
def bassn(f, d=0.7):
    tt = t_(d); return (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-tt * 8)) * np.exp(-tt * 4.5) * np.minimum(1, tt / 0.004) * 0.5
def shaker(g=1.0):
    tt = t_(0.07); return hp(rng.standard_normal(len(tt)), 5500) * np.exp(-tt * 55) * np.minimum(1, tt / 0.006) * 0.16 * g
def rim():
    tt = t_(0.06); return (np.sin(2 * np.pi * 1750 * tt) * 0.5 + bp(rng.standard_normal(len(tt)), 900, 4000) * 0.6) * np.exp(-tt * 85) * 0.3
def kick():
    tt = t_(0.4); return np.sin(2 * np.pi * np.cumsum(95 * np.exp(-tt * 20) + 46) / SR) * np.exp(-tt * 10) * 0.5
def pad(f, d):
    tt = t_(d); s = sum(2 * ((f * 2 ** (det / 12) * tt) % 1) - 1 for det in (-0.08, 0.0, 0.07))
    return lp(s, 1100) * np.minimum(1, tt / 1.0) * np.minimum(1, (d - tt) / 1.0) * 0.05
def drone(d):
    tt = t_(d); return (np.sin(2 * np.pi * midi(38) * tt) + 0.5 * np.sin(2 * np.pi * midi(45) * tt) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.21 * tt))) * np.minimum(1, tt / 1.5) * np.minimum(1, (d - tt) / 1.5) * 0.11
mel, low, perc, air = np.zeros(N), np.zeros(N), np.zeros(N), np.zeros(N)
INTRO = [(0, 62), (4, 63), (8, 66), (20, 69), (24, 67), (28, 66), (36, 62)]             # slow Hijaz motif over two bars, story-teller mood
SOFT = [(0, 0), (6, 2), (12, 1)]
nb = int(TOTAL / bar) + 1
place(air, drone(S[7] + 1.2), 0.0, 1.0)
for b in range(nb):
    t0 = b * bar; ch, root = CH[b % 4]; m0 = mode(t0 + 0.01)
    if m0 == 'title': ch, root = [62, 66, 69], 38
    if m0 in ('intro', 'soft', 'hold', 'title', 'tense'):
        for n in ch: place(air, pad(midi(n), bar + 1.2), t0, 1.0 if m0 != 'tense' else 0.6)
    elif b % 2 == 0:
        for n in ch: place(air, pad(midi(n + 12), 2 * bar + 1.0), t0, 0.45)
    for s_ in range(16):
        t = t0 + s_ * st; m = mode(t)
        if t > TOTAL - 0.4: break
        sw = 0.012 if s_ % 2 else 0.0
        if m == 'intro':
            for q, n in INTRO:
                if (b % 2) * 16 + s_ == q and t > 1.2: place(mel, marimba(midi(n), 2.0, 0.6), t, 0.55)
        elif m in ('light', 'groove', 'full'):
            for q, k in OST:
                if s_ == q: place(mel, marimba(midi(ch[k % 3] + (12 if k == 3 else 0)), 0.9), t + sw, 0.62 if q in (0, 8) else 0.45)
            if m != 'light' and s_ in (2, 10): place(mel, pizz(midi(ch[(s_ // 2) % 3] + 12)), t + sw, 0.42)
            if m == 'full' and s_ in (4, 7, 12, 15): place(mel, marimba(midi(ch[(s_ + b) % 3] + 24), 0.6, 1.3), t + sw, 0.3)
            if s_ in (0, 6): place(low, bassn(midi(root)), t, 0.9)
            if s_ == 8: place(low, bassn(midi(root + 7)), t, 0.7)
            if s_ == 14 and m != 'light': place(low, bassn(midi(root + 12), 0.4), t, 0.5)
            if s_ % 2 == 0: place(perc, shaker(1.0 if s_ % 4 == 2 else 0.55), t, 1.0 if m != 'light' else 0.6)
            elif m == 'full': place(perc, shaker(0.35), t + sw, 1.0)
            if m != 'light':
                if s_ in (4, 12): place(perc, rim(), t, 0.8)
                if s_ in (0, 10): place(perc, kick(), t, 0.8 if s_ == 0 else 0.5)
        elif m == 'tense':
            if s_ % 4 == 0: place(low, bassn(midi(38 if (s_ // 4) % 2 == 0 else 39), 0.5), t, 0.8)
            if s_ % 2 == 0: place(perc, tick(1500), t, 0.5)
            if s_ in (6, 14): place(mel, pizz(midi(63 + 12), 0.5), t, 0.35)
        elif m in ('soft', 'hold'):
            for q, k in SOFT:
                if s_ == q: place(mel, marimba(midi(ch[k] + 12), 1.8, 0.6), t, 0.42)
            if s_ == 0: place(low, bassn(midi(root), 1.4), t, 0.6)
        elif m == 'title':
            if s_ in (0, 6, 12) and t < VEND: place(mel, marimba(midi(ch[(s_ // 6) % 3] + 12), 1.8, 0.8), t, 0.4)
            if s_ == 0: place(low, bassn(midi(38), 1.6), t, 0.7)
            if s_ % 4 == 2 and t < VEND: place(perc, shaker(0.6), t, 0.7)
music = reverb(mel, IR_HALL, 0.22) * 1.0 + low * 0.95 + reverb(perc, IR_ROOM, 0.15) * 0.9 + reverb(air, IR_HALL, 0.4) * 1.0
# Qur'an rule: NO music while the verse sheet is on screen
mask = np.ones(N); mask[int((VERSE[0] - 0.45) * SR):int((VERSE[1] + 0.02) * SR)] = 0.0
k = int(0.3 * SR); mask = np.convolve(mask, np.ones(k) / k, mode="same"); mask[int((VERSE[0] - 0.1) * SR):int(VERSE[1] * SR)] = 0.0
music *= mask
sm = np.ones(N); sm[int((VERSE[0] - 0.4) * SR):int(VERSE[1] * SR)] = 0.0; sm = np.convolve(sm, np.ones(k) / k, mode="same"); sm[int((VERSE[0] - 0.1) * SR):int(VERSE[1] * SR)] = 0.0
ton_only = reverb(ton, IR_HALL, 0.3) * 0.9; sfx = reverb(dry, IR_ROOM, 0.12) + ton_only * sm   # reverb tails of pitched accents are cut too
# gentle limiting so one heavy hit does not push every other effect down; the bed comes up a little once the voice has finished
sfx = np.tanh(sfx / 0.8) * 0.8; music = np.tanh(music / 1.0)
up = np.interp(np.arange(N) / SR, [0, VEND + 0.2, VEND + 1.2, TOTAL + 2], [1, 1, 1.5, 1.5]); music *= up
fi = int(0.03 * SR); music[:fi] *= np.linspace(0, 1, fi)
fe = int(TOTAL * SR); fo = int(1.2 * SR)
for x in (music, sfx): x[fe - fo:fe] *= np.linspace(1, 0, fo); x[fe:] = 0
music, sfx = music[:fe], sfx[:fe]
a, b_ = int(VERSE[0] * SR), int(VERSE[1] * SR)
print("verse window %.2f-%.2f  music peak %.6f" % (VERSE[0], VERSE[1], np.abs(music[a:b_]).max()))
for name, x in (("music", music), ("sfx", sfx)):
    print(name, "peak %.3f rms %.4f" % (np.abs(x).max(), np.sqrt((x ** 2).mean())))
    x = x / (np.abs(x).max() + 1e-9) * 0.7
    sf.write(f"{os.environ['EP_DIR']}/{name}.wav", np.stack([x, x], 1).astype(np.float32), SR, subtype="FLOAT")
print("ok", TOTAL)
