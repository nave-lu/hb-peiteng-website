/* HTML-Bausteine, die sowohl beim Bauen (Astro) als auch im Editor (Browser)
 * benutzt werden. So sieht eine im Admin geänderte Equipe genau so aus wie gebaut. */
import { UI, href, type Lang } from '../i18n/ui';

export interface Training { day: string; time: string; hall: string }
export interface Team {
  id: string; nr: string; group: 'seniors' | 'youth';
  name: Record<Lang, string>; league: string; years: string; coach: string;
  photo: string; page: string; training: Training[]; hidden?: boolean;
}
export interface Partner { id: string; name: string; logo: string; url: string; tier: 'main' | 'partner'; hidden?: boolean }
export interface NewsItem {
  id: string; title: string; date: string; path: string; image: string; excerpt: string;
  category: 'hb-péiteng' | 'flh' | 'archiv' | 'neu'; html?: string; hidden?: boolean;
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

/** Brustseite: Schulterpartie mit V-Ausschnitt; darunter der bedruckte Stoff. */
const YOKE = `<svg class="front-yoke" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
  <path class="cloth" d="M0 40 L0 28 L26 6 L72 0 L100 30 L128 0 L174 6 L200 28 L200 40 Z"/><path class="mesh" d="M0 40 L0 28 L26 6 L72 0 L100 30 L128 0 L174 6 L200 28 L200 40 Z"/>
  <path class="collar" d="M70 0 L100 32 L130 0"/>
</svg>`;

export function teamShirt(t: Team, lang: Lang): string {
  const name = t.name[lang] || t.name.lb;
  const back = name.replace(/\s*\+.*$/, '').toUpperCase();
  const rows = t.training
    .map((r) => `<li><span class="day">${e(tr(lang, 'day.' + r.day))}</span><span class="time">${e(r.time)}</span><span class="hall">${e(r.hall)}</span></li>`)
    .join('');
  return `<article class="shirt" data-team="${e(t.id)}">
  <div class="shirt-inner">
    <button class="shirt-turn" type="button" aria-expanded="false" aria-controls="shirt-${e(t.id)}-front">
      <span class="sr">${e(tr(lang, 'teams.turn'))}: </span>
      ${shirtSvg()}
      <span class="shirt-back">
        <span class="shirt-name">${e(back)}</span>
        <span class="shirt-nr">${e(t.nr)}</span>
      </span>
    </button>
    <div class="shirt-front" id="shirt-${e(t.id)}-front">
      ${YOKE}
      <div class="front-body">
        <div class="front-top"><img class="crest" src="/brand/hbp-logo.jpg" alt="" width="36" height="36"><h3>${e(name)}</h3></div>
        ${t.years || t.league ? `<p class="shirt-meta">${e([t.years, t.league].filter(Boolean).join(' · '))}</p>` : ''}
        ${t.coach ? `<p class="shirt-coach"><span>${e(tr(lang, 'teams.coach'))}</span> ${e(t.coach)}</p>` : ''}
        ${rows ? `<ul class="shirt-times">${rows}</ul>` : ''}
        ${t.page ? `<a class="shirt-link" href="${e(href(lang, t.page))}">${e(tr(lang, 'teams.page'))}</a>` : ''}
      </div>
    </div>
  </div>
</article>`;
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
    .slice()
    .reverse()
    .map((t) => {
      const days = t.training.map((r) => tr(lang, 'day.' + r.day).slice(0, 2)).join(' · ');
      return `<li><span class="lbl-team">${e((t.name[lang] || t.name.lb).replace(/\s*\(.*/, ''))}</span><span class="lbl-days">${e(days)}</span><span class="lbl-time">${e(t.training[0].time)}</span></li>`;
    })
    .join('');
}

export function partnerPatches(partners: Partner[], tier?: Partner['tier']): string {
  return partners
    .filter((p) => !p.hidden && (!tier || p.tier === tier))
    .map((p) => {
      const img = `<img src="${e(p.logo)}" alt="${e(p.name || 'Partner')}" loading="lazy">`;
      return `<li class="print print-${p.tier}" data-partner="${e(p.id)}">${p.url ? `<a href="${e(p.url)}" target="_blank" rel="noopener">${img}</a>` : img}</li>`;
    })
    .join('');
}

const fmtDate = (iso: string, lang: Lang) => {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return isNaN(+d) ? '' : d.toLocaleDateString({ lb: 'lb-LU', fr: 'fr-LU', de: 'de-LU' }[lang], { day: 'numeric', month: 'long', year: 'numeric' });
};

export function newsPatch(n: NewsItem, lang: Lang, big = false): string {
  const link = n.path ? href(lang, n.path) : `${href(lang, '/noriichten-1/neu/')}#${encodeURIComponent(n.id)}`;
  return `<article class="news-patch${big ? ' is-big' : ''}${n.image ? '' : ' no-img'}" data-news="${e(n.id)}">
  ${n.image ? `<img src="${e(n.image)}" alt="" loading="lazy">` : ''}
  <div class="news-body">
    <h3><a href="${e(link)}">${e(n.title)}</a></h3>
    ${n.date ? `<time datetime="${e(n.date)}">${e(fmtDate(n.date, lang))}</time>` : ''}
    ${n.excerpt ? `<p>${e(n.excerpt)}</p>` : ''}
  </div>
</article>`;
}

export function newsList(items: NewsItem[], lang: Lang, limit = 99): string {
  return items.filter((n) => !n.hidden).slice(0, limit).map((n, i) => newsPatch(n, lang, i === 0 && !!n.image)).join('');
}
