---
name: HB Péiteng
description: Vereinswebseite im Look des gelb-schwarzen HBP-Matchtrikots
colors:
  club-yellow: "#f5d000"
  club-yellow-deep: "#e2bd00"
  flock-ink: "#0e0e0c"
  ink-2: "#2c2a22"
  ink-soft: "#4a4430"
  label-white: "#ffffff"
  rule: "#d9d6cc"
  muted: "#5d5a50"
typography:
  display:
    fontFamily: "Big Shoulders, Barlow Condensed, sans-serif"
    fontSize: "clamp(2.8rem, 6vw, 5.6rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.01em"
  flock-number:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "clamp(13rem, 33vw, 31rem)"
    fontWeight: 900
    lineHeight: 0.78
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "clamp(2.2rem, 3.6vw, 3.2rem)"
    fontWeight: 800
    lineHeight: 0.95
  label:
    fontFamily: "Barlow Condensed, Barlow, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 700
    letterSpacing: "0.06em"
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  cloth: "3px"
  patch: "14px"
  jersey-hem: "10px"
spacing:
  gutter: "clamp(16px, 4vw, 56px)"
  section: "clamp(64px, 10vw, 128px)"
  max: "1360px"
  collar: "68px"
components:
  tag-button:
    backgroundColor: "{colors.flock-ink}"
    textColor: "{colors.club-yellow}"
    padding: "13px 22px 13px 32px"
  tag-button-yellow:
    backgroundColor: "{colors.club-yellow}"
    textColor: "{colors.flock-ink}"
  collar-cta:
    backgroundColor: "{colors.club-yellow}"
    textColor: "{colors.flock-ink}"
    rounded: "{rounded.cloth}"
    padding: "9px 16px"
  sewn-label:
    backgroundColor: "{colors.label-white}"
    textColor: "{colors.flock-ink}"
    rounded: "{rounded.cloth}"
    padding: "22px 24px 20px"
  news-patch:
    backgroundColor: "{colors.flock-ink}"
    textColor: "{colors.label-white}"
    rounded: "{rounded.patch}"
---

# Design System: HB Péiteng

## Overview

**Creative North Star: "Das Trikot"**

Die Seite ist das Matchtrikot des Clubs: „giel Tricoten, schwaarz Shorten“, wie es auf der Club-Seite steht. Das Gelb ist der Stoff und deckt große Flächen (Committed). Schwarz kommt als Flocknummer, Kragen, Naht und als Hose (Fußzeile) dazu. Weiß gibt es nur dort, wo gelesen wird: auf eingenähten Etiketten und Leseflächen.

Die Ordnung kommt aus dem Trikot selbst, Schmuck kommt nicht dazu. Jede Equipe trägt eine Rückennummer (U9 → 9, Hären I → 1, Dammen → D). Partner sind auf den Stoff gedruckt. Nachrichten sind aufgenähte Patches. Der Maßstab ist bewusst extrem: eine riesige „62“ (Gründungsjahr 1962) steht gegen winzige gesperrte Beschriftungen.

**Key Characteristics:**
- Vollflächiges Clubgelb mit sichtbarer Mesh-Struktur; ganze Abschnitte in Tinte als Gegenstück
- Kondensierte, schwere Sportschrift für Nummern und Rückennamen; ruhige Barlow für Text
- Doppelnaht (zwei gestrichelte Linien) als einziges Trennelement
- Eine einzige Bewegung beim Laden (Flock wird aufgepresst) und eine Signatur-Interaktion (Trikot umdrehen)

## Colors

Zwei Clubfarben tragen alles. Neutrale Töne sind aus dem Schwarz des Flocks abgeleitet, nie aus kühlem Grau.

