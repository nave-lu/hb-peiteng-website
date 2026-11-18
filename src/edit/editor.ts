/* Admin direkt auf der Seite (Login im Footer).
 * - Texte: antippen und tippen (feste Texte, Seitentitel, ganze Seiteninhalte)
 * - Fotos: antippen → neues Foto aus der Galerie oder der Kamera
 * - Links: antippen → neue Adresse
 * - Verwalten: Equippen (Nummer, Trainer, Trainingszeiten, FLH-Liga), eigene Matcher, Neiegkeeten, Partner,
 *   Club-Daten (Adressen, E-Mails, Hallen, Links, Bank)
 * Speichern geht über storage.ts (Demo: dieser Browser; Betrieb: api.php). */
import './editor.css';
import { storage, emptyState, normalize, preloadImages, type EditState, type OwnMatch } from './storage';
import { teamsGrid, teamPanel, trainingCards, partnerPatches, newsList, newsSlides, type NewsItem, type Partner, type Team } from '../lib/render';
import { MAIN_TABLE_TEAMS, type Match } from '../lib/matches';
import { rebase } from '../lib/rebase.mjs';
import { UI, LANGS, href, type Lang } from '../i18n/ui';

const lang = (document.body.dataset.lang || 'lb') as Lang;
const path = document.body.dataset.path || '/';
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T | null;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll(sel)] as T[];
const esc = (s: string) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
/* Wurzel der Seite (GitHub Pages: /hb-peiteng-website/). Neu gezeichnete Bausteine bekommen dieselben Pfade wie die gebaute Seite. */
const BASE = (document.querySelector<HTMLMetaElement>('meta[name="site-base"]')?.content || '/').replace(/\/?$/, '/');
const fix = (html: string) => (BASE === '/' ? html : rebase(html, BASE.slice(0, -1)));
const withBase = (p: string) => (p.startsWith('/') && !p.startsWith('//') ? BASE + p.slice(1) : p);

type SiteData = Record<string, unknown>;
interface Base { teams: Team[]; partners: Partner[]; news: NewsItem[]; site: SiteData }
let base: Base = { teams: [], partners: [], news: [], site: {} };
let state: EditState = emptyState();
let savedJson = '';
let undo: string[] = [];
let loggedIn = false;
let editing = false;
let started = false;

const teams = () => state.teams ?? base.teams;
const partners = () => state.partners ?? base.partners;
const news = () => state.news ?? base.news;

/* ---------------- Inhalte anwenden ---------------- */
function remember() {
  for (const el of $$('[data-edit]')) el.dataset.orig ??= el.textContent ?? '';
  for (const el of $$('[data-edit-html]')) el.dataset.orig ??= el.innerHTML;
  for (const img of $$<HTMLImageElement>('main img')) if (!img.closest('[data-edit-html],[data-render]')) img.dataset.orig ??= img.getAttribute('src') ?? '';
  for (const a of $$<HTMLAnchorElement>('main a[href], .shorts a[href], .menu a[href]')) if (!a.closest('.hbp-ui')) a.dataset.origHref ??= a.getAttribute('href') ?? '';
  if (!textNodes.size) {
    for (const scope of $$(SITE_SCOPES)) {
      const w = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode() as Text | null; n; n = w.nextNode() as Text | null) {
        if (n.data.trim() && !n.parentElement?.closest('[data-edit],[data-edit-html],[data-render]')) textNodes.set(n, n.data);
      }
    }
  }
}

const showUrls = (html: string) =>
  html.replace(/src="(idb:[\w-]+)"/g, (_, k) => `src="${storage.imageUrl(k)}" data-key="${k}"`);

function readHtml(el: HTMLElement): string {
  const c = el.cloneNode(true) as HTMLElement;
  for (const img of $$<HTMLImageElement>('img[data-key]', c)) { img.setAttribute('src', img.dataset.key!); img.removeAttribute('data-key'); }
  for (const x of $$('[contenteditable]', c)) x.removeAttribute('contenteditable');
  return c.innerHTML;
}

/* eigene Matcher → gleiche Form wie die FLH-Spiele */
let dataTimer = 0;
const CLUB_NAME = 'HB Péiteng';
const toMatch = (o: OwnMatch): Match => ({
  id: o.id, date: o.date, time: o.time, team: o.team, competition: o.competition || 'Frëndschaftsmatch',
  home: o.isHome ? CLUB_NAME : o.opponent, guest: o.isHome ? o.opponent : CLUB_NAME,
  homeGoals: o.isHome ? o.ours : o.theirs, guestGoals: o.isHome ? o.theirs : o.ours,
  hall: o.hall, town: o.town, isHome: o.isHome, classId: '', cls: '', live: false,
});
const ownMatches = () => state.matches.filter((m) => !m.hidden && m.date && m.team).map(toMatch);

