/* Kleine Helfer für alle Besucher: Menü, Trikots, Karussells, Live-Matcher, Fotogalerie. */
import { weekGames, fetchTables, mergeMatches, windowMatches, matchCards, tablesHtml, liveMatch, teamMatches, teamLiveHtml, classStubs, MAIN_TABLE_TEAMS, type Match, type Table, type LiveMode } from '../lib/matches';
import type { Lang } from '../i18n/ui';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const editing = () => document.body.classList.contains('is-editing');

// Menü über die ganze Seite. Breit: Rubrik antippen/überfahren zeigt rechts ihre Seiten. Schmal: Rubrik klappt auf.
const menuBtn = document.querySelector<HTMLButtonElement>('.menu-btn');
const menu = document.getElementById('menu');
const wide = matchMedia('(min-width: 900px)');
const items = [...(menu?.querySelectorAll<HTMLElement>('.menu-item') ?? [])];
const activate = (li: HTMLElement | null) => items.forEach((x) => {
  x.classList.toggle('is-active', x === li);
  x.querySelector('.menu-toggle')?.setAttribute('aria-expanded', String(x === li));
});
items.forEach((li) => {
  if (!li.querySelector('.menu-sub')) return;
  li.querySelector('.menu-toggle')?.addEventListener('click', () => activate(li.classList.contains('is-active') ? null : li));
  li.addEventListener('pointerenter', (e) => { if (wide.matches && e.pointerType === 'mouse') activate(li); });
  li.addEventListener('focusin', () => { if (wide.matches) activate(li); });
});
let closing = 0;
function setMenu(open: boolean) {
  if (!menuBtn || !menu) return;
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', (open ? menuBtn.dataset.closeLabel : menuBtn.dataset.openLabel) ?? '');
  clearTimeout(closing);
  if (!open) document.documentElement.classList.remove('menu-restored'); // ab jetzt wieder mit Animation
  const finish = () => {
    clearTimeout(closing);
    menu.classList.remove('is-closing');
    menu.toggleAttribute('data-open', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  // Schließen spielt die Öffnen-Animation rückwärts (nach oben einrollen), dann erst ausblenden
  if (!open && menu.hasAttribute('data-open') && !reduced) {
    menu.classList.add('is-closing');
    closing = window.setTimeout(finish, 450);
  } else finish();
  if (open) {
    // breit: aktuelle (sonst erste) Rubrik ist schon offen; schmal: alles zu
    activate(wide.matches ? items.find((x) => x.hasAttribute('data-current')) ?? items[0] : null);
  }
}
menuBtn?.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
// Sprache im offenen Menü wechseln: gleiche Seite in der neuen Sprache, Menü bleibt offen (ohne neue Animation)
menu?.querySelectorAll('[data-keep-menu]').forEach((a) => a.addEventListener('click', () => {
  try { sessionStorage.setItem('menu-open', '1'); } catch { /* egal */ }
}));
try {
  // das Inline-Skript in Base.astro hat das Menü schon geöffnet; hier nur Beschriftung und aktive Rubrik nachziehen
  if (sessionStorage.getItem('menu-open')) { sessionStorage.removeItem('menu-open'); setMenu(true); }
} catch { /* egal */ }
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu?.hasAttribute('data-open')) { setMenu(false); menuBtn?.focus(); }
});

