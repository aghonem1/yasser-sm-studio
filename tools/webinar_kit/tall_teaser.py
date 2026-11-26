#!/usr/bin/env python3
"""Vertical (9:16) version of the 16:9 webinar teaser for Instagram, TikTok and Shorts.

The finished 16:9 film sits on a kraft-paper page with the title above it and the
spoken lines as captions below it (captions come from the teaser's own timeline, so
they say exactly what the narration says). Nothing is re-voiced or re-animated.

  python3 tools/webinar_kit/tall_teaser.py <teaser_16x9.mp4> <out_9x16.mp4> [workdir]
"""
import asyncio, json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
PUB = ROOT / "remotion" / "public"
TL = json.load(open(ROOT / "episodes" / "webinar01v" / "timeline.json"))
W, H = 1080, 1920
CROP_H = 927                                 # the film's own caption bar starts at about y=935 of 1080: cut it, our captions replace it
VW, VH, VX, VY = 1048, 506, 16, 670          # the film
CAP_Y = 1256                                  # top of the caption block
NAVY, CREAM, WHITE, NOTE = "#16233f", "#f1e7d0", "#fbf7ee", "#8f2a17"


def fonts(work):
    from fontTools.ttLib import TTFont
    d = work / "fonts"; d.mkdir(parents=True, exist_ok=True)
    for src, name in (("anton-latin-400-normal.woff2", "Anton.ttf"), ("caveat-latin-700-normal.woff2", "Caveat.ttf")):
        f = TTFont(PUB / "fonts" / src); f.flavor = None; f.save(d / name)
    return d


async def background(work):
    from playwright.async_api import async_playwright
    rough = lambda n, seed: ", ".join(
        [f"{100*i/n:.1f}% {((i*seed*37) % 7) * 0.6:.1f}%" for i in range(n + 1)] +
        [f"{100 - 100*i/n:.1f}% {100 - ((i*seed*53) % 7) * 0.6:.1f}%" for i in range(n + 1)])
    html = f"""<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Anton;src:url('file://{PUB}/fonts/anton-latin-400-normal.woff2')}}
@font-face{{font-family:Caveat;src:url('file://{PUB}/fonts/caveat-latin-700-normal.woff2')}}
html,body{{margin:0;width:{W}px;height:{H}px;overflow:hidden}}
body{{background:#b08a55 url('file://{PUB}/tex/kraft.jpg') center/auto 100%;position:relative}}
.grain{{position:absolute;inset:0;background:url('file://{PUB}/tex/grain.png');opacity:.25;mix-blend-mode:multiply}}
.vig{{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(40,24,6,.28) 100%)}}
.title{{position:absolute;left:54px;top:360px;width:972px;height:150px;transform:rotate(-1.3deg);filter:drop-shadow(2px 6px 6px rgba(40,24,6,.35))}}
.title i{{position:absolute;inset:-8px;background:{WHITE};clip-path:polygon({rough(26, 3)})}}
.title b{{position:absolute;inset:0;background:{CREAM};clip-path:polygon({rough(30, 5)});display:flex;align-items:center;justify-content:center;
  font:400 88px/1 Anton;letter-spacing:2px;color:{NAVY}}}
.sub{{position:absolute;left:0;top:538px;width:100%;text-align:center;font:700 58px/1 Caveat;color:{NAVY};transform:rotate(-.6deg)}}
.frame{{position:absolute;left:{VX-10}px;top:{VY-10}px;width:{VW+20}px;height:{VH+20}px;background:{WHITE};box-shadow:3px 9px 14px rgba(40,24,6,.45)}}
.frame u{{position:absolute;left:10px;top:10px;width:{VW}px;height:{VH}px;background:#000}}
.tape{{position:absolute;width:150px;height:44px;background:rgba(227,178,60,.82);box-shadow:1px 2px 3px rgba(40,24,6,.3)}}
</style><body><div class="grain"></div><div class="vig"></div>
<div class="title"><i></i><b>WHAT DID KHADIJAH KNOW?</b></div>
<div class="sub">a free live hour with Yasser Fares</div>
<div class="frame"><u></u></div>
<div class="tape" style="left:{W/2-75}px;top:{VY-34}px;transform:rotate(-2deg)"></div>
</body>"""
    (work / "bg.html").write_text(html, encoding="utf-8")
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox", "--allow-file-access-from-files"])
        pg = await b.new_page(viewport={"width": W, "height": H})
        await pg.goto(f"file://{work}/bg.html"); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(500)
        await pg.screenshot(path=str(work / "bg.png")); await b.close()
    return work / "bg.png"


def ass(work):
    def ts(t):
        t = max(0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
        return f"{h}:{m:02d}:{s:05.2f}"
    L = TL["lines"]
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Anton,72,&H003F2316,&H003F2316,&H00D0E7F1,&H80061828,0,0,0,0,100,100,1,0,3,18,5,8,60,60,{CAP_Y},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    for i, l in enumerate(L):
        a = l["start"] - 0.06
        b = min(L[i + 1]["start"] - 0.12, l["end"] + 0.8) if i + 1 < len(L) else l["end"] + 1.2   # never overlap the next line: libass would push it down
        rot = (0.7, -0.6, 0.4, -0.8)[i % 4]
        ev.append(f"Dialogue: 0,{ts(a)},{ts(b)},Cap,,0,0,0,,{{\\frz{rot}\\fad(60,40)}}{l['text'].upper()}")
    (work / "cap.ass").write_text(head + "\n".join(ev) + "\n", encoding="utf-8")
    return work / "cap.ass"


def main():
    src, out = pathlib.Path(sys.argv[1]).resolve(), pathlib.Path(sys.argv[2]).resolve()
    work = pathlib.Path(sys.argv[3] if len(sys.argv) > 3 else "/tmp/tall_teaser").resolve(); work.mkdir(parents=True, exist_ok=True)
    fd = fonts(work); bg = asyncio.run(background(work)); sub = ass(work)
    fc = (f"[1:v]crop=1920:{CROP_H}:0:0,scale={VW}:{VH}:flags=lanczos,setsar=1[v];[0:v][v]overlay={VX}:{VY}:shortest=1[c];"
          f"[c]ass={sub}:fontsdir={fd},format=yuv420p[o]")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-framerate", "30", "-i", str(bg), "-i", str(src),
                    "-filter_complex", fc, "-map", "[o]", "-map", "1:a", "-c:v", "libx264", "-crf", "22", "-preset", "medium",
                    "-c:a", "copy", "-movflags", "+faststart", "-shortest", str(out)], check=True)
    print(out)


if __name__ == "__main__":
    main()
