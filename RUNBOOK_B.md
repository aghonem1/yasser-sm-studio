# Track B runbook — "a phrase you say every day" (started 26 Nov 2026)

Track B runs **beside** the One Word reel (Track A, `RUNBOOK.md`), on the same accounts, one reel a day. Ahmed, 26 Nov 2026: keep Track A as it is; build a parallel system with the new approach; once one format clearly wins we stop one of them or keep both.
Everything in `RUNBOOK.md` and `.agents/product-marketing.md` still applies (content rules, voice, relay, audio chain, QA, captions loop, Zernio recipes) unless this file says otherwise. Reference episode: **B01 Allahu Akbar, v2** (`remotion/src/trackb/B01_AllahuAkbar.tsx`), built on kit v2 (camera, moods, walking, trails).

## Why this format (study of @osama_alsadeq_, 26 Nov 2026)
A same-niche account reached 26.8K followers in ~5 weeks with 9 reels (first reel 3.3M views, then 540K, 544K, 197K, 165K…). Same length as ours (~49 s), little posting volume, bare captions. What differs:
1. **The topic is a phrase every Muslim says every day**, opened as a correction or a confession aimed at the viewer ("I've been saying astaghfirullah my whole life…"). Ours picked Qur'anic words few people say.
2. **A faceless stick figure in a small story** (fear, waiting, judging, sitting with head on knees), so the viewer sees himself. Ours explain with diagrams.
3. **English and Arabic on screen, line by line**: it reaches the much larger Arabic-speaking audience too.
4. **One line of text, one figure, light paper background.** Ours has five zones on a dark screen.
Our own numbers (research/learnings.md): 65–75% of Instagram viewers leave in the first 3 seconds. Track B attacks that.

## Source material
*My Prayer* explains, line by line, what you say in prayer (takbir, Al-Fatihah, bowing, prostration, tashahhud, salam) and the adhan. Backlog: `trackb/backlog.md`. Text: `aghonem1/yasserfares-site` → `sources/my-prayer.txt`.
- Everything said comes from the cited section. Paraphrase faithfully; at most one short quote. No added hadith, numbers, scholarly positions or references.
- The phrase's Arabic: Al-Fatihah via `quran/verse.py` only; other phrases only from `trackb/phrases.json`. Anything else in Arabic on screen is the caption translation (below).
- No faces, no realistic people, no prophets. The stick figure is a faceless everyman (a black line figure with a plain round head). Other people are the same kind of figure in teal.

