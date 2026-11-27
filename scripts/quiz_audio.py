"""Sound for the weekly quiz reel (quiz/qNN.json): ambient bed (scripts/trackb_music.py) + countdown ticks,
a reveal chime per answer, soft pops as options land, whooshes between questions, a lift on the end card.
No narration. Output: <out_dir>/quiz_mix.wav at -14 LUFS (ffmpeg loudnorm afterwards)."""
import json, sys, os
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from trackb_music import ambient
SR = 48000; INTRO, QLEN, OUTRO = 3.0, 10.5, 6.5
spec = json.load(open(sys.argv[1])); out = sys.argv[2]
N = len(spec['questions']); TOTAL = INTRO + N * QLEN + OUTRO; n = int(TOTAL * SR)
rng = np.random.default_rng(3)
def t_(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def place(buf, x, t, g):
    i = int(t * SR); j = min(len(buf), i + len(x));
    if i < len(buf): buf[i:j] += x[:j - i] * g
def tick(f=2200):
    tt = t_(0.08); return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 60) + bp(rng.standard_normal(len(tt)), 3000, 8000) * np.exp(-tt * 90) * 0.3
def chime(f, d=1.4):
    tt = t_(d); return sum(np.sin(2 * np.pi * f * h * tt) * np.exp(-tt * (2.5 + h)) / h for h in (1, 2, 3)) * 0.6
def pop():
    tt = t_(0.14); f = 700 * np.exp(-tt * 25) + 250; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 30) * 0.5
def whoosh(d=0.45):
    tt = t_(d); e = np.sin(np.pi * tt / d) ** 2; return bp(rng.standard_normal(len(tt)), 400, 4000) * e * 0.35
def boom():
    tt = t_(1.4); return np.sin(2 * np.pi * (55 + 30 * np.exp(-tt * 6)) * tt) * np.exp(-tt * 3) * 0.8
sfx = np.zeros(n)
place(sfx, boom(), 0.0, 0.5); place(sfx, chime(1318.5), 0.05, 0.25)
for q in range(N):
    t0 = INTRO + q * QLEN
    place(sfx, whoosh(), t0 - 0.15, 0.5)
    for i in range(4): place(sfx, pop(), t0 + 0.6 + i * 0.22 + 0.1, 0.35)
    for s_ in range(3): place(sfx, tick(2200 if s_ < 2 else 2600), t0 + 3.5 + s_, 0.55)
    place(sfx, chime(1046.5), t0 + 6.5, 0.4); place(sfx, chime(1568.0), t0 + 6.62, 0.32)   # reveal: a rising fifth
tO = INTRO + N * QLEN
place(sfx, whoosh(0.6), tO - 0.2, 0.5); place(sfx, boom(), tO + 0.1, 0.45); place(sfx, chime(1318.5, 2.0), tO + 0.3, 0.3); place(sfx, pop(), tO + 0.9, 0.5)
music = ambient(TOTAL, [(0, 'gold'), (INTRO - 0.3, 'dawn'), (tO - 0.3, 'gold')], SR, seed=11)
music = np.concatenate([music, np.zeros(max(0, n - len(music)))])[:n]
mix = 0.55 * music / (np.abs(music).max() + 1e-9) + sfx
mix = mix / (np.abs(mix).max() + 1e-9) * 0.8
fo = int(0.5 * SR); mix[-fo:] *= np.linspace(1, 0.3, fo)
os.makedirs(out, exist_ok=True); sf.write(os.path.join(out, 'quiz_raw.wav'), np.stack([mix, mix], 1), SR)
print('ok', round(TOTAL, 2))
