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
  If an Arabic word is clearly wrong, generate that word alone once (language "ar", speed 0.85, text ending with a full stop), fetch it,
  and splice it in at the original onset. Take the take's audio from ~0.2 s BEFORE its first timestamp: the first syllable (e.g. لِ) starts
  earlier than HeyGen's timing says. Update that word's times in words.json, re-run split.py, and re-check with asr.py on the isolated word.

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

## 7. Audio — ONE version only (voice + music + SFX)
Music (fresh per episode, so the channel never sounds the same):
- Search HeyGen's music library: `search_audio_sounds` (type music), queries like "cinematic oud and modern synths building to an
  emotional payoff", "middle eastern cinematic, hand percussion, rising", "emotional piano and strings with a heartbeat pulse building".
  Shortlist 3–5 tracks ≥ 45 s; fetch them all in one relay call (tools/fetch_audio.sh accepts several url/name/dest triples).
- Pick by measurement: 3 s loudness curve (wants a clear build and a late climax), tempo, no vocals. Avoid flat drones.
  Don't reuse the previous episode's track. assets/music/heygen_1dca6f4f_oud-rise.wav (used in ep03) is the fallback.
- QUR'AN RULE (Ahmed, 21 Nov): NO music at all while a Qur'an verse is read. VERSE windows = every narration line that reads or
  paraphrases a verse (from "The Qur'an says…" through the verse's last words). Music cuts out ~0.3 s before and returns after.
  No tonal SFX (shimmers, tones, stings) inside those windows either; airy whooshes only.
- Structure: music under the hook (lifted, ~6–11 dB under voice) → cut to silence for the verse → punchy re-entry (reverse whoosh +
  boom) after it → pull back for "the hard part" → land the track's climax on the closing callback. Set A_END, B_START, PAYOFF_* in audio.py.
- Levels: music ~6–12 dB under the voice (check the per-2 s table), −14 LUFS stereo, true peak ≤ −1 dB; tools/asr.py on the final mix
  must transcribe every line.
`EP_DIR=... MUSIC=<track.wav> python3 scripts/audio.py` → `mix_v2_v3.wav`.

## 8. Deliver
Mux: `ffmpeg -i out/epNN_silent.mp4 -i mix_v2_v3.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart <name>.mp4`. One version only, no no-music file.
Name: `YYYY-MM-DD_the-mirror_one-word-NN-<slug>_9x16_v1.mp4` and `_cover.jpg` (frame at 0.6 s).
Send the two files (video, cover) with SendUserFile, plus platform copy (Instagram, TikTok, YouTube Shorts, Facebook captions + a first comment each).
If the desktop bridge is online, also save to `Yasser SM\videos\02_in-progress\<date>_the-mirror_one-word-NN-<slug>\07_exports\`.
Commit the new episode file, timeline and excerpts to `main`, update `episodes/log.json` and mark the backlog row `done`.
