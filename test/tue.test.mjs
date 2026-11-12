import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const T = require("../src/kern/tue.js");
const E = require("../src/kern/ergebnisse.js");

test("ohne Rückkaufrecht zählen die ersten drei", () => {
  const a = T.auswertung([8, 4, 9, null, null], 0);
  assert.deepEqual(a.zaehlend.slice().sort(), [1, 2, 3]);
  assert.equal(a.summe, 21);
  assert.equal(a.max, 30);
  assert.equal(a.vollstaendig, true);
});

test("ein Recht holt TÜ 4 dazu und streicht die schlechteste", () => {
  const a = T.auswertung([8, 4, 9, 10, null], 1);
  assert.deepEqual(a.gestrichen, [2]);
  assert.equal(a.summe, 27);
  assert.deepEqual(a.unzulaessig, []);
});

test("zwei Rechte streichen die zwei schlechtesten aus fünf", () => {
  const a = T.auswertung([8, 4, 9, 10, 6], 2);
  assert.deepEqual(a.gestrichen, [2, 5]);
  assert.equal(a.summe, 27);
});

test("TÜ 4 ohne Recht zählt nicht mit, wird aber gemeldet", () => {
  const a = T.auswertung([8, 4, 9, 10, null], 0);
  assert.deepEqual(a.unzulaessig, [4]);
  assert.equal(a.summe, 21);
});

test("ein Recht reicht nur für TÜ 4, nicht für TÜ 5", () => {
  const a = T.auswertung([8, 4, 9, null, 10], 1);
  assert.deepEqual(a.unzulaessig, [5]);
  assert.equal(a.summe, 21);
});

test("erst zwei geschrieben: Zwischenstand misst sich an 20 Punkten", () => {
  const a = T.auswertung([8, 6, null, null, null], 0);
  assert.equal(a.vollstaendig, false);
  assert.equal(a.max, 20);
  assert.equal(a.prozent, 70);
});

test("nichts geschrieben ergibt keine Punkte und keinen Absturz", () => {
  const a = T.auswertung([null, null, null, null, null], 0);
  assert.equal(a.summe, 0);
  assert.deepEqual(a.zaehlend, []);
  assert.equal(a.vollstaendig, false);
});

test("Punkte außerhalb 0 bis 10 werden begrenzt", () => {
  const a = T.auswertung([12, -3, 5, null, null], 0);
  assert.equal(a.summe, 15);
});

test("mehr Rechte als es Übungen gibt ändern nichts", () => {
  const a = T.auswertung([8, 4, 9, 10, 6], 7);
  assert.equal(a.rechte, 2);
  assert.equal(a.summe, 27);
});

test("Gleichstand: die frühere Übung zählt, die spätere fällt", () => {
  const a = T.auswertung([5, 5, 5, 5, null], 1);
  assert.deepEqual(a.zaehlend.slice().sort(), [1, 2, 3]);
  assert.deepEqual(a.gestrichen, [4]);
});

test("die Prozentzahl trifft den MV-Schlüssel", () => {
  /* 27 von 30 sind 90 Prozent - nach 96/80/60/40/20 eine Zwei. */
  const a = T.auswertung([9, 9, 9, null, null], 0);
  assert.equal(a.prozent, 90);
  assert.equal(E.noteAusProzent(a.prozent), 2);
  /* Volle Punktzahl ist eine Eins, die Hälfte eine Vier. */
  assert.equal(E.noteAusProzent(T.auswertung([10, 10, 10, null, null], 0).prozent), 1);
  assert.equal(E.noteAusProzent(T.auswertung([5, 5, 5, null, null], 0).prozent), 4);
});

test("checkr-Blatt landet im ersten freien Feld", () => {
  const r = T.einsortieren([7, null, null, null, null], {}, "2026-11-10-9a", 8, 10);
  assert.equal(r.ergebnis, "neu");
  assert.equal(r.nr, 2);
  assert.deepEqual(r.punkte, [7, 8, null, null, null]);
  assert.deepEqual(r.herkunft, { "2026-11-10-9a": { nr: 2, wert: 8 } });
});

test("derselbe Lauf belegt beim zweiten Abruf kein zweites Feld", () => {
  const a = T.einsortieren([], {}, "L1", 6, 10);
  const b = T.einsortieren(a.punkte, a.herkunft, "L1", 6, 10);
  assert.equal(b.ergebnis, "unveraendert");
  assert.deepEqual(b.punkte, [6, null, null, null, null]);
});

test("geänderte Durchsicht zieht nach, Handeintrag gewinnt", () => {
  const a = T.einsortieren([], {}, "L1", 6, 10);
  const b = T.einsortieren(a.punkte, a.herkunft, "L1", 7.5, 10);
  assert.equal(b.ergebnis, "aktualisiert");
  assert.equal(b.punkte[0], 7.5);
  const hand = b.punkte.slice(); hand[0] = 9;
  const c = T.einsortieren(hand, b.herkunft, "L1", 5, 10);
  assert.equal(c.ergebnis, "behalten");
  assert.equal(c.punkte[0], 9);
});

test("auf zehn umgerechnet, auf halbe Punkte gerundet", () => {
  assert.equal(T.einsortieren([], {}, "L", 7, 8).punkte[0], 9);
  assert.equal(T.einsortieren([], {}, "L", 5.5, 10).punkte[0], 5.5);
});

test("alle fünf Felder belegt: nichts überschrieben", () => {
  const r = T.einsortieren([1, 2, 3, 4, 5], {}, "L", 8, 10);
  assert.equal(r.ergebnis, "voll");
  assert.deepEqual(r.punkte, [1, 2, 3, 4, 5]);
});