/* Club-Daten (site.json): welche Felder es gibt; geänderte Werte werden in Fußzeile, Menü, Kontakt, Impressum und Hallen ersetzt */
const getPath = (o: unknown, path: string): unknown => path.split('.').reduce<unknown>((v, k) => (v as Record<string, unknown> | undefined)?.[k], o);
function siteFields(): [string, [string, string][]][] {
  const s = base.site as { halls?: { name: string }[]; address?: string[]; bank?: string[] };
  return [
    ['Club', [['fullName', 'Numm vum Club'], ...(s.address ?? []).map((_, i): [string, string] => [`address.${i}`, `Adress, Zeil ${i + 1}`])]],
    ['E-Mailen', [['emails.club', 'Sekretariat'], ['emails.president', 'President'], ['emails.wisiCup', 'Wisi-Cup']]],
    ['Links', [['links.livestream', 'Livestream'], ['links.flhKlassement', 'FLH-Klassement'], ['links.refill', 'Shop'], ['links.facebook', 'Facebook']]],
    ...(s.halls ?? []).map((h, i): [string, [string, string][]] => [`Hal: ${h.name}`, [[`halls.${i}.name`, 'Numm'], [`halls.${i}.street`, 'Strooss'], [`halls.${i}.city`, 'Uertschaft'], [`halls.${i}.map`, 'Google-Maps-Link'], [`halls.${i}.lat`, 'Kaart: Breedegrad'], [`halls.${i}.lon`, 'Kaart: Längegrad']]]),
    ['Bank', (s.bank ?? []).map((_, i): [string, string] => [`bank.${i}`, `Kont ${i + 1}`])],
  ];
}
function sitePairs(): [string, string][] {
  return Object.entries(state.site)
    .filter(([k]) => !/\.(lat|lon)$/.test(k))
    .map(([k, v]): [string, string] => [String(getPath(base.site, k) ?? ''), v])
    .filter(([o, v]) => o && o !== v)
    .sort((a, b) => b[0].length - a[0].length);
}
const swap = (text: string, pairs: [string, string][]) => pairs.reduce((t, [o, n]) => t.split(o).join(n), text);
function swapHref(h: string, pairs: [string, string][]): string {
  for (const [o, n] of pairs) {
    if (h === o) return n;
    if (h === `mailto:${o}` || h.startsWith(`mailto:${o}?`)) return `mailto:${n}${h.slice(7 + o.length)}`;
  }
  return h;
}
const SITE_SCOPES = '.shorts, .menu-sub, .hall-map, [data-live], body[data-path="/kontakt/"] main .prose, body[data-path="/impressum/"] main .prose';
const textNodes = new Map<Text, string>();
const osm = (lat: number, lon: number) => `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.006}%2C${lat - 0.0028}%2C${lon + 0.006}%2C${lat + 0.0028}&layer=mapnik&marker=${lat}%2C${lon}`;

function render() {
  // ohne Grunddaten (data.json nicht geladen) nichts neu zeichnen, sonst wären die Bausteine leer
  if (!base.teams.length && !state.teams) return;
  const t = teams(), p = partners(), n = news();
  for (const el of $$('[data-render]')) {
    const kind = el.dataset.render;
    if (kind === 'teams') el.innerHTML = fix(teamsGrid(t, lang));
    else if (kind === 'trainings') el.innerHTML = fix(trainingCards(t, lang));
    else if (kind === 'partners-main') el.innerHTML = fix(partnerPatches(p, 'main'));
    else if (kind === 'partners-rest') el.innerHTML = fix(partnerPatches(p, 'partner'));
    else if (kind === 'news-slides') el.innerHTML = fix(newsSlides(n, lang));
    else if (kind === 'news-index') {
      const cat = el.dataset.cat;
      el.innerHTML = fix(newsList(n.filter((x) => (cat ? x.category === cat || (x.category === 'neu' && cat === 'hb-péiteng') : x.category !== 'archiv')), lang));
    } else if (kind === 'team-panel') {
      const team = t.find((x) => x.id === el.dataset.teamId);
      if (team) el.outerHTML = fix(teamPanel(team, lang, el.classList.contains('is-compact')));
    } else if (kind === 'news-draft') {
      const id = decodeURIComponent(location.hash.slice(1));
      const item = n.find((x) => x.id === id);
      el.innerHTML = item
        ? fix(`${item.image ? `<figure><img src="${esc(storage.imageUrl(item.image))}" alt=""></figure>` : ''}<h2>${esc(item.title)}</h2>${item.date ? `<p><time>${esc(item.date)}</time></p>` : ''}${showUrls(item.html || `<p>${esc(item.excerpt)}</p>`)}`)
        : '<p>Dëse Beitrag gëtt et net (méi).</p>';
    }
  }
  // Klassement-Ligen (FLH-Liga-Nummer der Equippen) und eigene Matcher an die Spiele-Anzeige melden
  const tablesEl = $('[data-tables]');
  if (tablesEl) tablesEl.dataset.classes = JSON.stringify(t.filter((x) => x.flhClass && MAIN_TABLE_TEAMS.includes(x.flh ?? '')).map((x) => ({ team: x.flh, classId: x.flhClass })));
  clearTimeout(dataTimer);
  dataTimer = window.setTimeout(() => dispatchEvent(new CustomEvent('hbp:data', { detail: { matches: ownMatches() } })), 400);
  // Fotos in den Bausteinen (idb: → Blob-Adresse)
  for (const img of $$<HTMLImageElement>('[data-render] img')) {
    const s = img.getAttribute('src') || '';
    if (s.startsWith('idb:')) img.src = storage.imageUrl(s);
  }
  if (editing) markEditable();
}

function apply() {
  remember();
  const texts = state.texts[lang] ?? {};
  for (const el of $$('[data-edit]')) {
    const v = texts[el.dataset.edit!];
    const next = v ?? el.dataset.orig ?? '';
    if (el.textContent !== next && document.activeElement !== el) el.textContent = next;
  }
  const html = state.html[lang] ?? {};
  for (const el of $$('[data-edit-html]')) {
    if (document.activeElement === el) continue;
    const v = html[el.dataset.editHtml!];
    el.innerHTML = v !== undefined ? showUrls(v) : el.dataset.orig ?? '';
  }
  for (const img of $$<HTMLImageElement>('main img[data-orig]')) {
    const p = state.photos[img.dataset.orig!];
    img.hidden = p === '';
    img.src = p ? storage.imageUrl(p) : img.dataset.orig!;
  }
  render();
  remember();
  const pairs = sitePairs();
  for (const [node, orig] of textNodes) { const v = swap(orig, pairs); if (node.data !== v) node.data = v; }
  for (const a of $$<HTMLAnchorElement>('a[data-orig-href]')) {
    const o = a.dataset.origHref!;
    const v = state.links[o] ?? swapHref(o, pairs);
    if (a.getAttribute('href') !== v) a.setAttribute('href', v);
  }
  // Hallen-Karten: neue Koordinaten
  for (const sec of $$('.hall-map[data-hall]')) {
    const i = ((base.site as { halls?: { id: string }[] }).halls ?? []).findIndex((h) => h.id === sec.dataset.hall);
    const frame = $<HTMLIFrameElement>('iframe', sec);
    if (i < 0 || !frame) continue;
    frame.dataset.orig ??= frame.src;
    const lat = state.site[`halls.${i}.lat`], lon = state.site[`halls.${i}.lon`];
    const src = lat || lon ? osm(Number(lat ?? getPath(base.site, `halls.${i}.lat`)), Number(lon ?? getPath(base.site, `halls.${i}.lon`))) : frame.dataset.orig;
    if (frame.src !== src) frame.src = src;
  }
}

