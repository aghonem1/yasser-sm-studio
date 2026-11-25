"""Webinar 1 creative kit (navy and gold, same family as the site and reels).
Every date and time string comes from CFG so a change of date is one edit. Run: python3 kit.py [name-filter]
Text is the approved launch-kit text; nothing here adds a claim about the seerah."""
import asyncio, base64, io, sys
from pathlib import Path
import qrcode
from playwright.async_api import async_playwright

OUT = Path("/home/claude/work/kit/out"); OUT.mkdir(parents=True, exist_ok=True)
F = "/home/claude/work/fonts/node_modules/@fontsource"
SF = "/home/claude/yasser-sm-studio/remotion/public/fonts"

CFG = dict(
    day="Saturday 9 January", day_caps="SATURDAY 9 JANUARY", year="2027",
    time="9:00 PM Singapore time", time_caps="9 PM SINGAPORE TIME",
    zones=[("Singapore · Malaysia", "9:00 PM"), ("UAE", "5:00 PM"), ("Saudi Arabia", "4:00 PM"), ("Egypt", "3:00 PM"), ("United Kingdom", "1:00 PM"), ("US Eastern", "8:00 AM")],
    url="yasserfares.com/khadijah",
    qr="https://yasserfares.com/webinars/what-did-khadijah-know/?utm_source=brochure&utm_medium=print&utm_campaign=webinar1",
)
T = dict(
    eyebrow="A FREE LIVE SESSION WITH YASSER FARES",
    title="WHAT DID<br>KHADIJAH KNOW?",
    sub="Hira, the first revelation, and the first people to believe",
    hook1="He came home from Hira trembling.", hook2="She reassured him.",
    hook3="What had she seen in him that made her so sure?",
    known="Her answer was not a guess. She had known him for years, first through her trade and then as his wife.",
    covers=[("Before Hira", "His work in Khadijah’s trade, their marriage, and the day the clans of Quraysh accepted his judgement over the Black Stone."),
            ("Hira", "‘A’ishah’s account, from truthful dreams and retreat to the opening of Surat al-‘Alaq and the return home."),
            ("The first to believe", "Khadijah, ‘Ali, Zayd ibn Harithah, Abu Bakr and those he invited, and why the accounts differ on who came first."),
            ("Going public", "The call at Safa, and how Abu Lahab, who had also known him before revelation, answered differently.")],
    who="Anyone who wants to know the Prophet’s life ﷺ better. No background is needed. If you have studied the seerah before, you will meet a familiar story through a question you may not have asked.",
    teacher="Yasser Fares is an author and teacher. His books include <i>The Mirror</i> and <i>My Prayer</i>.",
)

def font(name, path, weight=400, style="normal"):
    return f"@font-face{{font-family:{name};src:url(file://{path});font-weight:{weight};font-style:{style}}}"

PATTERN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g fill='none' stroke='%23c9a457' stroke-width='1.2' opacity='.5'><rect x='48' y='48' width='64' height='64'/><rect x='48' y='48' width='64' height='64' transform='rotate(45 80 80)'/></g></svg>\")"

