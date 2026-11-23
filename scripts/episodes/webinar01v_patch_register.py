"""Replaces the last line of the story narration ("Register at yasserfares.com") with a re-recorded one in which
the name is pronounced the Arabic way (فارِس, "Faaris", not "Fairs"). Ahmed's correction, 23 Nov 2026.
Run AFTER webinar01_split.py (story variant): it edits voice_raw.wav and timeline.json in place and is a no-op when already applied.
The new line was generated once: "[warm] Register at يَاسِر فَارِس dot com." (speed 0.94) -> register_src.wav
usage: EP_DIR=<abs>/episodes/webinar01v python3 scripts/episodes/webinar01v_patch_register.py"""
import os, json, shutil
import numpy as np, soundfile as sf
D = os.environ["EP_DIR"]
TL = json.load(open(f"{D}/timeline.json")); L = TL["lines"][-1]
assert L["text"].startswith("Register at"), L["text"]
if L["end"] > 132.2: print("already patched"); raise SystemExit
# word timings of the new clip (from HeyGen; the audio tag is not spoken)
NEW = [("Register", 0.363, 0.772), ("at", 1.044, 1.498), ("yasserfares.com", 1.634, 3.45)]
y, sr = sf.read(f"{D}/voice_raw.wav"); c, sr2 = sf.read(f"{D}/register_src.wav"); assert sr == sr2, (sr, sr2)
shutil.copy(f"{D}/voice_raw.wav", f"{D}/voice_raw_before_register_patch.wav")
t0 = L["start"]; off = t0 - NEW[0][1]                       # the new "Register" starts where the old one did
a, b = int((t0 - 0.12) * sr), int((L["end"] + 0.25) * sr)
old = y[int(t0 * sr):int(L["end"] * sr)]; new = c[int(NEW[0][1] * sr):int(NEW[-1][2] * sr)]
g = np.sqrt((old ** 2).mean()) / np.sqrt((new ** 2).mean()); print("gain to match the old line: %.2f" % g)
f = int(0.02 * sr); y[a - f:a] *= np.linspace(1, 0, f); y[a:] = 0   # nothing but this line follows
c = c * g; c[:f] *= np.linspace(0, 1, f); c[-f:] *= np.linspace(1, 0, f)
i = int(off * sr); n = min(len(c), len(y) - i); y[i:i + n] += c[:n]
sf.write(f"{D}/voice_raw.wav", y.astype(np.float32), sr, subtype="FLOAT")
L["words"] = [[w, round(off + s, 3), round(off + e, 3)] for w, s, e in NEW]; L["end"] = L["words"][-1][2]
TL["voice_end"] = round(L["end"] + 0.6, 3)                  # total stays as it was: the end hold is a little shorter
json.dump(TL, open(f"{D}/timeline.json", "w"), ensure_ascii=False, indent=1)
print("line", L["start"], L["end"], "voice_end", TL["voice_end"], "total", TL["total"])