/* ---------------- Änderungen merken ---------------- */
let snapTimer = 0;
function changed(snapshot = true) {
  if (snapshot) {
    const cur = JSON.stringify(state);
    if (undo[undo.length - 1] !== cur) undo.push(cur);
    if (undo.length > 80) undo.shift();
  }
  updateBar();
}
function beforeChange() {
  // vor einer Änderung den alten Stand sichern (einmal pro Tipp-Pause)
  if (snapTimer) return;
  undo.push(JSON.stringify(state));
  snapTimer = window.setTimeout(() => (snapTimer = 0), 900);
}
const dirty = () => JSON.stringify(state) !== savedJson;

function setText(key: string, value: string, orig: string) {
  beforeChange();
  const m = (state.texts[lang] ??= {});
  if (value === orig) delete m[key]; else m[key] = value;
  changed(false);
}
function setHtml(key: string, value: string, orig: string) {
  beforeChange();
  const m = (state.html[lang] ??= {});
  if (value === orig) delete m[key]; else m[key] = value;
  changed(false);
}

/* ---------------- Bearbeiten auf der Seite ---------------- */
function markEditable() {
  for (const el of $$('[data-edit]')) { el.setAttribute('contenteditable', 'plaintext-only'); el.spellcheck = true; }
  for (const el of $$('[data-edit-html]')) el.setAttribute('contenteditable', 'true');
}
function setEditing(on: boolean) {
  editing = on;
  document.body.classList.toggle('is-editing', on);
  if (on) markEditable();
  else for (const el of $$('[contenteditable]')) el.removeAttribute('contenteditable');
  updateBar();
}

document.addEventListener('input', (ev) => {
  if (!editing) return;
  const el = ev.target as HTMLElement;
  const t = el.closest<HTMLElement>('[data-edit]');
  if (t) return setText(t.dataset.edit!, t.textContent ?? '', t.dataset.orig ?? '');
  const h = el.closest<HTMLElement>('[data-edit-html]');
  if (h) setHtml(h.dataset.editHtml!, readHtml(h), h.dataset.orig ?? '');
});
// Enter in einzeiligen Texten beendet die Eingabe
document.addEventListener('keydown', (ev) => {
  if (editing && ev.key === 'Enter' && (ev.target as HTMLElement).closest('[data-edit]')) { ev.preventDefault(); (ev.target as HTMLElement).blur(); }
});
// Beim Bearbeiten öffnen Links und Fotos nichts
document.addEventListener('click', (ev) => {
  if (!editing) return;
  const el = ev.target as HTMLElement;
  if (el.closest('.hbp-ui')) return;
  const img = el.closest('img') as HTMLImageElement | null;
  if (img && img.closest('main') && !img.closest('[data-render]')) {
    ev.preventDefault();
    ev.stopPropagation();
    return pickPhoto(img);
  }
  const link = el.closest<HTMLAnchorElement>('a[data-orig-href]');
  if (link && link.closest('main, .shorts') && !link.closest('[contenteditable], [data-render]')) {
    ev.preventDefault();
    ev.stopPropagation();
    return pickLink(link);
  }
  if (el.closest('main a') && (el.closest('[contenteditable]') || el.closest('[data-render]'))) ev.preventDefault();
}, true);

/* Foto wählen, verkleinern, ablegen */
function chooseFile(capture = false): Promise<File | null> {
  return new Promise((res) => {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = 'image/*';
    if (capture) i.setAttribute('capture', 'environment');
    i.onchange = () => res(i.files?.[0] ?? null);
    i.addEventListener('cancel', () => res(null));
    i.click();
  });
}
async function shrink(file: File, max = 2000): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob((b) => res(b!), file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.86));
}
async function uploadPhoto(): Promise<string | null> {
  const f = await chooseFile();
  if (!f) return null;
  toast('Foto gëtt gelueden …');
  const path = await storage.uploadImage(await shrink(f), f.name);
  toast('Foto ersat. Net vergiessen ze späicheren.');
  return path;
}
async function pickPhoto(img: HTMLImageElement) {
  const action = await menu(img, [
    ['new', 'Anert Foto wielen'],
    ['hide', img.hidden ? 'Erëm weisen' : 'Foto verstoppen'],
    ['orig', 'Original-Foto'],
  ]);
  const inHtml = img.closest<HTMLElement>('[data-edit-html]');
  if (action === 'new') {
    const p = await uploadPhoto();
    if (!p) return;
    if (inHtml) {
      img.src = storage.imageUrl(p);
      img.dataset.key = p;
      setHtml(inHtml.dataset.editHtml!, readHtml(inHtml), inHtml.dataset.orig ?? '');
    } else {
      beforeChange();
      state.photos[img.dataset.orig!] = p;
      apply();
      changed(false);
    }
  } else if (action === 'hide') {
    if (inHtml) { img.closest('figure')?.remove() ?? img.remove(); setHtml(inHtml.dataset.editHtml!, readHtml(inHtml), inHtml.dataset.orig ?? ''); }
    else {
      beforeChange();
      if (img.hidden) delete state.photos[img.dataset.orig!];
      else state.photos[img.dataset.orig!] = '';
      apply();
      changed(false);
    }
  } else if (action === 'orig' && !inHtml) {
    beforeChange(); delete state.photos[img.dataset.orig!]; apply(); changed(false);
  }
}

