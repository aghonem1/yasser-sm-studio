"""Builds voice tracks, timelines and sound cues for the four story reels of webinar 1 (9:16, reel v3 system):
  r1 the Black Stone · r2 how revelation began · r3 who believed next · r4 two people, two answers
Sources, no new script: the navy full narration of 22 Nov (episodes/webinar01), the openers and the date line of 25 Nov
(episodes/webinar01x). Each reel: opener (if any) + story lines + "What did Khadijah know?" + the spoken date. Run from the repo root."""
import json, os, re
import numpy as np, soundfile as sf

SR = 44100
def load(p):
    x, sr = sf.read(p); assert sr == SR, sr
    return x if x.ndim == 1 else x.mean(1)
def rms(x): return float(np.sqrt(np.mean(x ** 2) + 1e-12))
full, extra = load("episodes/webinar01/voice_raw.wav"), load("episodes/webinar01x/src.wav")
TF = json.load(open("episodes/webinar01/timeline.json"))["lines"]
TX = {l["key"]: l for l in json.load(open("episodes/webinar01x/words.json"))["lines"]}
REF = rms(np.concatenate([full[int(TF[i]["start"] * SR):int(TF[i]["end"] * SR)] for i in range(11, 36)]))
norm = lambda s: re.sub(r"[,.?'…“”:‘’]", "", s.lower())

REELS = {
    "r1": dict(opener="stone", lines=[12, 13, 14, 15], keys=["stone", "kabah", "dispute", "judgement", "honour"]),
    "r2": dict(opener="begin", lines=[17, 18, 19, 20], keys=["begin", "step", "dreams", "al-alaq", "home"]),
    "r3": dict(opener=None, lines=[25, 26, 27, 28, 29], keys=["next", "bakr", "invited", "first", "knowing"]),
    "r4": dict(opener="known", lines=[30, 31, 32, 33, 34, 35], keys=["years", "safa", "revelation", "different", "lahab", "people", "opposite"]),
}

def clip(src, a, b, pre=0.10, post=0.22):
    y = src[int((a - pre) * SR):int((b + post) * SR)].copy(); f = int(0.015 * SR)
    y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f); return y, pre

for name, R in REELS.items():
    D = f"episodes/webinar01{name}"; os.makedirs(D, exist_ok=True)
    out = np.zeros(60 * SR); lines = []; t = 0.12                       # the voice starts at once: the first 3 seconds decide
    def put(y, at): i = int(at * SR); out[i:i + len(y)] += y
    def add(words, d, text=None):
        w = [[x, s + d, e + d] for x, s, e in words]
        lines.append({"text": text or " ".join(x for x, _, _ in w), "words": w, "start": w[0][1], "end": w[-1][2]})
    if R["opener"]:
        W = TX[R["opener"]]["words"]; a, b = W[0][1], W[-1][2]
        y, pre = clip(extra, a, b); put(y * REF / rms(extra[int(a * SR):int(b * SR)]), t - pre); add(W, t - a, TX[R["opener"]]["text"]); t = t - a + b + 0.38
    # the story lines keep the pacing they were recorded with
    i0, i1 = R["lines"][0], R["lines"][-1]; a, b = TF[i0]["start"], TF[i1]["end"]
    y, pre = clip(full, a, b); put(y, t - pre)
    for i in R["lines"]: add(TF[i]["words"], t - a, TF[i]["text"])
    t = t - a + b + 0.6
    # the title question, then the date in his voice
    q = TF[41]; y, pre = clip(full, q["start"], q["end"]); put(y, t - pre); add(q["words"], t - q["start"], q["text"]); t = t + (q["end"] - q["start"]) + 0.55
    W = TX["date"]["words"]; a, b = W[0][1], W[-1][2]
    y, pre = clip(extra, a, b, post=0.35); put(y * REF / rms(extra[int(a * SR):int(b * SR)]), t - pre)
    add(W[:5], t - a); add(W[5:], t - a)
    keys = R["keys"] + ["khadijah", "january", "singapore"]
    for l, k in zip(lines, keys):
        l["key"] = next((x for x, _, _ in l["words"] if k in norm(x)), None); assert l["key"], (name, k, l["text"])
    voice_end = lines[-1]["end"] + 0.5; total = voice_end + 3.2
    x = out[:int(total * SR)]; x = x / max(1.0, np.max(np.abs(x)) / 0.98)
    sf.write(f"{D}/voice_raw.wav", x, SR)
    tl = {"lines": lines, "voice_end": voice_end, "total": total}
    for p in (f"{D}/timeline.json", f"remotion/src/episodes/timeline_webinar01{name}.json"): json.dump(tl, open(p, "w"), ensure_ascii=False)
    # sound cues: few and quiet. [kind, time, gain, (freq)]
    S = [l["start"] for l in lines]; T = len(lines) - 3
    def wt(i, w): return next((s for x, s, _ in lines[i]["words"] if norm(x).startswith(w)), lines[i]["start"])
    cues = [["boom", 0.05, 0.35]]
    mid = {"r1": [["chime", wt(1, "quraysh"), 0.26, 1174.7], ["whoosh", S[3] - 0.45, 0.4], ["chime", wt(3, "accepted"), 0.3, 1318.5], ["shimmer", wt(4, "share"), 0.3]],
           "r2": [["whoosh", S[1] - 0.45, 0.4], ["chime", wt(2, "truthful"), 0.28, 1174.7], ["chime", wt(2, "retreat"), 0.28, 1318.5], ["chime", wt(3, "opening"), 0.28, 1568.0], ["chime", wt(4, "return"), 0.28, 1760.0]],
           "r3": [["chime", wt(1, "ali"), 0.28, 1174.7], ["chime", wt(1, "zayd"), 0.28, 1318.5], ["chime", wt(1, "abu"), 0.28, 1568.0], ["whoosh", S[3] - 0.45, 0.4], ["shimmer", wt(3, "who"), 0.3]],
           "r4": [["whoosh", S[1] - 0.45, 0.4], ["chime", wt(2, "someone"), 0.26, 1174.7], ["boom", S[4] - 0.05, 0.3], ["whoosh", S[5] - 0.45, 0.4], ["chime", S[5], 0.28, 1318.5], ["chime", S[6], 0.28, 1174.7]]}[name]
    cues += mid + [["whoosh", S[T] - 0.5, 0.4], ["boom", S[T] - 0.1, 0.5], ["shimmer", S[T] - 0.05, 0.4], ["chime", S[T + 1] - 0.05, 0.3, 1318.5], ["chime", S[T + 2] - 0.05, 0.26, 1568.0], ["shimmer", voice_end - 0.3, 0.28]]
    json.dump({"cues": cues, "pulse": S[1] - 0.3, "dense": S[T]}, open(f"{D}/cues.json", "w"))
    print(name, "total %.2f" % total, "|", " / ".join("%d %.2f %s [%s]" % (i, l["start"], l["text"], l["key"]) for i, l in enumerate(lines)))
