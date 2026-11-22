"""Timeline for the webinar teaser "What Did Khadijah Know?" (full 16:9 version and the short 9:16 cut).

usage: EP_DIR=episodes/webinar01  VARIANT=full  python3 scripts/episodes/webinar01_split.py
       EP_DIR=episodes/webinar01s VARIANT=short python3 scripts/episodes/webinar01_split.py
Reads words.json (HeyGen word timings, audio tags included) and src.wav; writes spoken.json, voice_raw.wav, timeline.json.
Display text uses the outline's English spellings; each token consumes one spoken word unless listed in MERGE.
A non-breaking space keeps two display words as one token (the Ka'bah is one spoken word).
"""
import json, os, numpy as np

D = os.environ["EP_DIR"]
VARIANT = os.environ.get("VARIANT", "full")
TAGS = {"curious", "thoughtful", "pause", "serious", "warm"}
NB = " "

FULL = [
    "A man comes home from the cave of Hira, trembling.",
    "He has just received the first words of revelation.",
    "The first person to hear it is his wife.",
    "And she reassures him.",
    "Her name is Khadijah.",
    "Her answer was not a guess.",
    "She had known him for years:",
    "first as the man she trusted with her trade,",
    "then as her husband.",
    "So the question is simple.",
    "What had she seen?",
    "She was not the only one who had been watching.",
    f"When Quraysh rebuilt the{NB}Ka‘bah,",
    "the clans fell into dispute over who would place the Black Stone.",
    "They accepted his judgement.",
    "And the settlement let them all share the honour.",
    "Then came Hira.",
    "The account of ‘A’ishah takes us through it, step by step:",
    "truthful dreams, a retreat,",
    "the opening words of Surat al-‘Alaq,",
    "and the return home.",
    "Khadijah listens.",
    "And she answers from what she had witnessed in him.",
    "Then comes a second response,",
    "from Waraqah ibn Nawfal.",
    "Who believed next?",
    "‘Ali. Zayd ibn Harithah. Abu Bakr,",
    "and those he invited.",
    "The accounts differ on who came first among the men,",
    "and the reasons they differ are worth knowing.",
    "And when the call went public, at Safa,",
    "someone else who had known him before revelation",
    "gave a very different answer.",
    "Abu Lahab.",
    "Two people who knew him.",
    "Two opposite answers.",
    "Join me for one hour, live and free.",
    "We will read the accounts together,",
    "and follow this one question",
    "from the marketplace, to the mountain,",
    "to the first public call.",
    "What did Khadijah know?",
    "The weekend of the twelfth and thirteenth of December.",
    "Register at yasserfares.com",
]
SHORT = [
    "A man comes home from the cave of Hira, trembling.",
    "He has just received the first words of revelation.",
    "The first person to hear it is his wife, Khadijah.",
    "And she reassures him.",
    "Her answer was not a guess.",
    "She had known him for years,",
    "in trade and in marriage.",
    "So what had she seen?",
    "One hour, live and free.",
    "What did Khadijah know?",
    "The weekend of the twelfth and thirteenth of December.",
    "Register at the link.",
]
TXT = FULL if VARIANT == "full" else SHORT
MERGE = {"yasserfares.com": 3}
MAXG = 0.62 if VARIANT == "full" else 0.5       # the explainer keeps a little more air between lines
KEEP_LONG = {}
ENDCARD = 5.0 if VARIANT == "full" else 3.6

W = json.load(open(f"{D}/words.json"))
SP = [w for w in W if not (w[0] in TAGS and (w[2] - w[1]) < 0.45 and w[0].islower())]
json.dump(SP, open(f"{D}/spoken.json", "w"), ensure_ascii=False)

LINES = []
k = 0
for txt in TXT:
    n = sum(MERGE.get(tk, 1) for tk in txt.split(" "))
    LINES.append((txt, k, k + n - 1)); k += n
assert k == len(SP), (k, len(SP))

import soundfile as sf
audio, sr = sf.read(f"{D}/src.wav")
if audio.ndim > 1: audio = audio.mean(1)
def rms_db(t0, t1):
    s = audio[int(t0 * sr):int(t1 * sr)]
    return 20 * np.log10(np.sqrt((s ** 2).mean()) + 1e-9) if len(s) else -99

cuts = []
for i in range(len(LINES) - 1):
    e = SP[LINES[i][2]][2]; s = SP[LINES[i + 1][1]][1]
    g = s - e; mx = KEEP_LONG.get(i, MAXG)
    if g > mx:
        rem = g - mx; a, b = s - 0.08 - rem, s - 0.08
        if rms_db(a, b) > -45:
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
    toks = txt.split(" "); ws = SP[a:b + 1]; k = 0; words = []
    for tk in toks:
        n = MERGE.get(tk, 1); grp = ws[k:k + n]; k += n
        words.append([tk.replace(NB, " "), shift(grp[0][1]), shift(grp[-1][2])])
    assert k == len(ws), (txt, k, len(ws))
    lines.append({"text": txt.replace(NB, " "), "words": words, "start": words[0][1], "end": words[-1][2]})
voice_end = lines[-1]["end"] + 0.6; total = voice_end + ENDCARD
keep = np.ones(len(audio), bool)
fade = int(0.006 * sr); env = np.ones(len(audio))
for a, b in cuts:
    ia, ib = int(a * sr), int(b * sr); keep[ia:ib] = False
    env[max(0, ia - fade):ia] = np.linspace(1, 0, ia - max(0, ia - fade))
    env[ib:ib + fade] = np.linspace(0, 1, len(env[ib:ib + fade]))
y = (audio * env)[keep]
y = np.concatenate([y, np.zeros(max(0, int(total * sr) - len(y)))])[:int(total * sr)]
sf.write(f"{D}/voice_raw.wav", y.astype(np.float32), sr, subtype="FLOAT")
print("audio", sr, round(len(y) / sr, 2), "cut regions dB:", [round(rms_db(a, b)) for a, b in cuts])
json.dump({"lines": lines, "voice_end": voice_end, "total": total}, open(f"{D}/timeline.json", "w"), indent=1, ensure_ascii=False)
for i, l in enumerate(lines): print(f'{i:2d} {l["start"]:6.2f} {l["end"]:6.2f}  {l["text"]}')
print("removed", round(sum(b - a for a, b in cuts), 2), "voice_end", round(voice_end, 2), "total", round(total, 2))
