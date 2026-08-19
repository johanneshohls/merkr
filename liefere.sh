#!/bin/bash
# merkr aufs Gerät bringen.
#
# Warum nicht einfach kopieren: eine überschriebene Datei bleibt in iCloud
# manchmal stundenlang hängen, während eine neu angelegte sofort übertragen
# wird. Am 19.08.2026 lief das Gerät deshalb zwei Stunden auf einem alten
# Stand, und drei Fehlersuchen gingen ins Leere.
#
# Deshalb: erst löschen, dann neu schreiben.
set -e
ZIEL=~/Library/Mobile\ Documents/iCloud~dk~simonbs~Scriptable/Documents/merkr.js
cd "$(dirname "$0")"
node bau.mjs >/dev/null
rm -f "$ZIEL"
sleep 1
cp dist/merkr.js "$ZIEL"
echo "ausgeliefert: $(grep -o 'const VERSION = "[^"]*"' dist/merkr.js | cut -d'"' -f2)"
