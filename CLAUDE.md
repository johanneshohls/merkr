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

**Das Repo liegt seit dem 19.08.2026 privat auf GitHub** (`johanneshohls/merkr`) - vorher gab es
nur die Platte. Privat bleibt es, solange merkr nicht fertig ist. Datendateien dürfen nie hinein:
die `.gitignore` sperrt `*.json`, `Kursbuch*` und `merkr-sicherung*`, weil hier als einzigem Modul
die Zuordnung Kürzel zu Mensch entsteht.

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
| Rückmeldung an planr, was gewackelt hat | gebaut, Weg gegen planr geprüft, auf dem Gerät ungetestet |
| Umbenennung auf merkr, auch auf dem Bildschirm | fertig |
| Die drei Hebel aus dem Wendwerk-Review | umgesetzt, im Browser gemessen |
| Terminreihe in Sitzplan und Anwesenheit | fertig, im Browser geprüft |
| Stundennote am Stundenende bestätigen | fertig, 10 Tests |
| Noten-Reiter: ein Notenbuch, TÜ und Was-wäre-wenn | fertig, 11 Tests für die TÜ-Rechnung |
| Ziel und Verlauf aus planr zum Abhaken | merkr fertig (7 Tests); planr-Route erweitert, noch nicht ausgerollt |
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

## Noten: Stundennoten statt hundert Felder (seit 2026-08-22)

Vier Mitarbeitskategorien mal fünfundzwanzig Kinder sind hundert Felder je Stunde. Das füllt niemand.
Seit dem 22.08. läuft es umgekehrt: **merkr schlägt am Stundenende je Schüler eine Note vor**, aus den
Notizen dieser Stunde - wer keine hat, bekommt eine Drei. Eine Runde drüber, korrigieren, bestätigen.
Die Notizen sind damit die Begründung für die Ausschläge, nicht die Pflichtübung für den Normalfall.

Gerechnet wird in `MerkrMitarbeit.stundennote` mit demselben Modell wie der alte Halbjahresvorschlag,
nur ohne Mittelung: ein "+" macht die Stunde zur Eins, eine Störung zur Fünf, nichts zur Drei. Die
Halbjahresnote ist das schlichte Mittel der bestätigten Stunden (`halbjahresnote`) - sie muss im
Elterngespräch in einem Satz erklärbar sein, deshalb keine Zeitgewichtung. Gespeichert wird an der
Stunde (`st.mitarbeit`, `st.mitarbeitBestaetigt`), nicht am Schüler.

**Der Reiter Noten** trägt oben ein einziges Notenbuch und darunter zwei zusammenklappbare Blöcke,
dazu einen Umschalter für das Halbjahr. Erst standen dort drei Tabellen übereinander - Mitarbeit,
Noten, TÜ - mit denselben Namen in denselben Zeilen; wer wissen wollte, wie ein Kind steht, las
dreimal dieselbe Spalte Namen. Jetzt ein Raster: Namen links (klebend beim Querschieben), Spalten für
jede Arbeit, TÜ 1-5 mit Rückkauf, Mitarbeit und Stand. Die Tiefe steckt hinter den Zellen - Note
antippen öffnet die Eingabe der Arbeit, die Mitarbeit ihren Verlauf, die TÜ-Felder nehmen Punkte
direkt. Darunter "Was wäre, wenn" und die alte Arbeitenliste mit den Verteilungen.

**TÜ-Punkte** (`src/kern/tue.js`): fünf Übungen zu je zehn Punkten, die besten drei zählen, höchstens
30. TÜ 4 und 5 zählen nur mit Rückkaufrecht - eins streicht die schlechteste, zwei die zwei
schlechtesten. Daraus folgt eine Regel, die kürzer ist als ihre Erklärung: mit r Rechten kommen die
Übungen 1 bis 3+r in den Topf, daraus zählen die besten drei. Die Rechte hakt die Lehrkraft von Hand
ab (Knopf in der Spalte "Rück", 0/1/2). Die Note macht der MV-Schlüssel aus `MerkrErgebnisse`, sie
zählt als sonstige Leistung mit Gewicht 1 - aber erst, wenn drei Übungen geschrieben sind.

Mitarbeit und TÜ hängen als Note in der gewohnten Rechnung (`schuelerNoten`), statt daneben zu stehen.
Dieselbe Stelle filtert seither **alle** Leistungen nach dem gewählten Halbjahr: vorher zählten
Arbeiten aus dem ersten Halbjahr im zweiten weiter, während die Mitarbeit dort neu ansetzte.

Noch offen: die Auswertung führt einen eigenen Notenspiegel, der sich mit dem Notenbuch überschneidet.

## Die Stunden als Reihe (seit 2026-08-21)

Unter den Reitern steht in Sitzplan und Anwesenheit eine Reihe mit den Terminen des Kurses: welcher
Tag offen ist, wo heute liegt, wo eine Stunde ausgefallen ist und was schon notiert wurde - dieselben
Farben wie im Wochenplan (grün notiert, gelb gehalten, blass offen, rot Ausfall). Die Termine kommen
aus dem Stundenraster des Kurses, nicht aus `S.stunden`: so steht auch dort ein Tag, an dem noch nie
etwas erfasst wurde. Beim Zeichnen rückt der offene Tag in die Mitte; ist der Tag keine
Unterrichtsstunde, der nächste.

Die Pfeile ‹ › in `tagKopf` entfallen, wo die Reihe steht - im Reiter Schüler bleiben sie, dort gibt
es keine Reihe. Beides zugleich wäre zweimal derselbe Weg gewesen.

## Die Auswertung ist aufgelöst (22.08.2026)

