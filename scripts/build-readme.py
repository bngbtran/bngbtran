#!/usr/bin/env python3
"""Dựng README.md và các ảnh SVG từ dữ liệu sống của portfolio (xem scripts/readme-data.cjs).
GitHub Actions tự chạy định kỳ (.github/workflows/readme.yml). Chạy tay:
  conda run -n msa python scripts/build-readme.py
SVG dùng chữ đã chuyển thành nét vẽ nên GitHub hiện đúng font, không cần tải font."""
import html, json, math, os, re, subprocess, urllib.request
from datetime import date
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "images" / "readme"
OUT.mkdir(parents=True, exist_ok=True)
FONT_DIR = Path(os.environ["CONDA_PREFIX"]) / "share" / "readme-fonts" if os.environ.get("CONDA_PREFIX") else Path.home() / ".cache" / "readme-fonts"
FONT_DIR.mkdir(parents=True, exist_ok=True)

FONTS = {
    "serif": "Fraunces:ital,opsz,wght@0,144,350",
    "italic": "Fraunces:ital,opsz,wght@1,144,300",
    "mono": "JetBrains+Mono:wght@400",
    "sans": "Be+Vietnam+Pro:wght@400",
}
THEMES = {
    "dark": dict(bg="#090d0c", text="#e6efeb", dim="#92a19b", faint="#65726d", line="#26302c", a="#12a872", b="#3b72dc", dot="#1a2320", on="#03140c"),
    "light": dict(bg="#eef1ec", text="#0e1714", dim="#4d5a55", faint="#74807b", line="#c6ccc6", a="#045a3a", b="#1a41a8", dot="#d3d9d2", on="#f2fff8"),
}

def load_font(key):
    path = FONT_DIR / f"{key}.ttf"
    if not path.exists():
        req = urllib.request.Request(f"https://fonts.googleapis.com/css2?family={FONTS[key]}", headers={"User-Agent": "Mozilla/4.0"})
        css = urllib.request.urlopen(req).read().decode()
        urllib.request.urlretrieve(re.search(r"url\((https://[^)]+\.ttf)\)", css).group(1), path)
    font = TTFont(path)
    return dict(glyphs=font.getGlyphSet(), cmap=font.getBestCmap(), upem=font["head"].unitsPerEm)

F = {k: load_font(k) for k in FONTS}

def text(key, s, size, x=0, y=0, track=0.0):
    """Trả về (đường path, độ rộng) của chuỗi s; track tính theo em."""
    f = F[key]
    k = size / f["upem"]
    pen = SVGPathPen(f["glyphs"], ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip("."))
    cx = x
    for ch in s:
        name = f["cmap"].get(ord(ch))
        if name is None:
            raise ValueError(f"Font {key} thiếu ký tự {ch!r}")
        g = f["glyphs"][name]
        g.draw(TransformPen(pen, (k, 0, 0, -k, cx, y)))
        cx += g.width * k + track * size
    return pen.getCommands(), cx - x

def path(key, s, size, x, y, fill="none", track=0.0, extra=""):
    d, w = text(key, s, size, x, y, track)
    return f'<path d="{d}" fill="{fill}" {extra}/>', w

def write(name, w, h, body, defs=""):
    (OUT / name).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img"><defs>{defs}</defs>{body}</svg>\n', encoding="utf8")

SIGNATURE = re.search(r' d="([^"]+)"', (ROOT / "images/brand/signature.svg").read_text()).group(1)

# ---------- Dữ liệu sống, cùng cách tính với app.js ----------
D = json.loads(subprocess.check_output(["node", str(ROOT / "scripts" / "readme-data.cjs")]))
P, PROJECTS, COURSES = D["PROFILE"], D["PROJECTS"], D["COURSES"]
TX = {**D["TEXTS"], **({"statement": P["statement"]} if P.get("statement") else {}), **{k: v for k, v in (P.get("texts") or {}).items() if v}}
tech = {str(i).strip().lower() for g in P.get("skillGroups", []) if not re.search("kỹ năng mềm|soft skill", g.get("title", ""), re.I) for i in g.get("items", [])}
total = {str(p.get("repo") or p["title"]).lower() for p in PROJECTS} | {c["code"].lower() for c in COURSES}
years = max(1, date.today().year - P["startedCoding"]) if P.get("startedCoding") else 0
STATS = [(str(years), "+", TX["statYears"]), (str(len(P.get("languages", []))), "", TX["statLanguages"]), (str(len(tech)), "", TX["statSkills"]), (str(len(total)), "", TX["statProjects"])]
parts = P["name"].split()
FIRST, LAST = " ".join(parts[:-1]), parts[-1]

