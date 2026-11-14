/* Grunddaten für den Editor (Equippen, Partner, Neiegkeeten), wie gebaut. */
import { teams, partners, news } from '../lib/content';

export const GET = () =>
  new Response(JSON.stringify({ teams, partners, news }), { headers: { 'Content-Type': 'application/json' } });
