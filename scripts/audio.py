import os
"""Episode 3 v2 audio: studio voice chain, real CC0 SFX (wyzowl/sfx-kit), CC0 ambient bed (alvana-audio, HoliznaCC0 'Cave 1').
Outputs mix_v2_music.wav and mix_v2_nomusic.wav (48 kHz, -14 LUFS, true peak <= -1 dBTP)."""
import json, subprocess, numpy as np, soundfile as sf, pyloudnorm as pyln
from pedalboard import Pedalboard, HighpassFilter, PeakFilter, HighShelfFilter, LowShelfFilter, Compressor, Reverb, Gain, Limiter

D = os.environ["EP_DIR"]; KIT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "sfx"); SR = 48000
TL = json.load(open(f"{D}/timeline.json")); LINES = TL["lines"]; ST = [l["start"] for l in LINES]; VEND = TL["voice_end"]; TOTAL = TL["total"]
N = int(TOTAL * SR)
meter = pyln.Meter(SR)

def load(path, sr=SR):
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-af", f"aresample={sr}:resampler=soxr", "-ac", "1", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(out, np.float32).astype(np.float64)
def lufs(x): return meter.integrated_loudness(x)
def norm(x, target): return x * 10 ** ((target - lufs(x)) / 20)
def wt(i, w):
    for x, s, e in LINES[i]["words"]:
        if x.lower().strip(",.?'…“”:").startswith(w): return s
    return ST[i]

# ---------------- voice ----------------
v = load(f"{D}/voice_raw.wav")
v *= 10 ** (-3 / 20)  # headroom
chain = Pedalboard([
    HighpassFilter(cutoff_frequency_hz=72),
    LowShelfFilter(cutoff_frequency_hz=160, gain_db=1.0, q=0.7),        # a little chest
    PeakFilter(cutoff_frequency_hz=320, gain_db=-1.8, q=1.0),           # less boxy
    PeakFilter(cutoff_frequency_hz=3100, gain_db=1.4, q=0.9),           # presence
    HighShelfFilter(cutoff_frequency_hz=11000, gain_db=1.5, q=0.7),     # air
    Compressor(threshold_db=-22, ratio=2.4, attack_ms=8, release_ms=140),
    Compressor(threshold_db=-12, ratio=4, attack_ms=2, release_ms=60),  # catch peaks
])
v = chain(v.astype(np.float32), SR).astype(np.float64)
# gentle de-ess (split band 5.5–9 kHz, dynamic)
from scipy.signal import butter, sosfiltfilt
sos = butter(4, [5500, 9000], 'band', fs=SR, output='sos'); s_band = sosfiltfilt(sos, v)
env = np.sqrt(np.convolve(s_band ** 2, np.ones(int(0.004 * SR)) / int(0.004 * SR), mode="same")) + 1e-9
thr = 10 ** (-30 / 20); red = np.minimum(1, (thr / env) ** 0.5)
v = v - s_band + s_band * red
# small room so the clone does not sound "in a vacuum"
room = Pedalboard([Reverb(room_size=0.16, damping=0.7, wet_level=0.055, dry_level=1.0, width=0.0)])
v = room(v.astype(np.float32), SR).astype(np.float64)
v = np.concatenate([v, np.zeros(max(0, N - len(v)))])[:N]
v = norm(v, -16.0)

# voice activity envelope (for music ducking)
fr = int(0.02 * SR); rms = np.array([np.sqrt(np.mean(v[i:i + fr] ** 2)) for i in range(0, N, fr)])
act = (20 * np.log10(rms + 1e-9) > -40).astype(float)
def smooth_env(a, att, rel):
    o = np.zeros_like(a); y = 0
    ka, kr = np.exp(-1 / (att / 0.02)), np.exp(-1 / (rel / 0.02))
    for i, x in enumerate(a): y = (ka if x > y else kr) * y + (1 - (ka if x > y else kr)) * x; o[i] = y
    return o
act = smooth_env(act, 0.08, 0.45)
act = np.repeat(act, fr)[:N]