# ---------- Ảnh ----------
def hero(t, c):
    W, H = 1240, 470
    defs = (f'<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c["a"]}"/><stop offset="1" stop-color="{c["b"]}"/></linearGradient>'
            f'<linearGradient id="gt" gradientUnits="userSpaceOnUse" x1="56" y1="0" x2="330" y2="0"><stop offset="0" stop-color="{c["a"]}"/><stop offset="1" stop-color="{c["b"]}"/></linearGradient>'
            f'<pattern id="d" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1" fill="{c["dot"]}"/></pattern>'
            f'<radialGradient id="w" cx="0.05" cy="0" r="0.8"><stop offset="0" stop-color="{c["a"]}" stop-opacity=".1"/><stop offset="1" stop-color="{c["a"]}" stop-opacity="0"/></radialGradient>'
            f'<clipPath id="r"><rect width="{W}" height="{H}" rx="14"/></clipPath>')
    b = [f'<g clip-path="url(#r)"><rect width="{W}" height="{H}" fill="{c["bg"]}"/><rect width="{W}" height="{H}" fill="url(#d)"/><rect width="{W}" height="{H}" fill="url(#w)"/>']
    # Trường chấm gợn sóng, chuyển màu theo cột như trường ký tự trên web
    for i in range(30):
        for j in range(22):
            x, y = 770 + i * 16, 20 + j * 20
            n = (math.sin(i * .32) + math.sin(j * .42) + math.sin((i + j) * .16) + 3) / 6
            fall = max(0, 1 - math.hypot((x - 1010) / 250, (y - 235) / 225))
            v = n * fall
            if v > .08:
                k = i / 29
                col = "#" + "".join(f"{round(int(c['a'][q:q+2],16)*(1-k)+int(c['b'][q:q+2],16)*k):02x}" for q in (1, 3, 5))
                b.append(f'<circle cx="{x}" cy="{y}" r="{.8 + v * 3.6:.1f}" fill="{col}" opacity="{min(1, .25 + v * 1.1):.2f}"/>')
    s = 130 / 3553
    b.append(f'<g transform="translate(56 34) scale({s:.5f})"><path fill="{c["text"]}" fill-rule="evenodd" d="{SIGNATURE}"/></g>')
    b.append(path("mono", "PORTFOLIO", 12, 1100, 58, c["dim"], .12)[0])
    b.append(f'<rect x="56" y="104" width="{W-112}" height="1" fill="{c["line"]}"/>')
    p1, w1 = path("mono", f'~/{P["handle"]}', 15, 56, 150, c["b"])
    p2, w2 = path("mono", "$", 15, 56 + w1 + 10, 150, c["a"])
    p3, _ = path("mono", TX["heroCommand"], 15, 56 + w1 + w2 + 20, 150, c["dim"])
    b += [p1, p2, p3]
    b.append(path("serif", FIRST, 92, 52, 248, c["text"], -.05)[0])
    pl, wl = path("italic", LAST, 92, 56, 340, "url(#gt)", -.03)
    b.append(pl)
    b.append(f'<rect x="{56 + wl + 12:.0f}" y="272" width="8" height="70" fill="{c["a"]}"><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.5;.5;1" dur="1.05s" repeatCount="indefinite"/></rect>')
    b.append(path("italic", P["role"], 30, 56, 412, c["a"], -.02)[0])
    if P.get("openToWork"):
        lab = TX["openToWork"]
        _, lw = text("sans", lab, 14)
        x = W - 56 - lw
        b.append(f'<circle cx="{x - 16:.0f}" cy="407" r="4" fill="{c["a"]}"/>')
        b.append(path("sans", lab, 14, x, 412, c["dim"])[0])
    # Huy hiệu xoay
    cx, cy, r = 1010, 235, 76
    ring = f'{P["role"]} ✦ PORTFOLIO ✦ '.upper().replace("✦", "•")
    adv = 2 * math.pi * r / len(ring)
    chars = []
    for i, ch in enumerate(ring):
        if ch == " ":
            continue
        d, cw = text("mono", ch, 12.5)
        a = i * adv / r
        chars.append(f'<path d="{d}" fill="{c["text"]}" transform="rotate({math.degrees(a):.2f} {cx} {cy}) translate({cx - cw/2:.1f} {cy - r})"/>')
    b.append(f'<g>{"".join(chars)}<animateTransform attributeName="transform" type="rotate" from="0 {cx} {cy}" to="360 {cx} {cy}" dur="26s" repeatCount="indefinite"/></g>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="46" fill="url(#g)"/>')
    d, bw = text("italic", "BT", 34, 0, 0, -.02)
    b.append(f'<path d="{d}" fill="{c["on"]}" transform="translate({cx - bw/2:.1f} {cy + 12})"/>')
    b.append("</g>")
    write(f"hero-{t}.svg", W, H, "".join(b), defs)

