"""Holt alle Seiten + Originalfotos von hbpeiteng.com (Jimdo) als Basis fürs Redesign.
Aufruf: python3 -I scrape.py <ausgabeordner>"""
import json, re, sys, html, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path

BASE = "https://www.hbpeiteng.com"
OUT = Path(sys.argv[1])
IMG_RE = re.compile(r"https://image\.jimcdn\.com/app/cms/image/transf/[^\"'\s,]*?/path/(sd\w+)/image/(\w+)/version/(\d+)/image\.(\w+)")
FILE_RE = re.compile(r"https://u\.jimcdn\.com/cms/o/sd\w+/downloads/[^\"'\s]+")
UA = {"User-Agent": "Mozilla/5.0 (site-archiver)"}


def get(url):
    req = urllib.request.Request(urllib.parse.quote(url, safe=":/?=&%#~+,;@"), headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def content_area(page, marker='id="content_area"'):
    """Inneres des divs mit `marker` per Tiefenzählung der divs."""
    start = page.find(marker)
    if start < 0:
        return ""
    start = page.find(">", start) + 1
    depth, i = 1, start
    for m in re.finditer(r"<(/?)div\b", page[start:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return page[start:start + m.start()]
    return page[start:]


class MD(HTMLParser):
    """Minimaler HTML->Markdown-Konverter für Text, Links, Bilder."""
    BLOCK = {"p", "div", "br", "li", "tr", "h1", "h2", "h3", "h4", "table", "ul", "ol"}

    def __init__(self):
        super().__init__(); self.out = []; self.skip = 0; self.href = None

    def handle_starttag(self, t, a):
        a = dict(a)
        if t in ("script", "style", "noscript"): self.skip += 1
        if self.skip: return
        if t in self.BLOCK: self.out.append("\n")
        if t in ("h1", "h2", "h3", "h4"): self.out.append("#" * int(t[1]) + " ")
        if t == "li": self.out.append("- ")
        if t in ("td", "th"): self.out.append(" | ")
        if t in ("strong", "b"): self.out.append("**")
        if t == "a": self.href = a.get("href"); self.out.append("[")
        if t == "img":
            src = a.get("src") or a.get("data-src") or ""
            if src and not src.startswith("data:"):
                self.out.append(f"\n![{a.get('alt') or ''}]({src})\n")

    def handle_endtag(self, t):
        if t in ("script", "style", "noscript"): self.skip -= 1; return
        if self.skip: return
        if t in ("strong", "b"): self.out.append("**")
        if t == "a": self.out.append(f"]({self.href})" if self.href else "]"); self.href = None
        if t in self.BLOCK: self.out.append("\n")

    def handle_data(self, d):
        if not self.skip: self.out.append(re.sub(r"\s+", " ", d))

    def text(self):
        s = "".join(self.out).replace("[]()", "").replace("****", "")
        s = re.sub(r"[ \t]+\n", "\n", s)
        return re.sub(r"\n{3,}", "\n\n", s).strip() + "\n"


def slug(path):
    p = urllib.parse.unquote(path).strip("/")
    return p or "startseite"


def main():
    (OUT / "fotos").mkdir(parents=True, exist_ok=True)
    (OUT / "seiten").mkdir(exist_ok=True)
    seen, queue, pages, images, files = set(), ["/"], [], {}, set()
    while queue:
        path = queue.pop(0)
        if path in seen: continue
        seen.add(path)
        try:
            raw = get(BASE + path).decode("utf-8", "replace")
        except Exception as e:
            print("FEHLER", path, e); continue
        for l in re.findall(r'href="(/[^"#?]*)"', raw):
            l = html.unescape(l)
            if not l.startswith(("/j/", "/app/", "//")) and l not in seen:
                queue.append(l)
        for m in IMG_RE.finditer(raw):
            images[m.group(2)] = m.groups()  # alle Bilder inkl. Logo/Header
        files.update(FILE_RE.findall(raw))
        body = content_area(raw)
        # Bild-URLs im Inhalt auf lokale Originale umbiegen
        local = lambda m: f"../fotos/{m.group(2)}.{m.group(4)}"
        body = re.sub(r'\s(srcset|sizes)="[^"]*"', "", body)
        body = IMG_RE.sub(local, body)
        title = html.unescape((re.search(r"<title>(.*?)</title>", raw, re.S) or [None, ""])[1]).strip()
        s = slug(path).replace("/", "__")
        md = MD(); md.feed(body)
        fotos = sorted(set(re.findall(r"\.\./fotos/\w+\.\w+", body)))
        liste = "\n".join(f"- ![]({f})" for f in fotos)
        (OUT / "seiten" / f"{s}.md").write_text(f"# {title}\n\nQuelle: {BASE}{urllib.parse.unquote(path)}\n\n{md.text()}\n## Alle Fotos dieser Seite ({len(fotos)})\n\n{liste}\n")
        if path == "/":  # Seitenleiste + Footer sind auf jeder Seite gleich
            for name, mk in (("seitenleiste", 'data-container="sidebar"'), ("footer", 'id="contentfooter"')):
                part = IMG_RE.sub(lambda m: f"fotos/{m.group(2)}.{m.group(4)}", content_area(raw, mk))
                m2 = MD(); m2.feed(part); (OUT / f"{name}.md").write_text(m2.text())
        (OUT / "seiten" / f"{s}.html").write_text(
            f'<!doctype html><meta charset="utf-8"><title>{html.escape(title)}</title>'
            f'<style>body{{font:16px/1.5 system-ui;max-width:1000px;margin:2em auto;padding:0 16px}}img{{max-width:100%;height:auto}}</style>'
            f'<p><a href="../index.html">← Übersicht</a> · Quelle: <a href="{BASE}{path}">{BASE}{urllib.parse.unquote(path)}</a></p>{body}')
        pages.append({"pfad": urllib.parse.unquote(path), "titel": title, "datei": f"seiten/{s}.html", "markdown": f"seiten/{s}.md"})
        print(f"[{len(pages)}] {urllib.parse.unquote(path)}")

    def dl(item):
        sd, iid, ver, ext = item
        dest = OUT / "fotos" / f"{iid}.{ext}"
        if not dest.exists():
            try: dest.write_bytes(get(f"https://image.jimcdn.com/app/cms/image/transf/none/path/{sd}/image/{iid}/version/{ver}/image.{ext}"))
            except Exception as e: print("FEHLER Bild", iid, e)
    with ThreadPoolExecutor(8) as ex: list(ex.map(dl, images.values()))

    if files:
        (OUT / "dateien").mkdir(exist_ok=True)
        for f in files:
            try: (OUT / "dateien" / urllib.parse.unquote(f.rsplit("/", 1)[-1])).write_bytes(get(html.unescape(f)))
            except Exception as e: print("FEHLER Datei", f, e)

    pages.sort(key=lambda p: p["pfad"])
    (OUT / "seiten.json").write_text(json.dumps(pages, ensure_ascii=False, indent=1))
    rows = "".join(f'<li><a href="{p["datei"]}">{html.escape(p["pfad"])}</a> — {html.escape(p["titel"])}</li>' for p in pages)
    (OUT / "index.html").write_text(
        f'<!doctype html><meta charset="utf-8"><title>HB Péiteng – Inhalte</title>'
        f'<style>body{{font:16px/1.5 system-ui;max-width:1000px;margin:2em auto;padding:0 16px}}</style>'
        f"<h1>HB Péiteng – alle Inhalte</h1><p>{len(pages)} Seiten · {len(images)} Fotos · {len(files)} Dateien</p><ul>{rows}</ul>")
    print(f"FERTIG: {len(pages)} Seiten, {len(images)} Fotos, {len(files)} Dateien")


if __name__ == "__main__":
    main()
