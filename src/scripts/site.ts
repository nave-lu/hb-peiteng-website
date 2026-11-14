/* Kleine Helfer für alle Besucher: Menü, Trikots umdrehen, Fotogalerie. */

// Menü auf dem Handy
const menuBtn = document.querySelector<HTMLButtonElement>('.menu-btn');
const menu = document.getElementById('menu');
menuBtn?.addEventListener('click', () => {
  const open = menuBtn.getAttribute('aria-expanded') !== 'true';
  menuBtn.setAttribute('aria-expanded', String(open));
  menu?.toggleAttribute('data-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

// Trikot umdrehen (Rücken → Brust). Delegiert, damit auch neu gezeichnete Trikots im Editor funktionieren.
const CLOSE = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
function setTurned(shirt: HTMLElement, on: boolean) {
  shirt.toggleAttribute('data-turned', on);
  shirt.querySelector('.shirt-turn')?.setAttribute('aria-expanded', String(on));
  if (on) {
    // immer nur ein Trikot offen
    document.querySelectorAll<HTMLElement>('.shirt[data-turned]').forEach((o) => { if (o !== shirt) setTurned(o, false); });
    if (!shirt.querySelector('.shirt-close')) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'shirt-close';
      b.setAttribute('aria-label', document.documentElement.lang === 'fr' ? 'Retourner' : document.documentElement.lang === 'de' ? 'Zurückdrehen' : 'Zréckdréinen');
      b.innerHTML = CLOSE;
      shirt.append(b);
    }
    (shirt.querySelector('.shirt-front h3') as HTMLElement | null)?.setAttribute('tabindex', '-1');
    (shirt.querySelector('.shirt-close') as HTMLElement | null)?.focus({ preventScroll: true });
  }
}
document.addEventListener('click', (ev) => {
  const el = ev.target as HTMLElement;
  if (document.body.classList.contains('is-editing') && el.closest('[data-render]')) return;
  const turn = el.closest('.shirt-turn');
  if (turn) setTurned(turn.closest('.shirt') as HTMLElement, true);
  const close = el.closest('.shirt-close');
  if (close) {
    const shirt = close.closest('.shirt') as HTMLElement;
    setTurned(shirt, false);
    (shirt.querySelector('.shirt-turn') as HTMLElement).focus({ preventScroll: true });
  }
});
document.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Escape') return;
  const shirt = (document.activeElement as HTMLElement | null)?.closest('.shirt[data-turned]') as HTMLElement | null;
  if (shirt) { setTurned(shirt, false); (shirt.querySelector('.shirt-turn') as HTMLElement).focus(); }
});

// Fotogalerie im Vollbild
const lb = document.querySelector<HTMLDialogElement>('.lightbox');
let list: string[] = [];
let idx = 0;
const show = () => {
  let img = lb!.querySelector('img');
  if (!img) { img = document.createElement('img'); img.alt = ''; lb!.prepend(img); }
  img.src = list[idx];
};
document.addEventListener('click', (ev) => {
  if (document.body.classList.contains('is-editing')) return;
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
