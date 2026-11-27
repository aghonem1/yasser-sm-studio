# The One Word Challenge — weekly quiz reel (from 28 Nov 2026)

Every **Saturday 20:00 Singapore**, one quiz reel on Instagram, Facebook, TikTok and YouTube. Modelled on the @deenandplan
"Can you score 6/6?" reel (20.5K likes, 626 comments, 2,884 shares/saves; studied 27 Nov): a score every viewer can comment,
a 3-2-1 countdown that makes people play along, a green reveal with one line of why, a bonus question answered in the comments.
It sits outside the daily Track A vs Track B comparison (log it with `track: "quiz"`).

## Content rules (Ahmed, 27 Nov 2026: "it doesn't have to be 100% from the books if it helps reach and engagement")
- Mostly the week's own episodes (Track A words, Track B phrases) and Yasser's books: it recaps the week and sends people to the page.
- General Islamic knowledge is allowed when every fact is **verified and its source logged** in the spec's `source` field:
  Qur'an text and verse numbers via `quran/verse.py` (two-source check) or the Tanzil Uthmani text; Qur'an English as the book words it
  or a named translation (Quran.com: Saheeh International / Abdel Haleem); sīrah/history only from a named, reliable reference.
- Never: invented hadith or scholarly positions, hadith without collection and number checked against a reliable collection,
  fiqh rulings, contested or sectarian questions, questions about prophets' looks, anything that mocks a group. When unsure, drop it.
- One clearly right answer per question; wrong options plausible but not tricky; no trick questions.
- Arabic on screen: verse text only from verse.py / excerpts.json; phrases only from trackb/phrases.json.

## Make
1. Write `quiz/qNN.json` (copy q01.json): 5 questions {q ≤ 110 chars, ar (optional), options ×4 ≤ 28 chars, correct index, explain ≤ 90 chars, source}, a bonus {q, answer, source}, end lines. Rotate the correct letter (not always B).
2. `remotion/src/quiz/QNN.tsx` (copy Q01.tsx, import the spec) and register `qNN` in `remotion/src/Root.tsx`.
3. Stills: `COMP=qNN node stills.mjs 0 150 270 300 330 1680 1755` (intro, a question, countdown, reveal, explanation, end card); check text fits.
4. Render (`npx remotion render src/index.ts qNN out/qNN_silent.mp4 --browser-executable=/usr/bin/google-chrome --codec=h264 --crf=16 --concurrency=2`).
5. Sound: `python3 scripts/quiz_audio.py quiz/qNN.json /tmp/qNN && ffmpeg -i /tmp/qNN/quiz_raw.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 /tmp/qNN/quiz_mix.wav`; mux; cover = frame at 0.6 s.
   Name `YYYY-MM-DD_one-word-challenge-NN_9x16_v1.mp4`.
6. Captions (humanize → detect → caption.py): "Can you score 5/5?" first, the bonus question, "Comment READ…" (IG/FB), share ask, ≤5 hashtags (#QuranQuiz #IslamicQuiz …).
   firstComment = the bonus question. The NEXT quiz's caption reveals last week's bonus answer in one line.
7. Post as RUNBOOK "Posting through Zernio" (IG+FB post, TikTok+YouTube post; YouTube title "Can you score 5/5? … #Shorts"), external_id `quiz-qNN`; then the READ comment-to-DM automations (RUNBOOK "Comments" §3).
