"""Wandelt die gescrapten Jimdo-Seiten (hbpeiteng-basis/seiten/*.html) in saubere
Inhaltsdateien um: src/content/pages/<slug>.json mit {path, title, section, html}.

Aufruf: python3 -I scripts/import_pages.py hbpeiteng-basis src/content/pages

Was passiert:
- Jimdo-Module werden zu schlichtem HTML (h2/h3, p, figure, table, .gallery, .cols, a.btn, iframe).
- Fotos zeigen auf /fotos/<id>.jpg (verkleinert in public/fotos/).
- Von Cloudflare verschlüsselte E-Mail-Adressen werden entschlüsselt.
- Kontaktformular, Captcha, Cookie-Hinweise und javascript:-Links fallen weg.
"""
import html, json, re, sys
from html.parser import HTMLParser
from pathlib import Path

VOID = {"img", "br", "hr", "input", "meta", "link", "source", "col", "area", "wbr", "embed", "param"}
KEEP = {"p", "br", "strong", "b", "em", "i", "u", "a", "ul", "ol", "li", "h1", "h2", "h3", "h4",
        "table", "thead", "tbody", "tr", "td", "th", "img", "hr", "blockquote", "sup", "sub", "iframe"}
DROP = {"script", "style", "noscript", "form", "button", "input", "select", "textarea", "svg", "label"}


class Node:
    def __init__(self, tag, attrs, parent=None):
        self.tag, self.attrs, self.parent, self.kids = tag, dict(attrs), parent, []

    def cls(self):
        return self.attrs.get("class") or ""

    def walk(self):
        for k in self.kids:
            if isinstance(k, Node):
                yield k
                yield from k.walk()

    def find(self, pred):
        return next((n for n in self.walk() if pred(n)), None)

    def text(self):
        return "".join(k if isinstance(k, str) else k.text() for k in self.kids)


class Tree(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = self.cur = Node("root", {})

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs, self.cur)
        self.cur.kids.append(n)
        if tag not in VOID:
            self.cur = n

    def handle_startendtag(self, tag, attrs):
        self.cur.kids.append(Node(tag, attrs, self.cur))

    def handle_endtag(self, tag):
        n = self.cur
        while n is not self.root and n.tag != tag:
            n = n.parent
        if n is not self.root:
            self.cur = n.parent

    def handle_data(self, d):
        self.cur.kids.append(d)


def cfemail(hexstr):
    k = int(hexstr[:2], 16)
    return "".join(chr(int(hexstr[i:i + 2], 16) ^ k) for i in range(2, len(hexstr), 2))


def foto(src):
    m = re.search(r"fotos/(\w+)\.\w+", src or "")
    if not m:
        return None
    return f"/fotos/{m.group(1)}.{'png' if (ROOT / 'public/fotos' / (m.group(1) + '.png')).exists() else 'jpg'}"


def esc(s):
    return html.escape(s, quote=True)


def inline(node):
    """Whitelist-Serialisierung: unbekannte Tags werden ausgepackt."""
    out = []
    for k in node.kids:
        if isinstance(k, str):
            out.append(esc(k))
            continue
        t = k.tag
        if t in DROP:
            continue
        if "__cf_email__" in k.cls() or "data-cfemail" in k.attrs:
            mail = cfemail(k.attrs.get("data-cfemail", ""))
            out.append(f'<a href="mailto:{esc(mail)}">{esc(mail)}</a>')
            continue
        if t == "img":
            src = foto(k.attrs.get("src") or k.attrs.get("data-src"))
            if src:
                out.append(f'<img src="{src}" alt="{esc(k.attrs.get("alt") or "")}" loading="lazy">')
            continue
        if t == "iframe":
            src = k.attrs.get("src", "")
            if "vimeo" in src or "youtube" in src:
                out.append(f'<div class="video"><iframe src="{esc(src)}" loading="lazy" allowfullscreen title="Video"></iframe></div>')
            continue
        if t == "a":
            href = k.attrs.get("href", "")
            if "email-protection" in href:
                m = re.search(r"#([0-9a-f]+)", href)
                inner = inline(k)
                if m:
                    mail = cfemail(m.group(1))
                    out.append(f'<a href="mailto:{esc(mail)}">{inner}</a>')
                else:
                    out.append(inner)
                continue
            inner = inline(k)
            if not href or href.startswith("javascript") or "/app/" in href or "cookie" in href.lower():
                out.append(inner)
            elif inner.strip():
                href = re.sub(r"^https?://(www\.)?hbpeiteng\.com", "", href)
                ext = href.startswith("http")
                tgt = ' target="_blank" rel="noopener"' if ext else ""
                out.append(f'<a href="{esc(href)}"{tgt}>{inner}</a>')
            continue
        if t in KEEP:
            if t in VOID:
                out.append(f"<{t}>")
            else:
                tag = {"b": "strong", "i": "em", "h1": "h2"}.get(t, t)
                attrs = ""
                if t in ("td", "th") and k.attrs.get("colspan"):
                    attrs = f' colspan="{esc(k.attrs["colspan"])}"'
                out.append(f"<{tag}{attrs}>{inline(k)}</{tag}>")
        else:
            sep = "\n" if t in ("div", "span") and t == "div" else ""
            out.append(sep + inline(k) + sep)
    return "".join(out)


