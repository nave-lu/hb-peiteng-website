/* Prüft, wann der Live-Punkt leuchtet. Aufruf: node --experimental-strip-types tests/live.check.ts */
import assert from 'node:assert/strict';
import { liveMatch, type Match } from '../src/lib/matches.ts';

const m = (o: Partial<Match>): Match => ({ id: '1', date: '2026-11-14', time: '20:15', team: 'Hären 1', competition: '', home: 'HBC Schiffl.', guest: 'HB Petange', homeGoals: '', guestGoals: '', hall: '', town: '', isHome: false, classId: '1', cls: 'H-PRO', live: false, ...o });
const at = (hm: string, day = '2026-11-14') => new Date(`${day}T${hm}:00`);

assert.equal(liveMatch([m({})], at('19:00')), null, 'vor dem Spiel: aus');
assert.ok(liveMatch([m({})], at('20:30')), 'während des Spiels: an');
assert.equal(liveMatch([m({})], at('22:30')), null, 'nach dem Spiel: aus');
assert.equal(liveMatch([m({ team: 'U13 Mixte' })], at('20:30')), null, 'Jugend zählt nicht');
assert.ok(liveMatch([m({ live: true, date: '2026-11-15' })], at('10:00')), 'FLH-Live-Flag zählt immer');
assert.equal(liveMatch([m({})], at('20:30', '2026-11-15')), null, 'anderer Tag: aus');
console.log('ok');
