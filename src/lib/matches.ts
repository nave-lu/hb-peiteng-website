/* Matcher vum HB Péiteng, automatesch vun der FLH (Handball4all, dieselben Daten wie flh.lu).
 * Wird beim Bauen geholt (Schnappschuss) und im Browser bei jedem Besuch erneuert,
 * die Schnittstelle erlaubt das ausdrücklich (Access-Control-Allow-Origin: *). */
import type { Lang } from '../i18n/ui';

const API = 'https://spo.handball4all.de/service/if_g_json.php?cmd=po&og=95';
const CLUB = /p[ée]tange|p[ée]iteng/i;

export interface Match {
  id: string; date: string; time: string; team: string; competition: string;
  home: string; guest: string; homeGoals: string; guestGoals: string;
  hall: string; town: string; isHome: boolean;
}

/** Klassenkürzel der FLH → Equipe des Clubs (LB) */
function teamOf(sname: string): string {
  const s = sname.toUpperCase();
  if (s.startsWith('H-')) return 'Hären';
  if (s.startsWith('D-')) return 'Dammen';
  const u = s.match(/^U(\d+)([MFJ])?/);
  if (u) return `U${u[1]}${u[2] === 'M' ? ' Mixte' : u[2] === 'F' ? ' Meedercher' : u[2] === 'J' ? ' Jongen' : ''}`;
  return sname;
}

const iso = (d: string) => { const [dd, mm, yy] = d.split('.'); return `20${yy}-${mm}-${dd}`; };
const week = (offsetDays: number) => { const d = new Date(Date.now() + offsetDays * 864e5); return d.toISOString().slice(0, 10); };

async function weekGames(day?: string): Promise<Match[]> {
  const r = await fetch(day ? `${API}&do=${day}` : API);
  if (!r.ok) throw new Error(`FLH ${r.status}`);
  const [data] = await r.json();
  const out: Match[] = [];
  for (const c of data?.content?.classes ?? []) {
    for (const g of c.games ?? []) {
      const homeOurs = CLUB.test(g.gHomeTeam), guestOurs = CLUB.test(g.gGuestTeam);
      if (!homeOurs && !guestOurs) continue;
      out.push({
        id: String(g.gID), date: iso(g.gDate), time: g.gTime, team: teamOf(c.gClassSname), competition: c.gClassLname,
        home: g.gHomeTeam, guest: g.gGuestTeam, homeGoals: String(g.gHomeGoals ?? '').trim(), guestGoals: String(g.gGuestGoals ?? '').trim(),
        hall: g.gGymnasiumName, town: g.gGymnasiumTown, isHome: homeOurs,
      });
    }
  }
  return out;
}

/** Leschte Woch, dës Woch an déi nächst zwou Wochen. */
export async function fetchClubMatches(): Promise<Match[]> {
  const weeks = await Promise.all([week(-7), undefined, week(7), week(14)].map((d) => weekGames(d).catch(() => [] as Match[])));
  const seen = new Set<string>();
  return weeks.flat().filter((m) => !seen.has(m.id) && seen.add(m.id)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

const e = (s: string) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const LOCALE = { lb: 'lb-LU', fr: 'fr-LU', de: 'de-LU' } as const;
const L = {
  lb: { home: 'Doheem', away: 'Auswäerts', result: 'Resultat', none: 'Dës Woch sinn keng Matcher ugesat.' },
  fr: { home: 'À domicile', away: 'À l’extérieur', result: 'Résultat', none: 'Pas de match prévu cette semaine.' },
  de: { home: 'Heim', away: 'Auswärts', result: 'Ergebnis', none: 'Diese Woche sind keine Spiele angesetzt.' },
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

