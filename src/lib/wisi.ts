/* Wisi-Cup: alles auf einer Seite statt drei Klicks. Der letzte Turnier war 2019 (2020 abgesagt),
 * das steht groß oben, damit niemand alte Infos für aktuell hält. */
import { t, href, type Lang } from '../i18n/ui';
import { pages } from './content';

const e = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const byPath = (p: string) => pages.find((x) => x.path === p);

export function wisiCupHtml(lang: Lang, path: string): string {
  // Infos in der Sprache der Seite (LB liest Deutsch), sonst Französisch
  const info = byPath(lang === 'fr' ? '/wisi-cup/20-wisi-cup-2019/info-français/' : '/wisi-cup/20-wisi-cup-2019/info-deutsch/');
  const banner = `<div class="wisi-banner">
  <p class="wisi-banner-label">${e(t(lang, 'wisi.lastLabel'))}</p>
  <p class="wisi-banner-year">2019</p>
  <p class="wisi-banner-text">${e(t(lang, 'wisi.last'))}</p>
  <p class="wisi-banner-note">${e(t(lang, 'wisi.cancel'))}</p>
</div>`;

  const editions = pages
    .filter((p) => p.path.startsWith('/wisi-cup/') && p.path !== '/wisi-cup/' && p.path !== path)
    .map((p) => ({ p, y: (p.title.match(/20[12]\d/) ?? decodeURIComponent(p.path).match(/20[12]\d/) ?? ['2019'])[0] }))
    .reduce((m, x) => m.set(x.y, [...(m.get(x.y) ?? []), x.p]), new Map<string, typeof pages>());
  const list = path === '/wisi-cup/'
    ? `<h2>${e(t(lang, 'wisi.editions'))}</h2><div class="wisi-editions">${[...editions]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([y, ps]) => `<section><h3>${y}${y === '2020' ? ` <small>${e(t(lang, 'wisi.cancelled'))}</small>` : ''}</h3><ul>${ps
          .map((p) => `<li><a href="${e(href(lang, p.path))}">${e(p.title)}</a></li>`).join('')}</ul></section>`)
        .join('')}</div>`
    : '';

  return `${banner}${info ? `<h2>${e(t(lang, 'wisi.info'))}</h2><div class="wisi-info">${info.html}</div>` : ''}${list}`;
}
