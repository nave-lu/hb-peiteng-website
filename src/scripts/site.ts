/* Kleine Helfer für alle Besucher: Menü, Trikots, Karussells, Live-Matcher, Fotogalerie. */
import { fetchClubMatches, matchCards } from '../lib/matches';
import type { Lang } from '../i18n/ui';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const editing = () => document.body.classList.contains('is-editing');

// Menü auf dem Handy
const menuBtn = document.querySelector<HTMLButtonElement>('.menu-btn');
const menu = document.getElementById('menu');
menuBtn?.addEventListener('click', () => {
  const open = menuBtn.getAttribute('aria-expanded') !== 'true';
  menuBtn.setAttribute('aria-expanded', String(open));
  menu?.toggleAttribute('data-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
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
function setupCarousel(root: HTMLElement) {
  const track = root.querySelector<HTMLElement>('.carousel-track');
  if (!track || root.dataset.ready) return;
  root.dataset.ready = '1';
  const items = () => [...track.children] as HTMLElement[];
  const step = () => (items()[0]?.getBoundingClientRect().width ?? track.clientWidth) + parseFloat(getComputedStyle(track).columnGap || '0');
  const go = (dir: number) => {
    const max = track.scrollWidth - track.clientWidth - 2;
    const next = dir > 0 && track.scrollLeft >= max ? 0 : dir < 0 && track.scrollLeft <= 2 ? max : track.scrollLeft + dir * step();
    track.scrollTo({ left: next, behavior: reduced ? 'auto' : 'smooth' });
  };
  root.querySelectorAll<HTMLButtonElement>('.car-btn').forEach((b) => b.addEventListener('click', () => { go(+b.dataset.dir!); stop(); }));
  const dots = root.querySelector('.dots');
  const paint = () => {
    if (!dots) return;
    const n = items().length;
    const i = Math.round(track.scrollLeft / Math.max(1, step()));
    if (dots.children.length !== n) dots.innerHTML = '<i></i>'.repeat(n);
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === Math.min(i, n - 1)));
  };
  track.addEventListener('scroll', () => requestAnimationFrame(paint), { passive: true });
  paint();
  let timer = 0;
  const stop = () => { clearInterval(timer); timer = 0; };
  if (root.hasAttribute('data-autoplay') && !reduced) {
    timer = window.setInterval(() => { if (!document.hidden && !editing()) go(1); }, 6000);
    ['pointerdown', 'focusin', 'mouseenter'].forEach((e) => root.addEventListener(e, stop, { once: true }));
  }
  // Matcher: zum ersten Match ab heute springen (Resultater vun der leschter Woch stinn virdrun)
  if (track.matches('.matches')) {
    const firstUpcoming = items().findIndex((x) => !x.classList.contains('is-played') && !x.classList.contains('is-past'));
    if (firstUpcoming > 0) track.scrollLeft = items()[firstUpcoming].offsetLeft - track.offsetLeft - 4;
  }
}
document.querySelectorAll<HTMLElement>('[data-carousel]').forEach(setupCarousel);

/* ---------- Matcher: jedes Mal frisch von der FLH ---------- */
const box = document.querySelector<HTMLElement>('[data-matches]');
if (box) {
  fetchClubMatches()
    .then((m) => {
      if (!m.length) return;
      box.innerHTML = matchCards(m, (box.dataset.lang || 'lb') as Lang);
      const root = box.closest<HTMLElement>('[data-carousel]')!;
      delete root.dataset.ready;
      setupCarousel(root);
    })
    .catch(() => { /* Schnappschuss vom Bauen bleibt stehen */ });
}

/* ---------- Fotogalerie im Vollbild ---------- */
const lb = document.querySelector<HTMLDialogElement>('.lightbox');
let list: string[] = [];
let idx = 0;
const show = () => {
  let img = lb!.querySelector('img');
  if (!img) { img = document.createElement('img'); img.alt = ''; lb!.prepend(img); }
  img.src = list[idx];
};
document.addEventListener('click', (ev) => {
  if (editing()) return;
  const a = (ev.target as HTMLElement).closest('.gallery a') as HTMLAnchorElement | null;
  if (!a || !lb) return;
  ev.preventDefault();
  list = [...a.closest('.gallery')!.querySelectorAll('a')].map((x) => (x as HTMLAnchorElement).href);
  idx = list.indexOf(a.href);
  show();
  lb.showModal();
});
lb?.querySelector('.lb-close')?.addEventListener('click', () => lb.close());
lb?.querySelector('.lb-prev')?.addEventListener('click', () => { idx = (idx - 1 + list.length) % list.length; show(); });
lb?.querySelector('.lb-next')?.addEventListener('click', () => { idx = (idx + 1) % list.length; show(); });
lb?.addEventListener('keydown', (ev) => {
  if (ev.key === 'ArrowLeft') lb.querySelector<HTMLButtonElement>('.lb-prev')!.click();
  if (ev.key === 'ArrowRight') lb.querySelector<HTMLButtonElement>('.lb-next')!.click();
});
lb?.addEventListener('click', (ev) => { if (ev.target === lb) lb.close(); });

/* ---------- Sanftes Einblenden beim Scrollen (einmal pro Element) ---------- */
if (!reduced && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => { el.classList.add('will-reveal'); io.observe(el); });
}
