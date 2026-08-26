# Prompt für Claude Design

Stand 19.08.2026. Zum Kopieren in Claude Design. Alles unterhalb der Linie ist der Prompt.

---

Entwirf die Oberfläche für **merkr**, ein Klassenbuch, das eine Lehrkraft auf dem iPad benutzt — im Stehen, zwischen dreißig Kindern, oft mit einer Hand. Es hält fest, wer mitgearbeitet hat, wer gefehlt hat und wie Arbeiten ausgegangen sind, und rechnet daraus einen Vorschlag für die Halbjahresnote.

## Wer es benutzt

Eine einzige Person, jeden Tag, ein Schuljahr lang. Sie kennt die App nach einer Woche auswendig. Sie hat keine Zeit zu suchen: der häufigste Handgriff — eine mündliche Beteiligung festhalten — passiert mitten im Unterrichtsgespräch und darf nicht länger als zwei Sekunden dauern. Alles andere darf ruhig einen Schritt mehr kosten.

## Designsprache

Angelehnt an **selbr**, die Schülerfläche desselben Ökosystems — hell, freundlich, rund, ohne Verwaltungsstrenge. Konkret von dort übernehmen:

- **Schrift: Nunito**, Gewichte 400 bis 900, für Zahlen und Namen gern 700–800.
- **Hell, ausschließlich.** Kein dunkles Thema. `color-scheme: light`.
- **Großzügige Radien** (12–20 px an Karten und Knöpfen, Pillen für Zustände), **kaum Schatten** — höchstens ein sehr weicher.
- **Ruhige Flächen statt Rahmen.** selbr trennt über Farbflächen, nicht über Linien.

Eigene CI-Farbe, nicht selbrs Grün:

| Rolle | Wert |
|---|---|
| Papier (Hintergrund) | `#f4f2ef` |
| Tinte (Text) | `#1d2124` |
| Akzent (Marke, aktive Zustände, Hauptknopf) | `#2f3439` |
| Karte | `#ffffff` |

Die fünf Mitarbeitsstufen brauchen eine eigene, klar getrennte Skala von sehr gut bis sehr schwach. Sie ist die einzige Stelle, an der Farbe etwas bedeutet — halte den Rest der Oberfläche farblich zurück, damit diese fünf Werte sofort lesbar bleiben. Rot ist für "Lücke" reserviert und darf sonst nirgends auftauchen.

## Die Bildschirme

**1. Heute.** Der Einstieg. Welche Kurse heute anstehen (aus dem Stundenplan), was als Thema geplant ist, und ein Weg in jeden Kurs. Dazu offene Punkte, aber nur echte: nicht entschuldigte Fehlzeiten, überfällige Sicherung.

**2. Sitzplan eines Kurses.** Das Kernstück. Die Klasse als Raster von Kacheln, jede mit Name und den letzten Zuständen. Eine Kachel antippen öffnet die Stufenwahl: vier Kategorien (Qualität und Menge, mündlich und schriftlich), je fünf Stufen von ++ bis −−. Dieser Griff muss ohne Zielen funktionieren — große Flächen, klare Trefferzonen, sofortige Rückmeldung ohne Dialog, der erst bestätigt werden will.

**3. Anwesenheit.** Umgekehrte Logik: alle sind da, nur Abweichungen werden angetippt (fehlt, verspätet mit Minuten, beurlaubt). Ein Bildschirm, eine Liste, drei Knöpfe je Zeile.

**4. Schülerprofil.** Was über einen Menschen bekannt ist: Notenstand, Verteilung der Mitarbeit über die vier Kategorien, Fehlzeiten, der Notenvorschlag mit seiner Begründung ("aus 23 Notizen dieses Halbjahres, davon 9 aus den letzten vier Wochen"). Der Vorschlag ist ein Vorschlag — er darf nicht aussehen wie ein Urteil.

**5. Arbeiten und Auswertung.** Liste der Klassenarbeiten und LEKs mit Verteilung (Boxplot, Häufigkeiten), und je Arbeit die Eingabe der Punkte.

**6. Einrichten.** Sieben Schritte in ihrer Reihenfolge — Schuljahr, Kurse, Stundenplan, Schüler, Kürzel, Verbindung zu planr, Verbindung zu checkr —, jeder mit seinem Stand und einem Weg dorthin. Schrumpft auf eine Zeile, sobald alles steht.

## Drei Dinge, die im Entwurf sichtbar werden müssen

Sie kommen aus einer Prüfung der bestehenden Fassung und sind der eigentliche Grund für das Redesign:

**Leere Zustände sind Bildschirme, keine Fußnoten.** Jede Ansicht kann leer sein, und dann muss sie sagen, was fehlt und wohin es geht — mit einem Knopf, nicht mit einem Hinweis auf einen anderen Tab. Entwirf diese Zustände mit, nicht nur die vollen.

**Die App hat eine Meinung.** Sie fragt nicht, was sie wissen kann: das Datum ist heute, die Klasse die aus dem Stundenplan, die Note folgt dem Notenschlüssel des Landes. Zeige Einstellungen als kurze Liste von Entscheidungen, nicht als Schalterwand.

**Zahlen tragen ihre Herkunft.** Ein Notenvorschlag ohne Angabe, worauf er beruht, ist im Gespräch mit Eltern wertlos. Wo eine Zahl steht, gehört ihre Grundlage in Reichweite.

## Randbedingungen

- **iPad, Querformat und Hochformat**, Finger statt Maus. Trefferflächen mindestens 44 px.
- **Helles Klassenzimmer, oft Sonne auf dem Bildschirm.** Kontraste großzügig.
- **Kein Netz vorausgesetzt.** Keine Icon-Bibliotheken, keine externen Bilder; Symbole als Inline-SVG oder Text.
- **Eine einzelne HTML-Datei ohne Framework.** Bitte keine Entwürfe, die React-Komponenten voraussetzen; das Ergebnis wird von Hand in bestehendes Markup übersetzt.
- **Keine Emojis**, weder in Beschriftungen noch als Symbole.
- Deutsche Beschriftungen, Fachbegriffe aus der Schule (Kurs, Sitzplan, Lerngruppe, LEK, Halbjahr).

## Was es nicht werden soll

Kein Dashboard mit Kacheln voller Kennzahlen. Kein Verwaltungswerkzeug, das nach Behörde aussieht. Keine Gamification — hier werden echte Kinder bewertet, und die Oberfläche darf das nicht verspielt aussehen lassen. Freundlich ja, verniedlichend nein.
