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