# Số liệu và tiêu đề có nền riêng: GitHub khác chế độ sáng/tối với hệ điều hành thì chữ vẫn đọc được
def stats(t, c):
    W, H = 1240, 140
    col = W / len(STATS)
    b = [f'<rect width="{W}" height="{H}" rx="14" fill="{c["bg"]}"/>']
    for i, (num, sup, label) in enumerate(STATS):
        x = i * col + 32
        if i:
            b.append(f'<rect x="{i*col:.0f}" y="24" width="1" height="{H-48}" fill="{c["line"]}"/>')
        p, w = path("serif", num, 62, x, 80, c["text"], -.04)
        b.append(p)
        if sup:
            b.append(path("mono", sup, 24, x + w + 6, 48, c["a"])[0])
        b.append(path("sans", label, 15, x, 114, c["dim"])[0])
    write(f"stats-{t}.svg", W, H, "".join(b))

def heading(t, c, num, title, tag):
    W, H = 1240, 112
    bg = f'<rect width="{W}" height="{H}" rx="14" fill="{c["bg"]}"/>'
    p, nw = path("italic", num, 76, 28, 84, "none", -.04, f'stroke="{c["dim"]}" stroke-width="1"')
    x = 28 + nw + 26
    q, tw = path("serif", title, 36, x, 66, c["text"], -.03)
    r, _ = path("mono", f"<{tag} />", 13, x, 90, c["a"])
    write(f"h-{tag}-{t}.svg", W, H, bg + p + q + r + f'<rect x="{x + tw + 24:.0f}" y="54" width="{max(0, W - x - tw - 56):.0f}" height="1" fill="{c["line"]}"/>')

# Như section() trên web: tự đánh số theo thứ tự, mục trống thì bỏ qua; tiêu đề lấy từ chữ của trang
HEADS = [(f"{i:02d}", title, tag) for i, (title, tag) in enumerate(
    [x[:2] for x in ((TX["projectsEyebrow"], "projects", PROJECTS or COURSES), (TX["skillsTitle"], "skills", P.get("languages") or P.get("skillGroups")), (TX["experienceTitle"], "experience", P.get("experience"))) if x[2]], 1)]
for t, c in THEMES.items():
    hero(t, c)
    stats(t, c)
    for h in HEADS:
        heading(t, c, *h)

# ---------- README ----------
e = html.escape
def pic(name, alt, width="100%"):
    # Đúng dạng nhiều dòng theo tài liệu GitHub; không bọc <a> ngoài <picture>
    return (f'<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="images/readme/{name}-dark.svg" />\n'
            f'  <img src="images/readme/{name}-light.svg" alt="{e(alt)}" width="{width}" />\n</picture>')

SITE = "https://bngbtran.vercel.app"
def asset(u):
    return re.sub(r"^\./", "", u or "")
def card(p, span=False):
    links = " · ".join(f'<a href="{e(u)}">{l} ↗</a>' for l, u in (("Website", p.get("demo")), ("Mã nguồn", p.get("source"))) if u)
    tags = " ".join(f"<code>{e(x)}</code>" for x in p.get("tags", []))
    src, href = asset(p.get("image")), p.get("demo") or p.get("source")
    shot = f'<img src="{e(src)}" alt="{e(p["title"])}" width="100%" />' if src else ""
    if shot and href:
        shot = f'<a href="{e(href)}">{shot}</a>'
    year = f' <sub>{e(str(p["year"]))}</sub>' if p.get("year") else ""
    desc = f'<p>{e(p["description"])}</p>' if p.get("description") else ""
    attr = 'colspan="2"' if span else 'width="50%"'
    return (f'<td {attr} valign="top">{shot}<h3>{e(p["title"])}{year}</h3>{desc}'
            + (f"<p>{tags}</p>" if tags else "") + (f"<p>{links}</p>" if links else "") + "</td>")
