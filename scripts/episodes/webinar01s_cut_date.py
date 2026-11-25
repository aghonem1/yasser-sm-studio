"""Builds episodes/webinar01s2 from episodes/webinar01s: the same recording with the spoken date line removed
(the session moved from 12-13 December 2026 to Saturday 9 January 2027; the date is on screen only).
Run from the repo root. Writes voice_raw.wav and timeline.json, and copies the timeline into the Remotion source."""
import json
import numpy as np, soundfile as sf

src, dst = "episodes/webinar01s", "episodes/webinar01s2"
tl = json.load(open(f"{src}/timeline.json")); L = tl["lines"]
assert L[10]["text"].startswith("The weekend of the twelfth"), L[10]["text"]
cut0 = (L[9]["end"] + L[10]["start"]) / 2            # middle of the pause before the date line
cut1 = L[11]["start"] - (L[10]["start"] - cut0)      # keep the same pause before the last line
d = cut1 - cut0
x, sr = sf.read(f"{src}/voice_raw.wav")
a, b, f = int(cut0 * sr), int(cut1 * sr), int(0.012 * sr)
head, tail = x[:a].copy(), x[b:].copy()
ramp = np.linspace(1, 0, f)
if x.ndim > 1: ramp = ramp[:, None]
head[-f:] *= ramp; tail[:f] *= ramp[::-1]
sf.write(f"{dst}/voice_raw.wav", np.concatenate([head, tail]), sr)
last = dict(L[11]); last["start"] -= d; last["end"] -= d; last["words"] = [[w, s - d, e - d] for w, s, e in last["words"]]
new = {"lines": L[:10] + [last], "voice_end": tl["voice_end"] - d, "total": tl["total"] - d}
for path in (f"{dst}/timeline.json", "remotion/src/episodes/timeline_webinar01s.json"):
    json.dump(new, open(path, "w"), ensure_ascii=False)
print("removed", round(d, 3), "s; total", round(new["total"], 3))
