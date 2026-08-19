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
```

`node bau.mjs --pruefe <datei>` vergleicht das Ergebnis byteweise mit einer Vorgabe. Beim ersten
Commit war das die Ausgangsdatei `Kursbuch-Jahr.js` - der Umbau vom String-Patch auf diesen Build
ist damit nachweislich verlustfrei.

## Woher es kommt

Grundlage ist ein Scriptable-Kursbuch, das vor merkr per String-Ersetzung erweitert wurde: ein
zweites Skript las den fertigen Text und fügte einen Block vor `</script>` ein, worauf die
erweiterte Fassung als Grundlage der nächsten Runde gesperrt war. Der erste Commit hier ist dieser
Bestand, unverändert - jede spätere Änderung steht im Diff.
