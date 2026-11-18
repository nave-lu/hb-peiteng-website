// Letzter Schritt vor dem Hochladen (npm run deploy):
// 1. iCloud-Doppel entfernen: Der Projektordner liegt auf dem synchronisierten Schreibtisch, iCloud legt in dist/
//    Kopien wie „index 3.html“ an. Gelöscht wird „name N.ext“ nur, wenn „name.ext“ daneben existiert.
// 2. Nur ohne eigene Domain (GitHub Pages unter /<repo>/): alle Wurzel-Pfade (href="/…", src="/…", url(/…))
//    mit dem Präfix versehen. Aufruf: node scripts/pages-base.mjs [/hb-peiteng-website]
// ponytail: Textersetzung statt Astro-`base`, weil Inhalte (importierte Seiten, Fotos) feste /-Pfade haben;
// mit eigener Domain entfällt Schritt 2 ganz.
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

import { rebase, rebaseJs } from '../src/lib/rebase.mjs';
export { rebase, rebaseJs };

/** „index 3.html“ → „index.html“, sonst null */
export const icloudOriginal = (path) => {
  const m = path.match(/^(.*) \d+(\.[^./]+)?$/);
  return m ? m[1] + (m[2] ?? '') : null;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  let dupes = 0;
  for (const f of walk('dist')) {
    const orig = icloudOriginal(f);
    if (orig && existsSync(orig)) { rmSync(f); dupes++; }
  }
  const base = (process.argv[2] || '').replace(/\/$/, '');
  let n = 0;
  if (base) {
    for (const f of walk('dist')) {
      if (!/\.(html|css|js)$/.test(f)) continue;
      const s = readFileSync(f, 'utf8');
      const out = f.endsWith('.js') ? rebaseJs(s, base) : rebase(s, base);
      if (out !== s) { writeFileSync(f, out); n++; }
    }
  }
  writeFileSync('dist/.nojekyll', ''); // sonst blendet GitHub Pages den Ordner _astro aus
  console.log(`${dupes} iCloud-Doppel entfernt` + (base ? `, ${n} Dateien auf ${base}/ umgestellt` : ''));
}
