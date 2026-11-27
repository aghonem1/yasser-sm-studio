# Track B — "a phrase you say every day" · episode backlog

Source: *My Prayer — From the Call to a Life of Light* (Yasser Fares). Text: `aghonem1/yasserfares-site` → `sources/my-prayer.txt` (page numbers = the book's printed pages, from its table of contents).
Each run takes the first `todo` row and marks it `done` (or `blocked` with the reason). Everything said comes from the cited section. Never invent a hadith, a scholarly position, a number or a reference.
Arabic of the phrase: Qur'an via `python3 quran/verse.py S:V i0 i1 --save S:V` only (Al-Fatihah rows); other phrases only from `trackb/phrases.json`.
Hooks below are working ideas: write 5, score with tools/ig/hookscore.py, keep the best that is still faithful to the section.

| # | Phrase | Arabic from | Section (printed page) | Verse | Working hook | Status |
|---|---|---|---|---|---|---|
| B01 | Allahu Akbar (opening takbir) | phrases.json: takbir | Ch.4 "The Opening Takbir: From the Call to the Answer" p.31–32 | – | "Allahu Akbar is not only 'Allah is great.' You've been saying 'greater.'" (37.8→93.8) | done (pilot, 26 Nov) |
| B02 | Bismillah al-Rahman al-Rahim | verse.py 1:1 | Ch.5 "In the Name of Allah, the Entirely Merciful…" p.34 | 1:1 | "Bismillah before Al-Fatihah: you don't start with your strength." (83.0→85.6) | done (27 Nov) |
| B03 | Al-hamdu lillahi Rabb al-'alamin | verse.py 1:2 | Ch.5 "All praise belongs to Allah, Lord of all worlds" p.35 | 1:2 | "Before you ask Him for anything, you praise. Why?" | todo |
| B04 | Al-Rahman al-Rahim | verse.py 1:3 | Ch.5 "The Entirely Merciful, the Especially Merciful" p.35 | 1:3 | "Mercy, twice, in one breath. Why twice?" | todo |
| B05 | Maliki yawm al-din | verse.py 1:4 | Ch.5 "Master of the Day of Judgement" p.36 | 1:4 | "Right after mercy: judgement. Why that order?" | todo |
| B06 | Iyyaka na'budu | verse.py 1:5 | Ch.5 "You alone we worship" p.36 | 1:5 | "'You alone.' Then who else have you been working for?" | todo |
| B07 | wa iyyaka nasta'in | verse.py 1:5 | Ch.5 "And You alone we ask for help" p.37 | 1:5 | "You say 'help me' in every rak'ah. Do you mean it?" | todo |
| B08 | Ihdina al-sirat al-mustaqim | verse.py 1:6 | Ch.5 "Guide us to the straight path" p.37 | 1:6 | "Already Muslim, and still asking for guidance. Why?" | todo |
| B09 | Sirat alladhina an'amta 'alayhim | verse.py 1:7 | Ch.5 "The path of those You have blessed" p.38 | 1:7 | "You don't ask for a path. You ask for people." | todo |
| B10 | Ghayr al-maghdubi 'alayhim wa la al-dallin | verse.py 1:7 | Ch.5 "Not the path of those who incurred anger…" p.38 | 1:7 | "The last thing you ask for is two warnings." | todo |
| B11 | Subhana Rabbi al-'Azim | phrases.json: ruku | Ch.7 "Bowing and Rising" p.40–41 | – | "Your back bends. Does your pride?" | todo |
| B12 | Sami'a Allahu liman hamidah · Rabbana wa lakal-hamd | phrases.json: rafa, tahmid | Ch.7 "Rising: Standing in Praise after Humility" p.42–43 | – | "You stand up from bowing and say: He heard." | todo |
| B13 | Subhana Rabbi al-A'la | phrases.json: sujud | Ch.8 "Prostration and the Pause Between" p.44–45 | – | "Your face is on the floor. You say: Most High." | todo |
| B14 | Rabbi-ghfir li | phrases.json: jalsa | Ch.8 "Between the Two Prostrations: Need for Forgiveness" p.46–47 | – | "In the middle of prayer, you ask forgiveness. Why there?" | todo |
| B15 | At-tahiyyatu lillah | phrases.json: tahiyyat | Ch.10 "The Tashahhud" p.49–51 | – | "Every greeting you have ever given. Whose is it?" | todo |
| B16 | As-salamu 'alaykum wa rahmatullah | phrases.json: taslim | Ch.11 "From the Salam Back into Life" p.52–54 | – | "Your prayer ends with a promise to the people around you." | todo |
| B17 | Hayya 'ala al-falah | phrases.json: falah | Ch.1 "Come to Prayer; Come to Flourishing" p.20–21 | – | "Five times a day you're called. Not to prayer only." | todo |
| B18 | Ashhadu an la ilaha illa Allah | phrases.json: shahada | Ch.1 "The Two Testimonies: Devotion and Following" p.18–19 | – | "You testify every prayer. To what, exactly?" | todo |
| B19 | Allahu Akbar in the adhan | phrases.json: takbir | Ch.1 "The Adhan - A Call That Puts the World Back in Its Place" p.15–17 | – | "The call starts by putting your day in its place." | todo |

When fewer than 5 `todo` rows remain: add rows from *My Prayer* sections not yet used (Ch.2 intention, Ch.9 the next rak'ah, Ch.11 "Peace in the Gaze, the Word and the Deed", "Between Two Prayers"), then from *Hold Firmly*, *The Mirror* and *The Evil I*, only for words or phrases people say every day that the book itself explains (search the source text first; skip a phrase the book does not discuss). Never *The Language of Marital Repair*.
