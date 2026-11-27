# Yasser SM — daily "One Word" reel runbook

Private toolkit for the "One Word · from The Mirror" Reels/Shorts by author Yasser Fares.
Each run produces ONE finished episode for review. Nothing is ever posted: Ahmed and Yasser approve first.

## 0. Setup (fresh workspace)
```
git clone <this repo> ~/studio && cd ~/studio && tools/setup.sh
```
Remotion renders with the machine's Chrome: `--browser-executable=/usr/bin/google-chrome --concurrency=2`.

## 1. Pick the episode
Take the first `todo` row in `episodes/backlog.md`. Read the book pages it cites (Projects tool: "The Mirror -the Book amended 17 Sep.pdf";
printed page + 9 = PDF page). Use only what the book says. English verse renderings: copy the book's wording.
Pull each verse with `python3 quran/verse.py S:V i0 i1 --save S:V` (refuses if the two sources disagree). Note the index of the key word.

## 2. Script (40–50 s, ~105–125 spoken words)
- Line 1 = the hook, ≤5 words, a surprise that needs no prior knowledge; it is also on screen at full brightness on frame 1.
- Answer the hook within ~7 s. One idea per line. Short lines. A "hard part" turn ~2/3 in. Close by calling back to the hook.
- Arabic words in Arabic script with full tashkeel inside the English script (e.g. لِتَعَارَفُوا). Root letters as letter names (كاف فاء راء).
  Prefer the plain (non-Qur'anic-orthography) spelling for the voice; the voice tends to drop final long vowels: if a word ends in ـُوا, test it.
- HeyGen tags, one per section, restrained: [curious] [thoughtful] [serious] [lowering their voice] [warm].
- Every claim traceable to the book page. No invented hadith, scholars or references.

### 2a. Score and regenerate the hook and script (tools/ig, vendored from instagram-agent-skill, MIT)
The scores feed a rewrite loop; they are not just a report.
0. Read research/learnings.md (our own numbers, highest priority) and research/swipe.md first: open on the viewer or something happening now (command, scenario, concrete question), never a recap, title or abstract statement; ~7 words.
1. HOOK: write 5 options (spoken line 5–12 words; on-screen line ≤5 words). `python3 tools/ig/hookscore.py hooks.txt`. Take the best two, rewrite each against its weakest property (FRONTLOAD: move the payload word to the front; STAKES: name what is lost or at risk; SPECIFICITY: a checkable name/word from the book), re-score. Up to 3 rounds; stop at ≥80 or when a round gains <3 points. Keep the highest-scoring hook that is still true to the book.
2. SCRIPT: `python3 tools/ig/beats.py script.txt --target <planned seconds>`. Fix what it flags that is real: a loop (the last line echoes a word from the hook), beats too long to read, dead middle. Re-run once.
3. The scorer is a keyword heuristic. Never trade accuracy for points: no numbers, names or claims that are not in the book, no clickbait that misstates the verse or the author. Meaning, Qur'an rules and Yasser's voice beat the score.
4. Log hook score before → after in the delivery summary.

## 3. Voice (HeyGen)
- `create_speech_without_player`, voiceId `2c1e0005b48c4690a322867cea82a58f` (Yasser's clone), `withTimestamps: true`, no `language` when Arabic is mixed in.
- One generation per episode. Save the returned word timings to `$EP_DIR/words.json` as `[[word,start,end],...]` (audio-tag words included; split.py filters them).
- Fetch the wav through the relay (the workspace cannot reach HeyGen hosts):
  `tools/fetch_audio.sh "<audio_url>" epNN.wav $EP_DIR/src.wav`  (pushes to branch `audio`; GitHub Action downloads; ~1 min)
- Check Arabic words: `python3 tools/asr.py $EP_DIR/src.wav ar <start> <end>`; English: `python3 tools/asr.py $EP_DIR/src.wav en`.
  If an Arabic word is clearly wrong, generate that word alone once (language "ar", speed 0.85, text ending with a full stop), fetch it,
  and splice it in at the original onset. Take the take's audio from ~0.2 s BEFORE its first timestamp: the first syllable (e.g. لِ) starts
  earlier than HeyGen's timing says. Update that word's times in words.json, re-run split.py, and re-check with asr.py on the isolated word.

## 4. Timeline
`EP_DIR=... python3 scripts/split.py` — edit its LINES list first: (display text, first spoken-token index, last index).
It trims long inter-line gaps (with 6 ms fades), writes voice_raw.wav and timeline.json (lines → words, start, end; voice_end; total).
Copy timeline.json to `remotion/src/episodes/timeline_epNN.json`.

## 5. Animation — pictures that EXPLAIN (Ahmed, 22 Nov). Reference: remotion/src/episodes/Ep04_Balagh.tsx
Abstract decoration (rings, stars, dots of light with no meaning) is rejected. Every line gets a picture that makes its point.
### 5a. Storyboard first (written into the episode file's header comment, automatically, no approval step)
For EVERY narration line write: line → picture → what the picture says. Then run the checks:
- SILENT TEST: with the sound off, would a viewer still get the idea from the graphics + on-screen words? If a picture could sit under
  a different line unchanged, it fails: replace it.
- One concrete, instantly-readable picture per line: an object or action people know (gavel, letter, heart, magnifier, chain, crown,
  bell, road, door, scale, lamp, seed, mirror, hand…), not generic geometry.
- Key words act on screen: crossed out (StrikeIn), swapped (JUDGE → DELIVER), ticked or crossed (Mark check/x/ban), counted ("1 JOB").
- Arguments become diagrams: lists (✓ / ✗ rows), split panels (YOURS | HIS), logic ladders (if X… then how can Y?), zoom-outs
  (one moment → the whole road), before/after.
- A visual through-line: one object that travels through the episode (Ep04: the sealed letter appears, is held, is listed, is delivered).
- Something changes every 2–3 s (draw-on, swap, strike, tick, zoom, reveal). Callback to the hook at the end.
- Red lines: no faces, no AI people, no depiction of prophets (show only words or an empty place, a ban ring over a symbol is fine).
### 5b. Build
- Pictograms: `remotion/src/lib/icons.tsx` → `<Icon name x y size p sw c rot />` draws any of 87 line icons (Tabler, MIT) with p 0→1;
  `<Mark kind="check|x|ban">`, `<StrikeIn p>` for crossing out text. To add icons: take more from @tabler/icons (npm pack) into lib/tabler.json.
  Custom drawings (mirror, lantern, road…) are welcome when an icon would be too generic.
- Copy Ep04_Balagh.tsx, keep everything above the storyboard comment (palette, fonts, easing, Reveal, Background, Chrome, Card,
  Caption) and the end card/assembly; rewrite KEY, the scenes and SCN. Change the series number in Chrome.
- Style: navy ground with dawn glow; gold/cream line art (5–7 px), muted red (#d9624f) only for ✗/strike/ban; Cinzel caps labels,
  Cormorant italic for meanings; masked reveals; no heavy blur.
- Zones: chrome 230–330 · top word/card/labels 372–700 · graphic 700–1260 · captions 1290–1490 · bar 1512. Lists may use 400–1250
  when no verse card is on screen. Verse cards: keep motion under them calm (verse window).
Register the composition in `remotion/src/Root.tsx`.
Render time: ~5 min for a 48 s episode on 2 cores when nothing else runs. Do not run ASR, audio builds or stills while the full render runs (on 2 cores that slowed one render to ~1 h).
Example SFX cue script for this style: scripts/episodes/ep04_audio.py (copy it, change the cues and VERSE).


- Scale reveal (reference: Ep04_Balagh.tsx `Journey`): start framed tight on one detail (viewfinder), then pull back to the whole picture — layered hills, a winding road that narrows to the horizon, lamps lighting one by one outward from the framed point. Use it for "moment vs. whole", "one vs. many", "part vs. journey" lines.

## 6. Review before the full render
`COMP=epNN node stills.mjs <frames...>` at the busiest moments (every scene peak, each card, the Arabic word, end card). Look at them.
Fix any overlap, clipping, empty frame, or text touching another element. Then render:
`npx remotion render src/index.ts epNN out/epNN_silent.mp4 --browser-executable=/usr/bin/google-chrome --codec=h264 --crf=16 --concurrency=2`
Then a contact sheet (1 fps, 12×4) of the whole video and look at it.

### 6a. Animation review round (Ahmed, 26 Nov 2026: clean, professional, correct, seamless transitions)
After the first full render: `python3 tools/review_sheets.py out/epNN.mp4 /tmp/review` (5 fps, frames at 1/3 size, one sheet per 3 s) and look at every sheet, then save a full-size frame at the peak of every scene (`--stills t1,t2,...`) and look at each one.
Ahmed, 26 Nov (v2 of ep08 still had a broken arrow and flat drawings): a review at thumbnail size (216 px) is NOT a review; it only catches timing. Judge the craft at full size:
- Every drawing is a finished illustration at a readable size (people/objects ≥ ~150 px tall, labels ≥ 26 px, bubble text ≥ 30 px), not a thin outline icon floating in empty navy.
- Arrows start at one element and end at the next, with a solid filled head (`Arrow` in Ep08_Ahsan.tsx); never a loose line pointing at empty space.
- Composed objects are one drawing (a column with its plaque and base; a crutch that actually leans on it), not icons pasted on top of each other.
- Each scene fills the graphic zone; the final frame before the end card is held ≥ 2.5 s (split.py `HOLD`).
List each problem with its timestamp, fix all of them, check stills at those timestamps, re-render, review again (up to 3 rounds). Checks:
- Hand-offs: the outgoing element is fully gone before the next one appears in the same zone (no double exposure of headlines, cards, scenes).
- No muddy frames: card/scene fades ≤ ~0.25 s; gold/cream elements enter with a spring scale pop, not a slow opacity fade (they turn grey/brown).
- No empty frame > ~0.3 s between scenes; no heading missing while its scene is on screen.
- Nothing travels through text or another element; labels never overlap.
- No stuck artefacts (wipe highlights at edges, leftover glows) and no diagonal glare/`Sweep` overlays.
- Motion follows the words and the logic (cause before effect: in ep08 the hostility line must exist before the reply crosses it).
- Icons read correctly at their size and angle (ep08: an upright hammer read as a "T"); line art finishes drawing before it is needed.
ep08 fixes (26 Nov) are in Ep08_Ahsan.tsx: crisp Card fade (0.2 s + scale), headline out before ONE WORD, scene fade 0.2 s, no end-card Sweep.

## 7. Audio — ONE version only, ORIGINAL style (Ahmed, 21 Nov: keep the style of the first reels)
Synthesised in code, no outside tracks: Hijaz-coloured music (soft pads, sub, oud/harp-like pluck arpeggio, gentle pulse from the
first answer on, resolving at the end card) + synthesised SFX (boom, whooshes, chimes, shimmer, page flutter, riser), reverb.
`EP_DIR=... python3 scripts/audio.py` (writes music.wav, sfx.wav) then `EP_DIR=... bash scripts/mix.sh` → `mix_music.wav`
(voice chain, music −12 dB with sidechain duck, SFX −9 dB, −14 LUFS, true-peak limiter).
Edit per episode: the SFX cue list (synced to scene beats), the "hard part" dip window (d0, d1) and VERSE.
- QUR'AN RULE (Ahmed, 21 Nov): NO music at all while a Qur'an verse is read: VERSE = every narration line that reads or paraphrases a
  verse. The mask hard-zeroes the music there; no chimes/shimmers/booms in those windows (whooshes only). Verify: music.wav is
  silent (−240 dB) inside VERSE windows. tools/asr.py on mix_music.wav must transcribe every line.
- Do not swap in library music or vocal beds (tried 21 Nov, rejected). Improving the music is a separate task with Ahmed.

## 8. Deliver
Mux: `ffmpeg -i out/epNN_silent.mp4 -i mix_music.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart <name>.mp4`. One version only, no no-music file.
Name: `YYYY-MM-DD_the-mirror_one-word-NN-<slug>_9x16_v1.mp4` and `_cover.jpg` (frame at 0.6 s).
Send the two files (video, cover) with SendUserFile, plus platform copy (Instagram, TikTok, YouTube Shorts, Facebook captions + a first comment each).
If the desktop bridge is online, also save to `Yasser SM\videos\02_in-progress\<date>_the-mirror_one-word-NN-<slug>\07_exports\`.
Commit the new episode file, timeline and excerpts to `main`, update `episodes/log.json` and mark the backlog row `done`.

### 8a. Captions: clean, lint, regenerate
For each platform caption (and first comment): `python3 tools/ig/humanize.py cap.txt --report -o cap.txt` (strips em dashes, slop words, invisible characters), then `python3 tools/ig/detect.py cap.txt` (target: no FLAGGED) and `python3 tools/ig/caption.py cap.txt --keywords "<2–4 search terms>"` (first 125 characters carry the point + search words, one ask, ≤5 hashtags, no greeting/emoji first). Rewrite whatever fails and re-run, up to 3 rounds. Report the final verdicts. Arabic and verse text are exempt from rewriting.

### 8b. Close the loop
Record in episodes/log.json for the new episode: `test` (the one variable being tried, from research/learnings.md's experiment log), `hook_type`, `hook_score`, `duration_s`. The reel audit task fills episodes/metrics.csv from Instagram Insights at ~3 and ~7 days and rewrites research/learnings.md; follow its current rules unless they conflict with the content rules.

## 9. Webinar teasers (16:9 explainer + 9:16 short cut)
Reference: `remotion/src/episodes/Webinar01_Khadijah.tsx` (compositions `web01` 1920x1080 and `web01s` 1080x1920), made 22 Nov 2026 for the free session "What Did Khadijah Know?".
- Scenes are drawn on a 1000x620 stage that is scaled into each format, so both versions share the same pictures. Captions, chrome and the stage position come from the layout object (LAND / PORT).
- Timeline: `EP_DIR=episodes/webinar01 VARIANT=full python3 scripts/episodes/webinar01_split.py` (and `webinar01s` / `short`); copy timeline.json to `remotion/src/episodes/timeline_webinar01(s).json`.
- Audio: `EP_DIR=... VARIANT=full|short python3 scripts/episodes/webinar01_audio.py`, then `EP_DIR=$PWD/episodes/... bash scripts/mix.sh`. Music is hard-muted while the verse card is on screen.
- Source rule: only what the course outline's week states. Do not quote or paraphrase a narration in promotion; leave it for the session.
- Render: full ~12 min, short ~3 min on 2 cores. Names: `YYYY-MM-DD_webinar_<slug>_16x9_v1.mp4` / `_9x16_v1.mp4`.


### 9b. Webinar teaser, long landscape version in the paper-collage look (v2, 23 Nov 2026)
Approved by Ahmed for the long 16:9 video only; reels and carousels stay navy/gold.
- Narration: story-telling read (`VARIANT=story` in `scripts/episodes/webinar01_split.py`), audio in `episodes/webinar01v/`.
- Picture: `remotion/src/episodes/Webinar01_Collage.tsx`, composition `web01v` (timeline `timeline_webinar01v.json`). Paper moves on twos; marker lines boil; torn-sheet wipes between scenes.
- Sound: `EP_DIR=$PWD/episodes/webinar01v python3 scripts/episodes/webinar01v_audio.py` then `bash scripts/mix.sh`. Every paper drop, letter pop, tape, marker line and highlighter swipe has its own effect; the bed is mallets and pizzicato.
- Verse sheet (96:1): on screen from "opening" until just after "And then,". Music is hard-muted and no pitched effect plays in that window (the script prints the music peak there; it must be 0).
- Render: `npx remotion render src/index.ts web01v out/web01v.mp4 --browser-executable=/usr/bin/google-chrome --codec=h264 --crf=17 --concurrency=2` (about 16 minutes), then mux with `mix_music.wav` at `-crf 25` (about 57 MB).
- `wt(i, 'the')` also matches "then": name a later word when a line holds both.
- v3 (23 Nov), restraint pass agreed with Ahmed: "TREMBLING." lands and stays still (no shake, no heartbeat); the Hira scene uses the `soft` entrance (slow, smooth, no overshoot), quiet paper sounds only and the `soft` music mode, so the tone changes before the verse; one plain "ONE HOUR · LIVE · FREE" strip instead of three stickers; no paper heart, no "not!" note, no hopping question mark. Keep this restraint in any later webinar teaser: nothing playful on the Prophet's ﷺ state or on revelation.
- v4 (23 Nov): the closing line was re-recorded on its own and spliced in by `scripts/episodes/webinar01v_patch_register.py` (run it after the split; it is a no-op once applied).
- **Pronunciation of the name (Ahmed, 23 Nov): Fares is فارِس ("Faaris"), never "Fairs".** In every voice script write the name in Arabic with tashkeel, يَاسِر فَارِس, including inside the web address ("يَاسِر فَارِس dot com"). Check the slice with Arabic speech recognition before using it.


## Posting through Zernio (set up 25 Nov 2026)
Ahmed chose Zernio over Buffer for long-term automation (posting, results, comments, DMs and ads through one connector). It is a custom connector in Claude (tools named `mcp__Zernio__*`), signed in with the project's Zernio account.

- Connected accounts: Instagram `yasserfares_` (account id `6b06cbbc104b6c0b90df830a`) and Facebook page `yasser1fares` (`6b06cc18750a01a0e5fd98fa`), profile `6b06cb416a20c6c57c2e8a04`. TikTok `yasser_fares` (`6b080f17bd44f8e27a5948e0`) and YouTube `yasser_fares` (`6b080ede6f13fc227aa4cfb6`) were connected by Ahmed on 26 Nov 2026.
- **TikTok and YouTube Shorts (from 26 Nov 2026).** Every reel and every carousel slideshow also goes to TikTok and YouTube, in a SEPARATE Zernio post from the Instagram and Facebook one, so a problem on one pair never holds back the other. Recipe that published One Word 08 (post `6b0815c82986832c38ed0334`): `posts_create_post` with `content` = the TikTok caption (never empty); `media_items` = the video with `thumbnail` = cover URL; `platforms` = `{platform: "tiktok", accountId, customContent: <TikTok caption>}` and `{platform: "youtube", accountId, customContent: <YouTube description>, platformSpecificData: {title: <YouTube title, at most 100 characters, ending " #Shorts">, visibility: "public", madeForKids: false}}`; top-level `tiktok_settings` = `{privacyLevel: "PUBLIC_TO_EVERYONE", allowComment: true, allowDuet: true, allowStitch: true, contentPreviewConfirmed: true, expressConsentGiven: true}`; `external_id` = the Instagram post's id with `-tt-yt` added. A vertical video of 3 minutes or less becomes a Short by itself; a 16:9 video (the teaser) is a normal YouTube video and gets no " #Shorts". `dry_run: true` with only the TikTok entry checks whether TikTok can take a post right now.
  - Ahmed's two decisions, 26 Nov 2026: (1) yes, set TikTok's two required confirmations (`contentPreviewConfirmed`, `expressConsentGiven`) on automatic posts; (2) **no AI tag**: never set `videoMadeWithAi` on TikTok or `containsSyntheticMedia` on YouTube. He was told TikTok's own rules ask for its tag on realistic AI audio and that untagged posts may be removed or restricted. If TikTok removes or restricts a post for this, tell him plainly; do not switch the tag on without his yes. The banned AI-voice line applies to TikTok and YouTube copy too.
  - YouTube descriptions carry the full link with `?utm_source=youtube`; TikTok captions write the address without a tag (links are not clickable there).
- **Instagram Trial Reels are refused for now (27 Nov 2026):** Zernio failed the One Word 09 short with "Trial Reels require an Instagram account with 1,000+ followers. Publish as a regular Reel instead." Until the account passes 1,000 followers the short cut goes to TikTok and YouTube only (learnings rule 1 keeps Instagram at one reel a day). Direct `curl -X PUT` to the presigned upload URL works from the workspace again (28 Nov: 200 for all four files), so the GitHub relay is the fallback.
- **Getting a video or image to Zernio.** The workspace cannot reach Zernio's storage (the network proxy answers 403), so files go through GitHub:
  1. `media_get_media_presigned_url(filename, content_type)` returns `uploadUrl` and `publicUrl` (the upload URL lasts one hour).
  2. `bash tools/push_media.sh <local file> "<uploadUrl>" video/mp4` pushes the file to branch `media`; the `push-media` workflow uploads it and writes `done/<name>.ok`. A 7.9 MB reel took 17 seconds end to end. The branch is rewritten on every call.
  2b. Many files at once: `bash tools/push_media_batch.sh <manifest.tsv>` (one line per file: local file, upload URL, content type, name on the branch; keep the manifest outside the repo). 23 files, 21 MB, took about a minute on 25 Nov.
  3. Use `publicUrl` in `media_urls` of `posts_create` or `posts_cross_post`. Images already on yasserfares.com can be passed by their public address without the relay.
- **Scheduling for a set date.** `posts_create` only takes "minutes from now". Use `call_tool` with `posts_create_post`: `scheduled_for` (ISO time with `Z`), `media_items` (for a reel add `thumbnail` and `instagramThumbnail` with the cover URL), and `platforms` as a list of `{platform, accountId}`. A single video becomes an Instagram Reel by default; the Facebook entry needs `platformSpecificData: {"contentType": "reel"}`. Put the Facebook caption in that entry's `customContent` with the full tracked link (`https://yasserfares.com/khadijah?utm_source=facebook`) in place of "(link in bio)". Creating the post copies the media from temporary to permanent storage (uploads not used within 7 days are deleted). Set `external_id` so the post can be found again.
- **Webinar 1 posts scheduled on 25 Nov** (Ahmed's go), 8:00 PM Singapore time on 1, 3, 5, 8, 10, 12 and 15 Dec, `external_id` starting `web01-2026-12-`. Not scheduled: 17 Dec invitation cards (caption needs his yes) and the 19 Dec teaser (waits for Yasser's review).
- **Modes.** `is_draft=True` saves without publishing. Default is scheduled; `publish_now=True` goes live at once. `validate_post` is a dry run. A draft or scheduled post can be deleted with `posts_delete`; a published post cannot be deleted through Zernio on Instagram.
- **Reading results.** `analytics_get_analytics` returns per-post numbers, including reels' average watch time and skip rate, for posts made outside Zernio too.
- Most tools are not listed up front: `search_tools` then `call_tool` (ads are under `ad_campaigns_*`).
- Rule: nothing is published, scheduled or boosted without Ahmed's yes for that item. Tests use drafts and delete them.
- Not yet confirmed: that scheduled (unattended) runs can use the connector. Creating a one-off scheduled check was blocked in the 25 Nov session.

## Webinar 1 moved to Saturday 9 January 2027, 9:00 PM Singapore time (25 Nov 2026)

- Fixed time, no vote. 13:00 UTC: 3 PM Egypt, 4 PM Saudi Arabia, 5 PM UAE, 1 PM UK, 8 AM US Eastern.
- Static creative kit (navy and gold): `python3 tools/webinar_kit/kit.py [name-filter]`. Every date string is in `CFG` at the top; text is the approved launch-kit text in `T`. Output: invitation cards (4:5, 1:1, 9:16), time-zone card, carousels A (8) and B (5), ad stills B and C, four countdown stories, and the A4 partner brochure PDF with a QR code. Needs Playwright, the `qrcode` package and the fontsource fonts (paths at the top of the file).
- 9:16 short, v2: `episodes/webinar01s2/` is the same recording as `webinar01s` with the spoken December date line cut out (no new voice generation); the date is on screen only. `remotion/src/episodes/timeline_webinar01s.json` now holds the v2 timeline (11 lines). Audio: `EP_DIR=$PWD/episodes/webinar01s2 VARIANT=short python3 scripts/episodes/webinar01_audio.py && bash scripts/mix.sh`.
- Still on the December date: the 16:9 collage teaser (`web01v`, narration line 49 and the tape in `J2_`). Waiting for Ahmed: record one new line or cut the line.

## Marketing skills (installed 25 Nov 2026)
The marketingskills collection (coreyhaines31/marketingskills, MIT) is vendored in `.claude/skills/`; index and job-to-skill map in `.claude/skills/README.md`; shared brand context in `.agents/product-marketing.md`.
- Reel (§2, §2a, §8a): after reading learnings.md, read `.claude/skills/social/SKILL.md` and use it with `references/short-form-video.md` when writing the 5 hook options and the caption; `copy-editing` for the final caption pass. tools/ig scores still decide.
- Carousel: `social` (and `references/carousel-frameworks.md`) for cover, slide order and the ask; `copywriting` for the caption.
- Audit: `analytics` and `ab-testing` for how to read numbers and when a test can be judged (sample size, one variable at a time).
- Webinar campaigns: `events`, `launch`, `emails`, `co-marketing`, `ads`, `ad-creative`.
The content rules above and learnings.md always win over a skill. Never add a claim, urgency or scarcity a skill suggests if the source does not support it.

## Webinar 1: reel v3, teaser v5 and the tone rule (25 Nov 2026, later the same day)

- **Tone (Ahmed):** an educational, religious hour. "We are happy to teach you something", never selling. In video: no buttons, pills, "link in bio", "save your seat" notes or "register at the link" closes. The invitation comes from the teacher; the address is shown plainly.
- **Ahmed on reel v2:** animations, elements and transitions "not so clean", and the date must be spoken in Yasser's voice. Cause: v1/v2 squeezed a 1000x620 landscape stage into the portrait frame (small icons and labels, mixed transitions). Do not build portrait reels from `Webinar01_Khadijah.tsx` again.
- **Reel v3** = `remotion/src/episodes/Webinar01_Reel.tsx` (composition `web01r`), built on the One Word design system (Ep07): fixed zones, one focal line drawing per scene (mountain, path and lit doorway; a line of years with two marks; the question; an open book; the title and date), kinetic headlines, the same quiet cross-fade on every change, no person drawn. Storyboard is at the top of the file.
  - Voice, no new script: `python3 scripts/episodes/webinar01r_build.py` assembles `episodes/webinar01r/` from the 22 Nov short (hook, lines 0-7), the 22 Nov navy full narration (lines 36, 37, 38, 41: "Join me for one hour, live and free. We will read the accounts together, and follow this one question: What did Khadijah know?") and the new date line. Levels are matched by RMS.
  - Sound: `EP_DIR=$PWD/episodes/webinar01r VARIANT=reel python3 scripts/episodes/webinar01_audio.py && bash scripts/mix.sh` (few, quiet effects; no riser or sting).
- **Extra voice lines** (`episodes/webinar01x/`, ONE HeyGen generation, approved by Ahmed): the date line "Saturday, the ninth of January. Nine p.m., Singapore time." and three openers for the story reels ("Before Hira, there was the day of the Black Stone." / "How did revelation begin?" / "Khadijah had known him for years."). Word times in `words.json`. The openers are not used yet.
- **Teaser v5** (16:9 collage): `EP_DIR=$PWD/episodes/webinar01v python3 scripts/episodes/webinar01v_patch_date.py` replaces narration line 49 with the date line (everything after it moves 1.452 s later; total 138.84 s), then copy `timeline.json` to `remotion/src/episodes/timeline_webinar01v.json`, rebuild audio, render frames 3750 to the end and splice onto the v3 master at frame 3750 (frames before the old line 49 are unchanged). Tape now reads "Sat 9 January · 9 PM Singapore time"; the "save your seat" note and arrow are removed.

## Webinar 1 story reels (25 Nov 2026, evening)

Ahmed approved reel v3's look ("Looks ok the reel"), so the four story reels follow the same system. All awaiting his review; nothing posted.
- `web01r1` the Black Stone · `web01r2` how revelation began · `web01r3` who believed next · `web01r4` two people, two answers. 22 to 27 s each.
- Each: a headline that is on frame 1, the voice from 0.1 s (learnings: the first 3 seconds decide), one line drawing, then the same close as reel v3 ("What did Khadijah know?", the date in Yasser's voice, the address shown plainly).
- Voice and cues: `python3 scripts/episodes/webinar01_stories_build.py` (22 Nov navy narration + the 25 Nov openers and date line; writes `episodes/webinar01r1..r4/` with `cues.json`). Sound: `EP_DIR=$PWD/episodes/webinar01rN VARIANT=story python3 scripts/episodes/webinar01_audio.py && bash scripts/mix.sh`.
- Pictures: `python3 tools/gen_story_reels.py` writes `remotion/src/episodes/Webinar01_Story_R1..R4.tsx` from the shared head of `Webinar01_Reel.tsx` plus one scene each. Edit the generator, not the generated files.
- The verse is not shown in the Hira reel (only the words "the opening words of Surat al-'Alaq"), so the music runs through.
- Captions for all webinar posts are in the launch kit ("January additions"); tone-softened: "All are welcome. The details are at yasserfares.com/khadijah (link in bio)."


## Webinar 1, 25 Nov 2026 night: AI-voice credit removed, teaser v6, ads plan

- **Project rule (claude/project-rules.md, 25 Nov): no "The narration is an AI clone of Yasser's own voice." line and no reworded AI-voice note anywhere**, captions, end cards and credits included. The on-screen credit "Narration: Yasser Fares (AI voice clone)" was removed from `Webinar01_Reel.tsx`, `tools/gen_story_reels.py` (story reels regenerated) and `Webinar01_Collage.tsx`. Still carrying the line, not changed here: `episodes/ep05`, `ep06`, `ep07` `copy/*.txt` and the retired `Webinar01_Khadijah.tsx`.
- Re-rendered without the credit: main reel **v4** and story reels **v2** (same audio; full render, then `ffmpeg -c:v libx264 -crf 20` mux with `mix_music.wav`). The five scheduled Zernio posts were updated with the new files and captions without the line (`posts_update_post` with `content`, `media_items` and the full `platforms` list).
- **Teaser v6** = v5 with the credit tape removed: frames 3750 to 4164 re-rendered (`out/web01v6_tail.mp4`) and spliced onto `out/web01v3.mp4` at frame 3750, muxed at crf 25. Yasser approved the teaser on 25 Nov. A 720p copy (crf 28, 10 MB) is on the registration page from the site's own server (`video_file` in the site's `content/webinars.json`); scheduled on Facebook for Sat 19 Dec, `external_id` `web01-2026-12-19-teaser`.
- Ads: plan and ad texts are in the Claude Doc "Webinar 1 Ads Plan: 500 Sign-Ups Under S$1" (link in the Project doc `claude/webinar1-signup-sprint.md`). Nothing created in Meta yet.

## Technical notes from ep08 (26 Nov 2026)
- First 3 seconds (learnings, from ep08): `scripts/split.py` has `LEAD` to cut the leading silence so the hook is spoken from ~0.03 s.
- Verses: if `quran/verse.py` reports SOURCES DISAGREE, the verse is dropped; a backlog row whose only verse is refused is marked `blocked` and skipped (26 Nov: 2:143, 14:24, 6:164; the open-tanween mark is coded U+08F0 in one source and U+0657 in the other). Waiting for Ahmed's decision.
- Verse windows: SFX other than whooshes are muted there too (`scripts/episodes/ep08_audio.py` keeps verse-window whooshes in a separate buffer).
- **Caption is required (Ahmed, 26 Nov 2026).** When creating a Zernio post, always set the top-level `content` (the Instagram caption) as well as each platform's `customContent`. A post made with only `customContent` shows as captionless in Zernio (ep08, fixed with `posts_update_post`). After creating, read it back with `posts_get` and confirm the content is there before reporting the post as scheduled.

## Comments: ask, and give something back (both tracks, from 27 Nov 2026, Ahmed's yes to 1, 2, 4)
Baseline (Zernio, 26 Nov): 38 comments on 44 posts, ~12,000 views (≈3 per 1,000). Most comments came on the reel with a surprising claim (Kufr). Winning accounts get comments because the video leaves something to answer or to type (Osama's comments are mostly people writing the phrase itself or "Ameen").
1. **End question, spoken and on screen.** The last spoken lines become: one easy question answerable in a word or two, using choices the episode itself named, then the follow line. Track B example: "Which one pulls at you most in prayer: fear, your phone, people's opinion, or success? One word below. One phrase from your prayer, every day. Follow for the next one." Track A example: "Where is fairness hardest for you: with family, or with people you disagree with? Tell me below. One Qur'anic word a day. Follow for tomorrow's." Keep it inside the 40–65 s length.
2. **Caption:** the same question right after the hook line; then "Comment READ and I'll send you the free reflection" (Facebook: "we'll send you"); for Track B also one line inviting the phrase itself ("Write اللهُ أَكْبَرُ below if you'll remember it in your next prayer"). **firstComment** (platformSpecificData) = the question again. Never "comment YES if…" or "tag 3 friends": Meta demotes engagement bait; the question must be a real one.
3. **Comment-to-DM (Instagram and Facebook) for every episode post**, created right after posts_create_post with `comment_automations_create_comment_automation` (via call_tool): one for instagram (6b06cbbc104b6c0b90df830a) and one for facebook (6b06cc18750a01a0e5fd98fa); `post_id` = the Zernio post id (arms itself when the post publishes); keywords ["READ", "اقرأ", "اقرا"], match_mode "exact"; dm_message (warm, 2 sentences, no selling: "Assalamu alaykum, and thank you for watching. Here is Yasser's free reflection on …, from his book …"); buttons: "Read the reflection" → the reflection on yasserfares.com that matches the episode best (aghonem1/yasserfares-site content/reflections/*.md with status approved and a published date not in the future; same book first, closest topic), and if none fits, "All reflections" → https://yasserfares.com/reflections/ ; add `?utm_source=<instagram|facebook>&utm_medium=dm&utm_campaign=comment_read`; comment_reply "Sent you a DM 🤍" (Facebook: "Sent you a message 🤍") with 2–3 variations; public_reply_policy "after_dm"; repeat_policy {mode: "once"}; link_tracking true. Log the automation ids in episodes/log.json (`dm_automation_ids`). TikTok and YouTube have no DM: the caption line there is the question only.

## Qur'anic text on screen: display form (27 Nov 2026)
QuranEnc (verse.py source B) stores open fathatan and open kasratan as U+0657 and U+0656. Amiri Quran draws those as an
inverted damma and a subscript alef, so e.g. قَوۡلࣰا and أَعۡيُنࣲ showed the wrong mark (found on the List 02 render; also in
aired One Word 02/03, which cannot be changed now). verse.py's EXCERPT output and remotion/src/excerpts.json now use the
standard marks (U+08F0, U+08F2, U+08F1) through `quran/display.py`, which also checks every word against source A (KFGQPC
Hafs). Any Qur'anic Arabic shown on screen or sent in a DM goes through `display_text(text, "S:V")`; zoom into a still of
every Qur'anic line before rendering.
