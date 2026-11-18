// Prüft die Pfad-Umstellung für GitHub Pages (scripts/pages-base.mjs).
import assert from 'node:assert/strict';
import { rebase } from '../scripts/pages-base.mjs';
const b = '/hbp';
assert.equal(rebase('<a href="/club/">', b), '<a href="/hbp/club/">');
assert.equal(rebase('<img src="/fotos/a.jpg">', b), '<img src="/hbp/fotos/a.jpg">');
assert.equal(rebase('<a href="/">', b), '<a href="/hbp/">');
assert.equal(rebase('<a href="https://x.lu/">', b), '<a href="https://x.lu/">');
assert.equal(rebase('<a href="//cdn.x/a">', b), '<a href="//cdn.x/a">');
assert.equal(rebase("style=\"--bg:url('/fotos/b.jpg')\"", b), "style=\"--bg:url('/hbp/fotos/b.jpg')\"");
assert.equal(rebase('@font-face{src:url(/fonts/a.woff2)}', b), '@font-face{src:url(/hbp/fonts/a.woff2)}');
assert.equal(rebase('<a href="#x">', b), '<a href="#x">');
console.log('ok');