# ---------------- music bed ----------------
# Track: HeyGen music library "Astral 1dca6f4f" — warm cinematic ambient, oud + modern synths, building to an emotional payoff (48 s)
TRACK = os.environ.get("MUSIC", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "music", "heygen_6a3acd43_hijaz-vocal-ahs.wav"))  # HeyGen library: a cappella vocal ahs, Hijaz/Bayati maqam, no instruments, no words
mt = load(TRACK)
mt = Pedalboard([HighpassFilter(cutoff_frequency_hz=90), PeakFilter(cutoff_frequency_hz=1800, gain_db=-3.0, q=0.7), PeakFilter(cutoff_frequency_hz=3500, gain_db=-4.0, q=0.9), Reverb(room_size=0.7, damping=0.5, wet_level=0.22, dry_level=0.85, width=1.0), Compressor(threshold_db=-30, ratio=4, attack_ms=40, release_ms=400)])(mt.astype(np.float32), SR).astype(np.float64)
mt = norm(mt, -17.0)
t = np.arange(N) / SR
# Quran rule: NO music while a verse is being read. Verse windows = narration lines that read the Qur'an.
VERSE = [(ST[4] - 0.3, ST[7] - 0.1), (ST[10] - 0.3, ST[11] - 0.1)]
A_END = ST[4] - 0.3                       # hook music cuts out right before "The Qur'an says"
B_START = ST[11] - 0.12                   # music returns on "Not one race"
PAYOFF_TRACK, PAYOFF_VIDEO = 42.0, ST[19]  # track climax lands on the closing callback
m = np.zeros(N)
def lay(v0, v1, tr0):
    i0, i1 = int(v0 * SR), min(N, int(v1 * SR)); j0 = int(tr0 * SR)
    seg = mt[j0:j0 + (i1 - i0)]; m[i0:i0 + len(seg)] = seg
lay(0.0, A_END, 13.5)
lay(B_START, TOTAL, 2.0)
g = np.ones(N)
g *= np.clip(t / 0.25, 0, 1)
g *= np.where(t < A_END, np.clip((A_END - t) / 0.35, 0, 1), 1.0)                       # quick cut-out before the verse
g *= np.where((t >= A_END) & (t < B_START), 0.0, 1.0)
g *= np.where(t >= B_START, np.clip((t - B_START) / 0.12, 0, 1), 1.0)                   # punchy re-entry
for q0, q1 in VERSE: g *= np.where((t > q0 - 0.05) & (t < q1), 0.0, 1.0)               # hard guarantee
duck = 10 ** (-6 / 20); g *= (1 - act) + act * duck
hp = np.where(t < ST[14] - 0.3, 1.0, np.where(t < wt(16, 'differ') + 0.35, 0.55, 0.72))  # the hard part: pull back, then lift
hp = np.convolve(hp, np.ones(int(0.4 * SR)) / int(0.4 * SR), mode="same"); g *= hp
g *= np.where(t < A_END, 10 ** (1.0 / 20), 1.0)                                        # the track's intro is quiet: lift the hook
g *= np.clip((TOTAL - 0.15 - t) / 1.0, 0, 1)
m *= g

# ---------------- SFX ----------------
S = json.load(open(f"{KIT}/sounds.json")); S = S if isinstance(S, list) else S["sounds"]; S = {s["id"]: s for s in S if isinstance(s, dict)}
sfx = np.zeros(N); cache = {}
TONAL = {"shimmers", "tones", "logo-stings", "notifications", "celebration"}
def place(sid, at, adj=0.0, sync=True):
    s = S[sid]
    if s["category"] in TONAL and any(q0 - 0.3 < at < q1 + 0.3 for q0, q1 in VERSE): return
    if sid not in cache: cache[sid] = load(f"{KIT}/{s['file']}")
    x = cache[sid]
    target = -16.0 + s.get("under_voiceover_db", -8) + adj
    x = x * 10 ** ((target - s["level"]["lufs"]) / 20)
    i0 = int((at - (s["sync"]["at"] if sync else 0)) * SR)
    if i0 < 0: x = x[-i0:]; i0 = 0
    e = min(N, i0 + len(x)); sfx[i0:e] += x[:e - i0]

