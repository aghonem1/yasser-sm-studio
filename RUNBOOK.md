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

## 3. Voice (HeyGen)
- `create_speech_without_player`, voiceId `2c1e0005b48c4690a322867cea82a58f` (Yasser's clone), `withTimestamps: true`, no `language` when Arabic is mixed in.
- One generation per episode. Save the returned word timings to `$EP_DIR/words.json` as `[[word,start,end],...]` (audio-tag words included; split.py filters them).
- Fetch the wav through the relay (the workspace cannot reach HeyGen hosts):
  `tools/fetch_audio.sh "<audio_url>" epNN.wav $EP_DIR/src.wav`  (pushes to branch `audio`; GitHub Action downloads; ~1 min)
- Check Arabic words: `python3 tools/asr.py $EP_DIR/src.wav ar <start> <end>`; English: `python3 tools/asr.py $EP_DIR/src.wav en`.
  If an Arabic word is clearly wrong, generate that word alone once (language "ar") and splice it in at the same timing.

## 4. Timeline
`EP_DIR=... python3 scripts/split.py` — edit its LINES list first: (display text, first spoken-token index, last index).
It trims long inter-line gaps (with 6 ms fades), writes voice_raw.wav and timeline.json (lines → words, start, end; voice_end; total).
Copy timeline.json to `remotion/src/episodes/timeline_epNN.json`.

## 5. Animation — the reference is `remotion/src/episodes/Ep03_Taaruf.tsx` (Ahmed approved this look)
Copy it to `EpNN_<slug>.tsx`, keep everything above `// ---------- scene A` (palette, fonts, easing, Light/Line/Reveal, Background,
Chrome, Card, Caption) and the end card/assembly; rewrite the scenes and KEY map; change the series number in Chrome.
Design rules (keep them — they are what made it look professional):
- Navy ground, warm dawn glow at the bottom, faint grain, vignette. No rotating patterns, no blur glow filters.
- People are points of light (Light): crisp core + gradient halo. Never clip-art figures, never faces, never depictions of prophets.
- Thin crisp lines (1.5–3 px) drawn on with pathLength; one focal graphic per scene centred at (540, 975).
- Geometry is exact (regular polygons, circles, 8-point stars); nothing touches or overlaps.
- Type: Cinzel caps for headings, Cormorant italic gold for key words, Spectral for captions. Gold text via `goldText` (never on Arabic: use solid #efc874).
- Masked line reveals (Reveal) for text; outExpo/outCubic easing; one beat every 2–4 s; slow camera push per scene; light Sweep at 2–3 transitions.
- Zones: chrome 230–330 · verse card / Arabic word 372–700 · graphic 700–1260 · captions 1290–1490 · progress bar 1512. Platform UI covers below ~1520.
- Captions: balanced rows (rows()), words appear as spoken, key word per line in KEY.
- Verse cards: parchment Card with the verified excerpt and the key word highlighted by index.
- End card: The Mirror cover + "The World Sees Islam Through Us" + FOLLOW FOR THE NEXT WORD + yasserfares.com; loop crossfade to frame 0.
Register the composition in `remotion/src/Root.tsx`.

## 6. Review before the full render
`COMP=epNN node stills.mjs <frames...>` at the busiest moments (every scene peak, each card, the Arabic word, end card). Look at them.
Fix any overlap, clipping, empty frame, or text touching another element. Then render:
`npx remotion render src/index.ts epNN out/epNN_silent.mp4 --browser-executable=/usr/bin/google-chrome --codec=h264 --crf=16 --concurrency=2`
Then a contact sheet (1 fps, 12×4) of the whole video and look at it.

## 7. Audio
`EP_DIR=... python3 scripts/audio.py` — edit the SFX cue list (sound ids from assets/sfx/sounds.json, synced to scene beats) and the two
music windows (music steps out only while the Qur'an's own words are spoken). Gives mix_v2_music.wav and mix_v2_nomusic.wav at −14 LUFS (stereo), true peak ≤ −1 dB.
Music must be clearly audible: ~8–12 dB under the voice (check with the per-2 s table). Run `tools/asr.py` on the final mix: every line must transcribe.

## 8. Deliver
Mux: `ffmpeg -i out/epNN_silent.mp4 -i mix_v2_music.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart <name>.mp4` (and _no-music).
Name: `YYYY-MM-DD_the-mirror_one-word-NN-<slug>_9x16_v1.mp4`, `_v1_no-music.mp4`, `_cover.jpg` (frame at 0.6 s).
Send the three files with SendUserFile, plus platform copy (Instagram, TikTok, YouTube Shorts, Facebook captions + a first comment each).
If the desktop bridge is online, also save to `Yasser SM\videos\02_in-progress\<date>_the-mirror_one-word-NN-<slug>\07_exports\`.
Commit the new episode file, timeline and excerpts to `main`, update `episodes/log.json` and mark the backlog row `done`.