/* ---------- Trikots: antippen → Trikot hebt sich, darunter klappt eine Bahn mit allen Infos auf ---------- */
const CLOSE = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
function closeDetail(rack: Element, focusBack = false) {
  const open = rack.querySelector('.shirt-detail');
  const active = rack.querySelector<HTMLElement>('.shirt.is-active');
  rack.classList.remove('has-active');
  active?.classList.remove('is-active');
  active?.querySelector('.shirt-turn')?.setAttribute('aria-expanded', 'false');
  if (open) {
    open.classList.remove('is-open');
    setTimeout(() => open.remove(), reduced ? 0 : 380);
  }
  if (focusBack) active?.querySelector<HTMLElement>('.shirt-turn')?.focus();
}
function openDetail(shirt: HTMLElement) {
  const rack = shirt.closest('.rack')!;
  const wasActive = shirt.classList.contains('is-active');
  document.querySelectorAll('.rack.has-active').forEach((r) => closeDetail(r));
  if (wasActive) return;
  // letztes Trikot derselben Reihe finden: die Bahn kommt direkt darunter
  const shirts = [...rack.querySelectorAll<HTMLElement>(':scope > .shirt')];
  const top = shirt.offsetTop;
  const last = shirts.filter((s) => Math.abs(s.offsetTop - top) < 4).pop()!;
  const info = shirt.querySelector('.shirt-info')!;
  const detail = document.createElement('div');
  detail.className = 'shirt-detail';
  detail.setAttribute('role', 'region');
  detail.setAttribute('aria-label', shirt.querySelector('.shirt-info h3')?.textContent ?? '');
  detail.innerHTML = `<div class="detail-in">${info.innerHTML}<button type="button" class="detail-close" aria-label="${document.documentElement.lang === 'fr' ? 'Fermer' : document.documentElement.lang === 'de' ? 'Schließen' : 'Zoumaachen'}">${CLOSE}</button></div>`;
  // Pfeil zeigt auf das gewählte Trikot
  detail.style.setProperty('--arrow-x', `${shirt.offsetLeft + shirt.offsetWidth / 2}px`);
  last.after(detail);
  rack.classList.add('has-active');
  shirt.classList.add('is-active');
  shirt.querySelector('.shirt-turn')?.setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => requestAnimationFrame(() => detail.classList.add('is-open')));
  const r = detail.getBoundingClientRect();
  if (r.bottom > innerHeight) setTimeout(() => detail.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' }), 120);
}
document.addEventListener('click', (ev) => {
  if (editing()) return;
  const el = ev.target as HTMLElement;
  const turn = el.closest('.shirt-turn');
  if (turn) openDetail(turn.closest('.shirt') as HTMLElement);
  const close = el.closest('.detail-close');
  if (close) closeDetail(close.closest('.rack')!, true);
});
document.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Escape') return;
  const rack = (document.activeElement as HTMLElement | null)?.closest('.rack.has-active');
  if (rack) closeDetail(rack, true);
});

/* ---------- Karussells (Matcher, Neiegkeeten): Wischen nativ, Pfeile, Punkte, Autoplay ---------- */
/** Karussell einrichten: blättert nur, wenn man selbst drückt (kein Autoplay, kein Zurückspringen).
 *  Darf nach neuem Inhalt (Live-Matcher) erneut aufgerufen werden: Klicks werden nur einmal angehängt. */
function setupCarousel(root: HTMLElement) {
  const track = root.querySelector<HTMLElement>('.carousel-track');
  if (!track) return;
  const first = !root.dataset.ready;
  root.dataset.ready = '1';
  const items = () => [...track.children] as HTMLElement[];
  const step = () => (items()[0]?.getBoundingClientRect().width ?? track.clientWidth) + (parseFloat(getComputedStyle(track).columnGap) || 0);
  const max = () => track.scrollWidth - track.clientWidth - 2;
  const btns = [...root.querySelectorAll<HTMLButtonElement>('.car-btn')];
  const dots = root.querySelector('.dots');
  const paint = () => {
    // am Anfang/Ende den jeweiligen Pfeil ausgrauen
    const last = [...track.children].filter((x) => !x.classList.contains('match-spacer')).pop();
    const lastShown = !!last && last.getBoundingClientRect().right <= track.getBoundingClientRect().right + 2;
    btns.forEach((b) => { b.disabled = +b.dataset.dir! < 0 ? track.scrollLeft <= 2 : track.scrollLeft >= max() || lastShown; });
    if (!dots) return;
    const n = items().length;
    const i = Math.round(track.scrollLeft / Math.max(1, step()));
    if (dots.children.length !== n) dots.innerHTML = '<i></i>'.repeat(n);
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === Math.min(i, n - 1)));
  };
  if (first) {
    btns.forEach((b) => b.addEventListener('click', () => {
      root.dataset.moved = '1';
      const next = Math.min(max() + 2, Math.max(0, track.scrollLeft + +b.dataset.dir! * step()));
      track.scrollTo({ left: next, behavior: reduced ? 'auto' : 'smooth' });
    }));
    track.addEventListener('scroll', () => requestAnimationFrame(paint), { passive: true });
    // sobald jemand selbst blättert, springt eine Aktualisierung nicht mehr zurück
    ['pointerdown', 'wheel', 'keydown'].forEach((e) => root.addEventListener(e, () => { root.dataset.moved = '1'; }, { passive: true }));
  }
  // Matcher: das nächste Spiel steht immer als erste Karte (gespielte liegen links davon, per Pfeil erreichbar).
  // Gibt es danach zu wenige Spiele, kommen hinten leere Plätze dazu, damit es trotzdem ganz links stehen kann
  // (Padding geht nicht: die Spaltenbreite hängt an der Breite der Reihe).
  if (track.matches('.matches') && !root.dataset.moved) {
    track.querySelectorAll('.match-spacer').forEach((x) => x.remove());
    const next = items().find((x) => x.matches('.match:not(.is-played):not(.is-past)'));
    if (next) {
      const target = track.scrollLeft + next.getBoundingClientRect().left - track.getBoundingClientRect().left;
      const missing = target + track.clientWidth - track.scrollWidth;
      for (let k = 0; k < Math.ceil(missing / step()); k++) track.insertAdjacentHTML('beforeend', '<span class="match-spacer" aria-hidden="true"></span>');
      track.scrollLeft = target;
    } else track.scrollLeft = max() + 2; // nur Resultate: die neuesten zeigen
  }
  paint();
}
document.querySelectorAll<HTMLElement>('[data-carousel]').forEach(setupCarousel);

