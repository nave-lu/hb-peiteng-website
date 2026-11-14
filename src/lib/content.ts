/* Alle übernommenen Seiten, Navigation und Neuigkeiten. Nur beim Bauen benutzt. */
import teamsData from '../data/teams.json';
import partnersData from '../data/partners.json';
import newsData from '../data/news.json';
import type { NewsItem, Partner, Team } from './render';
import type { Key } from '../i18n/ui';

export interface Page { path: string; title: string; section: string; html: string }

const files = import.meta.glob<Page>('../content/pages/*.json', { eager: true, import: 'default' });
const imported: Page[] = Object.values(files);
/* Rubrik „Archiv“ hatte auf der alten Seite keine eigene Übersicht; sie erscheint trotzdem im Menü. */
/* Neue Beiträge (src/data/news.json) bekommen eine eigene Seite. */
const posts: Page[] = (newsData as NewsItem[]).filter((n) => n.path && n.html).map((n) => ({ path: n.path, title: n.title, section: 'noriichten', html: n.html! }));
export const pages: Page[] = [...imported, ...posts, { path: '/noriichten-1/archiv/', title: 'Archiv', section: 'noriichten', html: '' }].sort((a, b) => a.path.localeCompare(b.path, 'lb'));
export const teams = teamsData as Team[];
export const partners = partnersData as Partner[];

/** Hauptnavigation: Rubrik → Startseite der Rubrik + alle Seiten darunter. */
export const NAV: { key: Key; path: string; prefixes: string[] }[] = [
  { key: 'nav.teams', path: '/hären-i/', prefixes: ['/hären-i/', '/aner-equippen/'] },
  { key: 'nav.news', path: '/noriichten-1/', prefixes: ['/noriichten-1/'] },
  { key: 'nav.club', path: '/club/', prefixes: ['/club/', '/partner/', '/shop/', '/kontakt/'] },
  { key: 'nav.wisicup', path: '/wisi-cup/', prefixes: ['/wisi-cup/'] },
  { key: 'nav.media', path: '/media/', prefixes: ['/media/'] },
  { key: 'nav.events', path: '/events/', prefixes: ['/events/'] },
];

export const sectionOf = (path: string) => NAV.find((n) => n.prefixes.some((p) => path.startsWith(p)));

/** Unterseiten einer Rubrik als Baum (Tiefe aus der Adresse). */
export function sectionTree(path: string) {
  const sec = sectionOf(path);
  if (!sec) return [];
  return pages
    .filter((p) => sec.prefixes.some((pre) => p.path.startsWith(pre)))
    .filter((p) => !p.path.startsWith('/noriichten-1/') || p.path.split('/').filter(Boolean).length <= 2)
    .map((p) => ({ ...p, depth: p.path.split('/').filter(Boolean).length - 1 }));
}

const DATE = /(\d{1,2})\.(\d{1,2})\.(\d{2,4})/;
function findDate(s: string): string {
  const m = s.match(DATE);
  if (!m) return '';
  let [, d, mo, y] = m;
  if (y.length === 2) y = '20' + y;
  const iso = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  return isNaN(+new Date(iso)) ? '' : iso;
}

const plain = (html: string) =>
  html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, (m) => ({ '&amp;': '&', '&quot;': '"', '&#x27;': "'", '&#39;': "'", '&lt;': '<', '&gt;': '>' })[m] ?? ' ').replace(/\s+/g, ' ').trim();

const excerpt = (html: string) => {
  // Datum am Anfang steht schon unter dem Titel
  const s = plain(html).replace(/^\d{1,2}\.\d{1,2}\.\d{2,4}\s*/, '');
  return s.length > 160 ? s.slice(0, 157).replace(/\s\S*$/, '') + ' …' : s;
};

/** Artikel = Seiten unter /noriichten-1/<rubrik>/<artikel>/; neue Beiträge kommen aus src/data/news.json. */
export const news: NewsItem[] = [
  ...(newsData as NewsItem[]),
  ...pages
    .filter((p) => p.path.startsWith('/noriichten-1/') && p.path.split('/').filter(Boolean).length === 3 && !posts.includes(p))
    .map((p) => {
      const cat = p.path.split('/')[2] as NewsItem['category'];
      return {
        id: p.path.split('/').filter(Boolean).pop()!,
        title: p.title,
        date: findDate(p.title) || findDate(plain(p.html).slice(0, 400)),
        path: p.path,
        image: p.html.match(/<img src="([^"]+)"/)?.[1] ?? '',
        excerpt: excerpt(p.html),
        category: cat,
      };
    })
    .sort((a, b) => (a.category === 'archiv' ? 1 : 0) - (b.category === 'archiv' ? 1 : 0) || b.date.localeCompare(a.date)),
];

export const plainText = plain;
export const pageExcerpt = excerpt;
