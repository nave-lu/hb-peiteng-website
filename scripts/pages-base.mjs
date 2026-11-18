// GitHub Pages liegt unter /<repo>/ statt im Wurzelverzeichnis: nach dem Bauen alle
// Wurzel-Pfade in dist/ (href="/…", src="/…", url(/…)) mit diesem Präfix versehen.
// Aufruf: node scripts/pages-base.mjs /hb-peiteng-website
// ponytail: Textersetzung statt Astro-`base`, weil Inhalte (importierte Seiten, Fotos) feste /-Pfade haben;
// mit eigener Domain entfällt dieser Schritt ganz.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

export const rebase = (s, b) =>
  s
    .replace(/(=\s*["'])\/(?!\/)/g, `$1${b}/`) // Attribute
    .replace(/url\((["']?)\/(?!\/)/g, `url($1${b}/`); // CSS und style="…url(/…)"

if (import.meta.url === `file://${process.argv[1]}`) {
  const base = (process.argv[2] || '').replace(/\/$/, '');
  if (!base.startsWith('/')) throw new Error('Pfad fehlt, z. B. /hb-peiteng-website');
  let n = 0;
  for (const f of walk('dist')) {
    if (!/\.(html|css)$/.test(f)) continue;
    const s = readFileSync(f, 'utf8');
    const out = rebase(s, base);
    if (out !== s) { writeFileSync(f, out); n++; }
  }
  writeFileSync('dist/.nojekyll', ''); // sonst blendet GitHub Pages den Ordner _astro aus
  console.log(`${n} Dateien auf ${base}/ umgestellt`);
}