/* Link ändern: neue Adresse für diesen Link (gilt für alle Links mit derselben Original-Adresse) */
async function pickLink(a: HTMLAnchorElement) {
  const orig = a.dataset.origHref!;
  const action = await menu(a, [['edit', 'Link änneren'], ['orig', 'Original-Link'], ['open', 'Link opmaachen']]);
  if (action === 'open') return void window.open(a.href, '_blank', 'noopener');
  if (action === 'edit') {
    const v = prompt('Neien Link (z. B. https://… , mailto:… oder /club/):', a.getAttribute('href') ?? '');
    if (v === null) return;
    beforeChange();
    if (!v.trim() || v.trim() === orig) delete state.links[orig]; else state.links[orig] = v.trim();
  } else if (action === 'orig') { beforeChange(); delete state.links[orig]; } else return;
  apply();
  changed(false);
  toast('Link geännert. Net vergiessen ze späicheren.');
}

/* Kleines Auswahlmenü an einer Stelle */
function menu(anchor: HTMLElement, items: [string, string][]): Promise<string | null> {
  return new Promise((res) => {
    $('.hbp-menu')?.remove();
    const m = document.createElement('div');
    m.className = 'hbp-ui hbp-menu';
    m.innerHTML = items.map(([id, label]) => `<button type="button" data-id="${id}">${esc(label)}</button>`).join('');
    document.body.append(m);
    const r = anchor.getBoundingClientRect();
    m.style.top = `${Math.max(8, Math.min(innerHeight - m.offsetHeight - 8, r.top + 12))}px`;
    m.style.left = `${Math.max(8, Math.min(innerWidth - m.offsetWidth - 8, r.left + 12))}px`;
    (m.firstElementChild as HTMLElement).focus();
    const done = (v: string | null) => { m.remove(); document.removeEventListener('pointerdown', outside, true); res(v); };
    const outside = (e: Event) => { if (!m.contains(e.target as Node)) done(null); };
    setTimeout(() => document.addEventListener('pointerdown', outside, true));
    m.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('button'); if (b) done(b.dataset.id!); });
    m.addEventListener('keydown', (e) => { if (e.key === 'Escape') done(null); });
  });
}

/* ---------------- Werkzeugleiste ---------------- */
let bar: HTMLElement;
function buildBar() {
  bar = document.createElement('div');
  bar.className = 'hbp-ui hbp-bar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Admin');
  bar.innerHTML = `
    <span class="hbp-status" aria-live="polite"></span>
    <div class="hbp-format" hidden>
      <button type="button" data-cmd="bold" title="Fett"><b>F</b></button>
      <button type="button" data-cmd="italic" title="Kursiv"><i>K</i></button>
      <button type="button" data-cmd="h3" title="Iwwerschrëft">Ü</button>
      <button type="button" data-cmd="ul" title="Lëscht">• Lëscht</button>
      <button type="button" data-cmd="link" title="Link">Link</button>
      <button type="button" data-cmd="photo" title="Foto drasetzen">+ Foto</button>
    </div>
    <button type="button" data-act="edit" class="is-toggle"></button>
    <button type="button" data-act="manage">Verwalten</button>
    <button type="button" data-act="undo">Réckgängeg</button>
    <button type="button" data-act="save" class="is-main">Späicheren</button>
    <button type="button" data-act="more" aria-haspopup="menu">Méi</button>`;
  document.body.append(bar);
  document.body.classList.add('has-hbp-bar');
  bar.addEventListener('mousedown', (e) => { if ((e.target as HTMLElement).closest('.hbp-format')) e.preventDefault(); });
  bar.addEventListener('click', async (e) => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b) return;
    const act = b.dataset.act, cmd = b.dataset.cmd;
    if (cmd) return format(cmd);
    if (act === 'edit') setEditing(!editing);
    if (act === 'manage') openPanel();
    if (act === 'undo') doUndo();
    if (act === 'save') save();
    if (act === 'more') {
      const v = await menu(b, [['help', 'Kuerz-Uleedung'], ['page', 'Dës Säit op Original'], ['all', 'Alles op Original'], ['logout', 'Ofmellen']]);
      if (v === 'help') help();
      if (v === 'page') resetPage();
      if (v === 'all' && confirm('Alles op den Original-Zoustand zrécksetzen? Dat kann een net réckgängeg maachen.')) { await storage.resetContent(); state = emptyState(); savedJson = JSON.stringify(state); undo = []; apply(); changed(false); toast('Alles op Original zréckgesat.'); }
      if (v === 'logout') { if (dirty() && !confirm('Et gëtt Ännerungen, déi net gespäichert sinn. Trotzdeem ofmellen?')) return; await storage.logout(); location.hash = ''; location.reload(); }
    }
  });
  document.addEventListener('focusin', () => {
    const inHtml = editing && !!(document.activeElement as HTMLElement)?.closest?.('[data-edit-html]');
    $('.hbp-format', bar)!.hidden = !inHtml;
  });
  updateBar();
}
function updateBar() {
  if (!bar) return;
  $('[data-act="edit"]', bar)!.textContent = editing ? 'Fäerdeg' : 'Beaarbechten';
  $('[data-act="edit"]', bar)!.setAttribute('aria-pressed', String(editing));
  ($('[data-act="undo"]', bar) as HTMLButtonElement).disabled = !undo.length;
  ($('[data-act="save"]', bar) as HTMLButtonElement).disabled = !dirty();
  $('.hbp-status', bar)!.textContent = dirty() ? 'Net gespäichert' : SITE_STATUS;
}
const SITE_STATUS = 'Alles gespäichert';

