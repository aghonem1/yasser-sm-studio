# ep08 hooks — tools/ig/hookscore.py (RUNBOOK §2a)
Episode swap: backlog row 08 (وَسَطًا, 2:143) skipped — quran/verse.py reports SOURCES DISAGREE for 2:143 (hard rule: drop that verse).
Made row 09 (أَحْسَن, 41:34) as episode 08.
Starting hook (backlog): "Don't answer well. Answer better." = 80.2 (weakest STAKES 70)

Test from research/learnings.md (from ep08): "first-3-seconds" — open on a surprising word fact, Arabic word on screen at frame 1,
spoken hook from 0.0 s, first visual change by 1.0 s, no branding animation before the hook. ep05–07 showed negative-command hooks
did not lower the skip rate, so the final hook is a word fact (aḥsan = better, not just good), not a "Don't…" command.

Round 1 (5 options)
- 80.2 Don't answer well. Answer better.  (STAKES 70)
- 80.0 The Qur'an doesn't ask you to reply with good. It says better.  (STAKES 70)
- 45.0 You can win the argument and lose the heart.  (SPECIFICITY 15)
- 44.4 Ahsan doesn't mean good. It means better.  (SPECIFICITY 15)
- 28.2 Someone wrongs you. A good reply isn't enough.  (FRONTLOAD 0)
Round 2 (best two rewritten for STAKES)
- 85.8 Don't answer well. Answer better, or lose the heart.  ← highest score, but a negative command (the type ep05–07 tested without gain)
- 83.2 Don't answer well. The Qur'an asks for better.
- 80.2 Don't just answer well. Answer better.
- 78.6 The Qur'an doesn't ask you to answer with good. It asks for better.  (LENGTH 77)
- 61.2 Win the argument, lose the heart. The Qur'an says: answer better.  (ADDRESS 35)
Round 3 (word-fact hooks, per the learnings test)
- 84.4 Not good. Better. That's the Qur'an's command to you.  ← CHOSEN (word fact in 3 words, said in the first 1.2 s)
- 83.2 Don't settle for good. The Qur'an's word is better.
- 81.4 Stop at good and you miss the Qur'an's word: better.
- 62.6 Not good. Better. That's the Qur'an's command.  (ADDRESS 35)
- 38–42 "The Qur'an's command isn't good. It's better." and other third-person versions (FRONTLOAD / STAKES)
Rejected for accuracy: "Don't reply with good" (the Qur'an does not forbid good) and "This verse doesn't say good" (41:34 itself
contains ٱلۡحَسَنَةُ earlier in the verse). The hook refers to the command ٱدۡفَعۡ بِٱلَّتِي هِيَ أَحۡسَنُ, which the book renders
"Respond with what is better" and calls "the command to respond 'with what is better'".
Score: 80.2 → 84.4. On screen (≤5 words): "NOT GOOD. BETTER." + أَحْسَن.

Script (beats.py --target 55 --wpm 150): 132 words ≈ 52.8 s (final 52.7 s). Kept on purpose: the verse beat (6.4 s, book wording,
the picture changes inside it), beats 12 and 14 (>4 s; the screen changes inside them). Loop: the last spoken line repeats the hook.
Book check: Ch.4 "Kindness Towards Those Who Differ" (41:34; "does not merely say … something good … what is better: the response most
likely to heal, correct and bring peace"; "Not every answer we are able to give is one we ought to give"; "win an argument yet lose a
heart"; "not to break the person before us, but to make truth clearer"; "Truth does not need insult to support it"),
"Beyond Fairness" (return a greeting = justice; with something better = kindness).
