/* HTML-Bausteine, die sowohl beim Bauen (Astro) als auch im Editor (Browser)
 * benutzt werden. So sieht eine im Admin geänderte Equipe genau so aus wie gebaut. */
import { UI, href, type Lang } from '../i18n/ui';

export interface Training { day: string; time: string; hall: string }
export interface Team {
  id: string; nr: string; group: 'seniors' | 'youth';
  name: Record<Lang, string>; league: string; years: string; coach: string;
  photo: string; page: string; training: Training[]; hidden?: boolean; /** Equipe-Bezeichnung in den FLH-Daten (z. B. „Hären“, „U13 Mixte“) */ flh?: string; /** FLH-Liga der laufenden Saison (für das Klassement, jede Saison anpassen) */ flhClass?: string;
}
export interface Partner { id: string; name: string; logo: string; url: string; tier: 'main' | 'partner'; hidden?: boolean; /** Logo hat selbst einen dunklen Grund */ dark?: boolean }
export interface NewsItem {
  id: string; title: string; date: string; path: string; image: string; excerpt: string;
  category: 'hb-péiteng' | 'flh' | 'archiv' | 'neu'; html?: string; hidden?: boolean; /** Jahr, wenn kein genaues Datum bekannt ist */ year?: string;
}

const e = (s: string) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const tr = (lang: Lang, k: string) => (UI[lang] as Record<string, string>)[k] ?? k;

/** Handball-Trikot (Raglan, kurze Ärmel), Rücken. viewBox 0 0 200 200. */
export const SHIRT_PATH =
  'M64 12 C80 24 120 24 136 12 L170 26 L192 60 L162 74 L158 190 C120 197 80 197 42 190 L38 74 L8 60 L30 26 Z';

/** Stoff mit Mesh, Kragenbündchen, Raglan- und Saumnähte (doppelt). #hbp-mesh steht einmal im Layout. */
export const shirtSvg = (cls = 'shirt-shape') => `<svg class="${cls}" viewBox="0 0 200 200" aria-hidden="true">
  <path class="cloth" d="${SHIRT_PATH}"/><path class="mesh" d="${SHIRT_PATH}"/>
  <path class="seam" d="M40 72 L65 14 M160 72 L135 14"/>
  <path class="seam" d="M44 181 C80 187 120 187 156 181 M44 185 C80 191 120 191 156 185"/>
  <path class="collar" d="M62 12 C80 26 120 26 138 12"/>
</svg>`;

/* data-bind="team:<id>:<feld>" usw.: Stellen, die der Admin direkt auf der Seite bearbeiten kann (gilt dann überall). */
const bind = (key: string, text: string, tag = 'span', attrs = '') => `<${tag} data-bind="${e(key)}"${attrs}>${e(text)}</${tag}>`;
const timeRows = (t: Team, lang: Lang) =>
  t.training
    .map((r, j) => `<li><span class="day">${e(tr(lang, 'day.' + r.day))}</span>${bind(`team:${t.id}:training.${j}.time`, r.time, 'span', ' class="time"')}${bind(`team:${t.id}:training.${j}.hall`, r.hall, 'span', ' class="hall"')}</li>`)
    .join('');
const metaLine = (t: Team) => [t.years ? bind(`team:${t.id}:years`, t.years) : '', t.league ? bind(`team:${t.id}:league`, t.league) : ''].filter(Boolean).join(' · ');

