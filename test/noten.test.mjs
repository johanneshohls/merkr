import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const N = require("../src/kern/noten.js");

const JETZT = new Date("2026-05-01T12:00:00Z");
const vorTagen = (n) => new Date(JETZT.getTime() - n * 86400000).toISOString();

test("Stufenmittel o ergibt eine 3, nicht eine 4", () => {
  assert.equal(N.noteAusMittel(0, "noten"), 3);
  assert.equal(N.noteAusMittel(2, "noten"), 1);
  assert.equal(N.noteAusMittel(-1, "noten"), 4);
});

test("Notenskala und Punkteskala sagen bei o dasselbe", () => {
  // 8 Punkte sind eine glatte 3 - vor der Korrektur widersprachen sich beide Kurven.
  assert.equal(N.noteAusMittel(0, "punkte"), 8);
  assert.equal(N.noteAusMittel(0, "noten"), 3);
});

test("Gewicht halbiert sich nach der Halbwertszeit", () => {
  assert.equal(N.gewicht(0), 1);
  assert.ok(Math.abs(N.gewicht(8 * 7) - 0.5) < 1e-9);
  assert.ok(Math.abs(N.gewicht(16 * 7) - 0.25) < 1e-9);
});

test("Entwicklung zählt: frische Notizen wiegen schwerer als alte", () => {
  const schwacherStart = [
    { ts: vorTagen(180), stufe: -2 },
    { ts: vorTagen(170), stufe: -2 },
    { ts: vorTagen(7), stufe: 2 },
    { ts: vorTagen(2), stufe: 2 }
  ];
  const gewichtet = N.vorschlag(schwacherStart, { jetzt: JETZT, typ: "noten" });
  const ungewichtet = (-2 - 2 + 2 + 2) / 4; // was die alte Rechnung ergab: 0

  assert.ok(gewichtet.mittel > ungewichtet, "gewichtetes Mittel muss besser sein");
  assert.equal(gewichtet.wert, 1);
  assert.equal(gewichtet.anzahl, 4);
  assert.equal(gewichtet.anzahlFrisch, 2, "nur die letzten vier Wochen zählen als frisch");
});

test("Altes verschwindet nie ganz", () => {
  const nurAlt = [{ ts: vorTagen(300), stufe: -2 }];
  const erg = N.vorschlag(nurAlt, { jetzt: JETZT, typ: "noten" });
  assert.equal(erg.wert, 6, "eine einzelne alte Notiz trägt den Vorschlag allein");
});

test("Die Halbjahresgrenze ist hart", () => {
  const ereignisse = [
    { ts: "2025-11-10T09:00:00Z", stufe: -2 },
    { ts: "2026-04-20T09:00:00Z", stufe: 2 }
  ];
  const sj = { beginn: "2025-08-25", ende: "2026-07-10", halbjahrGrenze: "2026-02-02" };
  const ab = N.halbjahrBeginn(sj, "2026-05-01");
  assert.equal(ab, "2026-02-02");

  const erg = N.vorschlag(ereignisse, { jetzt: JETZT, typ: "noten", ab });
  assert.equal(erg.anzahl, 1, "das erste Halbjahr zählt nicht mehr mit");
  assert.equal(erg.wert, 1);
});

test("Vor der Grenze gilt der Schuljahresbeginn", () => {
  const sj = { beginn: "2025-08-25", halbjahrGrenze: "2026-02-02" };
  assert.equal(N.halbjahrBeginn(sj, "2025-12-01"), "2025-08-25");
});

test("Ohne verwertbare Notiz kommt kein Vorschlag", () => {
  assert.equal(N.vorschlag([], { jetzt: JETZT }), null);
  assert.equal(N.vorschlag([{ ts: vorTagen(3), stufe: null }], { jetzt: JETZT }), null);
});

test("Der ungerundete Wert zeigt, wie knapp es war", () => {
  // Stufenmittel 0,7 liegt zwischen 2 und 3, näher an 2.
  assert.equal(E_genau(0.7), 2.1);
  assert.equal(N.noteAusMittel(0.7, "noten"), 2, "eingetragen wird die ganze Note");
  assert.equal(E_genau(0), 3);
  assert.equal(E_genau(2), 1, "nach unten gedeckelt auf 1");
  assert.equal(E_genau(-2), 5.5);
});

function E_genau(mittel) { return N.genauAusMittel(mittel, "noten"); }

test("Der Vorschlag trägt beide Zahlen", () => {
  const erg = N.vorschlag([{ ts: "2026-05-01T09:00:00Z", stufe: 1 }], { jetzt: new Date("2026-05-01T12:00:00Z"), typ: "noten" });
  assert.equal(erg.wert, 2);
  assert.equal(erg.genau, 1.8);
});