def tidy(s):
    s = re.sub(r"\xa0", " ", s)
    s = re.sub(r"<(strong|em|u|p|h2|h3|h4|li)>\s*</\1>", "", s)
    s = re.sub(r"(<br>\s*){3,}", "<br><br>", s)
    s = re.sub(r"<p>\s*(<br>\s*)*</p>", "", s)
    # Jimdo-Trennlinien aus Unterstrichen/Strichen
    s = re.sub(r"<p>(\s*<strong>)?\s*[_\-–=¨*~ ]{8,}\s*(</strong>\s*)?</p>", "<hr>", s)
    s = re.sub(r"(?m)^\s*[_\-–=¨~]{8,}\s*$", "<hr>", s)
    s = re.sub(r"<strong>\s*[_\-–=¨~]{8,}\s*</strong>", "<hr>", s)
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\s*(</?(?:p|h\d|div|table|thead|tbody|tr|td|th|ul|ol|li|figure|figcaption|hr|br)\b[^>]*>)\s*", r"\1", s)
    s = re.sub(r"(<br>)+(</(?:p|td|li|h\d)>)", r"\2", s)
    return s.strip()


def wrap_text(s):
    """Lose Textzeilen ohne Block-Tag in <p> packen."""
    s = s.strip()
    if not s:
        return ""
    if re.match(r"^<(p|h\d|ul|ol|table|div|hr|figure|blockquote)\b", s):
        return s
    parts = [p.strip() for p in re.split(r"\n+", s) if p.strip()]
    return "".join(p if re.match(r"^<(p|h\d|ul|ol|table|div|hr|figure)", p) else f"<p>{p}</p>" for p in parts)


def module(m):
    c = m.cls()
    if "j-spacing" in c or "j-facebook" in c or "j-formnew" in c or "j-form" in c:
        return ""
    if "j-hr" in c:
        return "<hr>"
    if "j-header" in c:
        h = m.find(lambda n: n.tag in ("h1", "h2", "h3", "h4"))
        lvl = {"h1": 2, "h2": 2, "h3": 3, "h4": 4}.get(h.tag if h else "h2", 2)
        return f"<h{lvl}>{esc((h or m).text().strip())}</h{lvl}>"
    if "j-gallery" in c:
        srcs = []
        for n in m.walk():
            if n.tag == "a" and n.attrs.get("data-href"):
                srcs.append(foto(n.attrs["data-href"]))
            elif n.tag == "img":
                srcs.append(foto(n.attrs.get("src") or n.attrs.get("data-src")))
        srcs = list(dict.fromkeys(s for s in srcs if s))
        return '<div class="gallery">' + "".join(f'<a href="{s}"><img src="{s}" alt="" loading="lazy"></a>' for s in srcs) + "</div>" if srcs else ""
    if "j-imageSubtitle" in c or "j-textWithImage" in c:
        img = m.find(lambda n: n.tag == "img")
        cap = m.find(lambda n: n.tag == "figcaption" or "cc-m-image-subtitle" in n.cls())
        link = m.find(lambda n: n.tag == "a" and n.attrs.get("href", "").startswith("http") and n.find(lambda x: x.tag == "img"))
        src = foto(img.attrs.get("src") or img.attrs.get("data-src")) if img else None
        fig = ""
        if src:
            im = f'<img src="{src}" alt="{esc(img.attrs.get("alt") or "")}" loading="lazy">'
            if link:
                im = f'<a href="{esc(link.attrs["href"])}" target="_blank" rel="noopener">{im}</a>'
            captxt = cap.text().strip() if cap else ""
            fig = f"<figure>{im}{f'<figcaption>{esc(captxt)}</figcaption>' if captxt else ''}</figure>"
        if "j-textWithImage" in c:
            txt = m.find(lambda n: "cc-m-textwithimage-inline-rte" in n.cls())
            body = wrap_text(tidy(inline(txt))) if txt else ""
            return f'<div class="text-image">{fig}<div>{body}</div></div>' if fig else body
        return fig
    if "j-hgrid" in c:
        cols = [n for n in m.walk() if "cc-m-hgrid-column" in n.cls()]
        inner = ["".join(module(x) for x in col.walk() if "j-module" in x.cls() and nearest_col(x) is col) for col in cols]
        inner = [i for i in inner if i.strip()]
        return f'<div class="cols cols-{len(inner)}">' + "".join(f"<div>{i}</div>" for i in inner) + "</div>" if inner else ""
    if "j-callToAction" in c:
        a = m.find(lambda n: n.tag == "a")
        if a and a.attrs.get("href") and not a.attrs["href"].startswith("javascript"):
            href = re.sub(r"^https?://(www\.)?hbpeiteng\.com", "", a.attrs["href"])
            return f'<p><a class="btn" href="{esc(href)}">{esc(a.text().strip())}</a></p>'
        return ""
    if "j-product" in c:
        img = m.find(lambda n: n.tag == "img")
        title = m.find(lambda n: "j-product__info__title" in n.cls() or n.tag in ("h3", "h4"))
        price = m.find(lambda n: "j-product__price" in n.cls() or "price" in n.cls())
        desc = m.find(lambda n: "j-product__info__description" in n.cls())
        src = foto(img.attrs.get("src")) if img else None
        return ('<div class="product">' + (f'<img src="{src}" alt="" loading="lazy">' if src else "")
                + f'<div><h3>{esc(title.text().strip()) if title else ""}</h3>'
                + (wrap_text(tidy(inline(desc))) if desc else "")
                + (f'<p class="price">{esc(" ".join(price.text().split()))}</p>' if price else "") + "</div></div>")
    if "j-googlemaps" in c or m.find(lambda n: n.tag == "iframe" and "google.com/maps" in n.attrs.get("src", "")):
        return ""
    return wrap_text(tidy(inline(m)))


