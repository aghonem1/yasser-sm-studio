#!/usr/bin/env python3
"""Mirror the published reflections from the live site into this repo (no token needed).

Used by .github/workflows/mirror-site.yml when the SITE_REPO_TOKEN secret is not set (or the clone fails).
Writes, for every reflection linked from https://yasserfares.com/reflections/:
  mirror/site/web/<slug>.html   the page exactly as served
  mirror/site/web/<slug>.md     its readable text: front matter (url, dates found on the page, book links) + body
  mirror/site/web/index.json    [{slug, url, title, dates, books}] in the order the list page uses
Stdlib only. Usage: python3 tools/mirror_site.py [OUTDIR]
"""
import html, json, os, re, sys, time, urllib.request
from html.parser import HTMLParser

BASE = "https://yasserfares.com"
OUT = sys.argv[1] if len(sys.argv) > 1 else "mirror/site/web"
UA = {"User-Agent": "yasser-sm-studio-mirror/1.0 (+https://github.com/aghonem1/yasser-sm-studio)"}


def get(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:  # noqa: BLE001
            if attempt == 2:
                raise
            print(f"retry {url}: {e}", file=sys.stderr)
            time.sleep(5)


MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October",
          "November", "December"]
BLOCK = {"p", "div", "section", "article", "li", "br", "tr", "figure", "figcaption", "h1", "h2", "h3", "h4", "h5", "h6",
         "blockquote", "ul", "ol", "hr", "header", "footer", "main", "aside", "table"}
SKIP = {"script", "style", "noscript", "svg", "nav", "form", "button", "template"}


class Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.skip, self.quote, self.scope = [], 0, 0, 0
        self.dates, self.books, self.title = [], [], ""
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title":
            self._in_title = True
        if tag in SKIP:
            self.skip += 1
            return
        if tag == "time" and a.get("datetime"):
            self.dates.append(a["datetime"])
        if tag == "meta" and a.get("property") in ("article:published_time", "og:published_time"):
            self.dates.append(a.get("content", ""))
        mb = re.match(r"^(?:https://yasserfares\.com|(?:\.\./)+|/)?/?books/([a-z0-9-]+)/?$", a.get("href", "")) if tag == "a" else None
        if mb:
            href = f"{BASE}/books/{mb.group(1)}/"
            if href not in self.books:
                self.books.append(href)
        if tag == "blockquote":
            self.quote += 1
        if tag in BLOCK:
            self.parts.append("\n")
        if re.fullmatch(r"h[1-6]", tag):
            self.parts.append("#" * int(tag[1]) + " ")
        if tag == "li":
            self.parts.append("- ")

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag in SKIP:
            self.skip = max(0, self.skip - 1)
            return
        if tag == "blockquote":
            self.quote = max(0, self.quote - 1)
        if tag in BLOCK:
            self.parts.append("\n")
        elif tag in ("span", "td", "th"):
            self.parts.append(" · ")

    def handle_data(self, d):
        if self._in_title:
            self.title += d
        if self.skip:
            return
        self.parts.append(d)

    def text(self):
        raw = "".join(self.parts)
        lines = [re.sub(r"[ \t ]+", " ", l).strip() for l in raw.split("\n")]
        out, blank = [], False
        for l in lines:
            if not l:
                if not blank and out:
                    out.append("")
                blank = True
                continue
            out.append(l)
            blank = False
        return "\n".join(out).strip() + "\n"


def main_part(page):
    """The <main> (or <article>) element if the page has one, else the whole page."""
    for tag in ("main", "article"):
        m = re.search(rf"<{tag}\b.*?</{tag}>", page, re.S | re.I)
        if m:
            return m.group(0)
    return page


def parse(page):
    whole = Text(); whole.feed(page)
    body = Text(); body.feed(main_part(page))
    return whole, body


def main():
    os.makedirs(OUT, exist_ok=True)
    listing = get(BASE + "/reflections/")
    with open(os.path.join(OUT, "_list.html"), "w", encoding="utf-8") as f:
        f.write(listing)
    slugs = []
    # absolute (/reflections/x/, https://yasserfares.com/reflections/x) or relative (x/, ./x/) links, either quote
    for m in re.finditer(r'href=["\']([^"\'#?]+)["\']', listing):
        href = m.group(1)
        mm = re.search(r'(?:^|/)reflections/([a-z0-9][a-z0-9-]*)/?(?:index\.html)?$', href) or \
            re.fullmatch(r'(?:\./)?([a-z0-9][a-z0-9-]*-[a-z0-9-]+)/?(?:index\.html)?', href)
        if mm and mm.group(1) not in slugs:
            slugs.append(mm.group(1))
    if not slugs:
        sys.exit(f"no reflection links found on /reflections/ ({len(listing)} bytes saved to {OUT}/_list.html)")
    index = []
    for slug in slugs:
        url = f"{BASE}/reflections/{slug}/"
        page = get(url)
        whole, body = parse(page)
        title = html.unescape(whole.title).strip()
        dates = set(d for d in whole.dates if d)
        dates |= set(re.findall(r'"datePublished"\s*:\s*"([^"]+)"', page))
        for d, mon, y in re.findall(r"\b(\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December) (20\d\d)\b", body.text()[:3000]):
            dates.add(f"{y}-{MONTHS.index(mon) + 1:02d}-{int(d):02d}")
        dates = sorted(dates)
        fm = ["---", f"url: {url}", f"page_title: {json.dumps(title, ensure_ascii=False)}",
              f"dates_on_page: {json.dumps(dates)}", f"book_links: {json.dumps(whole.books)}",
              "source: website (mirrored by tools/mirror_site.py; text as the page prints it)", "---", ""]
        with open(os.path.join(OUT, f"{slug}.html"), "w", encoding="utf-8") as f:
            f.write(page)
        with open(os.path.join(OUT, f"{slug}.md"), "w", encoding="utf-8") as f:
            f.write("\n".join(fm) + body.text())
        index.append({"slug": slug, "url": url, "title": title, "dates": dates, "books": whole.books})
        print(f"ok {slug} {dates[:1]} {whole.books[:1]}")
    with open(os.path.join(OUT, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=1)
    print(f"{len(index)} reflections mirrored to {OUT}")


if __name__ == "__main__":
    main()