function format(cmd: string) {
  const host = (document.getSelection()?.anchorNode?.parentElement as HTMLElement | null)?.closest<HTMLElement>('[data-edit-html]');
  if (!host) return toast('Klick fir d’éischt an en Text.');
  if (cmd === 'bold' || cmd === 'italic') document.execCommand(cmd);
  if (cmd === 'h3') document.execCommand('formatBlock', false, document.queryCommandValue('formatBlock') === 'h3' ? 'p' : 'h3');
  if (cmd === 'ul') document.execCommand('insertUnorderedList');
  if (cmd === 'link') {
    const url = prompt('Link (z. B. https://… oder /club/):', 'https://');
    if (url === null) return;
    if (url.trim() && url.trim() !== 'https://') document.execCommand('createLink', false, url.trim());
    else document.execCommand('unlink');
  }
  if (cmd === 'photo') {
    const range = document.getSelection()?.getRangeAt(0)?.cloneRange();
    uploadPhoto().then((p) => {
      if (!p || !range) return;
      const sel = document.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('insertHTML', false, `<figure><img src="${storage.imageUrl(p)}" data-key="${p}" alt=""></figure>`);
      setHtml(host.dataset.editHtml!, readHtml(host), host.dataset.orig ?? '');
    });
    return;
  }
  setHtml(host.dataset.editHtml!, readHtml(host), host.dataset.orig ?? '');
}

function doUndo() {
  const prev = undo.pop();
  if (!prev) return;
  state = JSON.parse(prev);
  (document.activeElement as HTMLElement)?.blur?.();
  apply();
  if (panel?.open) drawPanel();
  updateBar();
}

async function save() {
  try {
    await storage.saveContent(state);
    savedJson = JSON.stringify(state);
    updateBar();
    toast('Gespäichert.');
  } catch (e) {
    toast(`Späicheren huet net geklappt: ${(e as Error).message}. Probéier et nach eng Kéier.`, true);
  }
}

function resetPage() {
  beforeChange();
  for (const l of LANGS) {
    delete state.html[l]?.[`page:${path}`];
    delete state.texts[l]?.[`title:${path}`];
  }
  apply();
  changed(false);
  toast('Dës Säit ass erëm am Original. Späicheren net vergiessen.');
}

function help() {
  const d = dialog('Kuerz-Uleedung', `
    <ol class="hbp-help">
      <li><b>Beaarbechten</b> drécken. Dann en Text uklicken an tippen. Bei Säitentexter erschéngt eng kleng Leescht fir Fett, Iwwerschrëft, Lëscht, Link a Foto.</li>
      <li><b>Fotoen</b>: am Beaarbechte-Modus e Foto uklicken → anert Foto wielen, verstoppen oder Original.</li>
      <li><b>Linken</b>: am Beaarbechte-Modus e Link uklicken → neien Link, Original oder opmaachen.</li>
      <li><b>Verwalten</b>: Equippen (Numm, Trikotnummer, Joergäng, Trainer, Trainingszäiten mat Hal, FLH-Liga fir de Klassement), eegen Matcher, Neiegkeeten, Partner a Club (Adressen, E-Mailen, Hallen, Linken, Bank).</li>
      <li><b>Späicheren</b> net vergiessen. <b>Réckgängeg</b> mécht de leschte Schrëtt zréck.</li>
      <li>Sprooch wiesselen: uewen LB · FR · DE. All Sprooch huet hir eegen Texter.</li>
    </ol>`);
  d.showModal();
}

/* ---------------- Verwalten: Equippen, Neiegkeeten, Partner ---------------- */
let panel: HTMLDialogElement | null = null;
let tab: 'teams' | 'matches' | 'news' | 'partners' | 'club' = 'teams';
let openItem: string | null = null;
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function dialog(title: string, body: string, cls = '') {
  const d = document.createElement('dialog');
  d.className = `hbp-ui hbp-dialog ${cls}`;
  d.innerHTML = `<div class="hbp-dialog-head"><h2>${esc(title)}</h2><button type="button" class="hbp-x" aria-label="Zoumaachen">×</button></div><div class="hbp-dialog-body">${body}</div>`;
  document.body.append(d);
  $('.hbp-x', d)!.addEventListener('click', () => d.close());
  d.addEventListener('close', () => { if (d !== panel) d.remove(); });
  return d;
}

function openPanel() {
  if (!panel) {
    panel = dialog('Verwalten', '', 'hbp-panel');
    panel.addEventListener('input', onPanelInput);
    panel.addEventListener('change', onPanelInput);
    panel.addEventListener('click', onPanelClick);
  }
  drawPanel();
  panel.showModal();
}

const field = (label: string, name: string, value: string, attrs = '') =>
  `<label class="hbp-field"><span>${esc(label)}</span><input name="${name}" value="${esc(value)}" ${attrs}></label>`;

