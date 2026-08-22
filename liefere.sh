#!/bin/bash
# merkr aufs Gerät bringen.
#
# Warum nicht einfach kopieren: eine überschriebene Datei bleibt in iCloud
# manchmal stundenlang hängen, während eine neu angelegte sofort übertragen
# wird. Am 19.08.2026 lief das Gerät deshalb zwei Stunden auf einem alten
# Stand, und drei Fehlersuchen gingen ins Leere.
#
# Deshalb: erst löschen, dann neu schreiben.
#
# Nachtrag: reines Löschen und Neuanlegen sah für iCloud aus wie zwei
# verschiedene Dateien mit demselben Namen - es entstanden Duplikate
# ("merkr 2.js"). Deshalb jetzt atomar: daneben schreiben, dann umbenennen.
set -e
ORDNER=~/Library/Mobile\ Documents/iCloud~dk~simonbs~Scriptable/Documents
ZIEL="$ORDNER/merkr.js"
cd "$(dirname "$0")"
node bau.mjs >/dev/null

# Duplikate aus frueheren Konflikten wegraeumen, bevor neue entstehen.
find "$ORDNER" -maxdepth 1 -name "merkr [0-9]*.js" -delete 2>/dev/null || true

cp dist/merkr.js "$ZIEL.neu"
mv -f "$ZIEL.neu" "$ZIEL"
echo "ausgeliefert: $(grep -o 'const VERSION = "[^"]*"' dist/merkr.js | cut -d'"' -f2)"

# Den Container wecken. Das ist die Befehlszeilen-Entsprechung zum Klick aufs
# Wolkensymbol im Finder, der am 21.08. den haengenden Sync in Gang brachte.
brctl download "$ZIEL" 2>/dev/null || true

# Und nachsehen, ob die Datei wirklich oben ist. Ohne diese Zeile bleibt beim
# naechsten Haenger wieder die Frage offen, ob es am Mac liegt oder am Geraet.
for i in 1 2 3 4 5 6; do
  AUSGABE=$(swift uploadstand.swift "$ZIEL" 2>/dev/null) && break
  sleep 5
done
if echo "$AUSGABE" | grep -q "hochgeladen: true"; then
  echo "in iCloud: ja"
else
  echo "in iCloud: noch nicht - $(echo "$AUSGABE" | tr '\n' ' ')"
  echo "Bleibt es dabei: im Finder in den Scriptable-Ordner gehen und auf das"
  echo "Wolkensymbol einer Datei klicken."
fi

