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

**Das Repo liegt seit dem 19.08.2026 auf GitHub** (`johanneshohls/merkr`), seit dem 26.08.2026
öffentlich - der Auslöser war ein Kollege, der merkr mitbenutzen will. Vor dem Umstellen wurde die
gesamte Historie geprüft: 56 Commits, keine Schülernamen (die Treffer waren Base64-Fragmente der
eingebetteten Schrift und die Platzhalter „Müller, Anna / Schmidt, Ben"), keine Schlüssel, keine
eingebetteten Daten - auch nicht im ersten Commit mit dem Altbestand. Datendateien dürfen nie hinein:
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
| Der Tag aus planr, mit Vertretung | fertig, 7 Tests, im Browser geprüft |
| Drei Sitzordnungen je Kurs | fertig, im Browser geprüft |
| merkr aktualisiert sich selbst | gebaut, auf dem Gerät ungetestet |
| Reiter Regie, Notizen für den Lehrertisch aus planr | gebaut, im Browser geprüft; planr-Feld liegt in der Datenbank, Deploy steht aus |
| Stundenplan und A/B-Wochen aus planr | merkr fertig (8 Tests, im Browser geprüft); planr-Route erweitert, Deploy steht aus |
| Termine mit eigenem Block aus planr | merkr fertig (1 Test, im Browser geprüft); planr-Route und Tagesplan erweitert |
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

## Die überschriebenen Fassungen sind weg (22.08.2026)

Jede Runde legte bisher eine Schicht über die vorige: `const alt = viewX; viewX = function(){ ... alt()
... }`. Wo die neue Fassung die alte **nicht** ruft, blieb die alte als toter Text stehen - 730 Zeilen
kamen so zusammen.

Entfernt sind sie jetzt, mit einer Ausnahme: die **erste** Deklaration eines Namens bleibt als
einzeiliger Platzhalter stehen. Die Datei läuft im strict mode, und die späteren Fassungen sind
Zuweisungen - ohne eine `function`-Deklaration gäbe es den Namen nicht.

Zwei Fallen, beide beim ersten Versuch zugeschnappt:

1. **Einzeilige Fassungen.** `viewEinstellungen = function(){ return a() + b(); };` - wer das Ende
   einer Funktion an der Klammer in Spalte 0 sucht, überliest sie und löscht fremden Code mit. Die
   Klammern müssen gezählt werden, und zwar ohne die in Strings, Kommentaren und Regex-Literalen.
2. **Verdeckte Fassungen in minifizierten Zeilen.** Die Jahresübersicht kam als eine Zeile mit 10.000
   Zeichen herein und definiert darin `viewKurs` und `planImportieren` gleich mit. Beide Namen sind
   deshalb vom Aufräumen ausgenommen - wer die sichtbaren Fassungen entfernt, legt die verdeckte frei.

Nicht gemacht: die **Kaskade**. Nach dem Löschen verwaisen weitere Fassungen (die Aliase, die sie
retteten, ruft niemand mehr). Die Runde darauf hätte 168 weitere Zeilen entfernt - und dabei die
Einstellungen um ein Drittel gekürzt. Rückgängig gemacht.

**Das Sicherheitsnetz:** vor und nach dem Umbau werden 23 Ansichten und Dialoge gerendert und
byteweise verglichen - jeder Reiter, beide Halbjahre, alle Blockzustände, die drei PDFs. Erst wenn
alle 23 Prüfsummen gleich sind, gilt der Umbau als verlustfrei. Dasselbe Prinzip wie `bau.mjs
--pruefe`, nur für die Oberfläche statt für die Datei.

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

Fehlzeiten und der Weg ins Profil standen ohnehin schon im Reiter Schüler. Der Code dahinter ist mit
dem Reiter gegangen: beide `viewAuswertung`-Fassungen, ihr Aufsatz und `verlaufSvg`, dazu die
Aufrufe in den ersetzten `viewKurs`-Fassungen und die Einträge in den alten Reiterlisten - zusammen
rund 230 Zeilen. Eine Umleitung für alte Zustände braucht es nicht: `R` lebt nur zur Laufzeit,
gespeichert wird allein `S`.

Geblieben sind `notenlistePdf`, `stundenlistePdf` und `viewMuendlich` - sie werden an ihren neuen
Orten gerufen und erzeugen nachweislich weiter Papier.

## merkr aktualisiert sich selbst (seit 2026-08-26)

Solange merkr nur auf einem Gerät lief, war „die neue Fassung liegt im Ordner" ein Weg. Mit einem
zweiten Menschen ist es keiner mehr. Seit dem 26.08. sieht merkr beim Start selbst nach - höchstens
einmal am Tag, über `dist/fassung.json` statt über die halbe Megabyte des Skripts. Geholt wird die
große Datei erst, wenn jemand zustimmt.

**Gefragt wird immer.** Ein Skript, das sich unbemerkt ändert, ist im Unterricht der falsche Moment
für eine Überraschung: wer um 7:38 Uhr das Klassenbuch aufschlägt, will die Stunde halten.

Der Weg: `QUELLE_BASIS` in `src/rahmen.js` zeigt auf den rohen `main`-Zweig. `fassungPruefen` holt
die kleine Datei, `fassungLaden` die große und schreibt sie an `module.filename` - erst daneben,
dann umbenannt, weil ein Abbruch mitten im Schreiben ein halbes Skript hinterließe, und das startet
nicht mehr. Zwei Prüfungen davor: mindestens 100.000 Zeichen und der Text `const KURSBUCH_HTML`.

Die eigene Fassung steht als `MERKR_FASSUNG` in der Oberfläche; der Rahmen setzt sie beim Anzeigen
ein, wie `KB_MODE`. Ist sie „ungebaut", wird nichts angeboten - ein Stand aus der Werkstatt soll
sich nicht selbst überschreiben.

## Drei Sitzordnungen je Kurs (seit 2026-08-25)

Eine Klasse sitzt nicht das ganze Jahr gleich: Frontalphase, Gruppentische,
Klassenarbeit. Neben "Aufrufen" stehen jetzt drei Knöpfe 1 2 3, und jeder hält seine eigene
Ordnung. An Tagen ohne Unterricht steht dieselbe Wahl im Band darüber - eingerichtet wird eine
Sitzordnung meist dann, wenn keine Stunde ist.

**Der erste Plan trägt weiter den nackten Kursschlüssel** in `s.sitz` (`s.sitz["m8d"]`), die
anderen hängen ein `#2` an. Damit bleibt jede vorhandene Sitzordnung, wo sie ist, ohne Umzug der
Daten - und ein Bestand, der noch nie von Plänen gehört hat, ist einfach auf dem ersten. Der
Schlüssel kommt aus `sitzSchluessel(kurs)`, die aktive Nummer steht als `kurs.sitzplan`.

Ein Plan, in dem noch niemand sitzt, übernimmt beim Hinwechseln die Ordnung, die gerade auf dem
Schirm steht. Wer auf "2" tippt, will meist eine Abwandlung der jetzigen - zwei Tische verschieben
statt dreissig.

## Das Schüler-Popup bleibt offen (25.08.2026)

Eine Wortmeldung hat oft mehr als ein Merkmal - gute Idee und laut dazwischen. Bisher schloss das
Popup nach jedem Tipp, und wer zwei Kategorien vergeben wollte, musste denselben Platz zweimal
antippen. In einer Stunde mit fünfundzwanzig Kindern ist das der Grund, warum am Ende nichts
notiert ist.

Jetzt bleibt es stehen und baut sich an Ort und Stelle neu auf - `popupAktualisieren()` setzt nur
`innerHTML`, ohne zu positionieren; neu zu positionieren hieße, dass es unter dem Finger
wegspringt. Zu geht es über "Fertig", über einen Klick daneben oder wenn ein anderer Name aufgeht.
Der Notiz-Dialog schiebt sich davor und gibt danach das Popup an seinen Platz zurück
(`popupAnkerZuletzt`), statt es in die Bildmitte zu werfen.

Nebenbei zählt ein offenes Popup jetzt als "die Oberfläche ist beschäftigt": der stille planr-Abruf
zeichnet sonst mitten im Notieren neu.

## „Klären" tat nichts (26.08.2026)

Auf der Startseite stand „5 Fehlzeiten ohne Entscheidung" und daneben ein Knopf, der `R.tab` auf
„liste" setzte - auf der Startseite gibt es aber keine Reiter, also passierte sichtbar nichts.
Dahinter lag der zweite Fehler: einen Knopf zum Entschuldigen gab es nirgends mehr, nur den
Handler dafür. Der Weg von der Zahl zur Entscheidung war also nie zu Ende gebaut.

Jetzt ein Dialog über alle Kurse (`fehlzeitenOffenHtml`), neueste zuerst, je Zeile Name, Datum,
Kurs und zwei Knöpfe. Er bleibt beim Entscheiden stehen und schrumpft mit jeder Zeile; ist die
letzte weg, geht er zu. Kein Sprung in einen Reiter - die offenen Fehlzeiten verteilen sich über
Kurse, und wer sie klärt, geht sie am Stück durch.

## Die Anwesenheit kommt ohne zweites Fenster aus (25.08.2026)

Im Reiter Anwesenheit stand die Liste auf der Seite - und jeder Tipp auf "fehlt", "verspätet" oder
"beurlaubt" legte dieselbe Liste noch einmal als Dialog darüber, der nach jedem einzelnen Eintrag
weggeklickt werden musste. Ursache: `anwSetzen` rief immer `zeigeModal`, egal woher der Tipp kam.

Jetzt entscheidet `anwesenheitAuffrischen(k)`: im Reiter wird gezeichnet, als Dialog (Knopf
"Anwesenheit" in der Kopfzeile) wird der Dialog neu gesetzt. Dieselben Knöpfe, derselbe Weg zum
Zurücknehmen - ein aktiver Zustand schaltet auf "anwesend" zurück.

## Vier Handgriffe an der Bedienung (22.08.2026)

**Die Stundenliste beginnt bei dem, was ansteht.** Vorher stand der Juni oben und man scrollte durchs
Schuljahr. Jetzt zwei Gruppen: offen (heute und später, aufsteigend) sichtbar, gehalten
zusammengeklappt darunter. "Gehalten" heißt vorbei **und** dokumentiert - eine vergangene Stunde ohne
Thema ist nicht erledigt, sondern nachzutragen, und bleibt oben stehen, wo man sie sieht.

**Der Reiter Schüler steht drei Plätze weiter rechts** und hat die Tageszeile verloren: in der Liste
hängt nichts vom Datum ab, Namen und Notenstand sind an jedem Dienstag dieselben.

**Die TÜ-Spalten lassen sich zuklappen.** Ein Tipp auf den Gruppenkopf, und aus sieben Spalten wird
eine mit der Punktzahl; die Note steht im Tooltip, alles Weitere einen Klick entfernt.

## Der Schultag kommt aus planr, samt Vertretung (seit 2026-08-25)

merkr rechnete seinen Wochenplan allein aus Wochentag und A/B-Woche (`kurs.slots`). Das stimmt für
die Regel und weiß nichts von dem Dienstag, an dem die 9d ausfällt und dafür eine Vertretung in der
7a liegt. planr liest den Vertretungsplan der Schule ohnehin als ICS - **seit dem 25.08. geht der
fertig gerechnete Tag mit der Stoffverteilung mit**, als Feld `tagesplan`.

Der Plan reicht nur so weit wie der Vertretungsplan der Schule, drei bis vier Tage. Deshalb
`MerkrTagesplan.gilt`: **nur für die genannten Tage** ersetzt er merkrs Raster, für alles danach
bleibt es beim eigenen. Ein Tag, über den er nichts sagt, ist kein Tag ohne Unterricht.

| Was planr meldet | Was merkr zeigt |
|---|---|
| Ausfall | Kachel bleibt stehen, durchgestrichen und blass; zählt nicht als Unterricht |
| Raumänderung | Kachel mit dem neuen Raum statt dem Thema |
| Verlegung | Kachel im neuen Block; ohne Zielblock nur der Ausfall am alten Platz |
| Vertretung | eigene Kachel, ohne Kurs und ohne Klick, wenn merkr die Lerngruppe nicht führt |
| Aufsicht | ein schmaler roter Balken in der Zeile über dem Block, ohne Text - sie ist keine Stunde |

Gerechnet wird in `src/kern/tagesplan.js` (7 Tests). Die Zuordnung planr-Kurs zu merkr-Kurs macht
weiter `MerkrPlanr.kursFuer` - der Tagesplan reicht sie nur als Funktion herein, damit die beiden
Kernteile nichts voneinander wissen müssen.

Auf der planr-Seite steht die Rechnung in `lib/vplan-quelle.ts` als `tagesplanStand()`: Soll aus
`class_slots` plus die Befunde des Vertretungsplans. Sie ruft `vplanStand({uebernehmen:false})` -
ein Abruf aus merkr läuft still im Hintergrund und darf planrs Stundenplan nicht anfassen. Ein
hängender Schulserver hält den Rest der Antwort nicht auf: der Tagesplan läuft nebenher und fällt
im Fehlerfall auf leer zurück.

## Ein ergänzter Termin steht auch hier im ersten Block (04.09.2026)

planr zeigte am Freitag Mathe 9a im ersten Block, merkr nicht. Der Termin kam nicht aus dem
Stundenplan: er war drüben von Hand ergänzt ("Termin ergänzen" im Wochenraster) und trägt in
`termine` einen eigenen Block und Raum. Der Tagesplan rechnete das Soll nur aus `class_slots`, die
Stoffverteilung schickte je Termin nur das Datum - und merkrs Raster kennt nur die Regel.

Jetzt drei Stellen: planrs `tagesplanStand` nimmt solche Termine als Art `termin` mit auf,
`/api/stoffverteilung` gibt je Thema `block` und `raum` mit, wo der Termin sie hat, und der
Importer schreibt sie an die Stunde (`st.block`, `st.raum`). `kurseAmTag` hängt diese Stunden an
das eigene Raster, deshalb steht der Termin auch an Tagen, über die der Vertretungsplan nichts
sagt. Fehlt das Feld beim nächsten Abruf, fällt der Block wieder weg - anders als bei `regie`, weil
er eine Aussage über diesen einen Tag ist. Die Kachel trägt "zusätzlich", wie drüben.

Nicht gelöst: zwei Termine derselben Klasse am selben Tag sind in merkr eine Stunde. Der Importer
fasst über `ensureStunde(kurs, datum)` zusammen, das zweite Thema überschreibt das erste.

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

## Der Notenvorschlag war zu gut (25.08.2026)

Der erste echte Unterrichtstag hat 71 bestätigte Stundennoten geliefert, und daran ist der
Vorschlag gemessen worden: **in 19 Fällen hat die Lehrkraft von Hand korrigiert, 18 davon nach
unten.** Die Ursache stand in der Kurve - jeder Beitrag hob sofort, ein einzelnes "+" ergab die
Eins.

Seither ein Freibetrag statt einer geraden Linie durch den Nullpunkt: die ersten drei Beitragspunkte
sind die gewöhnliche Stunde und bewegen nichts, erst was darüber hinausgeht, hebt - und dann steil,
weil "besonders häufig" in der Beschlussvorlage genau der Sprung von der Zwei zur Eins ist.

| Beitragswert der Stunde | vorher | jetzt | von Hand gesetzt |
|---|---|---|---|
| 0 (keine Notiz) | 3 | 3 | 3 (34×) |
| 2 (ein gutes Wort) | 1 | 3 | 3 (5×), 2 (2×) |
| 3 | 1 | 3 | 3 (2×) |
| 4 (zwei gute) | 1 | 2 | 2 (6×) |
| 5 und mehr | 1 | 1 | 1 |
| −1 (keine Antwort) | 5 | 3 | 3 |

Der Vorschlag trifft damit 56 der 71 Noten statt 52 - und, was zählt, 15 der 19 Korrekturen.

Zwei Feinheiten dabei: **eine nicht beantwortete Frage allein zieht nicht mehr** (Freibetrag 1 nach
unten) - wer nicht antworten kann, hat nicht verweigert. Eine **Störung wiegt in der Einzelstunde
zwei** (`stundenbeitrag`) und schlägt deshalb sofort durch; in der Halbjahresachse bleibt sie eine
Verweigerung unter anderen, sonst hätte sich das Modell dort mitverschoben. Dieselbe Trennung gilt
für die Kappung: `stundeMax` gehört der Bilanz, `stundeKappeMax` der Einzelnote.

## Wie lief die Stunde? (seit 2026-08-26)

Im Abschluss-Dialog steht unter der Geschafft?-Liste ein Freitextfeld. Die Haken sagen, was
geschafft wurde; sie sagen nicht, dass die Klasse bei den Sachaufgaben abgerissen ist.

Der Satz geht mit der Rückmeldung als `notiz` hinaus und landet drüben in
`lessonPlans.reflexion`. **Dort lag er bisher tot:** `naechste_stunde` liefert die Vorstunde mit
Ausblick, Hausaufgabe und Merkhefteinträgen - die Reflexion fehlte, jede Rückmeldung war ein
Eintrag ins Nichts. Seit dem 26.08. steht sie in `vorstunde.reflexion` (planr, `lib/tuApi.ts`),
wie die Hausaufgabe nur für den Betreiber, und die Werkzeugbeschreibung sagt ausdrücklich, dass
sie schwerer wiegt als die Stofffolge.

Beobachtung und offene Phasen gehen als **eine** Notiz hinaus, die Beobachtung vorn: drüben ist es
ein Feld, und zwei Sätze davor zu trennen hieße, einen zu verlieren. Der Block entsteht jetzt auch
ohne Ziel und Phasen - sonst hätte eine Stunde ohne planr-Planung kein Feld.

Ein zweites Freitextfeld gab es einen Tag lang: es hing im Stundendialog und schrieb ins
Klassenprofil. Zwei Kästen für "was mir aufgefallen ist" sind einer zu viel - es ist am 26.08.
wieder entfernt worden, mit `profilBrief`, seinen vier Tests und der Brücke `planrProfilAnhang`.

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

## Regie: was am Lehrertisch liegen muss (seit 27.08.2026)

Zwischen Anwesend und Noten steht ein Reiter Regie. Er zeigt zum eingestellten Tag drei Dinge:
Thema und Ziel der Stunde, darunter die Regie aus planr, darunter den geplanten Verlauf zum
Mitlesen. Die Terminreihe darüber ist dieselbe wie in Sitzplan und Anwesenheit
(`STUNDENREIHE_TABS`), man blättert also mit denselben Kacheln.

**Der Reiter liest nur.** Geschrieben wird die Regie drüben in planr, im Stundenkopf oder über
`stunde_eintragen`; hier steht sie nach dem nächsten Abruf der Stoffverteilung. Ein Eingabefeld an
dieser Stelle hieße zwei Planungen an zwei Orten, und die zweite wäre die, die niemand
wiederfindet. Abgehakt wird der Verlauf weiter im Abschluss-Dialog, nicht hier.

Auf der planr-Seite ist es `lesson_plans.regie` (Migration `0022`, additiv) und geht als Feld
`regie` je Termin über `/api/stoffverteilung` mit - nur für den Betreiber, wie die Hausaufgabe. Der
Importer übernimmt es nach `st.regie`; fehlt das Feld im Abruf, bleibt der letzte Stand stehen,
statt eine Notiz zu löschen. Dasselbe Muster wie bei `tuThemen`.

**TÜ-Lösungen** (seit 03.09.2026): Unter der Regie steht eine Karte mit den Lösungen zur TÜ der
Stunde, nummeriert, Aufgabe klein darüber. Die erste Phase jeder Stunde heißt "TÜ + Vergleichen",
und dafür lagen die Lösungen bisher nur in drillr. planr holt sie dort ab, übersetzt das LaTeX in
Klartext und schickt sie als `tuLoesungen` je Termin - nur für die Stunden der nächsten Tage.
`MerkrPlanr.loesungenAusPlanr` bringt sie in Form (`st.tuLoesungen`), und wie bei `regie` bleibt
der letzte Stand stehen, wenn das Feld im Abruf fehlt. Ohne TÜ an der Stunde keine Karte.

## Graphit statt Pflaume (27.08.2026)

Die Oberfläche trug Pflaume auf hellem Lila. Im Verbund war das eine Modulfarbe wie selbrs Smaragd
oder planrs Indigo - auf dem Tisch, aufgeschlagen vor fünfundzwanzig Kindern, sah es nach
Grundschule aus. Jetzt Graphit (`#2f3439`) auf warmem Papier (`#f4f2ef`), Text `#1d2124`.

Die fünf Mitarbeitsstufen bleiben unangetastet: sie sind die einzige Stelle, an der Farbe etwas
bedeutet, und ein zurückgenommener Rahmen macht sie eher lesbarer. Geändert wurden die neun Werte
in `:root` und die vier hartkodierten Stellen daneben (Body und Ladeanzeige, Seitenleiste, Tische
im Sitzplan, Marke) - `docs/design-prompt.md` trägt dieselben Werte, damit die nächste Runde an der
Oberfläche nicht wieder lila herauskommt.

## Der Stundenplan kommt jetzt mit (27.08.2026)

Ein Kollege hat merkr installiert, planr verbunden - und sah trotzdem eine leere
Woche. Der Wochenplan hängt an `kurs.slots`, und die trug bisher jeder von Hand
ein: Tag, Stunde, A oder B, je Kurs. Bei sechs eigenen Kursen ist das einmal
Tippen und danach nie wieder ein Thema, beim zweiten Menschen ist es der Schritt,
an dem er hängenbleibt.

Dabei liegt der Plan drüben. planr führt ihn in `class_slots` und braucht ihn
selbst für die Terminerzeugung; er ging nur nie hinaus. Seit dem 27.08. trägt
`/api/stoffverteilung` je Klasse ein Feld `raster` - Wochentyp, Wochentag,
Doppelstunden-Block, Raum. Also planrs eigene Zählung, dieselbe wie im
Tagesplan: die Umrechnung auf merkrs Einzelstunden (`block*2-1`) steht damit an
einer Stelle statt an zweien.

**Übernommen wird nur in einen leeren Stundenplan.** Wer seine Stunden von Hand
eingetragen hat, dem soll ein Abruf am Dienstagmorgen nichts umstellen. Weicht
planrs Raster später ab, steht in der Kurskarte eine Zeile „In planr steht: Do 5.
(A)" mit einem Knopf daneben - welche der beiden Fassungen stimmt, weiß nur die
Lehrkraft. Der Stand von drüben liegt dafür als `kurs.planrSlots` bereit,
getrennt von dem, was gilt.

**Die A/B-Wochen mussten mit.** Sonst wäre das Raster angekommen und die halben
Stunden trotzdem unsichtbar geblieben: merkr rechnete den Buchstaben aus einem
Anker-Montag und der Zahl der Kalenderwochen seither, und ohne Anker gab es gar
keinen. planr zählt anders - der Wechsel läuft über Schulwochen, Ferienwochen
fallen heraus und der Takt läuft über sie hinweg weiter. Nach jeder ungeraden
Zahl Ferienwochen liefen die beiden auseinander, eine ganze Woche lang und in
jeder Kachel. Deshalb geht die Zuordnung jetzt als Liste hinaus, Montag für
Montag (`schuljahr.abWochen`), und merkr schlägt nach, statt zu rechnen. Der
Anker bleibt für alle ohne planr.

Gerechnet wird in `src/kern/raster.js` (8 Tests): Block zu Anfangsstunde, und
dieselbe Stunde in A und B wird zu „AB". Auf der planr-Seite baut die Route den
Kalender selbst, statt `aktiverKalender()` zu rufen - der liest den A/B-Modus
über die Browser-Sitzung, und dieser Abruf kommt mit einem Schlüssel.

**Dabei fiel ein stiller Ausfall auf:** `kurs.planrName` wurde nur von der alten,
längst ersetzten Fassung des Importers gesetzt. `MerkrRueckmeldung.brief` gibt
ohne diesen Namen `null` zurück - die Rückmeldung nach der Stunde ging also seit
dem Umbau des Importers gar nicht mehr hinaus, ohne Fehler und ohne Meldung.
Derselbe Fehlertyp wie damals bei `tuThemen`, an derselben Stelle. Jetzt
übernimmt der Importer `name` und `fach` wieder.
