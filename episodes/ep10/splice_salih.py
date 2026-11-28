"""ep10: splice the single-word retake of صَالِح (take_salih.wav, ar, speed 0.85) over spoken-word indices 35, 45, 140
(whisper-ar heard السال / إليس / صلي there).
v2 (28 Nov, Ahmed: "the sound transition to say Salih is broken and abrupt"): v1 pasted the slow take (0.72 s, with its silence)
and added ~0.2 s of pause before each word. v2 keeps the original rhythm: the take's word (ṣ hiss to the end of ḥ) is time-stretched
(pitch kept) to fit the original word's slot between its neighbours, level-matched to the original word, and joined with 20 ms
raised-cosine crossfades at the quietest 5 ms point on each side. Only a slot too short for a 1.35x stretch grows (by the difference).
Writes src.wav and spoken.json from src_orig.wav / spoken_orig.json (idempotent)."""
import json, numpy as np, soundfile as sf
from pedalboard import time_stretch
src, sr = sf.read("src_orig.wav"); take, tsr = sf.read("take_salih.wav")
src = src if src.ndim == 1 else src.mean(1); take = take if take.ndim == 1 else take.mean(1)
assert sr == tsr
SP = json.load(open("spoken_orig.json"))
def db(x, t, d=0.005): s = x[int(t * sr):int((t + d) * sr)]; return 20 * np.log10(np.sqrt((s ** 2).mean()) + 1e-9)
def quietest(x, t0, t1): return min(np.arange(t0, max(t0 + 0.006, t1), 0.0025), key=lambda t: db(x, t))
def rms(x): return np.sqrt((x ** 2).mean() + 1e-12)
# the take's word: from the onset of the ṣ hiss to where the ḥ has died away (-50 dB)
on = 0.10
while db(take, on) < -45: on += 0.0025
off = 0.853
while db(take, off) > -50: off += 0.0025
word = take[int((on - 0.01) * sr):int(off * sr)]
# trim the slow ḥ tail at -42 dB so the next word follows as closely as in the original reading
end = len(word) / sr
while end > 0.3 and db(word, end - 0.005) < -42: end -= 0.0025
word = word[:int(end * sr)]
TL = len(word) / sr
# room tone (never digital silence) tiled from the quietest 0.2 s of the original reading
qt = min(np.arange(0.5, len(src) / sr - 0.3, 0.05), key=lambda t: db(src, t, 0.2))
tone = src[int(qt * sr):int((qt + 0.2) * sr)]
def bed(n): return np.tile(tone, n // len(tone) + 1)[:n].copy()
XF = int(0.012 * sr); ramp = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, XF))
out = []; pos = 0; edits = []
for idx in (35, 45, 140):
    w, p, n = SP[idx], SP[idx - 1], SP[idx + 1]
    a = quietest(src, p[2] - 0.01, w[1] + 0.03)            # end of the previous word
    b = quietest(src, w[2] - 0.02, n[1] - 0.01)             # before the next word
    lead = max(0.0, (w[1] - 0.03) - a)                      # keep the original onset
    slot = b - a - lead - 0.03
    L = min(max(slot, TL / 1.35), TL)                       # never slower than the take itself
    y = time_stretch(word.astype(np.float32)[None, :], sr, stretch_factor=TL / L)[0]
    orig = src[int(w[1] * sr):int(w[2] * sr)]
    y = y * (rms(orig) / rms(y[int(0.15 * len(y)):int(0.85 * len(y))]))
    y[:int(0.006 * sr)] *= np.linspace(0, 1, int(0.006 * sr)); y[-int(0.03 * sr):] *= np.linspace(1, 0, int(0.03 * sr))
    total = max(int((b - a) * sr), int((lead + len(y) / sr + 0.03) * sr))
    seg = bed(total); i0 = int(lead * sr)
    seg[i0:i0 + len(y)] = y + seg[i0:i0 + len(y)] * np.linspace(1, 0, len(y)) ** 8   # word replaces the bed
    ia, ib = int(a * sr), int(b * sr)
    pre = src[pos:ia]
    seg[:XF] = seg[:XF] * ramp + src[ia:ia + XF] * ramp[::-1]          # 12 ms overlap crossfade in
    seg[-XF:] = seg[-XF:] * ramp[::-1] + src[ib - XF:ib] * ramp        # and out (the original resumes at b)
    out += [pre, seg]; pos = ib
    grow = len(seg) / sr - (b - a)
    edits.append((idx, a, b, lead, len(y) / sr, grow))
    print(f"{idx}: slot {a:.3f}-{b:.3f} ({b - a:.3f} s), lead {lead:.3f}, word {TL:.3f} -> {len(y) / sr:.3f} s (x{TL / (len(y) / sr):.2f}), grows {grow:+.3f} s")
out.append(src[pos:]); y_all = np.concatenate(out)
# retime words: shift everything after each slot by the accumulated growth; the spliced word sits 20 ms into its slot
SP2 = [list(x) for x in SP]; shift = 0.0; ei = 0
for k, x in enumerate(SP):
    while ei < len(edits) and x[1] >= edits[ei][2]:
        shift += edits[ei][5]; ei += 1
    if ei < len(edits) and k == edits[ei][0]:
        idx, a, b, ld, wl, g = edits[ei]
        SP2[k][1] = round(a + shift + edits[ei][3], 3); SP2[k][2] = round(a + shift + edits[ei][3] + wl, 3)
    else:
        SP2[k][1] = round(x[1] + shift, 3); SP2[k][2] = round(x[2] + shift, 3)
json.dump(SP2, open("spoken.json", "w"), ensure_ascii=False)
sf.write("src.wav", y_all.astype(np.float32), sr, subtype="FLOAT")
print("len", round(len(src) / sr, 3), "->", round(len(y_all) / sr, 3))
for k in (34, 35, 36, 44, 45, 46, 139, 140, 141): print(k, SP2[k])
