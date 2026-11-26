#!/usr/bin/env python3
"""Render a brand carousel (1080x1350 PNGs) from a JSON spec.
usage: python3 tools/carousel/build.py spec.json OUTDIR
spec: {"handle":"@yasserfares_","url":"yasserfares.com/reflections/<slug>/","series":"Reflections",
       "slides":[{"type":"cover","title":"...","promise":"..."},
                 {"type":"text","head":"...","body":"..."},
                 {"type":"quote","quote":"...","source":"The Mirror, Ch. 3"},
                 {"type":"arabic","ar":"...","en":"...","ref":"..."},   # only verified text (quran/verse.py or the reflection itself)
                 {"type":"recap","head":"...","items":["...","..."]},
                 {"type":"cta","head":"Read the full reflection","ask":"Send this to someone who ...","url_line":"optional, default LINK IN BIO · YASSERFARES.COM"}]}
Rules checked here: 6-10 slides; cover title <= 6 words; text body <= 25 words; recap <= 5 items."""
import json, sys, os, subprocess, html, pathlib
HERE = pathlib.Path(__file__).resolve().parent
FONTS = (HERE / '../../remotion/public/fonts').resolve()
spec = json.load(open(sys.argv[1])); out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
S = spec['slides']; n = len(S); errs = []
if not 6 <= n <= 10: errs.append(f'{n} slides (want 6-10)')
for i, s in enumerate(S, 1):
    if s['type'] == 'cover' and len(s['title'].split()) > 6: errs.append(f'slide {i}: cover title over 6 words')
    if s['type'] == 'text' and len(s.get('body', '').split()) > 25: errs.append(f'slide {i}: body over 25 words')
    if s['type'] == 'recap' and len(s['items']) > 5: errs.append(f'slide {i}: recap over 5 items')
if errs: print('SPEC PROBLEMS:\n  ' + '\n  '.join(errs)); sys.exit(1)
e = html.escape
def body(s, i):
    t = s['type']
    if t == 'cover': return f'<div class="cover"><div class="eyebrow">{e(spec.get("series","Reflections"))}</div><h1>{e(s["title"])}</h1><div class="rule"></div><p class="promise">{e(s.get("promise",""))}</p>' + ('<div class="swipe">Swipe →</div>' if s.get("swipe", True) else '') + '</div>'
    if t == 'text': return f'<div class="text"><h2>{e(s["head"])}</h2><p>{e(s.get("body",""))}</p></div>'
    if t == 'quote': return f'<div class="quote"><div class="mark">“</div><blockquote>{e(s["quote"])}</blockquote><div class="src">{e(s.get("source",""))}</div></div>'
    if t == 'arabic': return f'<div class="quote"><div class="ar" dir="rtl" lang="ar">{e(s["ar"])}</div><blockquote class="en">{e(s.get("en",""))}</blockquote><div class="src">{e(s.get("ref",""))}</div></div>'
    if t == 'recap': return '<div class="recap"><h2>' + e(s['head']) + '</h2><ol>' + ''.join(f'<li>{e(x)}</li>' for x in s['items']) + '</ol></div>'
    if t == 'cta': return f'<div class="cta"><h2>{e(s["head"])}</h2><div class="url">{e(s.get("url_line","LINK IN BIO · YASSERFARES.COM"))}</div><div class="rule"></div><p class="ask">{e(s.get("ask",""))}</p><div class="follow">Follow {e(spec.get("handle","@yasserfares_"))} for a reflection every day</div></div>'
    raise SystemExit(f'unknown slide type {t}')
css = (HERE / 'style.css').read_text().replace('FONTS/', FONTS.as_uri() + '/')
for i, s in enumerate(S, 1):
    page = f'''<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body><div class="slide">
<div class="frame"></div><div class="top"><span>YASSER FARES</span><span>{i}/{n}</span></div>
{body(s, i)}
<div class="bot"><span>{e(spec.get("handle","@yasserfares_"))}</span><span>yasserfares.com</span></div></div></body></html>'''
    f = out / f'_slide{i:02d}.html'; f.write_text(page)
    png = out / f'slide_{i:02d}.png'
    subprocess.run(['google-chrome', '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1080,1350', '--virtual-time-budget=3000', f'--screenshot={png}', f.as_uri()], check=True, capture_output=True)
    f.unlink(); print('wrote', png)
