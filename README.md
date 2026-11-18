# HB Péiteng – Webseite

Neue Webseite des Handball Club vun der Gemeng Péiteng (Ersatz für die alte Jimdo-Seite hbpeiteng.com).
Design „Das Trikot“: Gelb ist der Stoff, Schwarz sind Nummern, Nähte und Hose. Jede Equipe ist ein Trikot mit Nummer, Partner sind Patches.

Offene Punkte stehen in [`OFFENE-PUNKTE.md`](OFFENE-PUNKTE.md). Der Demo-Login steht in `Demo-Zugang.txt` (nur lokal, nicht im Repository).

## Starten

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # statische Seite nach dist/
npm test         # Prüft den Import (E-Mails, Tabellen, Jimdo-Module)
```

## Inhalte

| Was | Wo |
|---|---|
| 109 übernommene Seiten (1:1) | `src/content/pages/*.json`, erzeugt mit `npm run import` aus `hbpeiteng-basis/` |
| Fotos (verkleinert auf 1600 px) | `public/fotos/` (Originale in `hbpeiteng-basis/fotos/`, nicht im Git) |
| Equippen, Trainer, Trainingszeiten | `src/data/teams.json` |
| Partner-Logos | `src/data/partners.json` |
| Neue News-Beiträge | `src/data/news.json` (alte Beiträge sind Seiten unter `/noriichten-1/`) |
| „Dëse Weekend“ (Spiele) | `src/data/weekend.json` |
| Club-Adresse, E-Mails, Hallen | `src/data/site.json` |
| Feste Texte LB/FR/DE | `src/i18n/ui.ts` |

Adressen: Lëtzebuergesch behält die alten Adressen (`/hären-i/kader/`), Französisch und Deutsch bekommen `/fr/…` und `/de/…`.
Übernommene Seiteninhalte bleiben in ihrer Originalsprache; auf FR/DE steht ein Hinweis darüber.

Das Skript `scrape.py` holt die alte Seite neu, falls dort noch etwas geändert wurde. Danach `npm run import`.

## Matcher, Resultater, Klassement (automatisch von der FLH)

Die Daten kommen von Handball4all, derselben Quelle wie flh.lu.

- **Lizenz:** Handball4all erlaubt den automatischen Massenabruf nur mit Lizenz. Ohne Lizenz lädt nur der Browser jedes Besuchers die laufende und die letzte Woche plus die Klassementer (höchstens alle 5 Minuten, während eines Matches alle 2 Minuten). Die ganze Saison auf den Resultat-Seiten braucht die Lizenz.
- `FLH_LICENSE=1 npm run sync` holt mit Lizenz die ganze Saison und die Klassementer nach `src/data/flh.json` (eine Anfrage nach der anderen, mit Pause). Ohne die Variable macht das Skript nichts. Die Sperre nie umgehen.
- Zuordnung FLH → Equipe: Feld `flh` in `src/data/teams.json` (z. B. „Hären“, „U13 Mixte“). Der Live-Punkt leuchtet nur, wenn ein Match der Hären oder Dammen gerade läuft (FLH-Live-Status oder Spielzeit).

## Admin (wie Rondpoint/Krombach)

„Login“ ganz unten im Footer öffnet die Anmeldung. Danach:

- **Beaarbechten:** Texte antippen und tippen. Ganze Seiteninhalte haben eine kleine Leiste (Fett, Kursiv, Überschrift, Liste, Link, Foto).
- **Fotos:** im Bearbeiten-Modus antippen → anderes Foto, verstecken, Original. Fotos werden im Browser auf 2000 px verkleinert.
- **Links:** im Bearbeiten-Modus einen Link antippen → neue Adresse, Original oder öffnen (gilt für alle Links mit derselben Adresse).
- **Verwalten:**
  - *Equippen:* Namen LB/FR/DE, Trikotnummer, Jahrgänge, Gruppe, Trainer, Liga-Text, Trainingszeiten mit Halle, FLH-Name, FLH-Liga-Nummer (Klassement, jede Saison neu), Seitenadresse, Reihenfolge, verstecken, neu, löschen.
  - *Matcher:* eigene Spiele zusätzlich zu den FLH-Spielen (Equipe, Datum, Uhrzeit, Heim/Auswärts, Gegner, Art, Halle, Ort, Resultat).
  - *Neiegkeeten:* neue Beiträge mit Foto und Text, alte umbenennen/verstecken.
  - *Partner:* Logo, Name, Link, Haupt-/Partner, Logo auf dunklem Grund, Reihenfolge, verstecken.
  - *Club:* Clubname, Adresse, E-Mails, Links (Livestream, FLH, Shop, Facebook), Hallen (Name, Straße, Ort, Google-Maps-Link, Kartenposition), Bankkonten – ersetzt in Fußzeile, Menü, Kontakt, Impressum und auf den Hallen-Seiten.
- **Späicheren · Réckgängeg · Méi** (Kurzanleitung, Seite/alles auf Original, Abmelden).

Besucher laden nur `src/edit/boot.ts`; der Editor kommt erst nach dem Login.

**Speichern** läuft über `src/edit/storage.ts`, die einzige Stelle, die für den Betrieb ausgetauscht wird:
- `storage: 'demo'` (jetzt): alles bleibt in diesem Browser (IndexedDB). Für Präsentationen.
- `storage: 'server'`: kleine `api.php` auf dem Webspace; der Vertrag steht oben in `storage.ts`.
- Alternativ wie Rondpoint: Speichern als Commit über die GitHub-API, danach baut GitHub Actions neu.

## Technik

Astro 7, statisch, ohne Framework im Browser. Schriften selbst gehostet (`public/fonts/`, OFL): Big Shoulders Display, Barlow, Barlow Condensed.
Bausteine, die Seite und Editor teilen (Trikot, Patches, News): `src/lib/render.ts`.

## Online stellen (GitHub Pages, wie Blackstar)

```bash
npm run deploy
```

Baut die Seite und lädt sie in den Branch `gh-pages`; GitHub Pages liefert sie aus.

- **Jetzt (Vorschau):** https://nave-lu.github.io/hb-peiteng-website/ – dafür stellt `scripts/pages-base.mjs` alle Pfade auf `/hb-peiteng-website/` um.
- **Mit eigener Domain (www.hbpeiteng.com):** genau wie bei www.blackstar-mersch.lu – Domain bei my.lu, Website weiter auf GitHub Pages.

### Umzug auf www.hbpeiteng.com (Reihenfolge einhalten)

Heute liegt `hbpeiteng.com` bei Jimdo (Registrar InterNetX, Nameserver `ns13/ns14.jimdo.com`), **auch die E-Mails** (`ca@`, `president@`, `wisi-cup@` über `mx1/mx2.jimdo.com`).

1. Bei my.lu die E-Mail-Postfächer (bzw. Weiterleitungen) für `ca@`, `president@`, `wisi-cup@hbpeiteng.com` anlegen (bei Blackstar: `mx.mbox.lu`).
2. Domain von Jimdo zu my.lu transferieren (Auth-Code bei Jimdo anfordern).
3. DNS bei my.lu – wie bei Blackstar:
   - `hbpeiteng.com` A → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `www.hbpeiteng.com` CNAME → `nave-lu.github.io.`
   - MX auf das neue Postfach (my.lu/mbox.lu)
4. Wenn die DNS-Einträge aktiv sind: `echo www.hbpeiteng.com > public/CNAME`, committen, `npm run deploy`, danach in GitHub → Settings → Pages „Enforce HTTPS“ anhaken.
   Mit `public/CNAME` entfällt die Pfad-Umstellung automatisch, die Seite läuft im Wurzelverzeichnis.

Erst Schritt 4 machen, wenn die Domain wirklich auf GitHub zeigt – sonst leitet die Vorschau-Adresse auf die alte Jimdo-Seite um.
