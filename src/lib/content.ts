/* Alle übernommenen Seiten, Navigation und Neuigkeiten. Nur beim Bauen benutzt. */
import teamsData from '../data/teams.json';
import partnersData from '../data/partners.json';
import newsData from '../data/news.json';
import type { NewsItem, Partner, Team } from './render';
import type { Key, Lang } from '../i18n/ui';

export interface Page { path: string; title: string; section: string; html: string }

/** Adressen natürlich sortieren: U9 vor U11 vor U13 (Zahlen nach Wert, nicht nach Buchstaben). */
const collator = new Intl.Collator('lb', { numeric: true, sensitivity: 'base' });
const byPath = (a: string, b: string) => collator.compare(a, b);

const files = import.meta.glob<Page>('../content/pages/*.json', { eager: true, import: 'default' });
const imported: Page[] = Object.values(files);
/* Rubrik „Archiv“ hatte auf der alten Seite keine eigene Übersicht; sie erscheint trotzdem im Menü. */
/* Neue Beiträge (src/data/news.json) bekommen eine eigene Seite. */
const posts: Page[] = (newsData as NewsItem[]).filter((n) => n.path && n.html).map((n) => ({ path: n.path, title: n.title, section: 'noriichten', html: n.html! }));
export const pages: Page[] = [...imported, ...posts, { path: '/noriichten-1/archiv/', title: 'Archiv', section: 'noriichten', html: '' }].sort((a, b) => byPath(a.path, b.path));
export const teams = teamsData as Team[];
export const partners = partnersData as Partner[];

/** Hauptnavigation: Rubrik → Startseite der Rubrik + alle Seiten darunter. */
export const NAV: { key: Key; path: string; prefixes: string[] }[] = [
  { key: 'nav.teams', path: '/aner-equippen/', prefixes: ['/hären-i/', '/aner-equippen/'] },
  { key: 'nav.news', path: '/noriichten-1/', prefixes: ['/noriichten-1/'] },
  { key: 'nav.club', path: '/club/', prefixes: ['/club/', '/partner/', '/shop/', '/kontakt/'] },
  { key: 'nav.wisicup', path: '/wisi-cup/', prefixes: ['/wisi-cup/'] },
  { key: 'nav.media', path: '/media/', prefixes: ['/media/'] },
  { key: 'nav.events', path: '/events/', prefixes: ['/events/'] },
];

/** Seiten, die im Menü nicht erscheinen (Inhalt fehlt oder ist kaputt), Adresse bleibt erreichbar. */
const HIDDEN = new Set(['/noriichten-1/archiv/international/', '/club/medico/', '/noriichten-1/neu/', '/aner-equippen/']);

export const sectionOf = (path: string) => NAV.find((n) => n.prefixes.some((p) => path.startsWith(p)));

/** Unterseiten einer Rubrik als Baum (Tiefe aus der Adresse). */
export function sectionTree(path: string) {
  const sec = sectionOf(path);
  if (!sec) return [];
  // Reihenfolge der Bereiche wie in NAV (z. B. erst Hären I, dann die übrigen Equippen), darin natürlich sortiert
  return sec.prefixes
    .flatMap((pre) => pages.filter((p) => p.path.startsWith(pre)))
    .filter((p) => !HIDDEN.has(p.path))
    .filter((p) => !p.path.startsWith('/noriichten-1/') || p.path.split('/').filter(Boolean).length <= 2)
    .map((p) => ({ ...p, depth: p.path.split('/').filter(Boolean).length - 1 }));
}

