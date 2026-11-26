# What our own numbers say (updated by the reel audit task; the daily reel and carousel tasks read this)

Source from 25 Nov 2026: Zernio analytics (Instagram + Facebook), which includes average watch time and 3-second skip rate. Raw rows: episodes/metrics_zernio.csv.

## 2026-11-25 · the real bottleneck is the first 3 seconds
| IG reel | length | reach | avg watch | 3-s skip rate | shares | saves |
|---|---|---|---|---|---|---|
| ep01 Kufr ("The Qur'an calls farmers kuffār") | 65 s | 384 | **13.2 s** | **63.7%** | 8 | 4 |
| Is a wife her husband's property? | 40 s | 1,277 | 7.0 s | 65.0% | 8 | 20 |
| ep02 Layyin | 49 s | 817 | 7.9 s | 71.2% | 5 | 9 |
| ep03 Taaruf | 47 s | 596 | 6.7 s | 75.2% | 3 | 5 |
| ep04 Balagh | 48 s | 132 | 6.8 s | 74.5% | 1 | 3 |
| ep05 Ikrah | – | 138 | 6.8 s | 72.7% | 2 | 1 |
| ep07 Ghuluw (day 0) | – | 79 | 7.0 s | 65.1% | 1 | 0 |
Carousels (IG): reach 31, 39, 3. Facebook reels: reach 210–250, avg watch 2–4 s (Kufr 10 s); FB carousels reach 1–2.

Rules (confidence medium for 1–2, low for 3–4):
1. Two thirds of viewers leave within 3 seconds, and average watch is ~7 s whatever the length. Length is not the problem; the opening is. Target: skip rate under 55%, avg watch over 12 s.
2. The one reel that beat that (Kufr: 63.7% skip, 13.2 s) opened on a surprising, concrete fact about a word everyone thinks they know, with the Arabic word large on frame 1. Open every reel this way: a claim that contradicts what the viewer assumes, in ≤7 spoken words, starting at 0.0 s, with motion in the first second.
3. Reach per reel fell from 600–1,300 (first week) to ~130 (daily posting since 22 Nov). Weak openings now cost distribution. Fix the opening before adding volume.
4. Carousels reach ~30 accounts: on an account this small Instagram shows them mostly to followers. Keep them for the website funnel, but test a 10–15 s "slideshow reel" version of the same carousel for reach.

## Growth plan (agreed 26 Nov 2026) · goal 10,000 combined followers by end Feb 2027
Baseline 26 Nov: 79 (TikTok 38, IG 22, YouTube 16, FB 3). Checkpoints: 300 by 10 Dec · 1,500 by 31 Dec · 4,000–5,000 by end Jan.
Cadence (Singapore time): carousel 12:30 (IG, FB, TikTok photo mode) · slideshow test 16:30 (IG, FB; ends 2 Dec) · episode reel 19:00 (IG, FB, TikTok, YouTube) · short cut 15–25 s 21:30 (TikTok, YouTube, IG Trial Reel). TikTok = 3 posts/day; IG second daily reel only once 3-second skips < 55%.
Why: TikTok converts ~1% of views to follows vs ~0.3% on IG; TikTok photo carousels get ~360 views vs ~30 on IG; more IG volume did not raise total reach (25 Nov).
Comment replies: automatic every 3 h (research/comments/log.json).
Waiting on Ahmed: Yasser on camera (not yet), collaborations, paid test.

## Experiment log (one variable per episode; recorded in episodes/log.json as `test`)
- ep05–07: hook type = negative command / question → no improvement in skip rate (72.7%, 65.1%).
- Next (from ep08): "first-3-seconds" test — open on a surprising word fact, Arabic word on screen at frame 1, spoken hook starts at 0.0 s, first visual change by 1.0 s; no header/branding animation before the hook.
- Carousels: test a slideshow-reel version (same slides, 1.5 s each, with the series music) alongside the carousel for 1 week; compare reach.

## Earlier (22 Nov, from Instagram web Insights)
Kufr had the most shares and follows per viewer; the wife reel had the most reach and saves; 10 follows from ~2,900 viewers.
