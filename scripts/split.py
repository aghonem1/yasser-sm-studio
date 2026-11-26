import os
import json, os, numpy as np
D = os.environ["EP_DIR"]
SP = json.load(open(f"{D}/spoken.json"))
# (display text, first spoken idx, last spoken idx); tokens consume 1 spoken word unless listed in MERGE
LINES = [   # ep08 ahsan (the last line is the series promise, spoken over the end card)
    ('Not good. Better.', 0, 2),
    ("That's the Qur'an's command to you.", 3, 8),
    ('One word: aḥsan.', 9, 11),
    ('God says:', 12, 13),
    ('“Respond with what is better,', 14, 18),
    ('and the one between whom and you there was hostility', 19, 28),
    ('may become like a close friend.”', 29, 34),
    ('Notice:', 35, 35),
    ("it doesn't just say, respond with something good.", 36, 43),
    ('It says: with what is better.', 44, 49),
    ('The response most likely to heal,', 50, 55),
    ('correct, and bring peace.', 56, 59),
    ('Think of a greeting.', 60, 63),
    ('Returning it is justice.', 64, 67),
    ('Returning it with something better is kindness.', 68, 74),
    ("Here's the hard part.", 75, 78),
    ('Not every answer you can give', 79, 84),
    ('is one you ought to give.', 85, 90),
    ('You can win the argument,', 91, 95),
    ('and lose the heart.', 96, 99),
    ("The point isn't to break the person in front of you.", 100, 110),
    ("It's to make the truth clearer.", 111, 116),
    ("Truth doesn't need insult to support it.", 117, 123),
    ('Not good. Better.', 124, 126),
    ('A new word, every day.', 127, 131),
]
PROMISE = True   # last line is spoken during the end card: voice_end = end of the line before it
MERGE = {}
MAXG, KEEP_LONG = 0.32, {0: 0.36, 1: 0.4, 2: 0.4, 3: 0.5, 6: 0.5, 9: 0.45, 11: 0.4, 14: 0.55, 15: 0.42, 21: 0.4, 22: 0.6}
LEAD = 0.03   # ep08: cut leading silence so the hook is spoken from ~0.0 s (learnings: first 3 seconds); None = keep
ENDCARD = 3.2
HOLD = 0.8   # ep08: the callback before the end card stays 0.8 s longer (Ahmed: it went by too fast)
QUIET_DB = -42   # gap trimming only removes audio this quiet (added ep07: protects word tails)

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
            # still not silent (word tail or breath under a short timestamp gap): shrink the cut until it is
            while rem > 0.04 and rms_db(a, b) > QUIET_DB:
                rem -= 0.02
                best = min((rms_db(t, t + rem), t) for t in np.arange(e, s - rem, 0.01))
                a, b = best[1], best[1] + rem
            if rms_db(a, b) > QUIET_DB: continue
        cuts.append((a, b))
if globals().get('LEAD') is not None:
    s0 = SP[LINES[0][1]][1] - LEAD
    if s0 > 0.05:
        if audio is not None:
            while s0 > 0.05 and rms_db(0, s0) > QUIET_DB: s0 -= 0.02
        if s0 > 0.05: cuts.insert(0, (0.0, s0))
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
    voice_end = lines[-2]["end"] + 0.6 + HOLD; total = max(voice_end + ENDCARD, lines[-1]["end"] + 1.0)
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
