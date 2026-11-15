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

export function teamShirt(t: Team, lang: Lang): string {
  const name = t.name[lang] || t.name.lb;
  const back = name.replace(/\s*\+.*$/, '').toUpperCase();
  const rows = t.training
    .map((r) => `<li><span class="day">${e(tr(lang, 'day.' + r.day))}</span><span class="time">${e(r.time)}</span><span class="hall">${e(r.hall)}</span></li>`)
    .join('');
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
    <div class="info-head"><span class="info-nr" aria-hidden="true">${e(t.nr)}</span><div><h3>${e(name)}</h3>${t.years || t.league ? `<p class="info-meta">${e([t.years, t.league].filter(Boolean).join(' · '))}</p>` : ''}</div></div>
    <div class="info-cols">
      ${t.coach ? `<div><h4>${e(tr(lang, 'teams.coach'))}</h4><p>${e(t.coach)}</p></div>` : ''}
      ${rows ? `<div class="info-times"><h4>${e(tr(lang, 'label.title').split(' ')[0])}</h4><ul class="shirt-times">${rows}</ul></div>` : ''}
    </div>
    ${t.page ? `<a class="tag-btn is-small" href="${e(href(lang, t.page))}">${e(tr(lang, 'teams.page'))}</a>` : ''}
  </div>
</article>`;
}

/** Block „Trainer + Trainingszeiten“ oben auf den Mannschaftsseiten (und kompakt auf den Übersichten). */
export function teamPanel(t: Team, lang: Lang, compact = false): string {
  const name = t.name[lang] || t.name.lb;
  const rows = t.training
    .map((r) => `<li><span class="day">${e(tr(lang, 'day.' + r.day))}</span><span class="time">${e(r.time)}</span><span class="hall">${e(r.hall)}</span></li>`)
    .join('');
  const title = compact && t.page ? `<a href="${e(href(lang, t.page))}">${e(name)}</a>` : e(name);
  return `<div class="team-panel${compact ? ' is-compact' : ''}" data-render="team-panel" data-team-id="${e(t.id)}">
  <div class="mini-shirt" aria-hidden="true">${shirtSvg('mini-svg')}<span>${e(t.nr)}</span></div>
  <div>
    <h2>${title}</h2>
    ${t.years || t.league ? `<p class="team-meta">${e([t.years, t.league].filter(Boolean).join(' · '))}</p>` : ''}
    ${t.coach ? `<p class="team-coach"><strong>${e(tr(lang, 'teams.coach'))}:</strong> ${e(t.coach)}</p>` : ''}
    ${rows ? `<h3 class="team-times-title">${e(tr(lang, 'label.title').split(' ')[0])}</h3><ul class="shirt-times">${rows}</ul>` : ''}
  </div>
</div>`;
}

export function teamsGrid(teams: Team[], lang: Lang): string {
  const vis = teams.filter((t) => !t.hidden);
  const group = (g: Team['group']) => vis.filter((t) => t.group === g);
  return (['seniors', 'youth'] as const)
    .filter((g) => group(g).length)
    .map((g) => `<div class="shirt-rack"><h3 class="rack-title">${e(tr(lang, 'teams.' + g))}</h3><div class="rack">${group(g).map((t) => teamShirt(t, lang)).join('')}</div></div>`)
    .join('');
}

/** Trainingszeiten der Jugend als eingenähtes Etikett (Startseite). */
export function youthLabel(teams: Team[], lang: Lang): string {
  return teams
    .filter((t) => t.group === 'youth' && !t.hidden && t.training.length && Number(t.nr) <= 15)
    .map((t) => {
      const days = t.training.map((r) => tr(lang, 'day.' + r.day).slice(0, 2)).join(' · ');
      const inner = `<span class="lbl-team">${e((t.name[lang] || t.name.lb).replace(/\s*\(.*/, ''))}</span><span class="lbl-days">${e(days)}</span><span class="lbl-time">${e(t.training[0].time)}</span>`;
      return `<li>${t.page ? `<a href="${e(href(lang, t.page))}">${inner}<svg class="lbl-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 4l6 6-6 6"/></svg></a>` : inner}</li>`;
    })
    .join('');
}

export function partnerPatches(partners: Partner[], tier?: Partner['tier']): string {
  return partners
    .filter((p) => !p.hidden && (!tier || p.tier === tier))
    .map((p) => {
      const img = `<img src="${e(p.logo)}" alt="${e(p.name || 'Partner')}" loading="lazy">`;
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
  <h3><a href="${e(newsLink(n, lang))}">${e(n.title)}</a></h3>
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
  <div class="slide-img" style="--bg:url('${e(n.image)}')"><img src="${e(n.image)}" alt="" ${i ? 'loading="lazy"' : ''}></div>
  <div class="slide-body">
    ${n.date ? `<time datetime="${e(n.date)}">${e(fmtDate(n.date, lang))}</time>` : ''}
    <h3>${e(n.title)}</h3>
    ${n.excerpt ? `<p>${e(n.excerpt)}</p>` : ''}
    <a class="tag-btn is-yellow" href="${e(newsLink(n, lang))}">${e(more)}<span class="sr">: ${e(n.title)}</span></a>
  </div>
</article>`)
    .join('');
}