export function teamShirt(t: Team, lang: Lang): string {
  const name = t.name[lang] || t.name.lb;
  const back = name.replace(/\s*\+.*$/, '').toUpperCase();
  const rows = timeRows(t, lang);
  // Die Details stehen im Trikot (für Bildschirmleser und ohne JavaScript) und werden beim Antippen
  // als Bahn unter der Trikot-Reihe aufgeklappt.
  return `<article class="shirt" data-team="${e(t.id)}">
  <button class="shirt-turn" type="button" aria-expanded="false">
    <span class="sr">${e(tr(lang, 'teams.turn'))}: </span>
    ${shirtSvg()}
    <span class="shirt-back">
      <span class="shirt-name">${e(back)}</span>
      <span class="shirt-nr">${e(t.nr)}</span>
    </span>
  </button>
  <div class="shirt-info" hidden>
    <div class="info-head">${bind(`team:${t.id}:nr`, t.nr, 'span', ' class="info-nr"')}<div>${bind(`team:${t.id}:name`, name, 'h3')}${t.years || t.league ? `<p class="info-meta">${metaLine(t)}</p>` : ''}</div></div>
    <div class="info-cols">
      ${t.coach ? `<div><h4 data-edit="ui:teams.coach">${e(tr(lang, 'teams.coach'))}</h4>${bind(`team:${t.id}:coach`, t.coach, 'p')}</div>` : ''}
      ${rows ? `<div class="info-times"><h4>${e(tr(lang, 'label.title').split(' ')[0])}</h4><ul class="shirt-times">${rows}</ul></div>` : ''}
    </div>
    ${t.page ? `<a class="tag-btn is-small" href="${e(href(lang, t.page))}">${e(tr(lang, 'teams.page'))}</a>` : ''}
  </div>
</article>`;
}

/** Block „Trainer + Trainingszeiten“ oben auf den Mannschaftsseiten (und kompakt auf den Übersichten). */
export function teamPanel(t: Team, lang: Lang, compact = false): string {
  const name = t.name[lang] || t.name.lb;
  const rows = timeRows(t, lang);
  const nameEl = bind(`team:${t.id}:name`, name);
  const title = compact && t.page ? `<a href="${e(href(lang, t.page))}">${nameEl}</a>` : nameEl;
  return `<div class="team-panel${compact ? ' is-compact' : ''}" data-render="team-panel" data-team-id="${e(t.id)}">
  <div class="mini-shirt" aria-hidden="true">${shirtSvg('mini-svg')}${bind(`team:${t.id}:nr`, t.nr)}</div>
  <div>
    <h2>${title}</h2>
    ${t.years || t.league ? `<p class="team-meta">${metaLine(t)}</p>` : ''}
    ${t.coach ? `<p class="team-coach"><strong>${e(tr(lang, 'teams.coach'))}:</strong> ${bind(`team:${t.id}:coach`, t.coach)}</p>` : ''}
    ${rows ? `<h3 class="team-times-title">${e(tr(lang, 'label.title').split(' ')[0])}</h3><ul class="shirt-times">${rows}</ul>` : ''}
  </div>
</div>`;
}

/** Übersicht zum Auswählen (Seite „Equippen“): pro Mannschaft eine Karte mit Trikot, Name und Liga, ganz anklickbar. */
export function teamCards(teams: Team[], lang: Lang): string {
  const vis = teams.filter((t) => !t.hidden && t.page);
  const card = (t: Team) => `<li><a href="${e(href(lang, t.page))}"><span class="mini-shirt" aria-hidden="true">${shirtSvg('mini-svg')}<span>${e(t.nr)}</span></span>${bind(`team:${t.id}:name`, t.name[lang] || t.name.lb, 'span', ' class="tc-name"')}${t.league ? bind(`team:${t.id}:league`, t.league, 'span', ' class="tc-meta"') : t.years ? bind(`team:${t.id}:years`, t.years, 'span', ' class="tc-meta"') : ''}</a></li>`;
  return (['seniors', 'youth'] as const)
    .filter((g) => vis.some((t) => t.group === g))
    // Jugend von der ältesten zur jüngsten Mannschaft (U21 … U9)
    .map((g) => `<h2 class="tc-group" data-edit="ui:teams.${g}">${e(tr(lang, 'teams.' + g))}</h2><ul class="team-cards">${vis.filter((t) => t.group === g).sort((a, b) => (g === 'youth' ? Number(b.nr) - Number(a.nr) : 0)).map(card).join('')}</ul>`)
    .join('');
}

export function teamsGrid(teams: Team[], lang: Lang): string {
  const vis = teams.filter((t) => !t.hidden);
  const group = (g: Team['group']) => vis.filter((t) => t.group === g);
  return (['seniors', 'youth'] as const)
    .filter((g) => group(g).length)
    .map((g) => `<div class="shirt-rack"><h3 class="rack-title" data-edit="ui:teams.${g}">${e(tr(lang, 'teams.' + g))}</h3><div class="rack">${group(g).map((t) => teamShirt(t, lang)).join('')}</div></div>`)
    .join('');
}

