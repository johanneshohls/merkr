// Baut dist/merkr.js: die Oberfläche wird als Zeichenkette in den Scriptable-Rahmen gesetzt.
//
// Scriptable kennt keine zweite Datei neben dem Skript, deshalb muss die
// Oberfläche eingebettet werden. Vorher entstand jede Erweiterung, indem ein
// zweites Skript den fertigen Text las und einen Block vor </script> einfügte -
// die erweiterte Fassung war dann als Grundlage der nächsten Runde unbrauchbar.
// Hier ist die Quelle die Quelle, und dist/ ist immer neu erzeugbar.
//
// Prüfstein beim Umbau: `node bau.mjs --pruefe <datei>` vergleicht das Ergebnis
// byteweise mit einer Vorgabe. Beim ersten Commit war das die Ausgangsdatei.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const hier = path.dirname(fileURLToPath(import.meta.url));
const PLATZHALTER = '"__OBERFLAECHE__"';

const rahmen = fs.readFileSync(path.join(hier, "src/rahmen.js"), "utf8");
let html = fs.readFileSync(path.join(hier, "src/oberflaeche.html"), "utf8");

// Nunito reist mit, statt von Google geladen zu werden: im Klassenraum ist das
// Netz manchmal weg, und eine Schrift, die nicht kommt, nimmt das ganze Bild
// mit. Variable Font, zwei Schnitte, zusammen rund 100 KB als Base64.
const SCHRIFT_PLATZHALTER = "/*__SCHRIFT__*/";
const schriftOrdner = path.join(hier, "src/schrift");
if (fs.existsSync(schriftOrdner)) {
  const teile = [
    ["latin", "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"],
    ["latin-ext", "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF"],
  ];
  const regeln = teile
    .map(([name, bereich]) => {
      const datei = path.join(schriftOrdner, "nunito-" + name + ".woff2");
      if (!fs.existsSync(datei)) return "";
      const daten = fs.readFileSync(datei).toString("base64");
      return "@font-face{font-family:'Nunito';font-style:normal;font-weight:400 900;font-display:swap;" +
        "src:url(data:font/woff2;base64," + daten + ") format('woff2');unicode-range:" + bereich + ";}";
    })
    .filter(Boolean)
    .join("\n");
  if (html.includes(SCHRIFT_PLATZHALTER)) {
    html = html.replace(SCHRIFT_PLATZHALTER, () => "/* Nunito, SIL OFL 1.1, siehe src/schrift/OFL.txt */\n" + regeln);
    console.log("Schrift eingesetzt: " + Math.round(regeln.length / 1024) + " KB");
  }
}

// Der Kern (src/kern/*.js) wird in die Oberfläche gesetzt, statt dort zu leben:
// so laufen dieselben Zeilen im WebView und in `node --test`. Sortiert, damit
// dist/ bei gleichem Stand gleich bleibt.
const KERN_PLATZHALTER = "/*__KERN__*/";
const kernOrdner = path.join(hier, "src/kern");
if (fs.existsSync(kernOrdner)) {
  const teile = fs.readdirSync(kernOrdner).filter((n) => n.endsWith(".js")).sort();
  const kern = teile
    .map((n) => "/* --- kern/" + n + " --- */\n" + fs.readFileSync(path.join(kernOrdner, n), "utf8"))
    .join("\n");
  if (!html.includes(KERN_PLATZHALTER)) {
    console.error("Platzhalter " + KERN_PLATZHALTER + " fehlt in src/oberflaeche.html.");
    process.exit(1);
  }
  html = html.replace(KERN_PLATZHALTER, () => kern);
  console.log("Kern eingesetzt: " + teile.join(", "));
}

if (!rahmen.includes(PLATZHALTER)) {
  console.error("Platzhalter " + PLATZHALTER + " fehlt in src/rahmen.js.");
  process.exit(1);
}

// Ersatz als Funktion: sonst deutet String.replace $-Zeichen im HTML als Rückverweis.
const ergebnis = rahmen.replace(PLATZHALTER, () => JSON.stringify(html));

// Die zusammengesetzte Oberfläche auch einzeln ablegen: so lässt sie sich im
// Browser öffnen und prüfen, ohne ein iPad. Im Standalone-Modus speichert sie
// nichts - genau richtig zum Durchklicken.
const vorschau = path.join(hier, "dist/oberflaeche.html");
fs.mkdirSync(path.dirname(vorschau), { recursive: true });
fs.writeFileSync(vorschau, html);

const ziel = path.join(hier, "dist/merkr.js");
fs.mkdirSync(path.dirname(ziel), { recursive: true });
fs.writeFileSync(ziel, ergebnis);
console.log("dist/merkr.js " + ergebnis.length + " Zeichen");

const i = process.argv.indexOf("--pruefe");
if (i >= 0) {
  const vorgabe = fs.readFileSync(process.argv[i + 1], "utf8");
  if (vorgabe === ergebnis) {
    console.log("Prüfung: byteweise gleich der Vorgabe.");
  } else {
    console.error("Prüfung: Abweichung. Vorgabe " + vorgabe.length + ", Ergebnis " + ergebnis.length);
    process.exit(1);
  }
}
