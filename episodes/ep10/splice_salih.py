"""ep10: splice the single-word retake of صَالِح (take_salih.wav, ar, speed 0.85) over spoken-word indices 35, 45, 140
(whisper-ar heard السال / إليس / صلي there). Cut points sit at the quietest 10 ms frame between the neighbouring words;
the take starts 0.2 s before its first timestamp trimmed to its energy onset (RUNBOOK §3). Writes src.wav and spoken.json
from src_orig.wav / spoken_orig.json (idempotent)."""
import json, numpy as np, soundfile as sf
src, sr = sf.read("src_orig.wav"); take, tsr = sf.read("take_salih.wav")
if src.ndim > 1: src = src.mean(1)
if take.ndim > 1: take = take.mean(1)
assert sr == tsr, (sr, tsr)
SP = json.load(open("spoken_orig.json"))
def rms(x): return np.sqrt((x ** 2).mean() + 1e-12)
def quietest(t0, t1):
    best = None
    for t in np.arange(t0, max(t0 + 0.001, t1 - 0.01), 0.002):
        v = rms(src[int(t * sr):int((t + 0.01) * sr)])
        if best is None or v < best[0]: best = (v, t + 0.005)
    return best[1]
# take: from 0.2 s before its first timestamp, trimmed to energy onset; end where energy falls after the ḥ
T0, T1 = 0.351, 0.853
fr = lambda t: rms(take[int(t * sr):int((t + 0.01) * sr)])
on = T0 - 0.2
while on < T0 and 20 * np.log10(fr(on)) < -45: on += 0.005
on = max(T0 - 0.2, on - 0.02)
off = T1
while off < len(take) / sr - 0.01 and 20 * np.log10(fr(off)) > -45: off += 0.005
seg = take[int(on * sr):int(off * sr)].copy()
word_in_seg = (T0 - on, T1 - on)
fade = int(0.008 * sr)
out = []; pos = 0; shifts = []  # (orig time, delta)
for idx in (35, 45, 140):
    w, prev, nxt = SP[idx], SP[idx - 1], SP[idx + 1]
    a = quietest(prev[2], w[1] + 0.02); b = quietest(w[2], nxt[1])
    g = seg * (rms(src[int(w[1] * sr):int(w[2] * sr)]) / rms(seg[int(word_in_seg[0] * sr):int(word_in_seg[1] * sr)]))
    g[:fade] *= np.linspace(0, 1, fade); g[-fade:] *= np.linspace(1, 0, fade)
    pre = src[pos:int(a * sr)].copy(); pre[-fade:] *= np.linspace(1, 0, fade)
    out += [pre, g]; pos = int(b * sr)
    tail_gap = b - w[2]
    out.append(np.zeros(int(max(0.0, tail_gap - (len(g) / sr - word_in_seg[1])) * sr)))  # keep the original gap after the word
    new_len = sum(len(x) for x in out) / sr
    shifts.append((idx, a, b, word_in_seg, new_len))
    print(idx, w, "cut", round(a, 3), round(b, 3), "take", round(len(g) / sr, 3))
rest = src[pos:].copy(); rest[:fade] *= np.linspace(0, 1, fade); out.append(rest)
y = np.concatenate(out)
# retime spoken words: build piecewise map orig->new
SP2 = [list(x) for x in SP]
delta = 0.0; prev_b = 0.0; new_cursor = 0.0
for idx, a, b, wis, new_len in shifts:
    # words before a shift by current delta
    for k, x in enumerate(SP2):
        if prev_b <= SP[k][1] < a: x[1] = SP[k][1] + delta; x[2] = SP[k][2] + delta
    start_new = a + delta
    SP2[idx][1] = round(start_new + wis[0], 3); SP2[idx][2] = round(start_new + wis[1], 3)
    delta = new_len - b; prev_b = b
for k, x in enumerate(SP2):
    if SP[k][1] >= prev_b: x[1] = round(SP[k][1] + delta, 3); x[2] = round(SP[k][2] + delta, 3)
json.dump(SP2, open("spoken.json", "w"), ensure_ascii=False)
sf.write("src.wav", y.astype(np.float32), sr, subtype="FLOAT")
print("len", round(len(src) / sr, 3), "->", round(len(y) / sr, 3))
for k in (34, 35, 36, 44, 45, 46, 139, 140, 141, 162): print(k, SP2[k])