Der Reiter führte vier Dinge, von denen zwei nur noch doppelten: eine zweite Notentabelle neben dem
Notenbuch, und darin eine Spalte "Vorschlag mdl.", die noch nach dem alten Modell aus den Notizen
rechnete - während daneben die Mitarbeit aus den bestätigten Stundennoten stand. Zwei mündliche
Zahlen aus zwei Modellen nebeneinander, ohne dass die Tabelle sagte, welche gilt. Dazu rechnete sie
seit dem Halbjahresfilter stillschweigend im Zeitraum, den der Noten-Reiter eingestellt hatte, ohne
ihn zu zeigen.

Die drei Teile, die etwas wert sind, stehen jetzt dort, wo ihr Inhalt steht:

| Teil | neuer Ort |
|---|---|
| Verlauf der Arbeiten | Schülerprofil, mit dem Klassenmittel als gestrichelter Vergleichslinie |
| "Wer war lange nicht dran" | Block im Reiter Noten, neben der Mitarbeitsnote |
| Notenliste als PDF | Kopfzeile des Reiters Noten |
| Stundendoku als PDF | Kopfzeile des Reiters Stunden |

Fehlzeiten und der Weg ins Profil standen ohnehin schon im Reiter Schüler. `viewAuswertung` bleibt im
Code stehen, wird aber nicht mehr gerufen - der Reiter ist aus `LEISTE_KURS` heraus.

## Vier Handgriffe an der Bedienung (22.08.2026)

**Die Stundenliste beginnt bei dem, was ansteht.** Vorher stand der Juni oben und man scrollte durchs
Schuljahr. Jetzt zwei Gruppen: offen (heute und später, aufsteigend) sichtbar, gehalten
zusammengeklappt darunter. "Gehalten" heißt vorbei **und** dokumentiert - eine vergangene Stunde ohne
Thema ist nicht erledigt, sondern nachzutragen, und bleibt oben stehen, wo man sie sieht.

**Der Reiter Schüler steht drei Plätze weiter rechts** und hat die Tageszeile verloren: in der Liste
hängt nichts vom Datum ab, Namen und Notenstand sind an jedem Dienstag dieselben.

**Die TÜ-Spalten lassen sich zuklappen.** Ein Tipp auf den Gruppenkopf, und aus sieben Spalten wird
eine mit der Punktzahl; die Note steht im Tooltip, alles Weitere einen Klick entfernt.

## Ziel und Verlauf zum Abhaken (seit 2026-08-22)

planr liefert mit der Stoffverteilung jetzt auch `ziel` (das Stundenziel) und `phasen` (Nummer,
Phase, Inhalt, Dauer). Sie stehen in merkr nicht zum Planen - geplant wird drüben -, sondern zum
Abhaken: im Abschluss-Dialog steht über den Namen das Ziel und darunter der Verlauf als Haken. Was
liegen blieb, geht beim Bestätigen mit an planr: alles erledigt heißt `zielErreicht: "ja"`, nichts
`"nein"`, dazwischen `"teilweise"`, und die offenen Schritte stehen im Klartext in der Notiz, die
drüben zur Reflexion wird. Ein eigenes Feld je Phase hat planr nicht; dafür wäre dort ein Schema zu
ändern, und ein Satz beantwortet die Frage beim Planen genauso.

Jeder Haken wird sofort behalten (`stunde.erledigt`) - der Dialog baut sich bei jedem Tipp auf eine
Note neu auf, und ein Haken, der dabei verschwindet, wird kein zweites Mal gesetzt.

**Dabei kam ein stiller Fehler heraus:** die zweite Fassung von `planImportieren` (die mit
`planrKlasse` und Halbjahresgrenze) übernahm `tuThemen` nicht mehr. Der Rückweg für gewackelte Themen
stand seither vollständig da und bekam nie etwas zu zeigen - der Block blendet sich ohne Themen
einfach aus, deshalb fiel es nicht auf. Seit dem 22.08. übernimmt der Importer die Themen wieder.

## Der Rückweg zu planr (seit 2026-08-20)

planr liefert mit der Stoffverteilung je Termin `tuThemen` - woraus die TÜ dieser Stunde gebaut ist,
aktuelles Thema und Auffrischung zusammen. Im Stundendialog stehen sie als Ankreuzliste: was
gewackelt hat, geht per `POST /api/rueckmeldung` zurück, und die nächste TÜ zieht es vor.

Freien Text gibt es dort bewusst nicht. Ein Thema, das drüben keine Aufgabe trifft, stünde sechs
Wochen offen und ginge bei jeder TÜ als Keyword mit hinaus, das drillr nicht zuordnen kann. planr
prüft das inzwischen selbst - die Ankreuzliste ist trotzdem die richtige Bedienung, weil sie die
Frage beantwortbar macht, statt sie zu stellen.

Gemeldet wird über denselben Schlüssel wie der Abruf (`merkr.planr` im Schlüsselbund), nur als POST.
Der Haken bleibt lokal stehen (`stunde.gewackelt`), auch wenn das iPad gerade kein Netz hat; dasselbe
Thema zweimal zu melden legt drüben nichts doppelt an.

`kurs.planrName` und `kurs.planrFach` kommen aus dem Abruf und werden dort gepflegt: drüben heißt der
Kurs "9d" mit Fach "Mathematik", hier vielleicht "Mathe 9d". Ein Kurs ohne diese Herkunft meldet
nichts - dasselbe Muster wie `planrKlasse` bei der Zuordnung.

Namen gehen nicht hinaus. Die Rückmeldung kennt Kurs, Datum und Thema, sonst nichts.
