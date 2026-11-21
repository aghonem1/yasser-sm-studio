import os
import json, os, numpy as np
D = os.environ["EP_DIR"]
SP = json.load(open(f"{D}/spoken.json"))
# (display text, first spoken idx, last spoken idx); tokens consume 1 spoken word unless listed in MERGE
LINES = [   # ep04 al-balagh
    ("You weren't asked to judge.", 0, 4),
    ('Not even the Prophet was.', 5, 9),
    ("The Qur'an gives him one job:", 10, 15),
    ('al-balāgh.', 16, 16),
    ('To deliver the message.', 17, 20),
    ('“Your duty is only to deliver the message,', 21, 28),
    ('and it is for Us to call them to account.”', 29, 38),
    ('Deliver.', 39, 39),
    ('Not force it into hearts.', 40, 44),
    ('Not search souls.', 45, 47),
    ('Not pronounce the final judgement.', 48, 52),
    ('“So remind them;', 53, 55),
    ('you are only one who reminds.', 56, 61),
    ('You are not appointed to control them.”', 62, 68),
    ("Here's the hard part.", 69, 72),
    ("If the Prophet was not appointed to control people's faith,", 73, 82),
    ('how can anyone after him', 83, 87),
    ('claim authority over their consciences?', 88, 92),
    ('We see a single moment.', 93, 97),
    ('God sees the whole journey.', 98, 102),
    ("You weren't asked to judge hearts.", 103, 108),
    ('You were asked to deliver.', 109, 113),
]
MERGE = {}
MAXG, KEEP_LONG = 0.5, {19: 0.75, 2: 0.45}
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
