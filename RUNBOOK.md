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
