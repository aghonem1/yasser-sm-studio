import os
import json, os, numpy as np
D = os.environ["EP_DIR"]
SP = json.load(open(f"{D}/spoken.json"))
# (display text, first spoken idx, last spoken idx); tokens consume 1 spoken word unless listed in MERGE
LINES = [   # Track B · B02 Bismillah (1:1)
    ('Bismillah before Al-Fatihah: you don’t start with your strength.', 0, 9),
    ('Not with your experience.', 10, 13),
    ('Not with your worthiness.', 14, 17),
    ('In the Name of Allah, the Entirely Merciful, the Especially Merciful.', 18, 21),
    ('It frees you from an illusion:', 22, 27),
    ('that you’re doing this on your own.', 28, 34),
    ('You begin with Allah,', 35, 38),
    ('asking His help, His blessing, His mercy.', 39, 45),
    ('And mercy, right at the start,', 46, 51),
    ('opens the door of hope.', 52, 56),
    ('You’re not walking up to a distant, unfeeling power.', 57, 65),
    ('You’re coming to a Lord whose mercy embraces you.', 66, 74),
    ('In your next prayer, don’t just repeat it from memory.', 75, 84),
    ('You’re entering a conversation.', 85, 88),
    ('Bismillah.', 89, 90),
    ('Not your strength. His name first.', 91, 96),
    ('What do you lean on most: your strength, your experience, or your worthiness?', 97, 109),
    ('One word below.', 110, 112),
    ('One phrase from your prayer, every day.', 113, 119),
    ('Follow for the next one.', 120, 124),
]
PROMISE = True
MERGE = {'Bismillah': 2, 'Bismillah.': 2}
MAXG, KEEP_LONG = 0.30, {0: 0.45, 2: 0.45, 4: 0.4, 5: 0.35, 9: 0.45, 11: 0.45, 13: 0.45, 15: 0.5, 16: 0.55}
LEAD = 0.03
ENDCARD = 2.6
HOLD = 0.5
QUIET_DB = -42
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
    toks = txt.split(' '); ws = SP[a:b + 1]; k = 0; words = []
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
