/* Matcher vum HB Péiteng, automatesch vun der FLH (Handball4all, dieselben Daten wie flh.lu).
 * Die ganze Saison holt `npm run sync` höflich nacheinander in src/data/flh.json (vor jedem Bau).
 * Im Browser wird nur die laufende Woche und das Klassement nachgeladen (zwischengespeichert),
 * denn die FLH sperrt zu viele Anfragen („Too many requests“). */
import type { Lang } from '../i18n/ui';

const API = 'https://spo.handball4all.de/service/if_g_json.php?cmd=po&og=95';
const CLUB = /p[ée]tange|p[ée]iteng/i;

export interface Match {
  id: string; date: string; time: string; team: string; competition: string;
  home: string; guest: string; homeGoals: string; guestGoals: string;
  hall: string; town: string; isHome: boolean; classId: string; cls: string; live: boolean;
}

export interface TableRow { pos: number; team: string; played: number; won: number; draw: number; lost: number; goals: string; points: number; ours: boolean }
export interface Table { classId: string; team: string; competition: string; rows: TableRow[] }

/** Klassenkürzel der FLH → Equipe des Clubs (LB) */
function teamOf(sname: string): string {
  const s = sname.toUpperCase();
  if (s.startsWith('H-RES')) return 'Hären 2';
  if (s.startsWith('D-RES')) return 'Dammen II';
  if (s.startsWith('H-')) return 'Hären 1';
  if (s.startsWith('D-')) return 'Dammen';
  const u = s.match(/^U(\d+)([MFJ])?/);
  if (u) return `U${u[1]}${u[2] === 'M' ? ' Mixte' : u[2] === 'F' ? ' Meedercher' : u[2] === 'J' ? ' Jongen' : ''}`;
  return sname;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Antwort der FLH lesen; bei Sperre („Too many requests“) oder Fehler wird geworfen. */
async function getJSON(url: string) {
  const r = await fetch(url);
  const text = await r.text();
  if (!r.ok || !text.trimStart().startsWith('[')) throw new Error(`FLH: ${text.slice(0, 60)}`);
  return JSON.parse(text)[0];
}

const iso = (d: string) => { const [dd, mm, yy] = d.split('.'); return `20${yy}-${mm}-${dd}`; };
const week = (offsetDays: number) => { const d = new Date(Date.now() + offsetDays * 864e5); return d.toISOString().slice(0, 10); };

export async function weekGames(day?: string): Promise<Match[]> {
  const data = await getJSON(day ? `${API}&do=${day}` : API);
  const out: Match[] = [];
  for (const c of data?.content?.classes ?? []) {
    for (const g of c.games ?? []) {
      const homeOurs = CLUB.test(g.gHomeTeam), guestOurs = CLUB.test(g.gGuestTeam);
      if (!homeOurs && !guestOurs) continue;
      const ours = homeOurs ? g.gHomeTeam : g.gGuestTeam;
      let team = teamOf(c.gClassSname);
      if (team === 'Hären 1' && /\s(2|II)$/.test(String(ours).trim())) team = 'Hären 2';
      out.push({
        id: String(g.gID), date: iso(g.gDate), time: g.gTime, team, competition: c.gClassLname,
        home: g.gHomeTeam, guest: g.gGuestTeam, homeGoals: String(g.gHomeGoals ?? '').trim(), guestGoals: String(g.gGuestGoals ?? '').trim(),
        hall: g.gGymnasiumName, town: g.gGymnasiumTown, isHome: homeOurs, classId: String(c.gClassID), cls: String(c.gClassSname), live: g.live === true,
      });
    }
  }
  return out;
}

/** Ganz Saison: all Wochen, déi d'FLH bis elo ugesat huet (bis 3 Wochen an d'Zukunft).
 *  Nur für `npm run sync`: nacheinander, mit Pause zwischen den Anfragen. */
export async function fetchSeason(pauseMs = 600): Promise<Match[]> {
  const d = await getJSON(API);
  const limit = week(21);
  const days = Object.keys(d?.menu?.dt?.list ?? {}).filter((x) => x <= limit);
  const all: Match[] = [];
  for (const day of days) { all.push(...(await weekGames(day))); await sleep(pauseMs); }
  return dedupe(all);
}

/** Am selben Tag nach Alter, älteste zuerst: Hären 1, Dammen, Hären 2, Dammen II, dann U21 … U9. */
const TEAM_ORDER = ['Hären 1', 'Dammen', 'Hären 2', 'Dammen II'];
export const teamRank = (team: string) => {
  const i = TEAM_ORDER.indexOf(team);
  if (i >= 0) return i;
  const age = parseInt(team.replace(/\D/g, ''), 10);
  return age ? 100 - age : 99; // U21 vor U15 vor … U9; Unbekanntes ans Ende
};
const dedupe = (list: Match[]) => {
  const seen = new Set<string>();
  return list
    .filter((m) => !seen.has(m.id) && seen.add(m.id))
    .sort((a, b) => a.date.localeCompare(b.date) || teamRank(a.team) - teamRank(b.team) || a.time.localeCompare(b.time));
};

/** Laufende Woche im Browser: frische Resultate und Live-Status in den Schnappschuss einarbeiten. */
export function mergeMatches(base: Match[], fresh: Match[]): Match[] {
  const byId = new Map(base.map((m) => [m.id, m]));
  for (const m of fresh) byId.set(m.id, m);
  return dedupe([...byId.values()]);
}

export const isCup = (m: Match) => /-C(-|$)/.test(m.cls) || /coupe|cup/i.test(m.competition);

/** Fenster für die Startseite: lescht Woch bis 3 Wochen no vir. */
export function windowMatches(all: Match[], now = new Date()): Match[] {
  const from = new Date(+now - 8 * 864e5).toISOString().slice(0, 10);
  const to = new Date(+now + 22 * 864e5).toISOString().slice(0, 10);
  return all.filter((m) => m.date >= from && m.date <= to);
}

/** Klassementer vun de Championnater, an deenen de Club spillt (Turnéier ouni Tabell falen ewech). */
/** Klassement auf der Startseite: nur Hären und Dammen (Wahl zwischen den beiden). */
export const MAIN_TABLE_TEAMS = ['Hären 1', 'Dammen'];
/** Feste Liga-Nummern aus teams.json als Ersatz, wenn eine Equipe in den geladenen Wochen nicht spielt. */
export const classStubs = (list: { team: string; classId: string }[]): Match[] =>
  list.map((x) => ({ id: 'stub-' + x.classId, date: '', time: '', team: x.team, competition: '', home: '', guest: '', homeGoals: '', guestGoals: '', hall: '', town: '', isHome: false, classId: x.classId, cls: '', live: false }));

export async function fetchTables(matches: Match[], pauseMs = 0): Promise<Table[]> {
  const classes = new Map<string, Match>();
  for (const m of matches) if (!isCup(m) && !classes.has(m.classId)) classes.set(m.classId, m);
  const out: (Table | null)[] = [];
  for (const m of classes.values()) {
    out.push(await (async () => {
    try {
      const d = await getJSON(`https://spo.handball4all.de/service/if_g_json.php?cmd=ps&cl=${m.classId}&og=95`);
      const rows: TableRow[] = (d?.content?.score ?? []).map((x: Record<string, unknown>) => ({
        pos: Number(x.tabScore), team: String(x.tabTeamname), played: Number(x.numPlayedGames), won: Number(x.numWonGames),
        draw: Number(x.numEqualGames), lost: Number(x.numLostGames), goals: `${x.numGoalsShot}:${x.numGoalsGot}`, points: Number(x.pointsPlus), ours: CLUB.test(String(x.tabTeamname)),
      }));
      return rows.length > 1 ? { classId: m.classId, team: m.team, competition: m.competition, rows } : null;
    } catch { return null; }
    })());
    if (pauseMs) await sleep(pauseMs);
  }
  const order = ['Hären 1', 'Hären 2', 'Dammen'];
  return (out.filter(Boolean) as Table[]).sort((a, b) => ((order.indexOf(a.team) + 1 || 9) - (order.indexOf(b.team) + 1 || 9)) || a.team.localeCompare(b.team));
}

/** Leeft elo e Match vun den Hären oder Dammen? (Live-Flag vun der FLH oder bannent der Spillzäit) */
export function liveMatch(matches: Match[], now = new Date()): Match | null {
  const p2 = (n: number) => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())}`;
  return matches.find((m) => {
    if (!m.team.startsWith('Hären') && m.team !== 'Dammen') return false;
    if (m.live) return true;
    if (m.date !== today || !/^\d{1,2}:\d{2}$/.test(m.time)) return false;
    const [h, min] = m.time.split(':').map(Number);
    const start = new Date(now); start.setHours(h, min, 0, 0);
    const mins = (+now - +start) / 60000;
    return mins >= -5 && mins <= 100;
  }) ?? null;
}

const e = (s: string) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const LOCALE = { lb: 'lb-LU', fr: 'fr-LU', de: 'de-LU' } as const;
/** Liga-Seite auf flh.lu (ganze Saison, alle Spiele, Klassement) */
export const flhLeague = (classId: string) => `https://www.flh.lu/championnat#/league?ogId=95&lId=${encodeURIComponent(classId)}`;
const flhLink = (classId: string, label: string) => `<a class="flh-link" href="${flhLeague(classId)}" target="_blank" rel="noopener">${label}</a>`;
const L = {
  lb: { season: 'Ganz Saison op flh.lu', date: 'Datum', homeTeam: 'Heemequipe', guestTeam: 'Gaascht', noGames: 'D’FLH huet fir dës Equipe nach keng Matcher ugesat.', home: 'Doheem', away: 'Auswäerts', result: 'Resultat', none: 'Dës Woch sinn keng Matcher ugesat.', cols: ['Equipe', 'M', 'G', 'U', 'V', 'Goaler', 'Pt'] },
  fr: { season: 'Toute la saison sur flh.lu', date: 'Date', homeTeam: 'Domicile', guestTeam: 'Visiteur', noGames: 'La FLH n’a pas encore programmé de match pour cette équipe.', home: 'À domicile', away: 'À l’extérieur', result: 'Résultat', none: 'Pas de match prévu cette semaine.', cols: ['Équipe', 'J', 'G', 'N', 'P', 'Buts', 'Pts'] },
  de: { season: 'Ganze Saison auf flh.lu', date: 'Datum', homeTeam: 'Heim', guestTeam: 'Gast', noGames: 'Die FLH hat für diese Mannschaft noch keine Spiele angesetzt.', home: 'Heim', away: 'Auswärts', result: 'Ergebnis', none: 'Diese Woche sind keine Spiele angesetzt.', cols: ['Team', 'Sp', 'S', 'U', 'N', 'Tore', 'Pkt'] },
};