/** Trainingszeiten aller Equippen (Startseite): pro Equipe Name und jede Einheit mit Tag + Uhrzeit. */
export function trainingCards(teams: Team[], lang: Lang): string {
  return teams
    .filter((t) => !t.hidden && t.training.length)
    .map((t) => {
      const name = bind(`team:${t.id}:name`, t.name[lang] || t.name.lb);
      const rows = t.training.map((r, j) => `<li><span>${e(tr(lang, 'day.' + r.day).slice(0, 2))}</span>${bind(`team:${t.id}:training.${j}.time`, r.time)}</li>`).join('');
      return `<li class="tcard"><h3>${t.page ? `<a href="${e(href(lang, t.page))}">${name}</a>` : name}</h3><ul>${rows}</ul></li>`;
    })
    .join('');
}

export function partnerPatches(partners: Partner[], tier?: Partner['tier']): string {
  return partners
    .filter((p) => !p.hidden && (!tier || p.tier === tier))
    .map((p) => {
      // nicht lazy: im laufenden Band und auf der Partnerwand sollen die Logos schon da sein, wenn sie ins Bild kommen
      const img = `<img src="${e(p.logo)}" alt="${e(p.name || 'Partner')}" decoding="async">`;
      const link = p.url ? `<a href="${e(p.url)}" target="_blank" rel="noopener" title="${e(p.name || p.url)}">${img}</a>` : img;
      return `<li class="print print-${p.tier}${p.dark ? ' is-dark' : ''}" data-partner="${e(p.id)}">${link}</li>`;
    })
    .join('');
}

const fmtDate = (iso: string, lang: Lang) => {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return isNaN(+d) ? '' : d.toLocaleDateString({ lb: 'lb-LU', fr: 'fr-LU', de: 'de-LU' }[lang], { day: 'numeric', month: 'long', year: 'numeric' });
};

const newsLink = (n: NewsItem, lang: Lang) => (n.path ? href(lang, n.path) : `${href(lang, '/noriichten-1/neu/')}#${encodeURIComponent(n.id)}`);

/** Karte für Übersichten: Bild, Titel, Datum. Kein Kasten. */
export function newsPatch(n: NewsItem, lang: Lang): string {
  return `<article class="news-card" data-news="${e(n.id)}">
  <div class="news-img">${n.image ? `<img src="${e(n.image)}" alt="" loading="lazy">` : '<span class="news-noimg" aria-hidden="true">HBP</span>'}</div>
  <h3><a href="${e(newsLink(n, lang))}">${bind(`news:${n.id}:title`, n.title)}</a></h3>
  ${n.date ? `<time datetime="${e(n.date)}">${e(fmtDate(n.date, lang))}</time>` : n.year ? `<time>${e(n.year)}</time>` : ''}
</article>`;
}

export function newsList(items: NewsItem[], lang: Lang, limit = 99): string {
  return items.filter((n) => !n.hidden).slice(0, limit).map((n) => newsPatch(n, lang)).join('');
}

/** Slideshow der Startseite: die neuesten Beiträge mit Foto. */
export function newsSlides(items: NewsItem[], lang: Lang, limit = 6): string {
  const more = tr(lang, 'news.more');
  return items
    .filter((n) => !n.hidden && n.image)
    .slice(0, limit)
    .map((n, i) => `<article class="slide" data-news="${e(n.id)}" aria-roledescription="slide" aria-label="${i + 1}">
  <div class="slide-img" style="--bg:url('${e(n.image)}')"><img src="${e(n.image)}" alt="" decoding="async"></div>
  <div class="slide-body">
    ${n.date ? `<time datetime="${e(n.date)}">${e(fmtDate(n.date, lang))}</time>` : ''}
    ${bind(`news:${n.id}:title`, n.title, 'h3')}
    ${n.excerpt ? bind(`news:${n.id}:excerpt`, n.excerpt, 'p') : ''}
    <a class="tag-btn is-yellow" href="${e(newsLink(n, lang))}"><span data-edit="ui:news.more">${e(more)}</span><span class="sr">: ${e(n.title)}</span></a>
  </div>
</article>`)
    .join('');
}
