# Offene Punkte

## Vom Club zu klären
- **Kontakt:** Telefonnummer fehlt. Auf der alten Seite gab es nur ein Formular; die E-Mails stammen aus Organigramme und Wisi-Cup-Seiten.
- **Logo:** nur als Banner-Bild vorhanden (ausgeschnitten nach `public/brand/hbp-logo.jpg`). Bitte Vektor-Datei (SVG/PDF) besorgen.
- **Dateschutz:** Die Sporthallen-Seiten binden OpenStreetMap-Karten ein (Kartenkacheln von openstreetmap.org); das gehört in die Datenschutzerklärung. Text fehlt (`/dateschutz/` zeigt `[FEHLT]`). Impressum prüfen (`/impressum/`).
- **Partner-Links:** 8 von 18 Logos sind verlinkt (geprüft). Bei den übrigen 10 fehlen Name und Website; im Admin unter Verwalten → Partner eintragen.
- **Matcher & Resultater:** kommen jetzt automatisch von der FLH (Handball4all, dieselben Daten wie flh.lu), beim Bauen und bei jedem Seitenaufruf. Erkannt werden Teams mit „Pétange/Péiteng“ im Namen (inkl. Entente Bieles/Pétange).
- **Comité-Hinweise:** sind jetzt vier News-Beiträge (Bénévoles, Jugendtraining, RE-FILL, Ukraine) ohne Datum. Daten nachtragen. Der alte Corona-Hinweis wurde nicht übernommen.
- **Médico-Seite:** war ein eingebettetes Powr.io-Formular, das nicht übernommen werden kann. Inhalt neu liefern.
- **Aschreiwung:** das Einschreibeformular war ein Download; nur das Vorschaubild ist übernommen. PDF nachliefern.
- **Kader Hären:** nur als Bild vorhanden.

- **FLH-Daten (wichtig):** Handball4all (liefert die Daten für flh.lu) erlaubt den automatischen Abruf nur mit Lizenz. Bei FLH bzw. Handball4all anfragen, ob der Club die Daten auf seiner Seite nutzen darf (Lizenz oder offizielles Widget). Bis dahin lädt nur der Browser der Besucher die laufende Woche und das Klassement; die ganze Saison auf den Resultat-Seiten fehlt.

- **Hären II:** Trainer und Trainingszeiten stammen von 2022/2023 (so auf der alten Seite). Aktuelle Angaben im Admin eintragen.
- **Wisi-Cup:** letzte Ausgabe 2019, 2020 abgesagt. Sobald es eine neue Ausgabe gibt, die Wisi-Cup-Seite und den Hinweis oben anpassen.
- **Médico und International:** im Menü ausgeblendet (Inhalt fehlt bzw. war ein eingebettetes Formular). Adressen bleiben erreichbar.

## Sprache
- FR- und DE-Texte (`src/i18n/ui.ts`) sind Erstübersetzungen und müssen von Muttersprachlern geprüft werden.
- Die Admin-Oberfläche ist auf Lëtzebuergesch; bitte gegenlesen.
- Übernommene Seiten bleiben in der Originalsprache (meist LB, teils FR).

## Technik
- Admin speichert im Demo-Modus nur im Browser. Für den Betrieb `storage.ts` auf `server` (api.php) oder GitHub-Commit umstellen.
- Weiterleitungen: LB-Adressen sind gleich geblieben. Jimdo-Adressen unter `/j/…` (Dateschutz, Shop-Recht) gibt es nicht mehr.