CSS = "".join([
    font("Cz", f"{F}/cinzel/files/cinzel-latin-400-normal.woff2"), font("Cz", f"{F}/cinzel/files/cinzel-latin-600-normal.woff2", 600),
    font("Cz", f"{F}/cinzel/files/cinzel-latin-700-normal.woff2", 700),
    font("Sp", f"{F}/spectral/files/spectral-latin-400-normal.woff2"), font("Sp", f"{F}/spectral/files/spectral-latin-400-italic.woff2", 400, "italic"),
    font("Sp", f"{F}/spectral/files/spectral-latin-600-normal.woff2", 600),
    font("Co", f"{F}/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2", 500, "italic"),
    font("Px", f"{F}/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2"), font("Px", f"{F}/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2", 500),
    font("Am", f"{SF}/Amiri-Regular.ttf"),
]) + """
*{box-sizing:border-box}html,body{margin:0;background:#09101e}
.c{position:relative;overflow:hidden;color:#ece6d6;display:flex;flex-direction:column;align-items:center;text-align:center;
  background:radial-gradient(ellipse at 50% 42%,#1c2b4a 0%,#0f1a2e 55%,#09101e 100%);font-family:Sp,Am,serif}
.c::before{content:"";position:absolute;inset:0;background-image:PATTERN;opacity:.10}
.c::after{content:"";position:absolute;left:50%;bottom:-30%;width:150%;height:60%;transform:translateX(-50%);background:radial-gradient(ellipse,rgba(243,217,164,.17),rgba(243,217,164,0) 65%)}
.c>*{position:relative;z-index:1}
.fr{position:absolute!important;inset:36px;border:2px solid rgba(201,164,87,.45);z-index:1}
.eb{font-family:Cz;letter-spacing:.26em;color:#c9a457;text-transform:uppercase}
.ti{font-family:Cz;font-weight:700;line-height:1.08;letter-spacing:.02em;background:linear-gradient(#f3d9a4,#c9a457 70%,#a8843d);-webkit-background-clip:text;color:transparent;margin:0}
.it{font-family:Co;font-style:italic;font-weight:500;color:#ece6d6}
.gold{color:#ecbe60}
.rule{width:160px;height:2px;background:#c9a457;opacity:.8}
.when{font-family:Cz;font-weight:600;letter-spacing:.14em;color:#f3d9a4;text-transform:uppercase}
.meta{font-family:Px;letter-spacing:.2em;text-transform:uppercase;color:#b9c0d0}
.url{font-family:Px;font-weight:500;letter-spacing:.04em;color:#0f1a2e;background:linear-gradient(#f3d9a4,#c9a457);border-radius:999px;display:inline-block}
.body{font-family:Sp,Am,serif;color:#ece6d6}
.num{font-family:Cz;color:#c9a457;letter-spacing:.2em}
.dots{display:flex;gap:10px}.dots i{width:9px;height:9px;border-radius:50%;background:rgba(201,164,87,.35)}.dots i.on{background:#c9a457}
.body,.it,.ti{text-wrap:balance}
.sw{font-family:Px;letter-spacing:.2em;text-transform:uppercase;color:#c9a457}
""".replace("PATTERN", PATTERN)

def page(w, h, inner, extra=""):
    return f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}.c{{width:{w}px;height:{h}px}}{extra}</style></head><body><div class='c'><div class='fr'></div>{inner}</div></body></html>"

def qr_data(url, dark="#0f1a2e", light="#f4ead4"):
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=12, border=4); q.add_data(url); q.make(fit=True)
    img = q.make_image(fill_color=dark, back_color=light); b = io.BytesIO(); img.save(b, format="PNG")
    return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

def mid(inner, pad="110px 80px"):
    return f"<div style='flex:1;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:{pad}'>{inner}</div>"

HOOK = f"{T['hook1']}<br>{T['hook2']}<br><span class='gold'>What had she seen in him<br>that made her so sure?</span>"

JOBS = {}
def job(name, w, h, kind="jpg"):
    def deco(fn):
        JOBS[name] = (w, h, kind, fn); return fn
    return deco

# ---------- invitation cards ----------
def invite(w, h, s, top, hook=True):
    """s = scale factor relative to the 1080x1350 card."""
    hk = (f"<div class='it' style='font-size:{54*s}px;line-height:1.3;margin-top:{54*s}px'>{HOOK}</div>" if hook
          else f"<div class='it' style='font-size:{46*s}px;line-height:1.25;margin-top:{40*s}px'>Hira, the first revelation,<br>and the first people to believe</div>")
    return mid(f"<div class='eb' style='font-size:{25*s}px'>{T['eyebrow']}</div>"
            f"<h1 class='ti' style='font-size:{90*s}px;margin-top:{40*s}px;white-space:nowrap'>{T['title']}</h1>{hk}"
            f"<div class='rule' style='margin-top:{56*s}px'></div>"
            f"<div class='when' style='font-size:{40*s}px;margin-top:{48*s}px'>{CFG['day']}</div>"
            f"<div class='when' style='font-size:{31*s}px;margin-top:{14*s}px;color:#ece6d6'>{CFG['time']}</div>"
            f"<div class='meta' style='font-size:{22*s}px;margin-top:{30*s}px'>Online · Free · One hour · In English</div>"
            f"<div class='url' style='font-size:{32*s}px;padding:{18*s}px {44*s}px;margin-top:{54*s}px'>{CFG['url']}</div>", top)

