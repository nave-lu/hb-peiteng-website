"""Prüft die heiklen Teile des Imports: E-Mail-Entschlüsselung, leere Tabellen, Jimdo-Module.
Aufruf: python3 -I tests/test_import.py"""
import importlib.util, pathlib

spec = importlib.util.spec_from_file_location("imp", pathlib.Path(__file__).parent.parent / "scripts/import_pages.py")
imp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(imp)

# Cloudflare-verschlüsselte Adresse aus der alten Organigramme-Seite
assert imp.cfemail("97e7e5f2e4fef3f2f9e3d7fff5e7f2fee3f2f9f0b9f4f8fa") == "president@hbpeiteng.com"

# leere Spielplan-Zeilen fallen weg, Tabelle mit nur Kopfzeile verschwindet ganz
t = "<table><tr><td>Deeg</td></tr><tr><td>Méindeg</td></tr><tr><td> </td></tr></table>"
assert imp.clean_tables(t) == "<table><tr><td>Deeg</td></tr><tr><td>Méindeg</td></tr></table>"
assert imp.clean_tables("<table><tr><td>Spilldag</td></tr><tr><td></td></tr></table>") == ""

# Jimdo-Module: Überschrift, Text mit javascript-Link, Trennlinie, Galerie
html = ('<div class="j-module n j-header "><h2>KADER</h2></div>'
        '<div class="j-module n j-text "><p>Komm <a href="javascript:;">op den</a> <b>Training</b></p></div>'
        '<div class="j-module n j-hr "><hr></div>'
        '<div class="j-module n j-gallery "><a data-href="../fotos/iabc.jpg"><img src="../fotos/iabc.jpg"></a></div>')
out = imp.convert(html)
assert out.startswith("<h2>KADER</h2><p>Komm op den <strong>Training</strong></p><hr>"), out
assert '<div class="gallery"><a href="/fotos/iabc.jpg">' in out, out
print("ok")
