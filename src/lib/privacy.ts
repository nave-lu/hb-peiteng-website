/* Dateschutzerklärung (DSGVO / RGPD), Stand November 2026.
 * Beschreibt, was die Seite wirklich macht: keine Cookies, keine Statistik, eigene Schriften,
 * Matcher direkt von handball4all (FLH), OpenStreetMap nur auf den Hallen-Seiten, Hosting bei GitHub Pages.
 * Bei anderem Hosting oder neuen Diensten (z. B. Video-Einbettung, Formular) hier anpassen. */
import site from '../data/site.json';
import type { Lang } from '../i18n/ui';

const mail = `<a href="mailto:${site.emails.club}">${site.emails.club}</a>`;
const club = `${site.fullName}<br>${site.address.join('<br>')}<br>${mail}`;
const cnpd = `Commission nationale pour la protection des données (CNPD), 15, Boulevard du Jazz, L-4370 Belvaux, <a href="https://cnpd.public.lu" target="_blank" rel="noopener">cnpd.public.lu</a>`;

const TEXT: Record<Lang, string> = {
  lb: `
<p>Mir huelen de Schutz vun Äre perséinlechen Donnéeën eescht. Hei erkläre mir, wéi eng Donnéeën op dëser Websäit veraarbecht ginn, firwat a wéi eng Rechter Dir hutt (EU-Dateschutz-Grondverordnung, DSGVO).</p>
<h2>1. Verantwortlechen</h2>
<p>${club}</p>
<h2>2. Kuerz zesummegefaasst</h2>
<ul>
<li>Dës Säit setzt <strong>keng Cookien</strong> an an benotzt <strong>keng Statistik- oder Reklammen-Tools</strong>.</li>
<li>D'Schrëften leien op eisem eegene Server, et ginn <strong>keng Google Fonts</strong> gelueden.</li>
<li>Et gëtt <strong>kee Kontaktformulaire</strong>; Dir schreift eis direkt per E-Mail.</li>
</ul>
<h2>3. Hosting a Server-Logbicher</h2>
<p>D'Websäit gëtt vun <strong>GitHub Pages</strong> (GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA) bereetgestallt. Wann Dir eng Säit opmaacht, kritt de Server technesch automatesch Är IP-Adress, Datum an Zäit, déi opgeruffe Säit a Browser-Informatiounen. Dat ass néideg, fir d'Säit auszeliwweren a sécher ze halen (Art. 6 Abs. 1 Bst. f DSGVO). GitHub späichert dës Logbicher nëmme kuerz. D'Iwwerdroung an d'USA geschitt op Basis vun de Garantien, déi d'EU-Kommissioun virgesäit (EU-US Data Privacy Framework bzw. Standardvertragsklauselen). Méi dozou: <a href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener">GitHub Privacy Statement</a>.</p>
<h2>4. Matcher, Resultater a Klassement (FLH)</h2>
<p>D'Matcher, Resultater an d'Klassementer kommen live vun der Fédération Luxembourgeoise de Handball. Är Browser lued se direkt vum Server <strong>spo.handball4all.de</strong> (handball4all, de Service, deen d'FLH dofir benotzt). Dobäi kritt dëse Server Är IP-Adress. Mir weisen domat aktuell Resultater (Art. 6 Abs. 1 Bst. f DSGVO). Fir de Server net ze iwwerlaaschten, gëtt eng Kopie vun de Matcher fir 5 Minutten am <em>sessionStorage</em> vun Ärem Browser gehalen; do sti keng perséinlech Donnéeën dran a si gëtt geläscht, soubal Dir den Tab zoumaacht.</p>
<h2>5. Kaarten (OpenStreetMap)</h2>
<p>Op de Säite vun de Sportshalen weise mir eng Kaart vun <strong>OpenStreetMap</strong> (OpenStreetMap Foundation, St John’s Innovation Centre, Cowley Road, Cambridge, CB4 0WS, Groussbritannien). Nëmmen op dëse Säite lued Äre Browser d'Kaart vun openstreetmap.org a schéckt dobäi Är IP-Adress. Fir Groussbritannien gëtt et en Ugemiessenheetsbeschloss vun der EU-Kommissioun. Rechtsgrondlag: Art. 6 Abs. 1 Bst. f DSGVO (Weebeschreiwung fir Spiller a Supporter). Méi dozou: <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener">OSMF Privacy Policy</a>.</p>
<h2>6. Linken op aner Säiten</h2>
<p>Mir verlinken op aner Websäiten, z. B. Google Maps, flh.lu, flh-live.lu, RTL, YouTube, Vimeo, Facebook an eis Partner. Dës Säite ginn eréischt gelueden, wann Dir op de Link klickt; da gëllt d'Dateschutzerklärung vum jeeweilegen Ubidder.</p>
<h2>7. Kontakt per E-Mail</h2>
<p>Wann Dir eis eng E-Mail schreift, benotze mir Är Donnéeën (Numm, E-Mail-Adress, Inhalt) nëmmen, fir Är Ufro ze beäntweren (Art. 6 Abs. 1 Bst. b an f DSGVO). Mir läschen d'E-Mailen, soubal se net méi gebraucht ginn, wann et keng gesetzlech Openthaltsflicht gëtt.</p>
<h2>8. Fotoen a Nimm vu Spiller</h2>
<p>Op der Säit weise mir Fotoen vu Matcher, Equippen an Evenementer souwéi Nimm vun Traineren a Spiller. Dat mécht de Clubliewen sichtbar (Art. 6 Abs. 1 Bst. f DSGVO). Wann Dir net wëllt, datt e Foto oder Numm vun Iech oder Ärem Kand ze gesinn ass, schreift eis einfach – mir huelen en ouni Diskussioun erof.</p>
<h2>9. Memberschaft an Aschreiwung</h2>
<p>D'Formulairen fir d'Aschreiwung kënnt Dir op der Säit eroflueden. D'Donnéeën, déi Dir eis domat gitt, benotze mir fir d'Memberschaft, d'Lizenz bei der FLH an d'Organisatioun vun Training a Matcher (Art. 6 Abs. 1 Bst. b DSGVO). Si ginn nëmmen un d'FLH weidergeleet, souwäit dat fir d'Lizenz néideg ass.</p>
<h2>10. Redaktiounsberäich</h2>
<p>Den Login ënnen op der Säit ass nëmme fir d'Leit aus dem Club, déi d'Säit änneren. Do gëtt e Login-Status an Är Ännerungen nëmmen an Ärem eegene Browser gespäichert (sessionStorage/IndexedDB).</p>
<h2>11. Är Rechter</h2>
<p>Dir hutt d'Recht op Auskunft, Verbesserung, Läschung, Aschränkung vun der Veraarbechtung, Datenübertragbarkeet a Widdersproch (Art. 15–21 DSGVO). E gitt Averständnis kënnt Dir all Moment zeréckzéien. Schreift eis dofir un ${mail}.</p>
<p>Dir kënnt Iech och bei der Opsiichtsautoritéit beschwéieren: ${cnpd}.</p>
<p><small>Stand: November 2026</small></p>`,

  fr: `
<p>Nous prenons la protection de vos données personnelles au sérieux. Cette page explique quelles données sont traitées sur ce site, pourquoi, et quels sont vos droits (Règlement général sur la protection des données, RGPD).</p>
<h2>1. Responsable du traitement</h2>
<p>${club}</p>
<h2>2. En bref</h2>
<ul>
<li>Ce site n’utilise <strong>aucun cookie</strong> ni <strong>aucun outil de statistiques ou de publicité</strong>.</li>
<li>Les polices sont hébergées sur notre propre serveur, <strong>aucune police Google</strong> n’est chargée.</li>
<li>Il n’y a <strong>pas de formulaire de contact</strong> ; vous nous écrivez directement par e-mail.</li>
</ul>
<h2>3. Hébergement et journaux du serveur</h2>
<p>Le site est hébergé par <strong>GitHub Pages</strong> (GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis). Lorsque vous ouvrez une page, le serveur reçoit automatiquement votre adresse IP, la date et l’heure, la page consultée et des informations sur le navigateur. C’est nécessaire pour afficher le site et le sécuriser (art. 6, par. 1, point f RGPD). GitHub ne conserve ces journaux que brièvement. Le transfert vers les États-Unis repose sur les garanties prévues par la Commission européenne (EU-US Data Privacy Framework ou clauses contractuelles types). Plus d’informations : <a href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener">GitHub Privacy Statement</a>.</p>
<h2>4. Matchs, résultats et classements (FLH)</h2>
<p>Les matchs, résultats et classements proviennent en direct de la Fédération Luxembourgeoise de Handball. Votre navigateur les charge directement depuis le serveur <strong>spo.handball4all.de</strong> (handball4all, le service utilisé par la FLH). Ce serveur reçoit alors votre adresse IP. Nous affichons ainsi des résultats à jour (art. 6, par. 1, point f RGPD). Pour ne pas surcharger ce serveur, une copie des matchs est gardée 5 minutes dans le <em>sessionStorage</em> de votre navigateur ; elle ne contient aucune donnée personnelle et est effacée dès que vous fermez l’onglet.</p>
<h2>5. Cartes (OpenStreetMap)</h2>
<p>Sur les pages des salles de sport, nous affichons une carte <strong>OpenStreetMap</strong> (OpenStreetMap Foundation, St John’s Innovation Centre, Cowley Road, Cambridge, CB4 0WS, Royaume-Uni). Uniquement sur ces pages, votre navigateur charge la carte depuis openstreetmap.org et transmet votre adresse IP. Le Royaume-Uni bénéficie d’une décision d’adéquation de la Commission européenne. Base légale : art. 6, par. 1, point f RGPD (itinéraire pour joueurs et supporters). Plus d’informations : <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener">OSMF Privacy Policy</a>.</p>
<h2>6. Liens vers d’autres sites</h2>
<p>Nous renvoyons vers d’autres sites, p. ex. Google Maps, flh.lu, flh-live.lu, RTL, YouTube, Vimeo, Facebook et nos partenaires. Ces sites ne sont chargés que lorsque vous cliquez sur le lien ; c’est alors la politique de confidentialité du fournisseur concerné qui s’applique.</p>
<h2>7. Contact par e-mail</h2>
<p>Si vous nous écrivez, nous utilisons vos données (nom, adresse e-mail, contenu) uniquement pour répondre à votre demande (art. 6, par. 1, points b et f RGPD). Nous supprimons les e-mails dès qu’ils ne sont plus nécessaires, sauf obligation légale de conservation.</p>
<h2>8. Photos et noms des joueurs</h2>
<p>Nous publions des photos de matchs, d’équipes et d’événements ainsi que les noms d’entraîneurs et de joueurs, afin de rendre la vie du club visible (art. 6, par. 1, point f RGPD). Si vous ne souhaitez pas qu’une photo ou un nom vous concernant, vous ou votre enfant, soit visible, écrivez-nous : nous le retirons sans discussion.</p>
<h2>9. Affiliation et inscription</h2>
<p>Les formulaires d’inscription peuvent être téléchargés sur le site. Les données que vous nous transmettez servent à l’affiliation, à la licence auprès de la FLH et à l’organisation des entraînements et des matchs (art. 6, par. 1, point b RGPD). Elles ne sont transmises à la FLH que dans la mesure nécessaire à la licence.</p>
<h2>10. Espace de rédaction</h2>
<p>Le lien « Login » en bas de page est réservé aux membres du club qui mettent le site à jour. Un état de connexion et vos modifications sont enregistrés uniquement dans votre propre navigateur (sessionStorage/IndexedDB).</p>
<h2>11. Vos droits</h2>
<p>Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation du traitement, de portabilité et d’opposition (art. 15 à 21 RGPD). Vous pouvez retirer à tout moment un consentement donné. Écrivez-nous à ${mail}.</p>
<p>Vous pouvez également introduire une réclamation auprès de l’autorité de contrôle : ${cnpd}.</p>
<p><small>Version : novembre 2026</small></p>`,

  de: `
<p>Wir nehmen den Schutz Ihrer persönlichen Daten ernst. Hier erklären wir, welche Daten auf dieser Website verarbeitet werden, warum, und welche Rechte Sie haben (EU-Datenschutz-Grundverordnung, DSGVO).</p>
<h2>1. Verantwortlicher</h2>
<p>${club}</p>
<h2>2. Kurz zusammengefasst</h2>
<ul>
<li>Diese Seite setzt <strong>keine Cookies</strong> und nutzt <strong>keine Statistik- oder Werbe-Tools</strong>.</li>
<li>Die Schriften liegen auf unserem eigenen Server, es werden <strong>keine Google Fonts</strong> geladen.</li>
<li>Es gibt <strong>kein Kontaktformular</strong>; Sie schreiben uns direkt per E-Mail.</li>
</ul>
<h2>3. Hosting und Server-Logdateien</h2>
<p>Die Website wird von <strong>GitHub Pages</strong> (GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA) bereitgestellt. Wenn Sie eine Seite aufrufen, erhält der Server technisch automatisch Ihre IP-Adresse, Datum und Uhrzeit, die aufgerufene Seite und Browser-Informationen. Das ist nötig, um die Seite auszuliefern und sicher zu betreiben (Art. 6 Abs. 1 lit. f DSGVO). GitHub speichert diese Logdateien nur kurz. Die Übermittlung in die USA erfolgt auf Grundlage der von der EU-Kommission vorgesehenen Garantien (EU-US Data Privacy Framework bzw. Standardvertragsklauseln). Mehr dazu: <a href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener">GitHub Privacy Statement</a>.</p>
<h2>4. Spiele, Ergebnisse und Tabellen (FLH)</h2>
<p>Spiele, Ergebnisse und Tabellen kommen live vom Luxemburger Handballverband (FLH). Ihr Browser lädt sie direkt vom Server <strong>spo.handball4all.de</strong> (handball4all, der Dienst, den die FLH dafür nutzt). Dabei erhält dieser Server Ihre IP-Adresse. So zeigen wir aktuelle Ergebnisse (Art. 6 Abs. 1 lit. f DSGVO). Um den Server nicht zu überlasten, wird eine Kopie der Spiele 5 Minuten im <em>sessionStorage</em> Ihres Browsers gehalten; sie enthält keine personenbezogenen Daten und wird gelöscht, sobald Sie den Tab schließen.</p>
<h2>5. Karten (OpenStreetMap)</h2>
<p>Auf den Seiten der Sporthallen zeigen wir eine Karte von <strong>OpenStreetMap</strong> (OpenStreetMap Foundation, St John’s Innovation Centre, Cowley Road, Cambridge, CB4 0WS, Vereinigtes Königreich). Nur auf diesen Seiten lädt Ihr Browser die Karte von openstreetmap.org und überträgt dabei Ihre IP-Adresse. Für das Vereinigte Königreich besteht ein Angemessenheitsbeschluss der EU-Kommission. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (Anfahrt für Spieler und Zuschauer). Mehr dazu: <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener">OSMF Privacy Policy</a>.</p>
<h2>6. Links zu anderen Seiten</h2>
<p>Wir verlinken auf andere Websites, z. B. Google Maps, flh.lu, flh-live.lu, RTL, YouTube, Vimeo, Facebook und unsere Partner. Diese Seiten werden erst geladen, wenn Sie auf den Link klicken; dann gilt die Datenschutzerklärung des jeweiligen Anbieters.</p>
<h2>7. Kontakt per E-Mail</h2>
<p>Wenn Sie uns eine E-Mail schreiben, nutzen wir Ihre Daten (Name, E-Mail-Adresse, Inhalt) nur, um Ihre Anfrage zu beantworten (Art. 6 Abs. 1 lit. b und f DSGVO). Wir löschen die E-Mails, sobald sie nicht mehr gebraucht werden, sofern keine gesetzliche Aufbewahrungspflicht besteht.</p>
<h2>8. Fotos und Namen von Spielern</h2>
<p>Wir zeigen Fotos von Spielen, Mannschaften und Veranstaltungen sowie Namen von Trainern und Spielern, um das Vereinsleben sichtbar zu machen (Art. 6 Abs. 1 lit. f DSGVO). Wenn Sie nicht möchten, dass ein Foto oder Name von Ihnen oder Ihrem Kind zu sehen ist, schreiben Sie uns – wir nehmen es ohne Diskussion herunter.</p>
<h2>9. Mitgliedschaft und Anmeldung</h2>
<p>Die Anmeldeformulare können Sie auf der Seite herunterladen. Die Daten, die Sie uns damit geben, nutzen wir für die Mitgliedschaft, die Lizenz bei der FLH und die Organisation von Training und Spielen (Art. 6 Abs. 1 lit. b DSGVO). Sie werden nur an die FLH weitergegeben, soweit das für die Lizenz nötig ist.</p>
<h2>10. Redaktionsbereich</h2>
<p>Der Login unten auf der Seite ist nur für die Vereinsmitglieder, die die Seite pflegen. Ein Anmeldestatus und Ihre Änderungen werden nur in Ihrem eigenen Browser gespeichert (sessionStorage/IndexedDB).</p>
<h2>11. Ihre Rechte</h2>
<p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO). Eine erteilte Einwilligung können Sie jederzeit widerrufen. Schreiben Sie uns dazu an ${mail}.</p>
<p>Sie können sich außerdem bei der Aufsichtsbehörde beschweren: ${cnpd}.</p>
<p><small>Stand: November 2026</small></p>`,
};

export const privacyHtml = (lang: Lang) => TEXT[lang];
