# Offene Punkte

## Vom Club zu klären
- **Kontakt:** Telefonnummer fehlt. Auf der alten Seite gab es nur ein Formular; die E-Mails stammen aus Organigramme und Wisi-Cup-Seiten.
- **Logo:** nur als Banner-Bild vorhanden (ausgeschnitten nach `public/brand/hbp-logo.jpg`). Bitte Vektor-Datei (SVG/PDF) besorgen.
- **Dateschutz:** Text fehlt (`/dateschutz/` zeigt `[FEHLT]`). Impressum prüfen (`/impressum/`).
- **Partnernamen:** 10 von 18 Logos haben noch keinen Namen und keinen Link (`src/data/partners.json` oder im Admin unter Verwalten → Partner).
- **Spielplan & Resultate:** nicht im Admin gewünscht. „Dëse Weekend“ ist ein Textblock, der im Admin wie jeder Text geändert wird. Klassement verlinkt auf flh.lu.
- **Médico-Seite:** war ein eingebettetes Powr.io-Formular, das nicht übernommen werden kann. Inhalt neu liefern.
- **Aschreiwung:** das Einschreibeformular war ein Download; nur das Vorschaubild ist übernommen. PDF nachliefern.
- **Kader Hären:** nur als Bild vorhanden.

## Sprache
- FR- und DE-Texte (`src/i18n/ui.ts`) sind Erstübersetzungen und müssen von Muttersprachlern geprüft werden.
- Die Admin-Oberfläche ist auf Lëtzebuergesch; bitte gegenlesen.
- Übernommene Seiten bleiben in der Originalsprache (meist LB, teils FR).

## Technik
- Admin speichert im Demo-Modus nur im Browser. Für den Betrieb `storage.ts` auf `server` (api.php) oder GitHub-Commit umstellen.
- Weiterleitungen: LB-Adressen sind gleich geblieben. Jimdo-Adressen unter `/j/…` (Dateschutz, Shop-Recht) gibt es nicht mehr.