@job("invite_4x5", 1080, 1350)
def _(): return page(1080, 1350, invite(1080, 1350, 1.04, "90px 60px"))

@job("invite_story_9x16", 1080, 1920)
def _(): return page(1080, 1920, invite(1080, 1920, 1.08, "260px 50px 340px"))

@job("invite_square_1x1", 1080, 1080)
def _(): return page(1080, 1080, invite(1080, 1080, .98, "70px 60px", hook=False))

# ---------- time zone card ----------
@job("your_time_4x5", 1080, 1350)
def _():
    rows = "".join(f"<div style='display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid rgba(201,164,87,.28);padding:22px 6px'>"
                   f"<span class='body' style='font-size:40px'>{a}</span><span class='when' style='font-size:38px'>{b}</span></div>" for a, b in CFG["zones"])
    return page(1080, 1350, mid(f"<div class='eb' style='font-size:25px'>What Did Khadijah Know?</div>"
                f"<h1 class='ti' style='font-size:84px;margin-top:34px'>YOUR TIME</h1>"
                f"<div class='it' style='font-size:46px;margin-top:22px'>{CFG['day']}, live online</div>"
                f"<div style='width:800px;margin-top:44px;text-align:left'>{rows}</div>"
                f"<div class='meta' style='font-size:21px;margin-top:40px'>Free · One hour · Recording sent to everyone who registers</div>"
                f"<div class='url' style='font-size:30px;padding:16px 40px;margin-top:40px'>{CFG['url']}</div>", "90px 60px"))

# ---------- countdown stories ----------
def countdown(big, line):
    return page(1080, 1920, mid(f"<div class='eb' style='font-size:28px'>{T['eyebrow']}</div>"
                f"<h1 class='ti' style='font-size:132px;margin-top:70px;white-space:nowrap'>{big}</h1>"
                f"<div class='rule' style='margin-top:60px'></div>"
                f"<div class='it' style='font-size:68px;margin-top:56px;max-width:860px;line-height:1.2'>What Did Khadijah Know?</div>"
                f"<div class='when' style='font-size:42px;margin-top:60px;line-height:1.5'>{line}</div>"
                f"<div class='meta' style='font-size:24px;margin-top:34px'>Online · Free · One hour</div>"
                f"<div class='url' style='font-size:34px;padding:20px 48px;margin-top:70px'>{CFG['url']}</div>", "260px 50px 340px"))

@job("countdown_1_one-week_9x16", 1080, 1920)
def _(): return countdown("ONE WEEK", f"{CFG['day']}<br><span style='color:#ece6d6;font-size:34px'>{CFG['time']}</span>")
@job("countdown_2_three-days_9x16", 1080, 1920)
def _(): return countdown("3 DAYS", f"{CFG['day']}<br><span style='color:#ece6d6;font-size:34px'>{CFG['time']}</span>")
@job("countdown_3_tomorrow_9x16", 1080, 1920)
def _(): return countdown("TOMORROW", CFG["time"])
@job("countdown_4_today_9x16", 1080, 1920)
def _(): return countdown("TODAY", CFG["time"])

# ---------- carousels (1080x1350) ----------
def slide(n, total, inner, swipe=True):
    dots = "".join(f"<i class='{'on' if i == n else ''}'></i>" for i in range(1, total + 1))
    foot = (f"<div style='position:absolute;left:0;right:0;bottom:84px;display:flex;flex-direction:column;align-items:center;gap:22px'>"
            f"<div class='dots'>{dots}</div>" + (f"<div class='sw' style='font-size:19px'>Swipe →</div>" if swipe else f"<div class='sw' style='font-size:19px'>Yasser Fares</div>") + "</div>")
    return page(1080, 1350, f"<div style='position:absolute;top:92px;left:0;right:0' class='eb'><span style='font-size:21px'>What Did Khadijah Know? · Free live session</span></div>"
                f"<div style='flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:150px 96px 190px;width:100%'>{inner}</div>{foot}")