## Script (40–50 s, ~110–125 spoken words)
- **Hook (0.0–3 s):** say the phrase and correct or sharpen what the viewer assumes it means, aimed at "you": B01 "Allahu Akbar is not only 'Allah is great.' You've been saying 'greater.'" Other shapes that fit: a question that the phrase itself raises ("Greater than what?"), a scenario from the viewer's day. Never a fake personal confession in Yasser's voice ("I've been saying it my whole life…") that he did not write. 5 options → `tools/ig/hookscore.py` → rewrite best two → up to 3 rounds; target ≥ 80 (RUNBOOK §2a).
- **Body:** concrete, daily-life pictures of what the book says (fear, a phone, someone's opinion, success, a sin), one per line, 3–6 words of picture per line.
- **Turn:** what to do with it in your next prayer (the book's own advice).
- **Callback:** the phrase again, now meaning more (B01: "Allahu Akbar. Greater than this thought too.").
- **End line (spoken and on screen):** "One phrase from your prayer, every day. Follow for the next one."
- Voice: same as Track A (Yasser's clone, one generation, `withTimestamps`, Arabic phrase written in Arabic with full tashkeel, restrained tags; warm and sincere rather than dramatic). Check the Arabic with `tools/asr.py … ar`.
- Arabic caption lines (one per narration line) are written at the same time: clear Modern Standard Arabic, faithful to the English line, short; tashkeel only where a word would be misread. When a line reads a verse, the Arabic line is the verse text from `verse.py`, exactly, and the window is music-free (RUNBOOK §7).

## Files and commands (episode NN, slug = phrase)
- `episodes_b/bNN/` : script.txt, url.txt, words.json, spoken.json, timeline.json, hooks (*.wav ignored by git).
- `scripts/episodes/bNN_split.py` (copy of `scripts/split.py` with the LINES table; `LEAD = 0.03`, `PROMISE = True`, `ENDCARD = 2.6`): `EP_DIR=episodes_b/bNN python3 scripts/episodes/bNN_split.py`, then copy `timeline.json` to `remotion/src/trackb/timeline_bNN.json`.
- `remotion/src/trackb/BNN_<slug>.tsx` built from the kit `remotion/src/trackb/kit.tsx` (Backdrop, Figure + poses + walk, Cloud, Phone, Trophy, Boulder, Heart, Bubble, Glyph, Captions, BigArabic, SeriesLabel). Copy B01 and change the storyboard; add new props to the kit when a story needs them (keep them flat, inked, simple). Register `bNN` in `remotion/src/Root.tsx`.
- `scripts/episodes/bNN_audio.py` (copy of b01_audio.py; SFX cues follow the storyboard; VERSE windows silent) run with **`MUSIC=ambient`**, then **`EP_DIR=episodes_b/bNN bash scripts/mix_b.sh`** (not mix.sh). Pass the episode's own mood sections to `ambient()` (same times as the picture's `moodAt` track).
- **Music v2 (from B02, Ahmed 26 Nov 2026: test new background music in B).** `scripts/trackb_music.py`, original and synthesised, modelled on what was measured in the winning reels (Osama 3.3M and 544K, Ticket to Jannah 732K, measured in the browser on 26 Nov): a continuous, beat-free, sustained, warm bed in a natural-minor colour (F minor: both Osama reels use that note set), about 10–14 dB under the voice and never ducked to silence. Pad + root drone + sparse felt piano + air; colour follows the moods (dusk darker, gold opens up, night thin). `mix_b.sh` keeps it ~11 dB under the voice with a gentle duck (ratio 2.5). B01 aired with the Track A score (Hijaz pluck + pulse); log `music: "ambient-v2"` or `"hijaz-v1"` so the audit can compare.
- Stills: `cd remotion && COMP=bNN node stills.mjs <frames>`; render: `npx remotion render src/index.ts bNN out/bNN_silent.mp4 --browser-executable=/usr/bin/google-chrome --codec=h264 --crf=16 --concurrency=2`; mux as RUNBOOK §8.
- Name: `YYYY-MM-DD_my-prayer_phrase-NN-<slug>_9x16_v1.mp4` + `_cover.jpg` (frame at 0.6 s).

## Motion (kit v2, 26 Nov 2026: Ahmed said v1's animation, motion graphics and transitions were nowhere near the reference)
Reference reel studied frame by frame (@osama_alsadeq_, the 3.3M "astaghfirullah" reel). Every Track B episode must have:
- **A camera over a wide world.** Lay the scenes out along one road (`X` table in the episode file). Moving from one idea to the next = the figure walking and the camera travelling with him (`stroll`, camera follows), not a fade in place. Use at least one big pull-back reveal (zoom ≈ 0.3) and one push-in. Camera helpers: `Cam`, `camTransform`, `toScreen`, `camAt`.
- **A mood per section** (`moodAt` with dawn / dusk / gold / night): the whole world, the figure's ink and the captions follow it. Change mood where the meaning turns (e.g. the problems = dusk, the answer = gold, the prayer = night, the callback = dawn).
- **A figure that moves like a person.** Walks with planted feet (`stroll` / `walkByDistance`), pose changes with a small overshoot (`settle`), the head a beat late (sample `heroRaw(t - 0.08)`), breathing, and a motion trail (two faint copies at t−1/30 and t−2/30) whenever he moves fast. Write the hero as a function of time (`heroRaw(t)`), as B01 does.
- **A world that acts.** Things rise, drop with a bounce, grow, shrink; weather and light carry the feeling (`Rain`, `Sky` sun and stars, parallax mountains, `Sprout`, `Dome`).
- **The phrase as an actor.** `PhraseWords` drops it in word by word (never letter by letter), swells on its key word, climbs and glows when the meaning peaks, lifts away when the story moves on.
- **Small captions, room to breathe** (size 50, top 300). The picture leads.
- Stills check: look at every scene peak AND at least two mid-walk frames (trail, feet) and the pull-back frame.

## Design rules (the kit enforces most of them)
- 1080×1920, 30 fps. Paper `#f4ecdf`, ink `#25221f`, one accent orange `#d8692d` (key words, the phrase), teal `#3f7b8c` for other people. Poppins (English), Cairo (Arabic); OFL licences in `remotion/public/fonts/trackb/`.
- Zones (screen): series label `MY PRAYER · NN` at 178 · captions 300–580 · story 600–1440 · ground line at 1440 when the camera is at rest · bottom quarter stays empty (platform UI).
- **Frame 1** = the hook caption fully visible + the figure in the phrase's posture + the phrase in Arabic, large. Spoken hook from 0.0 s; first motion within 1 s.
- English appears word by word as spoken; its Arabic line fades in under it; one or two key words per line in orange in both languages.
- One idea on screen at a time; something changes every 2–3 s; a "thing" grows or shrinks to show weight; the figure's pose carries the feeling (cower, pulled, small, reach, kneel, hug, takbir, folded).
- End on the frame-1 picture (the last half second returns to it) so the loop is seamless.
- QA as RUNBOOK §6: stills at every scene peak, a 1 fps contact sheet looked at; nothing overlaps the captions; Arabic renders with its marks; audio −14 LUFS, ASR transcribes every line.

## Publishing (Zernio; same accounts and recipes as RUNBOOK "Posting through Zernio")
- One post per episode to Instagram (Reel, shareToFeed true, cover), Facebook (Reel), TikTok and YouTube (Short), scheduled **23:15 Singapore** (18:15 Riyadh, 17:15 Cairo, 15:15 London; Track A posts at 19:00 and 21:30). TikTok/YouTube in a separate Zernio post from Instagram/Facebook as in RUNBOOK. No short cut for Track B.
- `external_id`: `trackb-bNN` (and `trackb-bNN-tt-yt`).
- Captions: line 1 = the hook in English (≤125 characters with 2–4 search words such as "Allahu Akbar meaning"); line 2 = the same hook in Arabic; then 2–4 short lines from the episode; one ask ("Send this to someone you pray with"); book line: "From My Prayer by Yasser Fares, link in bio" (Facebook/YouTube: full link to https://yasserfares.com/books/my-prayer/ with `?utm_source=<platform>&utm_campaign=trackb`); ≤5 hashtags mixing English and Arabic (#AllahuAkbar #صلاة …). Run humanize → detect → caption.py (RUNBOOK §8a). Never an AI-voice line. AI labels: as RUNBOOK (no TikTok/YouTube AI tag, Ahmed 26 Nov).
- Log in `episodes/log.json` with `track: "B"`, `id: "bNN"`, phrase, book section, hook, hook_score, duration_s, zernio_post_ids, scheduled_for; mark the backlog row done.

## How A and B are compared (reel audit task)
Every audit splits reels by `track`. Per platform: 3-second skip rate and average watch (Instagram), views ÷ the platform's median, follows per 1,000 views, shares + saves per view, and the Arabic-speaking share of comments. Judge only after at least 7 episodes of each track posted in the same period; report both tracks side by side and say which is ahead with the sample size. Ahmed decides whether to stop one, keep both, or move a winning element (e.g. the bilingual captions) into the other.