function drawPanel() {
  if (!panel) return;
  const body = $('.hbp-dialog-body', panel)!;
  const tabs = `<div class="hbp-tabs" role="tablist">${([['teams', 'Equippen'], ['matches', 'Matcher'], ['news', 'Neiegkeeten'], ['partners', 'Partner'], ['club', 'Club']] as const)
    .map(([id, l]) => `<button type="button" role="tab" data-tab="${id}" aria-selected="${tab === id}">${l}</button>`).join('')}</div>`;
  let html = '';
  if (tab === 'teams') {
    html = `<p class="hbp-hint">Dës Donnéeë gesäit een op der Startsäit (Trikoten an Trainingszäiten), op de Säite vun den Equippen an op der Trainingsplang-Säit.</p><ul class="hbp-list">${teams().map((t, i) => `
      <li class="${openItem === t.id ? 'is-open' : ''}${t.hidden ? ' is-hidden' : ''}">
        <div class="hbp-row"><button type="button" class="hbp-open" data-open="${t.id}"><span class="hbp-nr">${esc(t.nr)}</span>${esc(t.name.lb)}${t.hidden ? ' <em>(verstoppt)</em>' : ''}</button>
        <span class="hbp-move"><button type="button" data-move="${i}" data-dir="-1" aria-label="Erop">↑</button><button type="button" data-move="${i}" data-dir="1" aria-label="Erof">↓</button></span></div>
        ${openItem === t.id ? `<div class="hbp-form" data-team="${i}">
          <div class="hbp-grid3">${field('Numm LB', 'name.lb', t.name.lb)}${field('Numm FR', 'name.fr', t.name.fr)}${field('Numm DE', 'name.de', t.name.de)}</div>
          <div class="hbp-grid3">${field('Trikotnummer', 'nr', t.nr, 'maxlength="3"')}${field('Joergäng', 'years', t.years)}<label class="hbp-field"><span>Grupp</span><select name="group"><option value="seniors"${t.group === 'seniors' ? ' selected' : ''}>Senioren</option><option value="youth"${t.group === 'youth' ? ' selected' : ''}>Jugend</option></select></label></div>
          ${field('Trainer', 'coach', t.coach)}${field('Championnat / Info', 'league', t.league)}
          <div class="hbp-grid3">${field('FLH-Numm', 'flh', t.flh ?? '', 'placeholder="Hären 1" title="Esou wéi d’Equipe an de FLH-Matcher heescht"')}${field('FLH-Liga-Nr. (Klassement)', 'flhClass', t.flhClass ?? '', 'inputmode="numeric" title="All Saison nei: Nummer vun der Liga op flh.lu (lId=…)"')}${field('Säit (Adress)', 'page', t.page, 'placeholder="/hären-i/"')}</div>
          <fieldset><legend>Trainingszäiten</legend>${t.training.map((r, j) => `<div class="hbp-train" data-row="${j}">
            <select name="day" aria-label="Dag">${DAYS.map((d) => `<option value="${d}"${r.day === d ? ' selected' : ''}>${UI.lb[('day.' + d) as 'day.mon']}</option>`).join('')}</select>
            <input name="time" value="${esc(r.time)}" aria-label="Auerzäit" placeholder="17:30 – 19:00">
            <input name="hall" value="${esc(r.hall)}" aria-label="Hal" placeholder="Bim Diederich, Péiteng">
            <button type="button" data-delrow="${j}" aria-label="Zäit läschen">×</button></div>`).join('')}
            <button type="button" class="hbp-add" data-addrow>+ Trainingszäit</button></fieldset>
          <div class="hbp-actions"><label><input type="checkbox" name="hidden"${t.hidden ? ' checked' : ''}> Verstoppen</label><button type="button" class="hbp-danger" data-del="team">Equipe läschen</button></div>
        </div>` : ''}
      </li>`).join('')}</ul><button type="button" class="hbp-add is-big" data-new="team">+ Nei Equipe</button>`;
  }
  if (tab === 'partners') {
    html = `<p class="hbp-hint">Partner erschéngen als Patches op der Startsäit (Haaptpartner och am Ärmel uewen).</p><ul class="hbp-list hbp-partners">${partners().map((p, i) => `
      <li class="${openItem === p.id ? 'is-open' : ''}${p.hidden ? ' is-hidden' : ''}">
        <div class="hbp-row"><button type="button" class="hbp-open" data-open="${p.id}"><img src="${esc(withBase(storage.imageUrl(p.logo)))}" alt="">${esc(p.name || 'Partner ouni Numm')}${p.tier === 'main' ? ' <em>Haaptpartner</em>' : ''}${p.hidden ? ' <em>(verstoppt)</em>' : ''}</button>
        <span class="hbp-move"><button type="button" data-move="${i}" data-dir="-1" aria-label="Erop">↑</button><button type="button" data-move="${i}" data-dir="1" aria-label="Erof">↓</button></span></div>
        ${openItem === p.id ? `<div class="hbp-form" data-partner="${i}">
          ${field('Numm', 'name', p.name)}${field('Websäit', 'url', p.url, 'type="url" placeholder="https://"')}
          <label class="hbp-field"><span>Kategorie</span><select name="tier"><option value="main"${p.tier === 'main' ? ' selected' : ''}>Haaptpartner</option><option value="partner"${p.tier === 'partner' ? ' selected' : ''}>Partner</option></select></label>
          <div class="hbp-actions"><button type="button" data-logo>Logo ersetzen</button><label><input type="checkbox" name="dark"${p.dark ? ' checked' : ''}> Logo op donkelem Grond</label><label><input type="checkbox" name="hidden"${p.hidden ? ' checked' : ''}> Verstoppen</label><button type="button" class="hbp-danger" data-del="partner">Läschen</button></div>
        </div>` : ''}
      </li>`).join('')}</ul><button type="button" class="hbp-add is-big" data-new="partner">+ Neie Partner</button>`;
  }
  if (tab === 'news') {
    html = `<p class="hbp-hint">Nei Beiträg stinn uewen. Al Beiträg kann een hei verstoppen oder ëmbenennen; hiren Text ännert een direkt op der Säit.</p><button type="button" class="hbp-add is-big" data-new="news">+ Neie Beitrag</button><ul class="hbp-list">${news().map((n, i) => `
      <li class="${openItem === n.id ? 'is-open' : ''}${n.hidden ? ' is-hidden' : ''}">
        <div class="hbp-row"><button type="button" class="hbp-open" data-open="${esc(n.id)}">${n.category === 'neu' ? '<span class="hbp-new">Nei</span>' : ''}${esc(n.title || 'Ouni Titel')}${n.hidden ? ' <em>(verstoppt)</em>' : ''}<small>${esc(n.date)}</small></button></div>
        ${openItem === n.id ? `<div class="hbp-form" data-news="${i}">
          ${field('Titel', 'title', n.title)}
          <div class="hbp-grid3">${field('Datum', 'date', n.date, 'type="date"')}<div class="hbp-field"><span>Foto</span><button type="button" data-newsimg>${n.image ? 'Foto ersetzen' : 'Foto derbäi'}</button></div></div>
          ${n.category === 'neu' ? `<label class="hbp-field"><span>Text (eidel Zeil = neien Abschnitt)</span><textarea name="text" rows="8">${esc((n.html || '').replace(/<\/p>\s*<p>/g, '\n\n').replace(/<[^>]+>/g, ''))}</textarea></label>` : field('Kuerztext', 'excerpt', n.excerpt)}
          <div class="hbp-actions">${n.path ? `<a href="${esc(withBase(href(lang, n.path)))}" target="_blank">Säit opmaachen</a>` : `<a href="${esc(withBase(href(lang, '/noriichten-1/neu/')))}#${encodeURIComponent(n.id)}" target="_blank">Virschau</a>`}<label><input type="checkbox" name="hidden"${n.hidden ? ' checked' : ''}> Verstoppen</label>${n.category === 'neu' ? '<button type="button" class="hbp-danger" data-del="news">Läschen</button>' : ''}</div>
        </div>` : ''}
      </li>`).join('')}</ul>`;
  }
  if (tab === 'matches') {
    const flhTeams = teams().filter((t) => !t.hidden && t.flh);
    const teamName = (flh: string) => flhTeams.find((t) => t.flh === flh)?.name.lb ?? flh;
    html = `<p class="hbp-hint">Championnat- a Coupe-Matcher kommen automatesch vun der FLH. Hei setzt een eegen Matcher derbäi (Frëndschaftsmatch, Turnéier, Coupe …). Si stinn dann op der Startsäit an op der Säit vun der Equipe; mat Tore gëtt et e Resultat.</p><button type="button" class="hbp-add is-big" data-new="match">+ Neie Match</button><ul class="hbp-list">${state.matches.map((m, i) => `
      <li class="${openItem === m.id ? 'is-open' : ''}${m.hidden ? ' is-hidden' : ''}">
        <div class="hbp-row"><button type="button" class="hbp-open" data-open="${esc(m.id)}">${esc(teamName(m.team))} – ${esc(m.opponent || 'Géigner?')}${m.hidden ? ' <em>(verstoppt)</em>' : ''}<small>${esc(m.date)} ${esc(m.time)}</small></button></div>
        ${openItem === m.id ? `<div class="hbp-form" data-match="${i}">
          <div class="hbp-grid3"><label class="hbp-field"><span>Equipe</span><select name="team">${flhTeams.map((t) => `<option value="${esc(t.flh!)}"${m.team === t.flh ? ' selected' : ''}>${esc(t.name.lb)}</option>`).join('')}</select></label>${field('Datum', 'date', m.date, 'type="date"')}${field('Auerzäit', 'time', m.time, 'placeholder="18:00"')}</div>
          <div class="hbp-grid3"><label class="hbp-field"><span>Wou</span><select name="isHome"><option value="1"${m.isHome ? ' selected' : ''}>Doheem</option><option value="0"${!m.isHome ? ' selected' : ''}>Auswäerts</option></select></label>${field('Géigner', 'opponent', m.opponent)}${field('Wat fir e Match', 'competition', m.competition, 'placeholder="Frëndschaftsmatch"')}</div>
          <div class="hbp-grid3">${field('Hal', 'hall', m.hall)}${field('Uertschaft', 'town', m.town)}<div class="hbp-field"><span>Resultat (Péiteng : Géigner)</span><span class="hbp-score"><input name="ours" value="${esc(m.ours)}" inputmode="numeric" aria-label="Tore Péiteng"> : <input name="theirs" value="${esc(m.theirs)}" inputmode="numeric" aria-label="Tore Géigner"></span></div></div>
          <div class="hbp-actions"><label><input type="checkbox" name="hidden"${m.hidden ? ' checked' : ''}> Verstoppen</label><button type="button" class="hbp-danger" data-del="match">Läschen</button></div>
        </div>` : ''}
      </li>`).join('')}</ul>`;
  }
  if (tab === 'club') {
    html = `<p class="hbp-hint">Dës Donnéeë stinn ënnen op all Säit, am Menü ënner Kontakt, op der Kontakt- an Impressum-Säit an op de Säite vun de Sportshalen. Eidel loossen = Original.</p>${siteFields().map(([title, fields]) => `<fieldset class="hbp-form" data-site><legend>${esc(title)}</legend>${fields.map(([k, label]) => field(label, k, state.site[k] ?? String(getPath(base.site, k) ?? ''))).join('')}</fieldset>`).join('')}`;
  }
  const scroll = body.scrollTop;
  body.innerHTML = tabs + html;
  body.scrollTop = scroll;
}

