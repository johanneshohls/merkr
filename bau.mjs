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