def cta_inner():
    return (f"<div class='it' style='font-size:54px'>One hour. Live. Free.</div><h1 class='ti' style='font-size:92px;margin-top:36px'>{T['title']}</h1>"
            f"<div class='rule' style='margin-top:48px'></div><div class='when' style='font-size:40px;margin-top:44px'>{CFG['day']}</div>"
            f"<div class='when' style='font-size:30px;margin-top:12px;color:#ece6d6'>{CFG['time']}</div>"
            f"<div class='url' style='font-size:32px;padding:18px 44px;margin-top:50px'>{CFG['url']}</div>"
            f"<div class='meta' style='font-size:20px;margin-top:34px'>Recording sent to everyone who registers</div>")

A = [f"<div class='it' style='font-size:92px;line-height:1.16'>{T['hook1']}</div><div class='rule' style='margin:54px 0'></div><div class='it gold' style='font-size:92px;line-height:1.16'>{T['hook2']}</div>",
     f"<h1 class='ti' style='font-size:86px;line-height:1.2'>WHAT HAD SHE SEEN IN HIM THAT MADE HER SO SURE?</h1>",
     f"<div class='it gold' style='font-size:78px;line-height:1.18'>Her answer was not a guess.</div><div class='rule' style='margin:50px 0'></div><div class='body' style='font-size:56px;line-height:1.4'>She had known him for years,<br>first through her trade<br>and then as his wife.</div>"]
for i, (h, b) in enumerate(T["covers"], 1):
    A.append(f"<div class='num' style='font-size:30px'>IN THIS HOUR · {i} OF 4</div><h1 class='ti' style='font-size:84px;margin-top:34px;text-transform:uppercase'>{h}</h1>"
             f"<div class='rule' style='margin:46px 0'></div><div class='body' style='font-size:54px;line-height:1.4'>{b}</div>")
A.append(cta_inner())
for i, inner in enumerate(A, 1):
    job(f"carousel_A_{i:02d}", 1080, 1350)(lambda inner=inner, i=i: slide(i, len(A), inner, swipe=i < len(A)))

B = [f"<h1 class='ti' style='font-size:96px;line-height:1.14;white-space:nowrap'>TWO PEOPLE.<br>TWO ANSWERS.</h1><div class='rule' style='margin:54px 0'></div><div class='it' style='font-size:58px;line-height:1.25'>Two people knew him before revelation.</div>",
     f"<div class='num' style='font-size:30px'>THE FIRST</div><h1 class='ti' style='font-size:104px;margin-top:30px'>KHADIJAH</h1><div class='rule' style='margin:46px 0'></div><div class='body' style='font-size:56px;line-height:1.4'>She had known him for years,<br>first through her trade<br>and then as his wife.</div>",
     f"<div class='num' style='font-size:30px'>THE SECOND</div><h1 class='ti' style='font-size:104px;margin-top:30px'>ABU LAHAB</h1><div class='rule' style='margin:46px 0'></div><div class='body' style='font-size:56px;line-height:1.4'>He had also known him before revelation.</div>",
     f"<div class='it' style='font-size:74px;line-height:1.2'>When the call went public<br>at Safa,</div><div class='rule' style='margin:50px 0'></div><div class='it gold' style='font-size:86px;line-height:1.16'>they gave opposite answers.</div>",
     cta_inner()]
for i, inner in enumerate(B, 1):
    job(f"carousel_B_{i:02d}", 1080, 1350)(lambda inner=inner, i=i: slide(i, len(B), inner, swipe=i < len(B)))

# ---------- ad stills ----------
def ad(w, h, s, top, head, sub):
    return page(w, h, mid(f"<div class='eb' style='font-size:{24*s}px'>{T['eyebrow']}</div>"
                f"<h1 class='ti' style='font-size:{92*s}px;margin-top:{44*s}px;white-space:nowrap'>{head}</h1>"
                f"<div class='it' style='font-size:{50*s}px;line-height:1.28;margin-top:{44*s}px'>{sub}</div>"
                f"<div class='rule' style='margin-top:{52*s}px'></div>"
                f"<div class='when' style='font-size:{40*s}px;margin-top:{44*s}px'>{CFG['day']}</div>"
                f"<div class='when' style='font-size:{30*s}px;margin-top:{12*s}px;color:#ece6d6'>{CFG['time']}</div>"
                f"<div class='meta' style='font-size:{21*s}px;margin-top:{26*s}px'>Free · Live online · One hour</div>"
                f"<div class='url' style='font-size:{30*s}px;padding:{16*s}px {40*s}px;margin-top:{46*s}px'>{CFG['url']}</div>", top))