function editList<T>(key: 'teams' | 'partners' | 'news'): T[] {
  if (!state[key]) (state as unknown as Record<string, unknown>)[key] = clone(base[key]);
  return state[key] as unknown as T[];
}

function onPanelInput(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const form = input.closest<HTMLElement>('.hbp-form');
  if (!form || !input.name) return;
  beforeChange();
  const val = input.type === 'checkbox' ? input.checked : input.value;
  if (form.dataset.team) {
    const t = editList<Team>('teams')[+form.dataset.team];
    const row = input.closest<HTMLElement>('.hbp-train');
    if (row) (t.training[+row.dataset.row!] as unknown as Record<string, string>)[input.name] = String(val);
    else if (input.name.startsWith('name.')) t.name[input.name.slice(5) as Lang] = String(val);
    else (t as unknown as Record<string, unknown>)[input.name] = val;
  }
  if (form.dataset.partner) (editList<Partner>('partners')[+form.dataset.partner] as unknown as Record<string, unknown>)[input.name] = val;
  if (form.dataset.match) {
    const m = state.matches[+form.dataset.match] as unknown as Record<string, unknown>;
    m[input.name] = input.name === 'isHome' ? val === '1' : val;
  }
  if (form.dataset.site !== undefined) {
    const orig = String(getPath(base.site, input.name) ?? '');
    if (String(val) === orig || String(val) === '') delete state.site[input.name]; else state.site[input.name] = String(val);
    apply();
    changed(false);
    return;
  }
  if (form.dataset.news) {
    const n = editList<NewsItem>('news')[+form.dataset.news];
    if (input.name === 'text') {
      n.html = String(val).split(/\n\s*\n/).map((p) => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('');
      n.excerpt = String(val).replace(/\s+/g, ' ').trim().slice(0, 160);
    } else (n as unknown as Record<string, unknown>)[input.name] = val;
  }
  render();
  changed(false);
  if (input.type === 'checkbox' || input.tagName === 'SELECT') drawPanel();
}

async function onPanelClick(ev: Event) {
  const b = (ev.target as HTMLElement).closest('button');
  if (!b) return;
  const form = b.closest<HTMLElement>('.hbp-form');
  if (b.dataset.tab) { tab = b.dataset.tab as typeof tab; openItem = null; return drawPanel(); }
  if (b.dataset.open) { openItem = openItem === b.dataset.open ? null : b.dataset.open; return drawPanel(); }
  const listKey = tab;
  if (b.dataset.move) {
    beforeChange();
    const list = editList<unknown>(listKey as 'teams' | 'partners' | 'news'), i = +b.dataset.move, j = i + +b.dataset.dir!;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    render(); changed(false); return drawPanel();
  }
  if (b.dataset.new) {
    beforeChange();
    const id = `${b.dataset.new}-${Date.now().toString(36)}`;
    if (b.dataset.new === 'team') editList<Team>('teams').push({ id, nr: '', group: 'youth', name: { lb: 'Nei Equipe', fr: 'Nouvelle équipe', de: 'Neue Mannschaft' }, league: '', years: '', coach: '', photo: '', page: '', training: [] });
    if (b.dataset.new === 'partner') {
      const logo = await uploadPhoto();
      if (!logo) return;
      editList<Partner>('partners').push({ id, name: '', logo, url: '', tier: 'partner' });
    }
    if (b.dataset.new === 'news') editList<NewsItem>('news').unshift({ id, title: 'Neie Beitrag', date: new Date().toISOString().slice(0, 10), path: '', image: '', excerpt: '', category: 'neu', html: '' });
    if (b.dataset.new === 'match') state.matches.unshift({ id, team: teams().find((t) => !t.hidden && t.flh)?.flh ?? '', date: new Date().toISOString().slice(0, 10), time: '', isHome: true, opponent: '', hall: 'Centre sportif Bim Diederich', town: 'Péiteng', ours: '', theirs: '', competition: '' });
    openItem = id;
    render(); changed(false); return drawPanel();
  }
  if (!form) return;
  if (b.dataset.addrow !== undefined || b.dataset.delrow) {
    beforeChange();
    const t = editList<Team>('teams')[+form.dataset.team!];
    if (b.dataset.delrow) t.training.splice(+b.dataset.delrow, 1);
    else t.training.push({ day: 'tue', time: '', hall: 'Bim Diederich, Péiteng' });
    render(); changed(false); return drawPanel();
  }
  if (b.dataset.del) {
    if (!confirm('Wierklech läschen?')) return;
    beforeChange();
    if (form.dataset.match) state.matches.splice(+form.dataset.match, 1);
    else editList<unknown>(listKey as 'teams' | 'partners' | 'news').splice(+(form.dataset.team ?? form.dataset.partner ?? form.dataset.news)!, 1);
    openItem = null;
    render(); changed(false); return drawPanel();
  }
  if (b.dataset.logo !== undefined) {
    const logo = await uploadPhoto();
    if (!logo) return;
    beforeChange();
    editList<Partner>('partners')[+form.dataset.partner!].logo = logo;
    render(); changed(false); return drawPanel();
  }
  if (b.dataset.newsimg !== undefined) {
    const img = await uploadPhoto();
    if (!img) return;
    beforeChange();
    editList<NewsItem>('news')[+form.dataset.news!].image = img;
    render(); changed(false); return drawPanel();
  }
}

/* ---------------- Login ---------------- */
function loginDialog(): Promise<boolean> {
  return new Promise((res) => {
    const d = dialog('Login', `
      <form class="hbp-login" method="dialog">
        <label class="hbp-field"><span>Benotzernumm</span><input name="user" autocomplete="username" required></label>
        <label class="hbp-field"><span>Passwuert</span><input name="pass" type="password" autocomplete="current-password" required></label>
        <p class="hbp-error" role="alert" hidden>Benotzernumm oder Passwuert stëmmt net.</p>
        <button type="submit" class="hbp-submit">Umellen</button>
      </form>`, 'hbp-small');
    const f = $<HTMLFormElement>('form', d)!;
    let ok = false;
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(f);
      ok = await storage.login(String(data.get('user')), String(data.get('pass'))).catch(() => false);
      if (ok) d.close();
      else { $('.hbp-error', d)!.hidden = false; ($('input[name=pass]', d) as HTMLInputElement).select(); }
    });
    d.addEventListener('close', () => res(ok));
    d.showModal();
  });
}

