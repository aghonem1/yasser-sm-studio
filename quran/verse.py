"""Verified Qur'an excerpt tool. Never type Qur'anic Arabic by hand.

usage: python3 quran/verse.py 49:13 [first_word_index last_word_index] [--save KEY]
  - downloads the verse from two independent sources:
      A) fawazahmed0/quran-api edition ara-quranuthmanihaf (KFGQPC Hafs) via raw.githubusercontent.com
      B) npm package quran-json (QuranEnc Uthmani text)
  - canonicalises both (NFC, U+08F0+space+alif -> U+0657+alif, U+08F1->U+065E, U+08F2->U+0656,
    remove tatweel and Cf format characters) and refuses unless the word lists match
  - prints the words with indices; with indices, prints / saves the excerpt (source B string, as displayed)
    into remotion/src/excerpts.json under KEY (default "S:V").
"""
import json, os, re, subprocess, sys, tarfile, unicodedata, urllib.request, io

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(os.path.expanduser("~"), ".cache", "quran")
os.makedirs(CACHE, exist_ok=True)

def canon(s):
    s = unicodedata.normalize("NFC", s)
    s = re.sub("ࣰ ?ا", "ٗا", s).replace("ࣱ", "ٞ").replace("ࣲ", "ٖ")
    s = s.replace("ـ", "")
    s = "".join(c for c in s if unicodedata.category(c) != "Cf")
    return " ".join(s.split())

def src_a(su, v):
    p = os.path.join(CACHE, f"a_{su}_{v}.json")
    if not os.path.exists(p):
        url = f"https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/ara-quranuthmanihaf/{su}/{v}.json"
        urllib.request.urlretrieve(url, p)
    return json.load(open(p))["text"]

def src_b(su, v):
    p = os.path.join(CACHE, "quran-json", "package", "dist", "quran.json")
    if not os.path.exists(p):
        d = os.path.join(CACHE, "quran-json"); os.makedirs(d, exist_ok=True)
        tgz = subprocess.run(["npm", "pack", "quran-json", "--silent"], cwd=d, capture_output=True, text=True, check=True).stdout.strip().splitlines()[-1]
        tarfile.open(os.path.join(d, tgz)).extractall(d, filter="data")
    q = json.load(open(p))
    return q[su - 1]["verses"][v - 1]["text"]

def main():
    ref = sys.argv[1]; su, v = map(int, ref.split(":"))
    a, b = canon(src_a(su, v)), canon(src_b(su, v))
    wa = [w for w in a.split() if not re.fullmatch(r"[ۖ-ۜ۞۩٠-٩\d]+", w)]
    wb = [w for w in b.split() if not re.fullmatch(r"[ۖ-ۜ۞۩٠-٩\d]+", w)]
    strip = lambda w: re.sub("[\u06D6-\u06DC\u06DE\u06E9]", "", w)
    if [strip(x) for x in wa] != [strip(x) for x in wb]:
        print("SOURCES DISAGREE — do not use this verse without manual checking"); print("A:", a); print("B:", b); sys.exit(2)
    for i, w in enumerate(wb): print(i, w)
    if len(sys.argv) >= 4 and sys.argv[2].isdigit():
        i0, i1 = int(sys.argv[2]), int(sys.argv[3])
        ex = " ".join(strip(w) for w in wb[i0:i1 + 1])
        # display: QuranEnc writes open dammatan as legacy U+065E, which Amiri Quran has no glyph for;
        # use the standard code point U+08F1 (the same mark in source A, already equated by canon()).
        ex = ex.replace("\u065E", "\u08F1")
        # display form (27 Nov 2026): QuranEnc also writes open fathatan as U+0657 and open kasratan as U+0656, which
        # Amiri Quran draws as an inverted damma / a subscript alef. Use the standard marks and check against source A.
        from display import display_text
        ex = display_text(ex, ref)
        print("EXCERPT:", ex)
        if "--save" in sys.argv:
            key = sys.argv[sys.argv.index("--save") + 1] if len(sys.argv) > sys.argv.index("--save") + 1 else ref
            p = os.path.join(ROOT, "remotion", "src", "excerpts.json"); d = json.load(open(p)); d[key] = ex
            json.dump(d, open(p, "w"), ensure_ascii=False, indent=1); print("saved", key)

if __name__ == "__main__":
    main()
