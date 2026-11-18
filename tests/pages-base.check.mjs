// Prüft die Pfad-Umstellung für GitHub Pages (scripts/pages-base.mjs).
import assert from 'node:assert/strict';
import { rebase, icloudOriginal } from '../scripts/pages-base.mjs';
const b = '/hbp';
assert.equal(rebase('<a href="/club/">', b), '<a href="/hbp/club/">');
assert.equal(rebase('<img src="/fotos/a.jpg">', b), '<img src="/hbp/fotos/a.jpg">');
assert.equal(rebase('<a href="/">', b), '<a href="/hbp/">');
assert.equal(rebase('<a href="https://x.lu/">', b), '<a href="https://x.lu/">');
assert.equal(rebase('<a href="//cdn.x/a">', b), '<a href="//cdn.x/a">');
assert.equal(rebase("style=\"--bg:url('/fotos/b.jpg')\"", b), "style=\"--bg:url('/hbp/fotos/b.jpg')\"");
assert.equal(rebase('@font-face{src:url(/fonts/a.woff2)}', b), '@font-face{src:url(/hbp/fonts/a.woff2)}');
assert.equal(rebase('<a href="#x">', b), '<a href="#x">');
assert.equal(icloudOriginal('dist/noriichten-1/index 3.html'), 'dist/noriichten-1/index.html');
assert.equal(icloudOriginal('dist/fotos/i0104 2.jpg'), 'dist/fotos/i0104.jpg');
assert.equal(icloudOriginal('dist/dateien/Fiche 2025-2026.jpg'), null);
assert.equal(icloudOriginal('dist/dateien/Anmeldeformular 20. WISI 2019.pdf'), 'dist/dateien/Anmeldeformular 20. WISI.pdf'); // existiert nicht -> bleibt
console.log('ok');
