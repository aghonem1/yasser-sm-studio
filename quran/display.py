"""Display form of verified Qur'an text. Source B (QuranEnc) stores the open tanween marks with legacy code points that
Amiri Quran draws as other marks (U+0657 -> inverted damma, U+0656 -> subscript alef, U+065E -> no glyph). The display form
uses the standard marks (U+08F0 open fathatan, U+08F2 open kasratan, U+08F1 open dammatan), and every word is checked
to equal source A (KFGQPC Hafs) after normalisation, so what is shown is the KFGQPC text."""
import re, sys, os, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verse as V
PAUSE = re.compile("[ۖ-ۜ۞۩]")
def fix(s):
    return s.replace("ٗ", "ࣰ").replace("ٖ", "ࣲ").replace("ٞ", "ࣱ")
def norm_a(w):
    w = unicodedata.normalize("NFC", w).replace("ـ", "")
    w = "".join(c for c in w if unicodedata.category(c) != "Cf")
    return PAUSE.sub("", w)
def words_a(su, v):
    t = V.src_a(su, v).replace("ࣰ ا", "ࣰا")       # 57:20-style stray space before alif
    return [norm_a(w) for w in t.split() if not re.fullmatch(r"[ۖ-ۜ۞۩٠-٩\d]+", PAUSE.sub("", w) or "۞")]
def display_text(text, ref):
    """Fix the marks in an excerpt of verse `ref` and assert it is a contiguous run of source-A words."""
    su, v = map(int, ref.split(":")); A = words_a(su, v)
    out = [PAUSE.sub("", fix(unicodedata.normalize("NFC", w))) for w in text.split()]
    ok = any(A[i:i + len(out)] == out for i in range(len(A)))
    if not ok:
        raise ValueError(f"{ref}: display text does not match source A: {' '.join(out)}")
    return " ".join(out)
if __name__ == "__main__":
    print(display_text(sys.argv[2], sys.argv[1]))
