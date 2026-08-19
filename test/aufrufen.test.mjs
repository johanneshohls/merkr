import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const A = require("../src/kern/aufrufen.js");

const IDS = ["a", "b", "c", "d", "e"];

/** Ein Würfel, der eine feste Folge abarbeitet - damit ist der Zufall prüfbar. */
function wuerfelFolge(werte) {
  let i = 0;
  return () => werte[i++ % werte.length];
}

test("Jeder kommt einmal dran, bevor sich einer wiederholt", () => {
  let topf = [], zuletzt = null;
  const gezogen = [];
  for (let i = 0; i < IDS.length; i++) {
    const e = A.ziehen(IDS, topf, zuletzt, wuerfelFolge([0.1, 0.9, 0.5, 0.3, 0.7]));
    topf = e.topf; zuletzt = e.gezogen;
    gezogen.push(e.gezogen);
  }
  assert.equal(new Set(gezogen).size, IDS.length, "keine Wiederholung in der ersten Runde");
  assert.equal(topf.length, 0, "der Topf ist leer");
});

test("Ist der Topf leer, beginnt eine neue Runde", () => {
  const e = A.ziehen(IDS, [], null, () => 0);
  assert.equal(e.neueRunde, true);
  assert.equal(e.topf.length, IDS.length - 1);
});

test("Nach einer vollen Runde kommt nicht derselbe noch einmal", () => {
  // Der Würfel zeigt immer auf den ersten - ohne Schutz wäre das wieder "a".
  const e = A.ziehen(IDS, [], "a", () => 0);
  assert.notEqual(e.gezogen, "a", "wer zuletzt dran war, wird nicht sofort wieder Erster");
  assert.equal(e.neueRunde, true);
});

test("Bei einem einzigen Schüler bleibt es bei ihm", () => {
  const e = A.ziehen(["a"], [], "a", () => 0);
  assert.equal(e.gezogen, "a");
});

test("Wer den Kurs verlassen hat, fliegt aus dem Topf", () => {
  assert.deepEqual(A.topfPruefen(["a", "weg", "b"], IDS), ["a", "b"]);
  assert.equal(A.offen(["a", "weg", "b"], IDS), 2);
});

test("Wer neu dazukommt, ist in der laufenden Runde noch nicht dran gewesen", () => {
  // Topf hat noch c und d; e ist neu und noch nicht gezogen worden.
  const mit = [...IDS, "f"];
  let topf = ["c", "d"];
  const e = A.ziehen(mit, topf, "b", () => 0);
  assert.ok(["c", "d"].includes(e.gezogen), "erst wird der laufende Topf geleert");
});

test("Ohne Schüler gibt es niemanden zu ziehen", () => {
  assert.equal(A.ziehen([], [], null, () => 0), null);
});

test("Über viele Runden bleibt es gleichmäßig", () => {
  let topf = [], zuletzt = null;
  const zaehler = {};
  for (let i = 0; i < IDS.length * 20; i++) {
    const e = A.ziehen(IDS, topf, zuletzt, Math.random);
    topf = e.topf; zuletzt = e.gezogen;
    zaehler[e.gezogen] = (zaehler[e.gezogen] || 0) + 1;
  }
  const werte = Object.values(zaehler);
  assert.equal(werte.length, IDS.length);
  assert.ok(Math.max(...werte) - Math.min(...werte) <= 1,
    "nach vollen Runden liegen alle gleichauf: " + JSON.stringify(zaehler));
});
