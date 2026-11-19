/* =========================================================================
 *  SPEICHERN & LOGIN – die einzige Stelle, die für den Betrieb ausgetauscht wird.
 *  Seiten, Editor und Design bleiben gleich (Muster wie Rondpoint/Krombach).
 *
 *  DEMO   (storage: 'demo')   Inhalte, Fotos und Login bleiben in diesem Browser
 *                             (IndexedDB). Nichts verlässt das Gerät.
 *  LIVE   (storage: 'server') Spricht mit einer kleinen api.php auf dem Webspace:
 *                             Inhalt -> content.json, Fotos -> uploads/,
 *                             Passwort nur als Hash auf dem Server.
 *
 *  API-Vertrag für api.php (JSON, Session-Cookie):
 *    POST ?action=login   {user,pass}   -> {ok}
 *    POST ?action=logout                 -> {ok}
 *    GET  ?action=session                -> {loggedIn}
 *    GET  content.json                   -> EditState (fehlt = Original)
 *    POST ?action=save    {content}      -> {ok}
 *    POST ?action=reset                  -> {ok}
 *    POST ?action=upload  multipart file -> {ok,path}
 *
 *  Alternativ (wie Rondpoint): den Stand als Commit über die GitHub-API speichern
 *  und neu bauen lassen. Dann werden texts/teams/partners/news direkt zu
 *  src/data/*.json und src/content/pages/*.json.
 * ========================================================================= */
import type { NewsItem, Partner, Team } from '../lib/render';

export const SITE_CONFIG = {
  storage: 'demo' as 'demo' | 'server',
  api: '/api.php',
  // Nur Demo! Gespeichert ist nur der SHA-256-Hash des Passworts (siehe Demo-Zugang.txt).
  demoUser: 'hbpeiteng',
  demoPassHash: '3d4e3387de1429c95958ef7600de992d02ed647153254f2db0447ca83d4e5087',
};

type ByLang<T> = Partial<Record<'lb' | 'fr' | 'de', Record<string, T>>>;

export interface EditState {
  v: 1;
  /** feste Texte (ui:…) und Seitentitel (title:/pfad/) je Sprache */
  texts: ByLang<string>;
  /** formatierte Bereiche (page:/pfad/, weekend) je Sprache */
  html: ByLang<string>;
  /** ursprüngliche Bildadresse → neue Adresse; '' = ausgeblendet */
  photos: Record<string, string>;
  teams: Team[] | null;
  partners: Partner[] | null;
  news: NewsItem[] | null;
  /** ursprüngliche Link-Adresse → neue Adresse */
  links: Record<string, string>;
  /** Club-Daten (site.json), Feldpfad → neuer Wert, z. B. "emails.club" */
  site: Record<string, string>;
  /** eigene Spiele (zusätzlich zu den FLH-Spielen) */
  matches: OwnMatch[];
  /** direkt im Spiele-Kasten geänderte Felder, je Spiel-ID (gilt auch für FLH-Spiele) */
  matchEdits: Record<string, Record<string, string>>;
}

export interface OwnMatch {
  id: string; team: string; date: string; time: string; isHome: boolean; opponent: string;
  hall: string; town: string; ours: string; theirs: string; competition: string; hidden?: boolean;
}

export const emptyState = (): EditState => ({ v: 1, texts: {}, html: {}, photos: {}, teams: null, partners: null, news: null, links: {}, site: {}, matches: [], matchEdits: {} });
/** ältere gespeicherte Stände bekommen die neuen Felder dazu */
export const normalize = (c: Partial<EditState> | null): EditState => ({ ...emptyState(), ...(c ?? {}) });

export interface SiteStorage {
  hint(): boolean;
  loadContent(): Promise<EditState | null>;
  saveContent(c: EditState): Promise<void>;
  resetContent(): Promise<void>;
  uploadImage(blob: Blob, name: string): Promise<string>;
  imageUrl(path: string): string;
  login(user: string, pass: string): Promise<boolean>;
  logout(): Promise<void>;
  isLoggedIn(): Promise<boolean>;
}

