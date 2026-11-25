"""Builds the voice track and timeline for the 9:16 webinar reel, v3 (episodes/webinar01r), from recordings that already exist:
  lines 0-7   the hook, from the short cut recorded 22 Nov (episodes/webinar01s)
  lines 8-11  the invitation, from the navy full narration recorded 22 Nov (episodes/webinar01, lines 36, 37, 38, 41)
  lines 12-13 the date, from the extra lines recorded 25 Nov (episodes/webinar01x, line "date")
No sales close: the old "Register at the link." line is not used. Run from the repo root."""
import json
import numpy as np, soundfile as sf

SR = 44100
def load(ep, name="voice_raw.wav"):
    x, sr = sf.read(f"episodes/{ep}/{name}"); assert sr == SR, sr
    return x if x.ndim == 1 else x.mean(1)
def rms(x): return float(np.sqrt(np.mean(x ** 2) + 1e-12))
def cut(x, a, b, pre=0.10, post=0.22):
    i, j = int((a - pre) * SR), int((b + post) * SR); y = x[i:j].copy(); f = int(0.015 * SR)
    y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f); return y, pre

short, full, extra = load("webinar01s"), load("webinar01"), load("webinar01x", "src.wav")
TS = json.load(open("episodes/webinar01s/timeline.json"))["lines"]
TF = json.load(open("episodes/webinar01/timeline.json"))["lines"]
TX = {l["key"]: l for l in json.load(open("episodes/webinar01x/words.json"))["lines"]}

out = np.zeros(int(60 * SR)); lines = []
def put(y, at):
    i = int(at * SR); out[i:i + len(y)] += y
# 1) the hook, kept exactly as recorded (0 to just after "seen?")
hook_end = TS[7]["end"] + 0.25
h = short[:int(hook_end * SR)].copy(); f = int(0.015 * SR); h[-f:] *= np.linspace(1, 0, f); put(h, 0)
ref = rms(np.concatenate([short[int(l["start"] * SR):int(l["end"] * SR)] for l in TS[:8]]))
for l in TS[:8]: lines.append({"text": l["text"], "words": l["words"], "start": l["start"], "end": l["end"]})
# 2) the invitation, level-matched to the hook
seg = np.concatenate([full[int(TF[i]["start"] * SR):int(TF[i]["end"] * SR)] for i in (36, 37, 38, 41)])
g = ref / rms(seg)
t = TS[7]["end"] + 0.6
for i, gap in ((36, 0.45), (37, 0.30), (38, 0.45), (41, 0.60)):
    l = TF[i]; y, pre = cut(full, l["start"], l["end"]); put(y * g, t - pre)
    d = t - l["start"]
    txt = l["text"] + (":" if i == 38 else "")
    words = [[w, s + d, e + d] for w, s, e in l["words"]]
    if i == 38: words[-1][0] = words[-1][0] + ":"
    lines.append({"text": txt, "words": words, "start": t, "end": l["end"] + d}); t = l["end"] + d + gap
# 3) the date, one piece so its own pacing is kept; shown as two caption lines
W = TX["date"]["words"]; a, b = W[0][1], W[-1][2]
y, pre = cut(extra, a, b, post=0.35); gx = ref / rms(extra[int(a * SR):int(b * SR)]); put(y * gx, t - pre)
d = t - a
for part in (W[:5], W[5:]):
    lines.append({"text": " ".join(w for w, _, _ in part), "words": [[w, s + d, e + d] for w, s, e in part], "start": part[0][1] + d, "end": part[-1][2] + d})
voice_end = lines[-1]["end"] + 0.5
total = voice_end + 3.4                      # the closing card holds, then loops
x = out[:int(total * SR)]
x = x / max(1.0, np.max(np.abs(x)) / 0.98)
sf.write("episodes/webinar01r/voice_raw.wav", x, SR)
tl = {"lines": lines, "voice_end": voice_end, "total": total}
for p in ("episodes/webinar01r/timeline.json", "remotion/src/episodes/timeline_webinar01r.json"):
    json.dump(tl, open(p, "w"), ensure_ascii=False)
print("gains", round(g, 2), round(gx, 2), "| voice_end", round(voice_end, 2), "total", round(total, 2))
for i, l in enumerate(lines): print(i, round(l["start"], 2), round(l["end"], 2), l["text"])