HS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "heygen_sfx")   # HeyGen SFX library (peak offsets from the catalogue)
HPEAK = {"deep_boom": 0.305, "whoosh_impact": 2.405, "low_boom": 0.08, "heartbeat": 0.41, "low_riser": 5.29, "sub_hit": 0.42}
hcache = {}
def hplace(name, at, db):
    if name not in hcache: hcache[name] = norm(load(f"{HS}/{name}.mp3"), -20.0)
    x = hcache[name] * 10 ** ((db - 6) / 20)
    i0 = int((at - HPEAK[name]) * SR)
    if i0 < 0: x = x[-i0:]; i0 = 0
    e = min(N, i0 + len(x)); sfx[i0:e] += x[:e - i0]
tB, tE = ST[2], ST[3] + 0.15
hplace("deep_boom", 0.0, -2)                                           # frame-1 hit under the hook
place("shimmer-short-soft", tB, -3); place("shimmer-short-soft", tE, -3)
place("whoosh-slow-soft", ST[4] - 0.35, 0)                             # into the verse (non-tonal only from here)
place("whoosh-medium-soft", ST[5] - 0.25, -3)
place("whoosh-medium-soft", ST[7] - 0.15, -3)                          # card in
hplace("low_boom", wt(7, 'despise'), -5); hplace("low_boom", wt(8, 'fight'), -4)
hplace("sub_hit", wt(9, 'know'), -3)                                   # star completes
place("whoosh-slow-soft", ST[10] - 0.35, -1)
place("reverse-whoosh-medium-soft", B_START, -1); hplace("sub_hit", B_START, -1)   # vocal bed returns
place("whoosh-fast-soft", ST[11] - 0.05, -4); place("whoosh-fast-soft", ST[12] - 0.05, -4)
hplace("deep_boom", ST[13] + 0.1, -5)
place("bass-sub-drop-medium", ST[14] - 0.1, +1)                         # the hard part
tT, tD = wt(16, 'test') - 0.1, wt(16, 'differ')
hb = ST[14] + 0.5
while hb < tD - 0.2: hplace("heartbeat", hb, -6 + 4 * (hb - ST[14]) / max(tD - ST[14], 1)); hb += 0.95
hplace("low_riser", tD + 0.35, -6)
hplace("deep_boom", tD + 0.35, -1)
place("whoosh-medium-soft", ST[17] - 0.35, -3)
hplace("low_boom", wt(18, 'wrong'), -6)
place("shimmer-short-soft", ST[19] - 0.05, -4); place("shimmer-short-soft", ST[20] + 0.15, -4)
hplace("whoosh_impact", VEND + 0.05, -3)
sfx *= np.clip((TOTAL - 0.1 - t) / 0.6, 0, 1)

# ---------------- mix + master ----------------
def master(x, name):
    x = norm(x, -17.0)  # mono -17 LUFS = -14 LUFS once duplicated to stereo
    pre = f"{D}/pre_v2_{name}.wav"; out = f"{D}/mix_v2_{name}.wav"
    sf.write(pre, np.stack([x, x], 1).astype(np.float32), SR, subtype="FLOAT")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", pre, "-af", "aresample=192000,alimiter=limit=0.87:attack=1:release=60:level=disabled,aresample=48000", "-c:a", "pcm_f32le", out], check=True)
    y, _ = sf.read(out); y = y.mean(1)
    print(name, "LUFS %.2f" % lufs(y), "peak %.2f dBFS" % (20 * np.log10(np.abs(y).max())))
master(v + m + sfx, "v4")
print("voice", "%.1f" % lufs(v), "sfx", "%.1f" % lufs(sfx + 1e-12)); np.save(f"{D}/music_stem.npy", m.astype(np.float32)); np.save(f"{D}/voice_stem.npy", v.astype(np.float32))