let toastTimer = 0;
function toast(msg: string, error = false) {
  let t = $('.hbp-toast');
  if (!t) { t = document.createElement('div'); t.className = 'hbp-ui hbp-toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = msg;
  t.classList.toggle('is-error', error);
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t!.classList.remove('is-on'), 3200);
}

/* ---------------- Start ---------------- */
export async function start(wantLogin = false) {
  if (!started) {
    started = true;
    try { base = { ...base, ...(await fetch(`${BASE}data.json`).then((r) => r.json())) }; } catch { /* Bausteine bleiben wie gebaut */ }
    state = normalize(await storage.loadContent());
    await preloadImages(state);
    savedJson = JSON.stringify(state);
    apply();
    loggedIn = await storage.isLoggedIn().catch(() => false);
    if (loggedIn) buildBar();
    addEventListener('hashchange', () => render());
    addEventListener('beforeunload', (e) => { if (loggedIn && dirty()) e.preventDefault(); });
  }
  if (wantLogin && !loggedIn) {
    if (await loginDialog()) {
      loggedIn = true;
      buildBar();
      setEditing(true);
      toast('Wëllkomm! Klick en Text oder e Foto un, fir en z’änneren.');
    }
  }
  if (location.hash === '#login') history.replaceState(null, '', location.pathname + location.search);
}
