import os
import json, os, numpy as np
D = os.environ["EP_DIR"]
SP = json.load(open(f"{D}/spoken.json"))
# (display text, first spoken idx, last spoken idx); tokens consume 1 spoken word unless listed in MERGE
LINES = [   # ep10 salih (the last two lines are the follow line, spoken over the end card)
    ('Hours of prayer,', 0, 2),
    ('and still not righteous?', 3, 6),
    ('Ask your neighbour.', 7, 9),
    ('One word: ṣāliḥ.', 10, 12),
    ('Its root: ṣād, lām, ḥā,', 13, 17),
    ('means sound: fit for its good purpose.', 18, 24),
    ('Land is ṣāliḥah when it can produce life.', 25, 32),
    ('Water is ṣāliḥ when it can be used safely.', 33, 41),
    ('A deed is ṣāliḥ when its effect is right and beneficial.', 42, 52),
    ("So it's not merely about appearance.", 53, 58),
    ("It's about the effect.", 59, 62),
    ('God says:', 63, 64),
    ('“Surely, those who believe and do righteous deeds…”', 65, 72),
    ('Faith is the root.', 73, 76),
    ('Righteous conduct is its fruit.', 77, 81),
    ("Here's the hard part.", 82, 85),
    ('A person may pray for a long time,', 86, 93),
    ('and still harm his neighbour.', 94, 98),
    ('Roots, but no fruit?', 99, 102),
    ('The claim has no visible proof.', 103, 108),
    ('One sign of righteousness:', 109, 112),
    ('your neighbour feels safe around you.', 113, 118),
    ('Prayer is a righteous deed.', 119, 123),
    ('So is honesty at work.', 124, 128),
    ('Hours of prayer, and a neighbour who feels safe:', 129, 137),
    ('that is ṣāliḥ.', 138, 140),
    ('Where is goodness harder for you:', 141, 146),
    ('at work, or next door?', 147, 151),
    ('Tell me below.', 152, 154),
    ("One Qur'anic word a day.", 155, 159),
    ("Follow for tomorrow's.", 160, 162),
]
VOICE_END_LINE = 29   # ep10: the end card starts with the follow line
PROMISE = True
MERGE = {}
MAXG, KEEP_LONG = 0.32, {1: 0.36, 2: 0.42, 3: 0.45, 5: 0.36, 8: 0.38, 10: 0.45, 12: 0.5, 14: 0.5, 15: 0.5, 17: 0.4, 19: 0.45, 23: 0.42, 25: 0.55, 27: 0.36, 28: 0.4}
LEAD = 0.03
ENDCARD = 3.2
HOLD = 0.8
VOICE_END_LINE = globals().get('VOICE_END_LINE')
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
if VOICE_END_LINE is not None:
    voice_end = lines[VOICE_END_LINE]["start"] - 0.12; total = max(voice_end + ENDCARD, lines[-1]["end"] + 1.2)
elif globals().get("PROMISE"):
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
