# The List: list reel three times a week (Mon 12:30, Wed 20:00, Fri 12:30 Singapore, from 27 Nov 2026)

One list reel a week on Instagram, Facebook, TikTok and YouTube. Modelled on @islaminsketches "Every prophet mentioned by name
in the Qur'an, all 25" (studied 27 Nov 2026: 75.1K followers from 23 posts; that reel 1.9M views, 91.1K likes, 417 comments,
~9.6K shares, 44.2K saves). Why it works: frame 1 promises the complete set in a fixed time; it is a reference people save;
each card is very simple (number badge, the name in English and Arabic, one small drawn object, one line, a tiny source);
the end card asks viewers to comment one item, and every comment says what to make next. Ahmed said yes on 27 Nov 2026.
It sits outside the daily Track A vs Track B comparison (log it with `track: "list"`).

## Style lock (Ahmed, 27 Nov 2026: "I love the style, make sure it's locked for all future videos")
Every List reel uses `remotion/src/list/List.tsx` exactly as it looks in L01/L02. Do not change: the cream paper
(`public/list/paper.jpg`) and the faint orange margin line; the palette (ink #25221f, orange #d8692d, teal #3f7b8c, mute #8f8271);
the fonts (Poppins 500/600/700, Amiri Bold headwords, Amiri Quran for Qur'anic text, Cormorant Garamond Italic quotes,
Caveat for the hand-written lines); the layout zones (series header 176, number badge 236, drawing 398–890, Arabic headword,
KEYWORD · gloss line 1085, quote 1172, verse fragment + tiny source line 1365); the timing (intro 3.5 s, 8 s per card,
end card 7.5 s, loop back to frame 1); the motions (page slide-in with a slight tilt, badge pop with overshoot, ink drawing
itself stroke by stroke, word-by-word quote, chips dropping in on the end card); and the sound (scripts/list_audio.py, no music).
Allowed changes are content only: the spec JSON, new SYMBOLS drawn in the same line style (7.5 px ink, 6.5 px orange accents,
one orange accent per drawing), and the optional per-item fields `ar_font: "quran"` (Qur'anic headword) and `ar_intro`
(one short word for the frame-1 rows). A real layout bug may be fixed only if L01 and L02 still render the same.

## Three a week, themes across all five books (Ahmed, 27 Nov 2026: content does not have to be 100% from the books,
## but it must support and complete the brand)
The brand is Yasser Fares and his five books, so every list sits under one of their themes, using the book's own material
where it has it and verified Qur'an (or a named reliable reference) where it does not:
- **My Prayer**: salah, its words and its du'as (e.g. 7 Qur'anic du'as for your family; your whole prayer line by line).
- **The Mirror**: how Muslims treat and speak to people who differ (e.g. 9 Qur'anic words; manners of Surah al-Hujurat).
- **Hold Firmly**: one Ummah, the Qur'an first, disagreement without division.
- **The Evil I**: the self, desire, arrogance and repentance (e.g. 7 du'as of the prophets after a mistake).
- **The Language of Marital Repair**: marriage, mercy and repair at home (careful tone; Qur'an-only lists such as the verses on spouses).
Rotate so no book's theme runs twice in a row (L01, Mirror, airs Wed 2 Dec; so L03 on Mon 30 Nov is The Evil I). Monday and Friday at 12:30, Wednesday at 20:00 (it avoids stacking on
Track A's 19:00 and Track B's 23:15). Each item still follows the content rules above. Compare the lunchtime and evening
slots in the audits.

## Qur'anic text on screen: use the display form
`quran/display.py` (27 Nov 2026): source B stores open fathatan/kasratan as U+0657/U+0656, which Amiri Quran draws as an
inverted damma / a subscript alef. Pass every Arabic fragment through `display_text(text, "S:V")`: it swaps in the standard
marks (U+08F0/U+08F2/U+08F1) and fails unless the result is a run of words of source A (KFGQPC Hafs). verse.py's EXCERPT
output now does this itself. English renderings from a named translation are taken verbatim (Saheeh International:
fawazahmed0/quran-api edition `eng-ummmuhammad` on raw.githubusercontent.com), and the source line says so.

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
   TT+YT post (`list-lNN-tt-yt`), both at the day's slot (Mon/Fri 12:30, Wed 20:00 Asia/Singapore).
8. **Comment-to-DM: one automation per platform per post** (for a list with no episodes, e.g. du'as, the DM carries all the
   items' Arabic with references, no buttons, ≤ 1000 characters; add AMEEN/آمين and DUA/دعاء as keywords) (Zernio allows only one active automation per post), keywords =
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
| L02 | 7 du'as from the Qur'an for your family | My Prayer theme; Qur'an + Saheeh International | done (27 Nov 2026) |
| L03 | 6 du'as of the prophets after a mistake | The Evil I theme; Qur'an + Saheeh (check speakers in context) | todo |
| L04 | Verses that say Muslims are one Ummah | Hold Firmly theme; Qur'an + the book's own lines | todo |
| L05 | Your whole prayer, line by line (takbir to salam) | My Prayer; trackb/phrases.json; Al-Fatihah via verse.py | todo |
| L06 | 8 manners Surah al-Hujurat teaches in 13 verses | The Mirror theme; Qur'an 49 via verse.py + Saheeh | todo |
| L07 | What the Qur'an calls a marriage (the verses on spouses) | Marital Repair theme; Qur'an only, careful tone | todo |
| L08 | The words of the adhan, and what each one asks of you | My Prayer Ch.1; phrases.json (verify every phrase) | todo |
| L09 | 7 verses The Mirror uses about people who differ from you | The Mirror; verse.py | todo |
| L10 | The newest One Word episodes, all in one place (like L01) | Track A log | todo |

## Results
Compare saves, shares and comments per 1,000 views with Track A, Track B and the quiz in the Monday/Thursday audit.
