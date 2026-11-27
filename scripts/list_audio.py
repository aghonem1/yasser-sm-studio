"""Sound for the weekly list reel (list/lNN.json). No music: every card shows a Qur'an fragment (RUNBOOK: no music
during verses), so the bed is a quiet paper room tone, with a page turn per card, a pencil scratch while the object
draws itself, a soft pop on the number badge, and a lift on the end card. Output: <out_dir>/list_raw.wav."""
import json, sys, os
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
SR = 48000; INTRO, ITEM, OUTRO = 3.5, 8.0, 7.5
spec = json.load(open(sys.argv[1])); out = sys.argv[2]
N = len(spec['items']); TOTAL = INTRO + N * ITEM + OUTRO; n = int(TOTAL * SR)
rng = np.random.default_rng(7)
def t_(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def place(buf, x, t, g):
    i = int(t * SR); j = min(len(buf), i + len(x))
    if 0 <= i < len(buf): buf[i:j] += x[:j - i] * g
def page_turn(d=0.55):
    tt = t_(d); e = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 1.5
    crackle = (rng.random(len(tt)) < 0.004) * rng.standard_normal(len(tt)) * 3
    return (bp(rng.standard_normal(len(tt)), 900, 7000) * e + bp(crackle, 2000, 9000) * e) * 0.5
def pencil(d=2.0):
    tt = t_(d); strokes = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 3.1 * tt + np.sin(2 * np.pi * 0.7 * tt) * 2))
    env = np.minimum(1, tt / 0.1) * np.minimum(1, (d - tt) / 0.3) * (0.55 + 0.45 * strokes)
    grain = bp(rng.standard_normal(len(tt)), 2500, 9000) * (0.6 + 0.4 * (rng.random(len(tt)) < 0.3))
    return grain * env * 0.22
def pop():
    tt = t_(0.16); f = 620 * np.exp(-tt * 22) + 240; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 28) * 0.5
def bell(f, d=1.8):
    tt = t_(d); return sum(np.sin(2 * np.pi * f * h * tt) * np.exp(-tt * (2.8 + 1.5 * h)) / h for h in (1, 2.01, 3.02)) * 0.5
room = bp(rng.standard_normal(n), 120, 1800) * 0.018
sfx = np.zeros(n)
place(sfx, page_turn(0.8), 0.0, 0.6); place(sfx, bell(880.0), 0.1, 0.18)
for i in range(N):
    t0 = INTRO + i * ITEM
    place(sfx, page_turn(), t0 - 0.2, 0.75)
    place(sfx, pop(), t0 + 0.12, 0.45)
    place(sfx, pencil(1.9), t0 + 0.3, 1.0)
tO = INTRO + N * ITEM
place(sfx, page_turn(0.7), tO - 0.25, 0.8)
for j in range(N): place(sfx, pop(), tO + 0.9 + j * 0.12, 0.18)
place(sfx, bell(659.25, 2.2), tO + 2.3, 0.3); place(sfx, bell(987.77, 2.2), tO + 2.42, 0.22)
mix = room + sfx; mix = mix / (np.abs(mix).max() + 1e-9) * 0.85
fo = int(0.5 * SR); mix[-fo:] *= np.linspace(1, 0.3, fo)
os.makedirs(out, exist_ok=True); sf.write(os.path.join(out, 'list_raw.wav'), np.stack([mix, mix], 1), SR)
print('ok', round(TOTAL, 2))
