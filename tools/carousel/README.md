# Carousel renderer (brand: navy + gold, matches the reels)
`python3 tools/carousel/build.py spec.json OUTDIR` → OUTDIR/slide_01.png … (1080×1350). See build.py docstring for the spec; example.json is a sample. Pass an absolute OUTDIR.
Structure (ig-carousel method): 1 cover (≤6-word question/claim + one-line promise) · 2 the stake (stands alone as a second cover) · 3..N one idea per slide (3–7-word head, ≤25 words) · recap (the screenshot slide, ≤5 items) · CTA (read more on the book's page, link in bio; one specific "send this to someone who…" ask). 6–10 slides.
Text comes only from the day's published reflection (content/reflections/<slug>.md in aghonem1/yasserfares-site). Arabic only if the reflection itself prints it and it is verified with quran/verse.py.

## Slideshow reel (test until research/learnings.md ends it)
`python3 tools/carousel/reel.py SLIDES_DIR OUT.mp4 --quran <slide numbers showing Qur'an text>` → 9:16, slides centred on navy #09101e, cover 2.5 s, others 1.8 s, 0.3 s crossfades, H.264 30 fps, the series' Hijaz music bed (synthesised with scripts/audio.py's pad/pluck/sub), −14 LUFS, music hard-zeroed while a Qur'an slide is on screen.
For the reel, render the slides from a copy of the spec with `"swipe": false` on the cover and `"url_line": "YASSERFARES.COM · <BOOK>"` on the CTA (no "link in bio" inside video, per the teaching-not-selling rule).