AD_B = ("WHAT DID<br>KHADIJAH KNOW?", "She had known him for years,<br>in trade and in marriage.<br>When he came home from Hira,<br><span class='gold'>her answer was not a guess.</span>")
AD_C = ("TWO PEOPLE.<br>TWO ANSWERS.", "Two people knew him before revelation.<br><span class='gold'>They gave opposite answers.</span>")
for key, (hd, sb) in (("B", AD_B), ("C", AD_C)):
    job(f"ad_{key}_4x5", 1080, 1350)(lambda hd=hd, sb=sb: ad(1080, 1350, 1.04, "90px 70px", hd, sb))
    job(f"ad_{key}_1x1", 1080, 1080)(lambda hd=hd, sb=sb: ad(1080, 1080, .9, "60px 60px", hd, sb))
    job(f"ad_{key}_9x16", 1080, 1920)(lambda hd=hd, sb=sb: ad(1080, 1920, 1.08, "260px 50px 340px", hd, sb))

# ---------- ad cards, second set (26 Nov): question card and one "in this hour" card per region ----------
# No address pill: the ad carries its own "Learn more" button. Words are the approved launch-kit lines.
REGIONS = {
    "south-asia": [("Pakistan", "6:00 PM"), ("India · Sri Lanka", "6:30 PM"), ("Bangladesh", "7:00 PM")],
    "southeast-asia": [("Jakarta", "8:00 PM"), ("Malaysia · Brunei · Singapore", "9:00 PM")],
    "africa-egypt": [("Ghana", "1:00 PM"), ("Nigeria", "2:00 PM"), ("Egypt · South Africa", "3:00 PM"), ("Kenya", "4:00 PM")],
}
HOUR = ["The day of the Black Stone", "How revelation began", "Who believed next", "Two people, two answers"]

def ad_question(w, h, s, top):
    return page(w, h, mid(f"<div class='eb' style='font-size:{24*s}px'>A free live hour with Yasser Fares</div>"
                f"<div class='it' style='font-size:{74*s}px;line-height:1.22;margin-top:{70*s}px'>He came home from Hira trembling.<br>She reassured him.</div>"
                f"<div class='it gold' style='font-size:{74*s}px;line-height:1.22;margin-top:{44*s}px;color:#ecbe60'>What had she seen in him<br>that made her so sure?</div>"
                f"<div class='rule' style='margin-top:{70*s}px'></div>"
                f"<div class='when' style='font-size:{40*s}px;margin-top:{48*s}px'>{CFG['day']}</div>"
                f"<div class='meta' style='font-size:{22*s}px;margin-top:{24*s}px'>Online · Free · One hour</div>", top))

def ad_hour(w, h, s, top, region):
    items = "".join(f"<div style='display:flex;align-items:baseline;gap:{26*s}px;padding:{15*s}px 0'><span class='num' style='font-size:{30*s}px'>{i}</span>"
                    f"<span class='body' style='font-size:{44*s}px;line-height:1.2'>{t}</span></div>" for i, t in enumerate(HOUR, 1))
    rows = "".join(f"<div style='display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid rgba(201,164,87,.28);padding:{13*s}px 4px'>"
                   f"<span class='body' style='font-size:{31*s}px'>{a}</span><span class='when' style='font-size:{31*s}px'>{b}</span></div>" for a, b in REGIONS[region])
    return page(w, h, mid(f"<div class='eb' style='font-size:{24*s}px'>What Did Khadijah Know?</div>"
                f"<h1 class='ti' style='font-size:{58*s}px;margin-top:{34*s}px;line-height:1.16'>ONE HOUR ON THE<br>FIRST DAYS OF THE MESSAGE</h1>"
                f"<div style='width:{800*s}px;margin-top:{36*s}px;text-align:left'>{items}</div>"
                f"<div class='rule' style='margin-top:{34*s}px'></div>"
                f"<div class='when' style='font-size:{38*s}px;margin-top:{34*s}px'>{CFG['day']}</div>"
                f"<div style='width:{640*s}px;margin-top:{20*s}px;text-align:left'>{rows}</div>"
                f"<div class='meta' style='font-size:{21*s}px;margin-top:{32*s}px'>A free live hour with Yasser Fares · Online</div>", top))

