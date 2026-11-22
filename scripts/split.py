import os
import json, os, numpy as np
D = os.environ["EP_DIR"]
SP = json.load(open(f"{D}/spoken.json"))
# (display text, first spoken idx, last spoken idx); tokens consume 1 spoken word unless listed in MERGE
LINES = [   # ep05 ikrah (the last line is the series promise, spoken over the end card)
    ('Stop forcing faith on people.', 0, 4),
    ('Force wins the tongue, never the heart.', 5, 11),
    ("The Qur'an says it in one word:", 12, 18),
    ('ikrāh.', 19, 19),
    ('Compulsion.', 20, 20),
    ('“There is no compulsion in religion.', 21, 26),
    ('The right way has become clear from the wrong.”', 27, 35),
    ('Force can make someone say the words.', 36, 42),
    ('But it cannot create genuine belief.', 43, 48),
    ('“Say: The truth is from your Lord.', 49, 55),
    ('Whoever wishes may believe,', 56, 59),
    ('and whoever wishes may reject.”', 60, 64),
    ("Here's the hard part.", 65, 68),
    ("This doesn't make belief and rejection equal before God.", 69, 77),
    ('It means we choose, and we carry the responsibility.', 78, 86),
    ('The heart is not opened by force.', 87, 93),
    ('It is opened by truth, wisdom and sincere reflection.', 94, 102),
    ('So present the truth beautifully.', 103, 107),
    ('Never force the heart.', 108, 111),
    ('A new word, every day.', 112, 116),
]
PROMISE = True   # last line is spoken during the end card: voice_end = end of the line before it
MERGE = {}
MAXG, KEEP_LONG = 0.5, {2: 0.55, 11: 0.75, 14: 0.55, 18: 0.7}
ENDCARD = 3.2

src = f"{D}/src.wav"
audio = None
if os.path.exists(src):
    import soundfile as sf
    audio, sr = sf.read(src)
    if audio.ndim > 1: audio = audio.mean(1)
def rms_db(t0, t1):
    if audio is None: return -99
    s = audio[int(t0 * sr):int(t1 * sr)]
    return 20 * np.log10(np.sqrt((s ** 2).mean()) + 1e-9) if len(s) else -99

# --- gap trimming: remove audio inside long silences between lines ---
cuts = []   # (source time, seconds removed)  — removal region ends just before next line onset
for i in range(len(LINES) - 1):
    e = SP[LINES[i][2]][2]; s = SP[LINES[i + 1][1]][1]
    g = s - e; mx = KEEP_LONG.get(i, MAXG)
    if g > mx:
        rem = g - mx; a, b = s - 0.08 - rem, s - 0.08
        # slide region later/earlier is not needed: verify it is quiet
        if audio is not None and rms_db(a, b) > -45:
            # find the quietest window of length rem inside [e, s]
            best = None
            for t in np.arange(e, s - rem, 0.01):
                v = rms_db(t, t + rem)
                if best is None or v < best[0]: best = (v, t)
            a, b = best[1], best[1] + rem
        cuts.append((a, b))
def shift(t):
    d = 0.0
    for a, b in cuts:
        if t >= b: d += b - a
        elif t > a: d += t - a
    return t - d

lines = []
for txt, a, b in LINES:
    toks = txt.split(); ws = SP[a:b + 1]; k = 0; words = []
    for tk in toks:
        n = MERGE.get(tk, 1); grp = ws[k:k + n]; k += n
        words.append([tk, shift(grp[0][1]), shift(grp[-1][2])])
    assert k == len(ws), (txt, k, len(ws))
    lines.append({"text": txt, "words": words, "start": words[0][1], "end": words[-1][2]})
if globals().get("PROMISE"):
    voice_end = lines[-2]["end"] + 0.6; total = max(voice_end + ENDCARD, lines[-1]["end"] + 1.0)
else:
    voice_end = lines[-1]["end"] + 0.6; total = voice_end + ENDCARD
if audio is not None:
    keep = np.ones(len(audio), bool)
    for a, b in cuts:
        ia, ib = int(a * sr), int(b * sr); keep[ia:ib] = False
    # 10 ms crossfade-free splice is safe because regions are silent
    # micro-fades at every splice (6 ms out / 6 ms in) so cuts never click; timing unchanged
    fade = int(0.006 * sr); env = np.ones(len(audio))
    for a, b in cuts:
        ia, ib = int(a * sr), int(b * sr)
        env[max(0, ia - fade):ia] = np.linspace(1, 0, ia - max(0, ia - fade))
        env[ib:ib + fade] = np.linspace(0, 1, len(env[ib:ib + fade]))
    y = (audio * env)[keep]
    y = np.concatenate([y, np.zeros(max(0, int(total * sr) - len(y)))])[:int(total * sr)]
    sf.write(f"{D}/voice_raw.wav", y.astype(np.float32), sr, subtype="FLOAT")
    print("audio", sr, round(len(y) / sr, 2), "cut regions dB:", [round(rms_db(a, b)) for a, b in cuts])
json.dump({"lines": lines, "voice_end": voice_end, "total": total}, open(f"{D}/timeline.json", "w"), indent=1)
for l in lines: print(f'{l["start"]:6.2f} {l["end"]:6.2f}  {l["text"]}')
print("removed", round(sum(b - a for a, b in cuts), 2), "voice_end", round(voice_end, 2), "total", round(total, 2))
