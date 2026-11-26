#!/usr/bin/env python3
"""Slideshow reel (9:16) from rendered carousel slides, with the series' Hijaz-style music bed.

usage: python3 tools/carousel/reel.py SLIDES_DIR OUT.mp4 [--quran 4,7] [--cover 2.5] [--each 1.8] [--xfade 0.3]

- Each slide_NN.png is centred on a 1080x1920 navy (#09101e) canvas.
- Cover --cover s, other slides --each s, --xfade s crossfades. H.264, 30 fps.
- Music: the pad / sub / pluck synthesis of scripts/audio.py (same progression, tempo and reverb),
  faded in and out, loudness-normalised to -14 LUFS.
- QUR'AN RULE: --quran lists the 1-based slides that show Qur'an text. The music is hard-zeroed from the
  moment that slide starts fading in until it has fully faded out (fades happen outside that window).
"""
import argparse, json, os, pathlib, re, subprocess, sys, tempfile
import numpy as np, soundfile as sf

ap = argparse.ArgumentParser()
ap.add_argument('slides'); ap.add_argument('out')
ap.add_argument('--quran', default=''); ap.add_argument('--cover', type=float, default=2.5)
ap.add_argument('--each', type=float, default=1.8); ap.add_argument('--xfade', type=float, default=0.3)
a = ap.parse_args()
SL = sorted(pathlib.Path(a.slides).glob('slide_[0-9][0-9].png'))
n = len(SL); X = a.xfade
dur = [a.cover] + [a.each] * (n - 1)
start = [sum(dur[:i]) - X * i for i in range(n)]          # when slide i starts fading in
TOTAL = sum(dur) - X * (n - 1)
quran = [int(q) - 1 for q in a.quran.split(',') if q.strip()]
windows = [(start[q], (start[q + 1] + X) if q + 1 < n else TOTAL) for q in quran]
print(f'{n} slides, total {TOTAL:.2f} s; no-music windows: {[(round(x, 2), round(y, 2)) for x, y in windows]}')

# ---- music: reuse the series synthesis from scripts/audio.py (defs only) ----
src = (pathlib.Path(__file__).resolve().parent / '../../scripts/audio.py').read_text()
head = src[src.index('def t_('):src.index('# ---------------- SFX')]
mus = src[src.index('# ---------------- music'):src.index('music = np.zeros(N)')]
SR = 48000
g = {'np': np, 'SR': SR, 'rng': np.random.default_rng(3)}
exec('from scipy.signal import butter, sosfilt, fftconvolve\n' + head + mus, g)
place, midi, prog, beat, bar = g['place'], g['midi'], g['prog'], g['beat'], g['bar']
N = int((TOTAL + 1) * SR); music = np.zeros(N); t = 0.0; bi = 0
END = TOTAL - 1.0
while t < TOTAL - 0.1:
    ch = prog[bi % 4] if t < END - 0.2 else [50, 54, 57]          # resolve to D major on the last slide
    d = min(2 * bar, TOTAL - t)
    for n_ in ch: place(music, g['pad_note'](midi(n_ + 12), d + 0.6), t, 1.0)
    place(music, g['sub'](midi(ch[0] - 12), d), t, 1.0)
    for s_ in [0, 2, 3, 5]:
        tt0 = t + s_ * beat
        if tt0 < TOTAL - 0.5:
            nn = ch[s_ % 3] + 24 + (12 if s_ == 5 else 0)
            if ch == prog[3] and s_ == 3: nn = 46 + 36             # Bb over A: Hijaz colour
            place(music, g['pluck'](midi(nn)), tt0, 0.9)
    t += 2 * bar; bi += 1
music = g['reverb'](music, 0.35)
tt = np.arange(N) / SR
mask = np.ones(N)
for c0, c1 in windows: mask[(tt >= c0 - 0.35) & (tt <= c1 + 0.35)] = 0.0
k = int(0.3 * SR); mask = np.convolve(mask, np.ones(k) / k, mode='same')
for c0, c1 in windows: mask[(tt >= c0) & (tt <= c1)] = 0.0     # hard guarantee
music *= mask
fi = int(0.6 * SR); music[:fi] *= np.linspace(0, 1, fi)
fe = int(TOTAL * SR); fo = int(1.2 * SR); music[fe - fo:fe] *= np.linspace(1, 0, fo); music = music[:fe]
music = music / (np.abs(music).max() + 1e-9) * 0.5
tmp = pathlib.Path(tempfile.mkdtemp())
sf.write(tmp / 'music_raw.wav', np.stack([music, music], 1).astype(np.float32), SR, subtype='FLOAT')

# loudness: two-pass loudnorm to -14 LUFS
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(tmp / 'music_raw.wav'), '-af',
                    'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
m = json.loads(re.findall(r'\{[^{}]*\}', r.stderr)[-1])
ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
      f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(tmp / 'music_raw.wav'), '-af', ln + ',alimiter=limit=0.84:level=false', '-ar', '48000',
                str(tmp / 'music.wav')], check=True)
# re-apply the hard zero inside verse windows (loudnorm must not leave a noise floor there)
y, _ = sf.read(tmp / 'music.wav'); ty = np.arange(len(y)) / SR
for c0, c1 in windows: y[(ty >= c0) & (ty <= c1)] = 0.0
sf.write(tmp / 'music.wav', y.astype(np.float32), SR, subtype='FLOAT')

# ---- video ----
cmd = ['ffmpeg', '-loglevel', 'error', '-y']
for i, p in enumerate(SL): cmd += ['-loop', '1', '-framerate', '30', '-t', f'{dur[i]:.3f}', '-i', str(p)]
cmd += ['-i', str(tmp / 'music.wav')]
fl = [f'[{i}:v]scale=1080:1350,pad=1080:1920:0:285:color=0x09101e,format=yuv420p,setsar=1,fps=30[v{i}]' for i in range(n)]
prev = 'v0'
for i in range(1, n):
    fl.append(f'[{prev}][v{i}]xfade=transition=fade:duration={X}:offset={start[i]:.3f}[x{i}]'); prev = f'x{i}'
cmd += ['-filter_complex', ';'.join(fl), '-map', f'[{prev}]', '-map', f'{n}:a', '-c:v', 'libx264', '-preset', 'veryfast',
        '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '256k', '-t', f'{TOTAL:.3f}',
        '-movflags', '+faststart', a.out]
subprocess.run(cmd, check=True)
json.dump({'total': TOTAL, 'starts': start, 'no_music': windows}, open(tmp / 'timing.json', 'w'))
print('wrote', a.out, '| music', tmp / 'music.wav', '| timing', tmp / 'timing.json')