### Primary
- **Clubgelb** (#f5d000): der Stoff. Seitengrund, Trikots, Buttons auf Tinte, Ärmelbündchen. Liegt immer unter dem Mesh-Muster.
- **Gelb tief** (#e2bd00): Ärmelbündchen am Fuß des ersten Bildschirms; Schattenseite des Stoffs.

### Neutral
- **Flock-Tinte** (#0e0e0c): Nummern, Kragen, Navigation, Fußzeile, Equipen-Abschnitt, News-Patches.
- **Tinte 2** (#2c2a22) und **Tinte weich** (#4a4430): Nebentext auf Gelb (aus Tinte getönt, nie grau).
- **Etikett-Weiß** (#ffffff): nur Leseflächen (Etikett, Matchblatt, Seiteninhalt) und das Admin-Panel.
- **Linie** (#d9d6cc) und **Gedämpft** (#5d5a50): Tabellenlinien und Nebentext auf Weiß.

### Named Rules
**The Kit Rule.** Es gibt nur Gelb und Schwarz. Eine dritte Farbe kommt allein über echte Fotos und Partnerlogos auf die Seite.
**The Reading-Surface Rule.** Weiß ist ein Etikett zum Lesen, nie ein Kartencontainer für Teaser oder Logos.

## Typography

**Display Font:** Big Shoulders Display (variabel, selbst gehostet), Fallback Barlow Condensed
**Body Font:** Barlow
**Label Font:** Barlow Condensed 600/700

**Character:** Big Shoulders ist die Sprache der Flocknummer: eng, schwer und gerade. Barlow ist sachlich und gut lesbar, wie ein Matchprogramm.

### Hierarchy
- **Flock-Nummer** (900, clamp(13rem, 33vw, 31rem), 0.78): nur die „62“ im ersten Bildschirm und die Rückennummern der Trikots.
- **Display** (800, clamp(2.8rem, 6vw, 5.6rem), 0.95, Großbuchstaben): Abschnittstitel und h1 der Innenseiten (max. 6rem).
- **Headline** (800, clamp(2.2rem, 3.6vw, 3.2rem)): Matchblatt, News-Spalte, Etikett-Titel.
- **Body** (400, 1.0625rem, 1.55): Fließtext, Messbreite bis 70ch auf Leseflächen.
- **Label** (Barlow Condensed 700, 0.8–0.98rem, gesperrt 0.06–0.24em, Großbuchstaben): Navigation, Buttons, Uhrzeiten (tabular-nums), Gruppenbezeichnungen.

### Named Rules
**The No-Kicker Rule.** Über einer Überschrift steht nie eine kleine Zeile. Das Datum gehört unter den Titel, die Brotkrumen sind normale kleine Navigation.

## Layout

Container bis 1360px mit fließendem Rand (clamp(16px, 4vw, 56px)). Abschnitte haben clamp(64px, 10vw, 128px) Abstand. Die Startseite wechselt zwischen gelb und tintenschwarz. Seitennähte (gestrichelte Längslinien) laufen links und rechts über die ganze Seite. Innenseiten haben eine Unternavigation von 260px und daneben die weiße Lesefläche. Unter 900px wandert die Unternavigation unter den Inhalt. Trikot-Ständer: auto-fill ab 230px, auf dem Handy 2 Spalten. Auf dem Handy liegt die Daumenleiste („Komm schnupperen“ · „Equippen“) fest am unteren Rand.

## Elevation & Depth

Tiefe entsteht durch Stoff, nicht durch schwebende Karten. Trikots werfen einen leichten Stoffschatten (`drop-shadow(0 5px 6px rgb(0 0 0 / 0.32))`). Etiketten und Leseflächen nutzen `--shadow-cloth` (`0 1px 1px rgb(0 0 0 / 0.08), 0 6px 18px -6px rgb(0 0 0 / 0.28)`). Partnerlogos haben keinen Schatten; sie sind mit `mix-blend-mode: multiply` gedruckt.

## Shapes

- **Trikot:** Raglan-Schnitt (`SHIRT_PATH` in `src/lib/render.ts`), Kragenbündchen als schwarzer Strich (7), Raglan- und doppelte Saumnaht gestrichelt, Mesh-Muster `#hbp-mesh`.
- **Hängeetikett-Button:** Rechteck mit spitzer Lasche links (clip-path, 14px) und Ösenpunkt.
- **News-Patch:** 14px Radius, gemerrowte Kante (4px Tinte-Ring) und eine gelbe Steppnaht innen (`outline-offset: -9px`).
- **Eingenähtes Etikett:** 3px Radius, gestrichelte Steppnaht 8px innen.
- **Doppelnaht:** zwei gestrichelte Linien von 1.5px im Abstand von 5px (7px Strich, 5px Lücke).

## Components

- **Kragen (Navigation):** schwarz mit feinen Rippen, Logo-Wappen rund, Links mit wachsendem gelbem Unterstrich, Sprachwahl LB·FR·DE, gelber CTA.
- **Trikot (Equipe):** Rücken mit Name und Nummer. Ein Klick dreht ein einziges preserve-3d-Element um 180° auf die Brustseite: Schulterpartie mit V-Ausschnitt, Wappen, Trainer und Trainingszeiten in Tinte auf Gelb. Es ist immer nur eines offen, und es liegt über den Nachbarn. Auf dem Handy öffnet die Brust ohne 3D über die volle Breite.
- **Eingenähtes Etikett:** Trainingszeiten der Jugend, Hängeetikett-Button.
- **Partner-Druck:** Logo direkt auf Gelb, im Ärmelbündchen und in „Op eisem Trikot“.
- **Shorts (Fußzeile):** Tinte mit zwei gelben Seitenstreifen; dort steht der unauffällige „Login“.
- **Admin-Leiste:** schwarze Pille unten (Beaarbechten · Verwalten · Réckgängeg · Späicheren · Méi), Panel rechts mit Reitern.

## Do's and Don'ts

- **Do:** Gelb großflächig einsetzen; Neues als Nummer, Naht, Patch oder Druck denken.
- **Do:** Inhalte der alten Seite unverändert auf weißen Leseflächen zeigen.
- **Don't:** weiße Karten mit Schatten als Grundbaustein; gleich große Icon-Karten-Reihen.
- **Don't:** Eyebrow-Zeilen über Überschriften; Datum über dem Titel.
- **Don't:** dritte Akzentfarbe, Verläufe, Glas-Effekte.
- **Don't:** Systemschrift als Display-Stimme.