def nearest_col(n):
    p = n.parent
    while p is not None and "cc-m-hgrid-column" not in p.cls():
        p = p.parent
    return p


def nearest_grid(n):
    p = n.parent
    while p is not None and "j-hgrid" not in p.cls():
        p = p.parent
    return p


def convert(src_html):
    body = src_html.split("</p>", 1)[1] if src_html.startswith("<!doctype") else src_html
    t = Tree()
    t.feed(body)
    mods = [n for n in t.root.walk() if "j-module" in n.cls() and nearest_grid(n) is None]
    # nur äußerste Module (keine Module in Modulen außer über hgrid)
    top = [m for m in mods if not any("j-module" in (p.cls()) for p in parents(m))]
    out = "\n".join(x for x in (module(m) for m in top) if x.strip())
    out = clean_tables(tidy(out))
    out = re.sub(r"(<hr>\s*){2,}", "<hr>", out)
    out = re.sub(r"^\s*<hr>|<hr>\s*$", "", out.strip())
    return tidy(out)


def clean_tables(s):
    """Leere Zeilen (z. B. nie ausgefüllte Spielpläne) entfernen; Tabellen ohne Inhalt fallen weg."""
    def table(m):
        rows = re.findall(r"<tr>.*?</tr>", m.group(0), re.S)
        full = [r for r in rows if re.sub(r"<[^>]+>|&nbsp;|\s", "", r)]
        if len(full) <= 1:
            return ""
        return "<table>" + "".join(full) + "</table>"
    return re.sub(r"<table>.*?</table>", table, s, flags=re.S)


def parents(n):
    p = n.parent
    while p is not None:
        yield p
        p = p.parent


SECTIONS = {"hären-i": "equippen", "aner-equippen": "equippen", "club": "club", "partner": "club",
            "shop": "club", "kontakt": "club", "noriichten-1": "noriichten", "wisi-cup": "wisi-cup",
            "media": "media", "events": "events", "": "start"}


def main():
    global ROOT
    base, out = Path(sys.argv[1]), Path(sys.argv[2])
    ROOT = base.parent if (base.parent / "public").exists() else Path(".")
    out.mkdir(parents=True, exist_ok=True)
    pages = json.loads((base / "seiten.json").read_text())
    for p in pages:
        raw = (base / p["datei"]).read_text()
        title = re.sub(r"\s*-\s*HB Péiteng\s*$", "", p["titel"]).strip(" *")
        path = p["pfad"]
        top = path.strip("/").split("/")[0]
        slug = path.strip("/").replace("/", "__") or "index"
        data = {"path": path, "title": title, "section": SECTIONS.get(top, "club"), "html": convert(raw)}
        (out / f"{slug}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1))
    print(f"{len(pages)} Seiten importiert nach {out}")


ROOT = Path(".")
if __name__ == "__main__":
    main()