# Như lưới trên web: số lẻ thì thẻ cuối trải ngang
rows = "".join("<tr>" + "".join(card(p, len(PROJECTS[i:i+2]) == 1) for p in PROJECTS[i:i+2]) + "</tr>" for i in range(0, len(PROJECTS), 2))

def course_row(c):
    title = f'<b>{e(c["title"])}</b>' if c.get("title") else ""
    intro = e(c["intro"]) if c.get("intro") else ""
    text = "<br />".join(x for x in (title, intro) if x)
    lang = f'<code>{e(c["language"])}</code>' if c.get("language") else ""
    return f'<tr><td valign="top"><a href="{e(c["url"])}"><b>{e(c["code"])}</b></a></td><td>{text}</td><td valign="top">{lang}</td></tr>'
def course_group(gid, title, desc):
    items = [c for c in COURSES if c["group"] == gid]
    if not items:
        return ""
    return (f'<details>\n<summary><b>{e(TX[title])}</b> · {len(items)} môn · {e(TX[desc])}</summary>\n\n'
            f'<table>{"".join(course_row(c) for c in items)}</table>\n\n</details>')
courses = "\n\n".join(x for x in (course_group("fpt", "courseGroupFpt", "courseGroupFptDesc"), course_group("fsb", "courseGroupFsb", "courseGroupFsbDesc")) if x)

skills = [("Ngôn ngữ lập trình", [l["name"] for l in P.get("languages", [])])] + [(g["title"], g["items"]) for g in P.get("skillGroups", [])]
skill_rows = "".join(f'<tr><td width="24%" valign="top"><b>{e(t)}</b></td><td>{" ".join(f"<code>{e(i)}</code>" for i in items)}</td></tr>' for t, items in skills)

TYPE = {"work": "Công việc", "education": "Học vấn", "milestone": "Cột mốc"}
def exp(x):
    h = "".join(f"<li>{e(i)}</li>" for i in x.get("highlights", []))
    l = " · ".join(f'<a href="{e(u)}">{e(k)} ↗</a>' for k, u in x.get("links", {}).items())
    return (f'<tr><td width="24%" valign="top"><b><i>{e(x["period"])}</i></b><br /><sub>{TYPE.get(x["type"], "")}</sub></td><td valign="top"><b>{e(x["title"])}</b><br />{e(x.get("org", ""))}'
            + (f'<p>{e(x["description"])}</p>' if x.get("description") else "") + (f"<ul>{h}</ul>" if h else "") + (f"<p>{l}</p>" if l else "") + "</td></tr>")

email = P["links"]["email"]
projects_label, study_label = TX["projectsTabMain"], TX["projectsTabStudy"]
BODY = {
    "projects": f"""**{e(projects_label)}** · {len(PROJECTS)} dự án

<table>{rows}</table>

**{e(study_label)}** · {len(COURSES)} môn

{courses}""",
    "skills": f"<table>{skill_rows}</table>",
    "experience": f"""<table>{"".join(exp(x) for x in P.get("experience", []))}</table>""",
}
sections = "\n\n".join(f'{pic("h-" + tag, num + " " + title)}\n\n{BODY[tag]}' for num, title, tag in HEADS)

readme = f'''<!-- Tệp này được GitHub Actions tự dựng từ dữ liệu portfolio. Đừng sửa tay: thay đổi sẽ bị ghi đè. -->

{pic("hero", P["name"] + " · " + P["role"])}

{e(P["bio"])}

{e(TX["experienceDesc"])}

**[Portfolio ↗]({SITE})** &nbsp;·&nbsp; **[Email ↗](mailto:{email})**

{pic("stats", " · ".join(f"{a}{b} {c}" for a, b, c in STATS))}

{sections}
'''
(ROOT / "README.md").write_text(readme, encoding="utf8")
print("OK", [p.name for p in sorted(OUT.iterdir())], "| README", len(readme), "| stats", STATS)