export function matchCards(matches: Match[], lang: Lang): string {
  if (!matches.length) return `<p class="match-none">${L[lang].none}</p>`;
  const today = new Date().toISOString().slice(0, 10);
  // Resultater vun der leschter Woch zu Ufank, dann déi nächst Matcher
  return matches
    .map((m) => {
      const d = new Date(m.date + 'T12:00:00');
      const played = m.homeGoals !== '' && m.guestGoals !== '';
      const past = m.date < today;
      const ours = (n: string) => (CLUB.test(n) ? ' is-ours' : '');
      const won = played && (m.isHome ? +m.homeGoals > +m.guestGoals : +m.guestGoals > +m.homeGoals);
      return `<article class="match${played ? ' is-played' : ''}${past && !played ? ' is-past' : ''}${won ? ' is-won' : ''}">
  <header><span class="match-team">${e(m.team)}</span><span class="match-where">${m.isHome ? L[lang].home : L[lang].away}</span></header>
  <p class="match-date"><span class="d">${e(d.toLocaleDateString(LOCALE[lang], { weekday: 'short', day: 'numeric', month: 'short' }))}</span><span class="t">${e(m.time)}</span></p>
  <div class="match-teams">
    <span class="${ours(m.home).trim()}">${e(m.home)}</span>${played ? `<b>${e(m.homeGoals)}</b>` : ''}
    <span class="${ours(m.guest).trim()}">${e(m.guest)}</span>${played ? `<b>${e(m.guestGoals)}</b>` : ''}
  </div>
  <p class="match-hall">${e(m.hall)}${m.town ? `, ${e(m.town)}` : ''}</p>
  <p class="match-comp">${e(m.competition)}</p>
</article>`;
    })
    .join('');
}


