# The List: weekly list reel (Wednesdays 20:00 Singapore, from 2 Dec 2026)

One list reel a week on Instagram, Facebook, TikTok and YouTube. Modelled on @islaminsketches "Every prophet mentioned by name
in the Qur'an, all 25" (studied 27 Nov 2026: 75.1K followers from 23 posts; that reel 1.9M views, 91.1K likes, 417 comments,
~9.6K shares, 44.2K saves). Why it works: frame 1 promises the complete set in a fixed time; it is a reference people save;
each card is very simple (number badge, the name in English and Arabic, one small drawn object, one line, a tiny source);
the end card asks viewers to comment one item, and every comment says what to make next. Ahmed said yes on 27 Nov 2026.
It sits outside the daily Track A vs Track B comparison (log it with `track: "list"`).

## Content rules
- Lists come from material already verified for the series: aired Track A words and Track B phrases, and Yasser's books
  (book text in aghonem1/yasserfares-site `sources/*.txt`). General Islamic knowledge only under the quiz/README.md rules
  (verified, source logged; never invented hadith or scholarly positions, no fiqh rulings, nothing contested or sectarian).
- Every quoted line is **verbatim** from the book, with its page (the page footer that follows it in `sources/<book>.txt`).
  Check each line with a script (`line in flattened text`) before rendering.
- Arabic verse fragments only as consecutive words of a verse, checked against BOTH verse.py sources (see "Verify" below);
  Track B phrases only from trackb/phrases.json; headwords as aired.
- No faces, no figures of prophets: each item gets one simple drawn object (List.tsx `SYMBOLS`; add new ones there as paths
  in a 600x420 box, accent paths `true`).
- No music: every card carries a Qur'an fragment (RUNBOOK: no music during verses). Sound = paper room tone, page turns,
  pencil while the object draws, soft pops, a bell on the end card (`scripts/list_audio.py`).
- 6 to 12 items; INTRO 3.5 s + 8 s per item + OUTRO 7.5 s (9 items = 83 s). The hook names the count and the time honestly.

## Make
1. `list/lNN.json` (copy l01.json): hook {kicker, big, sub, save}, header, items[{key (the comment keyword, ASCII caps), slug,
   ar, gloss, line, verse_ar, ref, page, symbol, keywords[], episode_ig, reflection}], end {done, ask, cta, follow}, sources.
2. Verify: every `line` verbatim in the book text; every `verse_ar` a contiguous run of words in verse.py source A and B
   (import quran/verse.py, compare stripped word lists as in the L01 check); headword spelling as aired.
3. `remotion/src/list/LNN.tsx` (copy L01.tsx) and register `lNN` in remotion/src/Root.tsx.
4. Stills: `COMP=lNN node stills.mjs 0 <each card at +4.5 s> <outro +3 s>` and look at all of them (text fits, objects read).
5. Render (`npx remotion render src/index.ts lNN out/lNN_silent.mp4 --browser-executable=/usr/bin/google-chrome --codec=h264 --crf=16 --concurrency=2`),
   `python3 scripts/list_audio.py list/lNN.json /tmp/lNN`, loudnorm −14 LUFS, mux, cover at 0.6 s,
   name `YYYY-MM-DD_the-list-NN_9x16_v1.mp4` in list/out/ (gitignored).
6. Captions in list/lNN_copy/ (ig, fb, tt, yt, yt_title, first_comment) through tools/ig humanize.py → detect.py → caption.py.
   IG/FB: "Write it in the comments and I'll DM you…" (FB "we'll message you"); TT/YT: the question only.
7. Post as RUNBOOK "Posting through Zernio": IG+FB post (external_id `list-lNN`, firstComment listing the keywords) and
   TT+YT post (`list-lNN-tt-yt`), both 20:00 Asia/Singapore on Wednesday.
8. **Comment-to-DM: one automation per platform per post** (Zernio allows only one active automation per post), keywords =
   every item's keywords (ASCII + Arabic) plus READ/اقرأ/اقرا, `match_mode: "word"`, `typo_tolerance: true`; the DM lists
   every item's episode link (Instagram permalinks via `accounts_get_account_posts`), ≤ 640 characters with buttons;
   buttons "Free reflections" → https://yasserfares.com/reflections/ and the book page, both with
   `?utm_source=<instagram|facebook>&utm_medium=dm&utm_campaign=comment_list`; repeat once; public reply after the DM.
9. Log in episodes/log.json `{track: "list", id, date, status, scheduled_for, duration_s, items, zernio_post_id,
   zernio_post_id_tt_yt, dm_automation_ids, files}`; mark the backlog row done.

## Backlog (first `todo` row is next)
| # | List | Source | Status |
|---|------|--------|--------|
| L01 | 9 Qur'anic words that change how you see people | One Word 01–09, The Mirror | done (2 Dec 2026) |
| L02 | Your whole prayer, line by line (takbir to salam) | My Prayer; trackb/phrases.json; Al-Fatihah via verse.py | todo |
| L03 | The words of the adhan, and what each one asks of you | My Prayer Ch.1; phrases.json (verify every phrase) | todo |
| L04 | 7 verses The Mirror uses about people who differ from you | The Mirror; verse.py | todo |
| L05 | The week's One Word episodes, all in one place (repeat of L01 with the newest 6–9 words) | Track A log | todo |

## Results
Compare saves, shares and comments per 1,000 views with Track A, Track B and the quiz in the Monday/Thursday audit.