/* ---------- Matcher: jedes Mal frisch von der FLH ---------- */
/* Live-Daten: Schnappschuss vom Bauen + laufende und letzte Woche frisch von der FLH.
 * Pro Browser höchstens alle 5 Minuten (sessionStorage), damit die FLH uns nicht sperrt. */
type Base = { matches: Match[]; tables: Table[] };
const readBase = (root: ParentNode): Base => {
  try { return JSON.parse(root.querySelector('[data-flh-base]')?.textContent || '{}'); } catch { return { matches: [], tables: [] }; }
};
async function cached<T>(key: string, fn: () => Promise<T>, ttl = 5 * 60e3): Promise<T> {
  try {
    const hit = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (hit && Date.now() - hit.t < ttl) return hit.v as T;
  } catch { /* egal */ }
  const v = await fn();
  try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch { /* egal */ }
  return v;
}
const dayIn = (days: number) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
// letzte, laufende und nächste Woche: drei Anfragen, höchstens alle 5 Minuten pro Besucher
const freshWeeks = () => cached('flh-weeks-v3', async () => [
  ...(await weekGames()),
  ...(await weekGames(dayIn(7)).catch(() => [])),
  ...(await weekGames(dayIn(-7)).catch(() => [])),
]);
const freshTables = (m: Match[]) => cached('flh-tables-v2-' + [...new Set(m.map((x) => x.classId))].sort().join('-'), () => fetchTables(m));

/* Eigene Spiele aus dem Admin (Freundschaftsspiele, Turniere …): kommen per Ereignis „hbp:data“ dazu */
let extraMatches: Match[] = [];
const dataListeners: (() => void)[] = [];
addEventListener('hbp:data', (ev) => {
  extraMatches = ((ev as CustomEvent).detail?.matches ?? []) as Match[];
  dataListeners.forEach((f) => f());
});