job("ads2_question_4x5", 1080, 1350)(lambda: ad_question(1080, 1350, 1.0, "90px 70px"))
job("ads2_question_9x16", 1080, 1920)(lambda: ad_question(1080, 1920, 1.06, "260px 50px 340px"))
for _r in REGIONS:
    job(f"ads2_hour_{_r}_4x5", 1080, 1350)(lambda r=_r: ad_hour(1080, 1350, 1.0, "80px 70px", r))
    job(f"ads2_hour_{_r}_9x16", 1080, 1920)(lambda r=_r: ad_hour(1080, 1920, 1.04, "260px 50px 340px", r))

# ---------- brochure (A4 at 150 dpi: 1240x1754; printed to PDF) ----------
def brochure_html():
    zones = " · ".join(f"{b} {a}" for a, b in CFG["zones"][1:3]) + "<br>" + " · ".join(f"{b} {a}" for a, b in CFG["zones"][3:])
    cover = (f"<div class='c' style='width:1240px;height:1754px'><div class='fr' style='inset:44px'></div><div style='height:170px'></div>"
             f"<div class='eb' style='font-size:27px'>{T['eyebrow']}</div><h1 class='ti' style='font-size:106px;margin-top:50px;white-space:nowrap'>{T['title']}</h1>"
             f"<div class='it' style='font-size:50px;margin-top:40px'>{T['sub']}</div><div class='rule' style='margin-top:60px'></div>"
             f"<div class='it' style='font-size:56px;line-height:1.32;margin-top:60px'>{HOOK}</div>"
             f"<div class='when' style='font-size:46px;margin-top:84px'>{CFG['day']} {CFG['year']}</div>"
             f"<div class='when' style='font-size:34px;margin-top:16px;color:#ece6d6'>{CFG['time']}</div>"
             f"<div class='body' style='font-size:25px;margin-top:22px;color:#b9c0d0;max-width:980px'>{zones}</div>"
             f"<div class='meta' style='font-size:23px;margin-top:40px'>Online · Free · One hour · In English</div>"
             f"<div style='display:flex;align-items:center;gap:40px;margin-top:70px;text-align:left'><img src='{qr_data(CFG['qr'])}' style='width:210px;height:210px;border-radius:10px;border:3px solid #c9a457'>"
             f"<div><div class='eb' style='font-size:22px'>Save your seat</div><div class='url' style='font-size:34px;padding:16px 38px;margin-top:18px'>{CFG['url']}</div>"
             f"<div class='body' style='font-size:25px;margin-top:20px;color:#b9c0d0'>Scan the code or type the address.<br>A recording goes to everyone who registers.</div></div></div></div>")
    cov = "".join(f"<div style='display:flex;gap:20px;margin-top:16px'><div style='color:#a8843d;font-size:22px;line-height:1.6'>◆</div><div><b style='font-family:Sp;font-weight:600'>{h}.</b> {b}</div></div>" for h, b in T["covers"])
    faq = [("Is it free?", "Yes. There is nothing to pay and nothing sold in the session."), ("Will there be a recording?", "Yes. Everyone who registers receives it."),
           ("Do I need to know the seerah already?", "No."), ("What language is it in?", "English."), ("Can I ask questions?", "Yes, in the chat. The last fifteen minutes are for them."),
           ("Where do I watch?", "Online. The link is emailed to everyone who registers.")]
    faqh = "".join(f"<div style='margin-top:11px'><b style='font-family:Sp;font-weight:600'>{q}</b> {a}</div>" for q, a in faq)
    h2 = "font-family:Cz;font-weight:600;font-size:27px;letter-spacing:.16em;text-transform:uppercase;color:#8a6a2a;margin:0"
    box = "border:1.5px solid #c9a457;border-radius:10px;padding:26px 30px;background:#fffaf0;margin-top:16px;font-size:24px;line-height:1.46"
    inside = (f"<div style='width:1240px;height:1754px;background:#fbf8f1;color:#16213a;font-family:Sp,Am,serif;font-size:25px;line-height:1.46;padding:80px 100px;position:relative;text-align:left'>"
              f"<div style='font-family:Cz;letter-spacing:.24em;font-size:20px;color:#8a6a2a;text-transform:uppercase'>Yasser Fares · Free live session · {CFG['day']} {CFG['year']}</div>"
              f"<div style='font-family:Cz;font-weight:700;font-size:50px;color:#0f1a2e;margin-top:12px;line-height:1.15'>What Did Khadijah Know?</div>"
              f"<div style='height:2px;background:#c9a457;margin:22px 0 26px'></div>"
              f"<p style='margin:0'>When the Prophet ﷺ returned from the cave of Hira, the first person to hear what had happened was Khadijah. She reassured him. Her answer was not a guess. She had known him for years, first through her trade and then as his wife. This session follows one question through the early accounts: what did she know of his character?</p>"
              f"<h2 style='{h2};margin-top:30px'>In this hour</h2>{cov}"
              f"<div style='display:flex;gap:44px;margin-top:30px'><div style='flex:1'><h2 style='{h2}'>Who it is for</h2><p style='margin:14px 0 0'>{T['who']}</p>"
              f"<h2 style='{h2};margin-top:30px'>About the teacher</h2><p style='margin:14px 0 0'>{T['teacher']}</p></div>"
              f"<div style='flex:1'><h2 style='{h2}'>Questions</h2><div style='font-size:24px'>{faqh}</div></div></div>"
              f"<h2 style='{h2};margin-top:30px'>For organisers: a text you can forward</h2>"
              f"<div style='{box}'><i>What Did Khadijah Know?</i> A free live hour on the seerah with Yasser Fares.<br>When the Prophet ﷺ came home from Hira, Khadijah was the first to hear, and she reassured him. What had she seen in him that made her so sure?<br>"
              f"{CFG['day']} · {CFG['time']} · Online · Free<br>Register: {CFG['url']}</div>"
              f"<div style='position:absolute;left:100px;right:100px;bottom:56px;display:flex;justify-content:space-between;font-family:Px;font-size:20px;color:#4f5668;border-top:1px solid #d9cfb8;padding-top:18px'>"
              f"<span>{CFG['url']}</span><span>hello@yasserfares.com</span></div></div>")
    return (f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}@page{{size:1240px 1754px;margin:0}}.ti{{background:none;-webkit-background-clip:border-box;color:#e3c27a}}body{{background:#fff}}.pg{{page-break-after:always}}"
            f"</style></head><body><div class='pg'>{cover}</div><div>{inside}</div></body></html>")

async def main(flt):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        pg = await b.new_page()
        for name, (w, h, kind, fn) in JOBS.items():
            if flt and flt not in name: continue
            src = OUT / "_src"; src.mkdir(exist_ok=True); f = src / f"{name}.html"; f.write_text(fn(), encoding="utf-8")
            await pg.set_viewport_size({"width": w, "height": h}); await pg.goto(f"file://{f}"); await pg.wait_for_timeout(250)
            await pg.screenshot(path=str(OUT / f"{name}.png"), clip={"x": 0, "y": 0, "width": w, "height": h})
            print("ok", name)
        if not flt or flt in "brochure":
            f = OUT / "_src" / "brochure.html"; f.parent.mkdir(exist_ok=True); f.write_text(brochure_html(), encoding="utf-8")
            await pg.set_viewport_size({"width": 1240, "height": 1754}); await pg.goto(f"file://{f}"); await pg.wait_for_timeout(400)
            await pg.pdf(path=str(OUT / "brochure_A4.pdf"), width="1240px", height="1754px", print_background=True)
            await pg.screenshot(path=str(OUT / "brochure_preview.png"), full_page=True)
            print("ok brochure")
        await b.close()

asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else ""))