/** Menü: pro Rubrik nur die Haupt- und direkten Unterseiten (Tiefe 0–1). */
export function menuLinks(n: (typeof NAV)[number], lang: Lang) {
  // Equippen: nur die Mannschaften selbst (Hären I führt auf seine Hauptseite, nicht auf die Trainingszeiten)
  if (n.key === 'nav.teams') return teams.filter((x) => !x.hidden && x.page).map((x) => ({ path: x.page, title: x.name[lang] || x.name.lb, depth: 0 }));
  return sectionTree(n.path).filter((p) => p.depth <= 1);
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

/** Datum eines alten Beitrags; steht im Titel ein Jahr, gilt dieses (alte Seite hatte Tippfehler wie „Niklosmaart 2019“ vom 03.12.2020). */
function dateFor(p: Page): string {
  const d = findDate(p.title) || findDate(plain(p.html).slice(0, 400));
  const y = p.title.match(/\b(20[12]\d)\b/)?.[1];
  return d && y && d.slice(0, 4) !== y ? `${y}${d.slice(4)}` : d;
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
        date: dateFor(p),
        year: archiveYear(p),
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

/** Welche Mannschaft(en) gehören zu einer Seite? Eigene Seite → eine; Übersichten → mehrere. */
const EXTRA_TEAM_PAGES: Record<string, string> = { '/hären-i/kader/': 'haeren-1', '/hären-i/trainingszäiten/': 'haeren-1' };
export function teamsForPage(path: string): { team?: Team; list: Team[] } {
  const vis = teams.filter((t) => !t.hidden);
  const id = EXTRA_TEAM_PAGES[path];
  const team = vis.find((t) => t.page === path || t.id === id);
  if (team) return { team, list: [] };
  if (path === '/aner-equippen/jugend/') return { list: vis.filter((t) => t.group === 'youth') };
  // Übersicht aller Mannschaften (Menüpunkt „Equippen“): alle zum Auswählen
  if (path === '/aner-equippen/') return { list: vis };
  return { list: [] };
}

/** Mannschaftsseite aufräumen: Trainer/Trainingszeiten stehen im Block oben (aus den Team-Daten),
 *  alte Fotos wandern ans Ende unter „Fotoen“. Text, Spielpläne und Resultate bleiben. */
export function teamPageHtml(html: string, photosTitle: string): string {
  let h = html.replace(/<table>(?:(?!<\/table>).)*?(Deeg|Wéini|Weini)(?:(?!<\/table>).)*?<\/table>/s, '');
  // Spielpläne von Hand (Heemequipe/Gaascht) ersetzt der Live-Block der FLH
  h = h.replace(/<table>(?:(?!<\/table>).)*?(Heemequipe|Gaascht)(?:(?!<\/table>).)*?<\/table>/gs, '');
  // Einleitungszeilen vor dem ersten Inhalt (Saison, Name, Jahrgänge) stehen schon im Block oben
  h = h.replace(/^(?:\s*(?:<hr>|<p>(?:(?!<\/p>).){0,160}<\/p>))+/s, '');
  const photos: string[] = [];
  h = h.replace(/<figure>.*?<\/figure>|<div class="gallery">.*?<\/div>/gs, (m) => { photos.push(m); return ''; });
  h = h
    .replace(/<p>(?:<strong>)?\s*(Trainer|Traineren|Responsabelen)\s*:.*?<\/p>/gis, '')
    .replace(/<p>(?:<strong>)?\s*Trainingszäiten[\s\S]{0,60}?<\/p>/gi, '')
    .replace(/<p>(?:<(strong|em)>|<br>|\s)*(?:<\/(strong|em)>|\s)*<\/p>/g, '')
    .replace(/<div class="cols cols-\d+">(?:<div>\s*<\/div>)*<\/div>/g, '')
    // Überschrift eines Spielplans ohne Spiele (die leere Tabelle ist schon beim Import weggefallen)
    .replace(/<p>(?:<strong>|\s)*(ALLER\s*-\s*RETOUR|PLAY\s*-\s*OFF|Championnat|PROMOTION|Spilldag)(?:(?!<\/p>).){0,120}<\/p>(?!\s*<table>)/gi, '')
    .replace(/(<hr>\s*)+/g, '<hr>')
    .replace(/^\s*<hr>|<hr>\s*$/g, '');
  if (photos.length) h += `<h2 class="photos-title">${photosTitle}</h2><div class="team-photos">${photos.join('')}</div>`;
  return h;
}

/** Archiv-Hinweis: Jahr eines alten Inhalts (Titel, Adresse oder Textanfang), sonst leer.
 *  Aktuelle Seiten (Mannschaften, Club, neue Beiträge) bekommen keinen. */
export function archiveYear(p: Page): string {
  if (!isArchive(p)) return '';
  const src = `${p.title} ${decodeURIComponent(p.path)} ${plain(p.html).slice(0, 1500)}`;
  const years = [...src.matchAll(/\b(20[12]\d)\b/g)].map((m) => +m[1]).filter((y) => y <= 2025);
  const short = [...`${p.title} ${p.path}`.matchAll(/\d{1,2}[.-]\d{1,2}[.-](1\d|2[0-5])\b/g)].map((m) => 2000 + +m[1]);
  const all = [...years, ...short];
  return all.length ? String(Math.max(...all)) : '';
}

/** Zeitraum einer Sammelseite (z. B. Coupe-Resultate mehrerer Saisons): „2017 – 2025“. */
export function archiveRange(p: Page): string {
  const ys = [...plain(p.html).matchAll(/\b(20[12]\d)\b/g)].map((m) => +m[1]).filter((y) => y <= 2025);
  if (!ys.length) return '';
  const lo = Math.min(...ys), hi = Math.max(...ys);
  return lo === hi ? String(hi) : `${lo} – ${hi}`;
}

/** Gehört die Seite zum Archiv der alten Website? (Übersichten der Rubriken und neue Beiträge nicht) */
export function isArchive(p: Page): boolean {
  // als Funktion-Konstante, weil die Neuigkeiten-Liste weiter oben schon beim Laden des Moduls fragt
  const ARCHIVE_SECTIONS = ['/wisi-cup/', '/media/', '/noriichten-1/', '/hären-i/resultater/coupe/', '/hären-i/resultater/statistik/'];
  const cat = /^\/noriichten-1\/[^/]+\/$/.test(p.path) || p.path === '/noriichten-1/';
  return ARCHIVE_SECTIONS.some((s) => p.path.startsWith(s)) && !posts.some((x) => x.path === p.path) && !cat && p.path !== '/wisi-cup/';
}

/** Archiv von Hären I (Knopf unten auf der Seite): alte Unterseiten, Coupe-Saison 2018 und alte Meldungen.
 *  Nationalmannschaften und gemeinsame Hären/Dammen-Meldungen gehören nicht dazu. */
export function haerenArchive() {
  const year = (p: Page) => archiveYear(p) || archiveRange(p);
  const newestFirst = (a: Page, b: Page) => year(b).slice(-4).localeCompare(year(a).slice(-4)) || a.title.localeCompare(b.title, 'de');
  const outside = pages.filter((p) => !p.path.startsWith('/hären-i/') && !HIDDEN.has(p.path));
  const cup = outside.filter((p) => /coupe|final/i.test(p.path));
  const news = outside.filter((p) => !cup.includes(p) && /hären-1|hären-i\b|virstellung-hären|neien-hären|radek|merchweiler/i.test(decodeURIComponent(p.path)));
  return [
    { key: 'archive.team' as const, items: pages.filter((p) => p.path.startsWith('/hären-i/') && p.path !== '/hären-i/') },
    { key: 'archive.cup' as const, items: cup.sort(newestFirst) },
    { key: 'nav.news' as const, items: news.sort(newestFirst) },
  ].map((g) => ({ ...g, items: g.items.map((p) => ({
    path: p.path, title: p.title, depth: p.path.split('/').filter(Boolean).length,
    // Mannschaftsseiten zeigen den ganzen Zeitraum, alles andere das Jahr
    year: g.key === 'archive.team' ? archiveRange(p) : year(p),
    kind: (p.path.match(/^\/media\/(fotoen|press|video)\//)?.[1] ?? '') as '' | 'fotoen' | 'press' | 'video',
  })) }));
}

/** Unterseiten einer Seite (eine Ebene tiefer), für Übersichten ohne eigenen Inhalt. */
export function childPages(path: string): Page[] {
  const depth = path.split('/').filter(Boolean).length + 1;
  return pages.filter((p) => p.path.startsWith(path) && p.path !== path && p.path.split('/').filter(Boolean).length === depth && !HIDDEN.has(p.path));
}
