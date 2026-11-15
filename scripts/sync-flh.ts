/* Holt die ganze Saison und die Klassementer des HB Péiteng von der FLH (Handball4all)
 * nach src/data/flh.json. Läuft vor jedem Bau (npm run build) und kann per Zeitplan laufen.
 * Höflich: eine Anfrage nach der anderen, mit Pause. Schlägt etwas fehl (z. B. Sperre),
 * bleibt der letzte gute Stand stehen und der Bau läuft trotzdem weiter. */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fetchSeason, fetchTables } from '../src/lib/matches.ts';

/* Handball4all erlaubt automatisierten Massenabruf nur mit Lizenz („may not be mass-accessed by a robot
 * without a license“). Dieses Skript läuft deshalb nur, wenn eine Lizenz/Erlaubnis von FLH bzw.
 * Handball4all vorliegt und FLH_LICENSE=1 gesetzt ist. Nicht umgehen. */
if (process.env.FLH_LICENSE !== '1') {
  console.log('FLH-Sync übersprungen: ohne Lizenz von Handball4all kein automatischer Abruf (siehe README).');
  process.exit(0);
}

const OUT = new URL('../src/data/flh.json', import.meta.url);
try {
  const matches = await fetchSeason(600);
  if (!matches.length) throw new Error('keine Matcher erhalten');
  const tables = await fetchTables(matches, 600);
  writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), matches, tables }, null, 1));
  console.log(`FLH: ${matches.length} Matcher, ${tables.length} Klassementer gespeichert`);
} catch (e) {
  const old = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')).updated : 'keinen';
  console.warn(`FLH nicht erreichbar (${(e as Error).message}); behalte Stand vom ${old}`);
  if (!existsSync(OUT)) writeFileSync(OUT, JSON.stringify({ updated: null, matches: [], tables: [] }));
}