export async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- IndexedDB und Sitzung; beides darf fehlen (privates Fenster) ---------- */
const HINT = 'hbp-edit-hint';
const SESSION = 'hbp-edit-session';
let dbp: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  dbp ??= new Promise((res, rej) => {
    const r = indexedDB.open('hbp-edit', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('kv'); r.result.createObjectStore('img'); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbp;
}
async function idb<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const d = await db();
  return new Promise((res, rej) => {
    const req = fn(d.transaction(store, mode).objectStore(store));
    req.onsuccess = () => res(req.result as T);
    req.onerror = () => rej(req.error);
  });
}
const ls = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* egal */ } },
  del: (k: string) => { try { localStorage.removeItem(k); } catch { /* egal */ } },
};
const ss = {
  get: (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* egal */ } },
  del: (k: string) => { try { sessionStorage.removeItem(k); } catch { /* egal */ } },
};

/* Hochgeladene Demo-Fotos liegen als Blob in IndexedDB; im Inhalt steht "idb:<schlüssel>". */
const blobUrls = new Map<string, string>();
export async function preloadImages(state: EditState) {
  const keys = new Set<string>();
  const scan = (v: unknown) => {
    if (typeof v === 'string') for (const m of v.matchAll(/idb:[\w-]+/g)) keys.add(m[0]);
    else if (v && typeof v === 'object') Object.values(v).forEach(scan);
  };
  scan(state);
  await Promise.all([...keys].filter((k) => !blobUrls.has(k)).map(async (k) => {
    try {
      const blob = await idb<Blob | undefined>('img', 'readonly', (s) => s.get(k.slice(4)));
      if (blob) blobUrls.set(k, URL.createObjectURL(blob));
    } catch { /* fehlt */ }
  }));
}

const demo: SiteStorage = {
  hint: () => ls.get(HINT) === '1' || ss.get(SESSION) === '1',
  async loadContent() {
    try { return (await idb<EditState | undefined>('kv', 'readonly', (s) => s.get('content'))) ?? null; } catch { return null; }
  },
  async saveContent(c) {
    await idb('kv', 'readwrite', (s) => s.put(c, 'content'));
    ls.set(HINT, '1');
  },
  async resetContent() {
    await idb('kv', 'readwrite', (s) => s.delete('content'));
    await idb('img', 'readwrite', (s) => s.clear());
    ls.del(HINT);
  },
  async uploadImage(blob, name) {
    const key = `${Date.now().toString(36)}-${name.replace(/[^\w]+/g, '-').slice(0, 30)}`;
    await idb('img', 'readwrite', (s) => s.put(blob, key));
    blobUrls.set(`idb:${key}`, URL.createObjectURL(blob));
    return `idb:${key}`;
  },
  imageUrl: (p) => (p.startsWith('idb:') ? blobUrls.get(p) ?? '' : p),
  async login(user, pass) {
    const ok = user.trim().toLowerCase() === SITE_CONFIG.demoUser && (await sha256(pass)) === SITE_CONFIG.demoPassHash;
    if (ok) ss.set(SESSION, '1');
    return ok;
  },
  async logout() { ss.del(SESSION); },
  async isLoggedIn() { return ss.get(SESSION) === '1'; },
};

const api = (action: string, body?: unknown) =>
  fetch(`${SITE_CONFIG.api}?action=${action}`, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    headers: body instanceof FormData || body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
  }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Server: ${r.status}`))));

const server: SiteStorage = {
  hint: () => true,
  async loadContent() {
    const r = await fetch('/content.json', { cache: 'no-store' });
    return r.ok ? r.json() : null;
  },
  async saveContent(c) { await api('save', { content: c }); },
  async resetContent() { await api('reset', {}); },
  async uploadImage(blob, name) {
    const f = new FormData();
    f.append('file', blob, name);
    return (await api('upload', f)).path;
  },
  imageUrl: (p) => p,
  async login(user, pass) { return !!(await api('login', { user, pass })).ok; },
  async logout() { await api('logout', {}); },
  async isLoggedIn() { return !!(await api('session')).loggedIn; },
};

export const storage: SiteStorage = SITE_CONFIG.storage === 'server' ? server : demo;
