"""Replaces the spoken date in the story narration (line 49, "The weekend of the twelfth and thirteenth of December.")
with the line recorded on 25 Nov 2026: "Saturday, the ninth of January. Nine p.m., Singapore time." (episodes/webinar01x/src.wav, key "date").
The session moved to Saturday 9 January 2027, 9 PM Singapore time. The new line is longer, so everything after it moves later
and the total grows by the difference. Edits voice_raw.wav and timeline.json in place; a no-op when already applied.
usage: EP_DIR=<abs>/episodes/webinar01v python3 scripts/episodes/webinar01v_patch_date.py   (run from the repo root)"""
import os, json, shutil
import numpy as np, soundfile as sf
D = os.environ["EP_DIR"]
TL = json.load(open(f"{D}/timeline.json")); L, R = TL["lines"][49], TL["lines"][50]
if L["text"].startswith("Saturday"): print("already patched"); raise SystemExit
assert L["text"].startswith("The weekend of the twelfth") and R["text"].startswith("Register at"), (L["text"], R["text"])
NEW = next(l for l in json.load(open(os.path.join(os.path.dirname(D), "webinar01x", "words.json")))["lines"] if l["key"] == "date")["words"]
y, sr = sf.read(f"{D}/voice_raw.wav"); c, sr2 = sf.read(os.path.join(os.path.dirname(D), "webinar01x", "src.wav")); assert sr == sr2, (sr, sr2)
shutil.copy(f"{D}/voice_raw.wav", f"{D}/voice_raw_before_date_patch.wav")
t0, t1 = L["start"], L["end"]; a0, a1 = NEW[0][1], NEW[-1][2]
delta = (a1 - a0) - (t1 - t0)
old = y[int(t0 * sr):int(t1 * sr)]; new = c[int(a0 * sr):int(a1 * sr)]
g = np.sqrt((old ** 2).mean()) / np.sqrt((new ** 2).mean()); print("gain to match the old line: %.2f, shift after it: %.3f s" % (g, delta))
f = int(0.02 * sr)
cutA, cutB = int((t0 - 0.12) * sr), int((t1 + 0.2) * sr)                # the old line with a little air on both sides
head, tail = y[:cutA].copy(), y[cutB:].copy()
head[-f:] *= np.linspace(1, 0, f); tail[:f] *= np.linspace(0, 1, f)
clip = c[int((a0 - 0.12) * sr):int((a1 + 0.2) * sr)].copy() * g
clip[:f] *= np.linspace(0, 1, f); clip[-f:] *= np.linspace(1, 0, f)
out = np.concatenate([head, clip, tail])
sf.write(f"{D}/voice_raw.wav", out.astype(np.float32), sr, subtype="FLOAT")
off = t0 - a0
L["text"] = "Saturday, the ninth of January. Nine p.m., Singapore time."
L["words"] = [[w, round(off + s, 3), round(off + e, 3)] for w, s, e in NEW]; L["end"] = L["words"][-1][2]
R["start"] = round(R["start"] + delta, 3); R["end"] = round(R["end"] + delta, 3); R["words"] = [[w, round(s + delta, 3), round(e + delta, 3)] for w, s, e in R["words"]]
TL["voice_end"] = round(TL["voice_end"] + delta, 3); TL["total"] = round(TL["total"] + delta, 3)
json.dump(TL, open(f"{D}/timeline.json", "w"), ensure_ascii=False, indent=1)
print("line 49", L["start"], L["end"], "| line 50", R["start"], R["end"], "| voice_end", TL["voice_end"], "total", TL["total"])
