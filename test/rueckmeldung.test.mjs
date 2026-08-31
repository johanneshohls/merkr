import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const R = require("../src/kern/rueckmeldung.js");

const kurs = { id: 1, name: "Mathe 9d", planrName: "9d", planrFach: "Mathematik" };
const stunde = {
  datum: "2026-08-25",
  tuThemen: ["lösungsformel", "faktorisierung", "prozent"],
};

test("Auswahl kommt aus den TÜ-Themen der Stunde", () => {
  assert.deepEqual(R.wackelThemen(stunde), ["lösungsformel", "faktorisierung", "prozent"]);
});

test("ohne TÜ gibt es nichts anzukreuzen", () => {
  assert.deepEqual(R.wackelThemen({ datum: "2026-08-25" }), []);
});

test("Doppelte und Leere fallen weg", () => {
  const s = { tuThemen: ["a", " a ", "", null, "b"] };
  assert.deepEqual(R.wackelThemen(s), ["a", "b"]);
});

test("Brief trägt Klasse, Fach und Datum aus planr", () => {
  const b = R.brief(kurs, stunde, ["lösungsformel"]);
  assert.deepEqual(b, {
    klasse: "9d",
    datum: "2026-08-25",
    gehalten: true,
    wackelt: ["lösungsformel"],
    fach: "Mathematik",
  });
});

test("nur was auf dem Blatt stand", () => {
  const b = R.brief(kurs, stunde, ["lösungsformel", "trigonometrie"]);
  assert.deepEqual(b.wackelt, ["lösungsformel"]);
});

test("nichts ausgewählt heißt kein Brief", () => {
  assert.equal(R.brief(kurs, stunde, []), null);
  assert.equal(R.brief(kurs, stunde, ["gibtesnicht"]), null);
});

test("ein Kurs ohne planr-Herkunft meldet nichts", () => {
  assert.equal(R.brief({ name: "AG Schach" }, stunde, ["lösungsformel"]), null);
});

test("Fach bleibt weg, wenn planr keins genannt hat", () => {
  const b = R.brief({ planrName: "8c" }, stunde, ["prozent"]);
  assert.equal("fach" in b, false);
  assert.equal(b.klasse, "8c");
});

test("Notiz fasst zusammen", () => {
  assert.equal(R.notiz(R.brief(kurs, stunde, ["lösungsformel", "faktorisierung"])),
    "2026-08-25: lösungsformel, faktorisierung");
  assert.equal(R.notiz(null), "");
});

/* ---------- Der Zielstand aus den abgehakten Phasen ---------- */

const PHASEN = [
  { schluessel: "p1", name: "TÜ + Vergleichen" },
  { schluessel: "p2", name: "Erarbeitung" },
  { schluessel: "p3", name: "Sicherung" },
];

test("alles abgehakt heißt: Ziel erreicht", () => {
  const z = R.zielstand(PHASEN, ["p1", "p2", "p3"]);
  assert.equal(z.zielErreicht, "ja");
  assert.deepEqual(z.offen, []);
  assert.equal(z.notiz, "");
});

test("ein Rest bleibt: teilweise, und der Rest steht in der Notiz", () => {
  const z = R.zielstand(PHASEN, ["p1", "p2"]);
  assert.equal(z.zielErreicht, "teilweise");
  assert.deepEqual(z.offen, ["Sicherung"]);
  assert.match(z.notiz, /Sicherung/);
});

test("nichts abgehakt heißt: nicht erreicht", () => {
  assert.equal(R.zielstand(PHASEN, []).zielErreicht, "nein");
});

test("ohne Phasen gibt es keinen Zielstand", () => {
  const z = R.zielstand([], ["p1"]);
  assert.equal(z.zielErreicht, null);
  assert.equal(z.notiz, "");
});

test("der Brief trägt den Zielstand auch ohne gewackelte Themen", () => {
  const b = R.brief(
    { planrName: "9d", planrFach: "Mathematik" },
    { datum: "2026-09-17" },
    [],
    { zielErreicht: "teilweise", notiz: "Offen geblieben: Sicherung" },
  );
  assert.equal(b.zielErreicht, "teilweise");
  assert.equal(b.wackelt, undefined);
  assert.equal(b.klasse, "9d");
});

test("ein erfundener Zielstand geht nicht hinaus", () => {
  const b = R.brief(
    { planrName: "9d" },
    { datum: "2026-09-17", tuThemen: ["Wurzeln"] },
    ["Wurzeln"],
    { zielErreicht: "vielleicht" },
  );
  assert.equal(b.zielErreicht, undefined);
  assert.deepEqual(b.wackelt, ["Wurzeln"]);
});

test("ohne Inhalt entsteht kein Brief", () => {
  assert.equal(R.brief({ planrName: "9d" }, { datum: "2026-09-17" }, [], {}), null);
});

/* Der Rückfall auf den Themenblock, seit dem 27.08.2026.

   Bis dahin hing die ganze Ankreuzliste an `tuThemen`, und das Feld stand nur
   da, wenn die TÜ über planrs Knopf entstanden war. Da sie in der Praxis direkt
   in drillr gebaut wird, blieb es leer - der Block erschien nie, und in planr
   standen null Wiederholungssignale, seit es die Tabelle gibt. */
test("ohne TÜ-Themen greifen die Themen des Blocks", () => {
  const themen = R.wackelThemen({ datum: "2026-09-17", wackelThemen: ["terme", "klammern"] });
  assert.deepEqual(themen, ["terme", "klammern"]);
});

test("mit TÜ-Themen gewinnen die genaueren", () => {
  const themen = R.wackelThemen({
    datum: "2026-09-17",
    tuThemen: ["lösungsformel"],
    wackelThemen: ["quadratische gleichungen"],
  });
  assert.deepEqual(themen, ["lösungsformel"]);
});

test("eine leere TÜ-Liste zählt wie keine", () => {
  const themen = R.wackelThemen({ datum: "2026-09-17", tuThemen: [], wackelThemen: ["Optik"] });
  assert.deepEqual(themen, ["Optik"]);
});

test("aus dem Block gemeldete Themen kommen in den Brief", () => {
  const b = R.brief(
    { planrName: "8d", planrFach: "Mathematik" },
    { datum: "2026-09-17", wackelThemen: ["terme", "klammern"] },
    ["klammern"],
  );
  assert.deepEqual(b.wackelt, ["klammern"]);
});

test("ohne beide Listen gibt es nichts anzukreuzen", () => {
  assert.deepEqual(R.wackelThemen({ datum: "2026-09-17" }), []);
});
