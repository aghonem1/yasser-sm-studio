# ep09 hooks — tools/ig/hookscore.py (RUNBOOK §2a)
Backlog working hook: "Justice even against yourself." = 25.8 (FRONTLOAD 0)
Task brief: prefer a real-life question or surprising concrete claim (best so far: the wife / extremism questions).
Learnings test (ep08–11, "first-3-seconds"): hook spoken from ~0.03 s, Arabic word on frame 1, motion in the first second, no branding first. Kept.

Round 1 (hooks_r1.txt)
- 62.2 Your own family is wrong. Would you say so?  (FRONTLOAD 40)
- 48.6 Is it justice if it never goes against you?  (SPECIFICITY 15)
- 47.0 The Qur'an asks you to be fair against your own parents.  (STAKES 20)
- 37.8 Would you testify against your own parents?  (SPECIFICITY 15)
- 25.8 Justice even against yourself.  (FRONTLOAD 0)
Round 2 (hooks_r2.txt, best two rewritten for FRONTLOAD / STAKES)
- 84.4 Wrong, and it's your own parents. The Qur'an says: testify.  (statement, not a question; "says: testify" over-compresses the verse)
- 77.8 Your parents are wrong. Would you testify against them?
- 65.8 Your own family is wrong. Would you still tell the truth?
Round 3 (hooks_r3.txt)
- 87.0 Wrong, and it's your own parents. Would you still testify?  (awkward to say in the first second)
- 80.0 Your parents are wrong. Would you still testify against them?  ← CHOSEN (plain, real-life question, the payoff word "parents" in word 2)
- 79.4 / 75.1 variants adding "The Qur'an says yes / asks you to" (LENGTH, and "says yes" is not the book's wording)
Accuracy: 4:135 in the book: "stand firmly for justice as witnesses for God, even if it is against yourselves, your parents or your closest
relatives"; p.30 "Justice may require us to admit that ... someone close to us is wrong." Line 2 "The Qur'an asks you to." refers to that verse.
Score: 25.8 → 80.0. On screen frame 1: "YOUR PARENTS / ARE WRONG." + قِسْط + the tipped scale; then "TESTIFY / AGAINST THEM?".

Script (beats.py --target 55 --wpm 150): 150 words ≈ 60 s; final 57.9 s (52.8 s to the end card). Long beats are split on screen
(verse 4:135 in 4 caption lines with tiles changing; the "scale/lens" line split across a strike and a morph). Loop: the callback
line repeats "parents" from the hook; the follow line closes (task brief).
