#!/usr/bin/env python3
"""Animation review sheets (RUNBOOK §6a). usage: python3 tools/review_sheets.py <video.mp4> <out_dir> [fps=5] [seconds_per_sheet=3]
Frames are 360x640 (1/3 of full size), 8 per row: large enough to judge drawings, arrows and text, not just timing.
Also run with --stills t1,t2,... to save full-size 1080x1920 frames for close inspection.
Extracts frames at `fps`, tiles them 10 per row with a time label under each frame, one sheet per `seconds_per_sheet`.
Look at every sheet: hand-offs, muddy fades, empty frames, collisions, stuck artefacts, motion order, icon legibility, clipping."""
import glob, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
args = [a for a in sys.argv[3:] if not a.startswith("--")]
fps = float(args[0]) if len(args) > 0 else 5.0
span = float(args[1]) if len(args) > 1 else 3.0
os.makedirs(out, exist_ok=True)
tmp = tempfile.mkdtemp()
if "--stills" in sys.argv:
    for tt in sys.argv[sys.argv.index("--stills") + 1].split(","):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", tt, "-i", src, "-frames:v", "1", f"{out}/full_{float(tt):06.2f}s.png"], check=True)
    sys.exit(0)
subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", f"fps={fps},scale=360:640", f"{tmp}/f_%05d.png"], check=True)
fs = sorted(glob.glob(f"{tmp}/f_*.png"))
per = int(round(span * fps)); cols = 8
for s0 in range(0, len(fs), per):
    chunk = fs[s0:s0 + per]; rows = (len(chunk) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 360, rows * 660), "black"); d = ImageDraw.Draw(sheet)
    for k, f in enumerate(chunk):
        i = s0 + k; x, y = (k % cols) * 360, (k // cols) * 660
        sheet.paste(Image.open(f), (x, y)); d.text((x + 6, y + 644), f"{(i + 0.5) / fps:.2f}s", fill="yellow")
    name = f"{out}/review_{s0 / fps:05.1f}s.png"; sheet.save(name); print(name)
