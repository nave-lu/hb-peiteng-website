/* Grunddaten für den Editor (Equippen, Partner, Neiegkeeten, Club-Daten), wie gebaut. */
import { teams, partners, news } from '../lib/content';
import site from '../data/site.json';

export const GET = () =>
  new Response(JSON.stringify({ teams, partners, news, site }), { headers: { 'Content-Type': 'application/json' } });