const box = document.querySelector<HTMLElement>('[data-matches]');
const liveEl = document.querySelector<HTMLElement>('[data-live]');
const liveLabel = { lb: 'Elo live', fr: 'En direct', de: 'Jetzt live' } as Record<string, string>;
function paintLive(m: Match[]) {
  if (!liveEl) return;
  const now = liveMatch(m);
  liveEl.classList.toggle('is-live', !!now);
  const b = liveEl.querySelector('.live-now');
  if (b) b.textContent = now ? `${liveLabel[document.documentElement.lang] ?? liveLabel.lb}: ${now.home} – ${now.guest}` : '';
}
if (box) {
  const lang = (box.dataset.lang || 'lb') as Lang;
  const base = readBase(box.parentElement!);
  paintLive(base.matches);
  const refresh = () => freshWeeks()
    .then(async (fresh) => {
      const m = windowMatches(mergeMatches(base.matches, [...fresh, ...extraMatches]));
      box.innerHTML = matchCards(m, lang);
      setupCarousel(box.closest<HTMLElement>('[data-carousel]')!);
      paintLive(m);
      // Klassement: nur Hären und Dammen; feste Ligen aus teams.json, falls eine Equipe gerade nicht spielt
      let stubs: { team: string; classId: string }[] = [];
      try { stubs = JSON.parse(document.querySelector<HTMLElement>('[data-tables]')?.dataset.classes || '[]'); } catch { /* egal */ }
      const own = m.filter((x) => MAIN_TABLE_TEAMS.includes(x.team));
      const known = new Set(own.map((x) => x.team));
      const tables = (await freshTables([...own, ...classStubs(stubs.filter((x) => !known.has(x.team)))]).catch(() => base.tables)).filter((x) => MAIN_TABLE_TEAMS.includes(x.team));
      const tb = document.querySelector<HTMLElement>('[data-tables-body]');
      const sel = tb?.querySelector('[aria-selected="true"]')?.getAttribute('data-tab');
      if (tb && tables.length) {
        tb.innerHTML = tablesHtml(tables, lang);
        if (sel) tb.querySelector<HTMLElement>(`[data-tab="${sel}"]`)?.click();
      }
    })
    .catch(() => { /* Schnappschuss bleibt stehen */ });
  refresh();
  dataListeners.push(refresh);
  // Automatisch: alle 2 Minuten nachsehen. Der 5-Minuten-Cache bremst die Anfragen an die FLH;
  // nur während eines laufenden Matches wird er übersprungen (dann wirklich alle 2 Minuten).
  // Die Wochen rechnen ab heute, rücken also jede Woche von selbst weiter.
  const tick = () => {
    if (document.hidden) return;
    if (liveEl?.classList.contains('is-live')) try { sessionStorage.removeItem('flh-weeks-v3'); } catch { /* egal */ }
    refresh();
  };
  setInterval(tick, 120000);
  document.addEventListener('visibilitychange', tick); // zurück im Tab: gleich auffrischen
}

/* Mannschafts- und Resultat-Seiten: Schnappschuss + laufende Woche */
const teamLive = document.querySelector<HTMLElement>('[data-team-live]');
if (teamLive) {
  const { teamLive: team, mode, lang, hResults, hTable } = teamLive.dataset as Record<string, string>;
  const base = readBase(teamLive);
  const keep = teamLive.querySelector('[data-flh-base]')!;
  const draw = () => freshWeeks()
    .then(async (fresh) => {
      const list = teamMatches(mergeMatches(base.matches, [...fresh, ...extraMatches]), team, mode as LiveMode);
      const tables = mode === 'cup' ? [] : await freshTables(list).catch(() => base.tables);
      const html = teamLiveHtml(list, tables, mode as LiveMode, lang as Lang, { results: hResults, table: hTable });
      // nur ersetzen, wenn wirklich etwas Neues da ist (sonst bleibt Schnappschuss bzw. Link auf flh.lu)
      if (!html || (mode === 'table' && !tables.length)) return;
      teamLive.innerHTML = html;
      teamLive.append(keep);
    })
    .catch(() => { /* Schnappschuss bleibt */ });
  draw();
  dataListeners.push(draw);
}

// Klassement: Reiter
document.addEventListener('click', (ev) => {
  const tab = (ev.target as HTMLElement).closest<HTMLElement>('.table-tabs [data-tab]');
  if (!tab) return;
  const wrap = tab.closest('[data-tables-body], .tables-light')!;
  wrap.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b === tab)));
  wrap.querySelectorAll<HTMLElement>('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== tab.dataset.tab));
});

/* ---------- Fotogalerie im Vollbild ---------- */
const lb = document.querySelector<HTMLDialogElement>('.lightbox');
let list: string[] = [];
let idx = 0;
const show = () => {
  let img = lb!.querySelector('img');
  if (!img) { img = document.createElement('img'); img.alt = ''; lb!.prepend(img); }
  img.src = list[idx];
  // ein einzelnes Foto: keine Pfeile
  lb!.querySelectorAll<HTMLElement>('.lb-prev, .lb-next').forEach((b) => { b.hidden = list.length < 2; });
};
/* Groß ansehen: Fotos in Galerien und alle einzelnen Fotos im Seiteninhalt (z. B. Team-Fotos unten),
 * aber keine Fotos, die selbst ein Link sind (Partner-Logos, Werbebanner). */
