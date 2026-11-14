# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Astro (statisch) wie bei Rondpoint (`/Users/steenbeckers/Rondpoint`), weil Nave dort schon einen erprobten Aufbau hat: statischer Build, Inhalte als Dateien, Admin ohne eigenen Server. Admin nach demselben Muster: „Login“ im Footer öffnet den Editor direkt auf der Seite (Demo speichert im Browser, `storage.ts` ist die einzige austauschbare Stelle für Betrieb über GitHub-API oder `api.php`), dazu ein Dashboard für strukturierte Daten.

## Users

Vier Gruppen, alle bestätigt:
- **Eltern & Kinder** aus der Gemeng Péiteng: suchen Trainingszeiten, Schnuppertraining, Einschreibung. Der Club sucht aktiv Jungen und Mädchen U9 bis U17.
- **Fans & Zuschauer**: wann und wo spielen Hären, Dammen (Entente HB Bieles – HB Péiteng) und Jugend, Resultate, Livestream.
- **Partner & Sponsoren**: Sichtbarkeit ihrer Logos, Kontakt zum Club.
- **Mitglieder & Ehrenamtliche**: Comité, Aufruf zum Mitmachen, Abo, Shop, Events (Wisi-Cup, Kleeschen, Niklosmaart).

## Product Purpose

Webseite des Handball Club vun der Gemeng Péiteng a.s.b.l. (HB Péiteng, HBP), Luxemburg. Ersetzt die alte Jimdo-Seite hbpeiteng.com. Erfolg: Familien finden in Sekunden den Weg ins Training, Fans den nächsten Match, und der Club pflegt die Seite selbst.

## Positioning

Ein Gemeindeverein mit langer Geschichte: eigene Halle „Bim Diederich“ in Péiteng, Hären in der AXA League, eigenes Jugendturnier Wisi-Cup (seit über 20 Ausgaben), Coupe-de-Luxembourg-Finale 2018.

## Operating Context

- Heimhalle: Centre sportif „Bim Diederich“, Péiteng; zweite Halle in Rodange.
- Liga-Daten (Spielplan, Klassement) kommen vom Verband FLH; Livestream über flh-live.lu / Handball TV by AXA.
- Pflege durch Ehrenamtliche, auf Handy und Computer.

## Capabilities and Constraints

- **Sprachen:** Lëtzebuergesch (Standard), Französisch, Deutsch.
- **Inhalte:** alle bestehenden Seiten werden 1:1 übernommen (109 Seiten inkl. Archiv 2017–2020, Wisi-Cup-Jahrgänge, Fotogalerien, Presse, Video). Quelle: `hbpeiteng-basis/`.
- **Admin pflegt:** Texte & Fotos direkt auf der Seite; News-Beiträge (anlegen, Fotos, veröffentlichen, archivieren); Teams, Kader, Trainingszeiten, Partner-Logos.
- **Nicht im Admin (bewusst):** Spielplan & Resultate. Offen, ob diese von Hand, per FLH-Link oder gar nicht auf der Seite stehen.
- Kontaktseite hat heute nur ein Formular; Adresse, Telefon, E-Mail des Clubs fehlen und dürfen nicht erfunden werden.
- Bestehende Übersetzungen FR/DE gibt es nicht; FR/DE-Texte müssen geprüft werden.

## Brand Commitments

- Name: „HB Péiteng“, voll „Handball Club vun der Gemeng Péiteng“, Kürzel HBP.
- Rundes Logo mit „HBP“ und Handballspieler, Gelb auf Schwarz (`hbpeiteng-basis/fotos/i19c747d3d81ebcd6.jpg`, nur als Banner mit Schriftzug vorhanden; freigestelltes Logo fehlt).
- Clubfarben Gelb und Schwarz (💛🖤 in den eigenen Posts).
- Ton: herzlich, direkt, Lëtzebuergesch, „MERCI“, Aufrufe in Großbuchstaben.

## Evidence on Hand

- 109 Seiten Text: `hbpeiteng-basis/seiten/*.md`, Seitenleiste mit Partnern und Spielplan: `hbpeiteng-basis/seitenleiste.md`.
- 488 Fotos in Originalgröße: `hbpeiteng-basis/fotos/` (Teams, Matches, Events, Partner-Logos).
- Kader Hären 2025/2026 als Bild; Kooperation RE-FILL Luxembourg (Trinkflaschen mit Logo).
- Fehlt: Logo als Vektor, Kontaktdaten, aktuelle Trainingszeiten als Text prüfen, Spielerlisten als Text.

## Product Principles

1. Der Weg ins Training ist von jeder Seite einen Klick entfernt.
2. Was diese Woche passiert (Matches, Training, Events) steht vor allem anderen.
3. Nichts geht verloren: das Archiv bleibt vollständig erreichbar, aber ruhig.
4. Ehrenamtliche pflegen ohne Schulung, am Handy.
5. Partner sind sichtbar, weil sie den Club tragen.