export function tablesHtml(tables: Table[], lang: Lang): string {
  if (!tables.length) return '';
  const c = L[lang].cols;
  const tabs = tables.map((t, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-tab="${t.classId}">${e(t.team)}</button>`).join('');
  const panels = tables.map((t, i) => `<div class="table-panel" role="tabpanel" data-panel="${t.classId}"${i ? ' hidden' : ''}>
  <p class="table-comp">${t.competition ? `${e(t.competition)} · ` : ''}${flhLink(t.classId, L[lang].season)}</p>
  <table class="standings"><thead><tr><th>#</th><th>${c[0]}</th><th>${c[1]}</th><th>${c[2]}</th><th>${c[3]}</th><th>${c[4]}</th><th>${c[5]}</th><th>${c[6]}</th></tr></thead>
  <tbody>${t.rows.map((r) => `<tr${r.ours ? ' class="is-ours"' : ''}><td>${r.pos}</td><td>${e(r.team)}</td><td>${r.played}</td><td>${r.won}</td><td>${r.draw}</td><td>${r.lost}</td><td>${r.goals}</td><td><b>${r.points}</b></td></tr>`).join('')}</tbody></table>
</div>`).join('');
  return `${tables.length > 1 ? `<div class="table-tabs" role="tablist">${tabs}</div>` : ''}${panels}`;
}

/** Alle Matcher einer Equipe als Tabelle, nach Wettbewerb gruppiert (Championnat, Coupe …). */
export function resultsHtml(matches: Match[], lang: Lang): string {
  if (!matches.length) return `<p class="results-none">${L[lang].noGames}</p>`;
  const groups = new Map<string, Match[]>();
  for (const m of matches) groups.set(m.competition, [...(groups.get(m.competition) ?? []), m]);
  const fmt = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString(LOCALE[lang], { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' });
  return [...groups].map(([comp, list]) => `<div class="results-head"><h3 class="results-comp">${e(comp)}</h3>${flhLink(list[0].classId, L[lang].season)}</div>
<table class="results"><thead><tr><th>${L[lang].date}</th><th>${L[lang].homeTeam}</th><th>${L[lang].guestTeam}</th><th>${L[lang].result}</th></tr></thead><tbody>${list
    .map((m) => {
      const played = m.homeGoals !== '' && m.guestGoals !== '';
      const won = played && (m.isHome ? +m.homeGoals > +m.guestGoals : +m.guestGoals > +m.homeGoals);
      const lost = played && (m.isHome ? +m.homeGoals < +m.guestGoals : +m.guestGoals < +m.homeGoals);
      return `<tr class="${played ? (won ? 'is-won' : lost ? 'is-lost' : 'is-draw') : 'is-open'}"><td>${e(fmt(m.date))}<span class="r-time">${e(m.time)}</span></td><td${CLUB.test(m.home) ? ' class="is-ours"' : ''}>${e(m.home)}</td><td${CLUB.test(m.guest) ? ' class="is-ours"' : ''}>${e(m.guest)}</td><td class="r-score">${played ? `${e(m.homeGoals)} : ${e(m.guestGoals)}` : '–'}</td></tr>`;
    })
    .join('')}</tbody></table>`).join('');
}

export type LiveMode = 'team' | 'results' | 'table' | 'cup';
export const teamMatches = (all: Match[], team: string, mode: LiveMode) =>
  all.filter((m) => m.team === team && (mode === 'cup' ? isCup(m) : true));

/** Block „Resultater + Klassement“ einer Equipe; dieselbe Funktion beim Bauen und im Browser. */
export function teamLiveHtml(list: Match[], tables: Table[], mode: LiveMode, lang: Lang, h: { results: string; table: string }): string {
  const res = mode !== 'table' ? `<h2>${e(h.results)}</h2>${resultsHtml(list, lang)}` : '';
  const tab = mode !== 'cup' && tables.length ? `<h2>${e(h.table)}</h2><div class="tables-light">${tablesHtml(tables, lang)}</div>` : '';
  return mode === 'table' ? tab + res : res + tab;
}
