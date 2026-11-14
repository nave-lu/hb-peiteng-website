/* Für alle Besucher: winziger Starter. Der Editor selbst lädt erst nach „Login“
 * oder wenn in diesem Browser schon Änderungen gespeichert sind. */
import { storage } from './storage';

const load = (login = false) => import('./editor').then((m) => m.start(login));

if (storage.hint() || location.hash === '#login') load(location.hash === '#login');

document.addEventListener('click', (ev) => {
  if (!(ev.target as HTMLElement).closest('[data-login]')) return;
  ev.preventDefault();
  load(true);
});
