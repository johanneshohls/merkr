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
