# Nunito, mitgeliefert

Variable Font (Gewichte 400 bis 900) in zwei Schnitten: `latin` und `latin-ext`.
Zusammen 74 KB, als Base64 im gebauten Skript rund 100 KB.

**Warum eingebettet und nicht von Google geladen:** merkr läuft im Klassenraum,
und dort ist das Netz manchmal weg. Eine Schrift, die nicht kommt, nimmt das
ganze Bild mit. Nebenbei geht so kein Aufruf an Google, wenn eine Lehrkraft die
App öffnet.

Bezogen am 19.08.2026 von fonts.gstatic.com (Nunito v32). Lizenz: SIL Open Font
License 1.1, siehe `OFL.txt` - Einbetten ist ausdrücklich erlaubt, der
Copyright-Vermerk muss mit.

`bau.mjs` setzt beide Dateien an der Stelle `/*__SCHRIFT__*/` in die Oberfläche.
