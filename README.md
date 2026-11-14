# HB Péiteng – Webseite

Neue Webseite des Handball Club vun der Gemeng Péiteng (Ersatz für die alte Jimdo-Seite hbpeiteng.com).
Design „Das Trikot“: Gelb ist der Stoff, Schwarz sind Nummern, Nähte und Hose. Jede Equipe ist ein Trikot mit Nummer, Partner sind Patches.

Offene Punkte stehen in [`OFFENE-PUNKTE.md`](OFFENE-PUNKTE.md), der Demo-Login in `Demo-Zugang.txt`.

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

## Admin (wie Rondpoint/Krombach)

„Login“ ganz unten im Footer öffnet die Anmeldung. Danach:

- **Beaarbechten:** Texte antippen und tippen. Ganze Seiteninhalte haben eine kleine Leiste (Fett, Kursiv, Überschrift, Liste, Link, Foto).
- **Fotos:** im Bearbeiten-Modus antippen → anderes Foto, verstecken, Original. Fotos werden im Browser auf 2000 px verkleinert.
- **Verwalten:** Equippen (Nummer, Namen LB/FR/DE, Trainer, Trainingszeiten), Neiegkeeten (neue Beiträge, alte umbenennen/verstecken), Partner (Logo, Name, Link, Haupt-/Partner, Reihenfolge).
- **Späicheren · Réckgängeg · Méi** (Kurzanleitung, Seite/alles auf Original, Abmelden).

Besucher laden nur `src/edit/boot.ts`; der Editor kommt erst nach dem Login.

**Speichern** läuft über `src/edit/storage.ts`, die einzige Stelle, die für den Betrieb ausgetauscht wird:
- `storage: 'demo'` (jetzt): alles bleibt in diesem Browser (IndexedDB). Für Präsentationen.
- `storage: 'server'`: kleine `api.php` auf dem Webspace; der Vertrag steht oben in `storage.ts`.
- Alternativ wie Rondpoint: Speichern als Commit über die GitHub-API, danach baut GitHub Actions neu.

## Technik

Astro 7, statisch, ohne Framework im Browser. Schriften selbst gehostet (`public/fonts/`, OFL): Big Shoulders Display, Barlow, Barlow Condensed.
Bausteine, die Seite und Editor teilen (Trikot, Patches, News): `src/lib/render.ts`.
