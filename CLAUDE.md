# merkr

Das Klassenbuch im [lehrr]-Verbund: Mitarbeitsnotizen, Anwesenheit, Noten. Läuft als
Scriptable-Skript auf dem iPad, die Daten liegen als eine JSON-Datei in iCloud Drive.

**merkr ist das einzige Modul mit Klarnamen.** planr hält keine Schülerdaten, checkr entfernt sie
beim Job-Start, selbr kennt nur Klassen. Die Auflösungstabelle Kürzel zu Mensch liegt hier - und
nur hier, auf Johannes' Geräten. Die Regel gilt in eine Richtung: Kürzel dürfen hinaus, Namen nie.

Vollständiger Plan mit Etappen und Begründungen:
`~/Dropbox/brain/Leben/Software/merkr.md`

## Aufbau

| Datei | Was |
|---|---|
| `src/oberflaeche.html` | die Anwendung, ein einzelnes HTML mit eingebettetem Skript |
| `src/rahmen.js` | die Scriptable-Seite: Dateien, Sicherungen, WebView, Brücke |
| `bau.mjs` | setzt die Oberfläche in den Rahmen, schreibt `dist/merkr.js` |
| `dist/merkr.js` | das, was nach Scriptable kommt - eingecheckt, damit die ausgelieferte Fassung nachvollziehbar bleibt |

```bash
node bau.mjs
node --test test/*.mjs
```

`src/kern/` enthält die Rechenteile ohne DOM - Notenvorschlag, Kürzelvergabe und die Zuordnung der
planr-Kurse. bau.mjs setzt sie
an der Stelle `/*__KERN__*/` in die Oberfläche, damit dieselben Zeilen im WebView und unter node
laufen. Wer dort etwas ändert, ändert es an einer Stelle und kann es prüfen, ohne ein iPad in die
Hand zu nehmen.

`node bau.mjs --pruefe <datei>` vergleicht das Ergebnis byteweise mit einer Vorgabe. Beim ersten
Commit war das die Ausgangsdatei `Kursbuch-Jahr.js` - der Umbau vom String-Patch auf diesen Build
ist damit nachweislich verlustfrei.

## Woher es kommt

Grundlage ist ein Scriptable-Kursbuch, das vor merkr per String-Ersetzung erweitert wurde: ein
zweites Skript las den fertigen Text und fügte einen Block vor `</script>` ein, worauf die
erweiterte Fassung als Grundlage der nächsten Runde gesperrt war. Der erste Commit hier ist dieser
Bestand, unverändert - jede spätere Änderung steht im Diff.

## Stand

| Etappe | Stand |
|---|---|
| Repo mit Build statt String-Patch | fertig |
| iCloud-Ablage, Sicherung je Kalendertag | gebaut, auf dem Gerät ungetestet |
| Notenvorschlag mit Halbjahresgrenze und Zeitgewichtung | fertig, 8 Tests |
| Kürzel und checkr-Ausgabe | fertig, 5 Tests |
| Anthropic-Schlüssel in den Schlüsselbund | am 19.08. wieder entfallen, siehe unten |
| Stoffverteilung aus planr, automatisch | gebaut, gegen echte planr-Daten geprüft |
| Ergebnisse aus checkr je Kürzel | gebaut, gegen einen echten Korrekturauftrag geprüft |
| Umbenennung auf merkr, auch auf dem Bildschirm | fertig |
| Die drei Hebel aus dem Wendwerk-Review | umgesetzt, im Browser gemessen |
| Einrichten, Probelauf, Parallelbetrieb | offen |

Der erste Lauf auf dem iPad steht aus. Bis dahin ist besonders der Umzug der Ablage nach iCloud
unbestätigt - er kopiert den Bestand aus `KursbuchDaten`, benennt die alte Datei um und löscht
nichts.


## Was der Review am 19.08.2026 geändert hat

Geprüft nach den sechs Wendwerk-Merkmalen, **18 von 30**: ein starker Kern in einer Oberfläche, die
dreimal angebaut wurde. Bericht in `~/Dropbox/brain/Leben/Software/Reviews/2026-08-19-merkr.md`,
gemessen im Desktop-Chrome an `dist/oberflaeche.html` - Sitzplan-Drag und PDF-Ausgabe sind darin
ungeprüft. Daraus wurden drei Hebel gezogen:

**1. Ein Weg für die Stoffverteilung statt drei.** `st.geplant` ließ sich aus planr holen, aus einer
Plandatei lesen oder von Claude erzeugen. Der Claude-Weg ist entfallen, mit ihm der
Anthropic-Schlüssel aus dem Schlüsselbund; die Plandatei ist vom eigenen Kasten zur Nebenzeile in
der planr-Karte geworden und bleibt der Rückweg ohne Netz. Die Einstellungen haben jetzt acht
Karten statt neun, und keine zwei davon füllen dasselbe Feld. Die Brücke `msg.typ === "anthropic"`
in `src/rahmen.js` steht noch, sie wird aus der Oberfläche nur nicht mehr gerufen.

**2. Leere Zustände sagen dasselbe und führen weiter.** Für "dieser Kurs hat noch keine Schüler" gab
es drei Formulierungen und keinen Knopf, jetzt einen Satz und einen Weg. Die Jahresübersicht zeigt
im leeren Kurs einen Satz statt 52 leerer Wochenkacheln, die Sicherungs-Mahnung erscheint erst, wenn
es etwas zu sichern gibt, und Fehlermeldungen unterscheiden "lässt sich nicht lesen" von "ist keine
merkr-Sicherung", ohne Formatnamen zu nennen.

**3. Einrichtung an einem Ort.** Eine Karte oben in den Einstellungen zeigt die sieben Schritte in
ihrer Reihenfolge, hakt ab was steht und führt zum nächsten. Steht alles, schrumpft sie auf eine
Zeile.

## Die App heißt merkr, auch auf dem Bildschirm (seit 19.08.2026)

Kopfzeile, Fenstertitel, Startbildschirm, Sperrbildschirm, PDF-Fußzeilen und Fehlermeldungen trugen
noch "Kursbuch". **Nicht umbenannt sind Pfad- und Formatnamen:** `KursbuchDaten` adressiert den
Altbestand, aus dem übernommen wird, und `kursbuch-plan-2` ist der Vertrag mit planr.

Der Hinweis in der Datensicherung stimmte seit der iCloud-Umstellung nicht mehr ("Daten liegen lokal
auf dem iPad"). Jetzt steht dort, wo sie wirklich liegen, samt Tagesrhythmus und 60 Tagen Vorhalt.

Für die nächste Runde an der Oberfläche liegt ein Prompt in `docs/design-prompt.md`.
