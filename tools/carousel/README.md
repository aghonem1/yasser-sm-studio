# Carousel renderer (brand: navy + gold, matches the reels)
`python3 tools/carousel/build.py spec.json OUTDIR` → OUTDIR/slide_01.png … (1080×1350). See build.py docstring for the spec; example.json is a sample.
Structure (ig-carousel method): 1 cover (≤6-word question/claim + one-line promise) · 2 the stake (stands alone as a second cover) · 3..N one idea per slide (3–7-word head, ≤25 words) · recap (the screenshot slide, ≤5 items) · CTA (read the full reflection, link in bio; one specific "send this to someone who…" ask). 6–10 slides.
Text comes only from the day's published reflection (content/reflections/<slug>.md in aghonem1/yasserfares-site). Arabic only if the reflection itself prints it and it is verified with quran/verse.py.