const zoomable = (img: Element) => img.matches('.prose figure img, .prose .team-photos img, .prose .cols img, .prose .text-image img') && !img.closest('a');
document.addEventListener('click', (ev) => {
  if (editing() || !lb) return;
  const target = ev.target as HTMLElement;
  const a = target.closest('.gallery a') as HTMLAnchorElement | null;
  if (a) {
    ev.preventDefault();
    list = [...a.closest('.gallery')!.querySelectorAll('a')].map((x) => (x as HTMLAnchorElement).href);
    idx = list.indexOf(a.href);
  } else if (target.tagName === 'IMG' && zoomable(target)) {
    // alle vergrößerbaren Fotos derselben Seite, damit man mit den Pfeilen weiterblättern kann
    const imgs = [...target.closest('.prose')!.querySelectorAll('img')].filter(zoomable) as HTMLImageElement[];
    list = imgs.map((x) => x.currentSrc || x.src);
    idx = imgs.indexOf(target as HTMLImageElement);
  } else return;
  show();
  lb.showModal();
});
// Hinweis, dass man Fotos anklicken kann
document.querySelectorAll('.prose img').forEach((img) => { if (zoomable(img)) img.classList.add('is-zoomable'); });
lb?.querySelector('.lb-close')?.addEventListener('click', () => lb.close());
lb?.querySelector('.lb-prev')?.addEventListener('click', () => { idx = (idx - 1 + list.length) % list.length; show(); });
lb?.querySelector('.lb-next')?.addEventListener('click', () => { idx = (idx + 1) % list.length; show(); });
lb?.addEventListener('keydown', (ev) => {
  if (ev.key === 'ArrowLeft') lb.querySelector<HTMLButtonElement>('.lb-prev')!.click();
  if (ev.key === 'ArrowRight') lb.querySelector<HTMLButtonElement>('.lb-next')!.click();
});
lb?.addEventListener('click', (ev) => { if (ev.target === lb) lb.close(); });
// Handy: wischen links/rechts blättert, nach unten wischen schließt
let touch: { x: number; y: number } | null = null;
lb?.addEventListener('touchstart', (ev) => { touch = { x: ev.touches[0].clientX, y: ev.touches[0].clientY }; }, { passive: true });
lb?.addEventListener('touchend', (ev) => {
  if (!touch) return;
  const dx = ev.changedTouches[0].clientX - touch.x, dy = ev.changedTouches[0].clientY - touch.y;
  touch = null;
  if (dy > 90 && Math.abs(dy) > Math.abs(dx)) lb.close();
  else if (Math.abs(dx) > 60 && list.length > 1) lb.querySelector<HTMLButtonElement>(dx < 0 ? '.lb-next' : '.lb-prev')!.click();
});

/* ---------- Sprungmarken: Ziel sofort fertig zeigen und genau oben halten ---------- */
// Spiele, Fotos und Schriften laden nach dem Sprung noch nach und verschieben die Seite;
// deshalb kurz nachjustieren, bis man selbst scrollt (höchstens 4 Sekunden).
function jumpTo(id: string): boolean {
  const target = document.getElementById(id);
  if (!target) return false;
  const sec = target.closest('section') ?? target;
  sec.classList.add('is-instant');
  [sec, ...sec.querySelectorAll('.reveal, .stagger')].forEach((el) => el.classList.add('is-in'));
  setTimeout(() => sec.classList.remove('is-instant'), 200);
  const align = () => target.scrollIntoView({ block: 'start' });
  align();
  let done = false;
  const ro = new ResizeObserver(() => { if (!done) align(); });
  const quit = () => { done = true; ro.disconnect(); };
  ro.observe(document.body);
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((e) => addEventListener(e, quit, { once: true, passive: true }));
  setTimeout(quit, 4000);
  return true;
}
document.addEventListener('click', (ev) => {
  const a = (ev.target as Element).closest?.<HTMLAnchorElement>('a[href^="#"]');
  if (!a || a.hasAttribute('data-login') || a.hash.length < 2) return;
  const id = decodeURIComponent(a.hash.slice(1));
  if (jumpTo(id)) { ev.preventDefault(); history.pushState(null, '', `#${id}`); }
});
if (location.hash.length > 1) addEventListener('load', () => jumpTo(decodeURIComponent(location.hash.slice(1))));

/* ---------- Sanftes Einblenden beim Scrollen (einmal pro Element) ---------- */
if (!reduced && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => { el.classList.add('will-reveal'); io.observe(el); });
  // Raster (Trikoten, Neiegkeeten) kommen nacheinander; Partner-Logos nicht, die sollen sofort da sein
  document.querySelectorAll<HTMLElement>('.rack, .news-index').forEach((el) => {
    [...el.children].forEach((c, i) => (c as HTMLElement).style.setProperty('--i', String(Math.min(i, 12))));
    el.classList.add('stagger');
    io.observe(el);
  });
}

