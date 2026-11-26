#!/usr/bin/env python3
"""Animation review sheets (RUNBOOK §6a). usage: python3 tools/review_sheets.py <video.mp4> <out_dir> [fps=10] [seconds_per_sheet=10]
Extracts frames at `fps`, tiles them 10 per row with a time label under each frame, one sheet per `seconds_per_sheet`.
Look at every sheet: hand-offs, muddy fades, empty frames, collisions, stuck artefacts, motion order, icon legibility, clipping."""
import glob, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
fps = float(sys.argv[3]) if len(sys.argv) > 3 else 10.0
span = float(sys.argv[4]) if len(sys.argv) > 4 else 10.0
os.makedirs(out, exist_ok=True)
tmp = tempfile.mkdtemp()
subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", f"fps={fps},scale=216:384", f"{tmp}/f_%05d.png"], check=True)
fs = sorted(glob.glob(f"{tmp}/f_*.png"))
per = int(round(span * fps)); cols = 10
for s0 in range(0, len(fs), per):
    chunk = fs[s0:s0 + per]; rows = (len(chunk) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 216, rows * 400), "black"); d = ImageDraw.Draw(sheet)
    for k, f in enumerate(chunk):
        i = s0 + k; x, y = (k % cols) * 216, (k // cols) * 400
        sheet.paste(Image.open(f), (x, y)); d.text((x + 4, y + 386), f"{(i + 0.5) / fps:.2f}s", fill="yellow")
    name = f"{out}/review_{s0 / fps:05.1f}s.png"; sheet.save(name); print(name)
