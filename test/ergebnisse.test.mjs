import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const E = require("../src/kern/ergebnisse.js");

const klasse = () => ([
  { id: "a", name: "Berg", vorname: "Ben", kuerzel: "9d-01" },
  { id: "b", name: "Meyer", vorname: "Cem", kuerzel: "9d-02" },
  { id: "c", name: "Zander", vorname: "Ann", kuerzel: "9d-03" }
]);

test("Der MV-Schlüssel gilt an seinen Grenzen", () => {
  assert.equal(E.noteAusProzent(96), 1);
  assert.equal(E.noteAusProzent(95.9), 2);
  assert.equal(E.noteAusProzent(80), 2);
  assert.equal(E.noteAusProzent(60), 3);
  assert.equal(E.noteAusProzent(40), 4);
  assert.equal(E.noteAusProzent(39), 5);
  assert.equal(E.noteAusProzent(20), 5);
  assert.equal(E.noteAusProzent(19), 6);
});

test("Zuordnung läuft über das Kürzel", () => {
  const erg = E.zuordnen(klasse(), [
    { code: "9d-01", erreicht: 34, maximal: 40, prozent: 85 },
    { code: "9d-02", erreicht: 20, maximal: 40, prozent: 50 }
  ], "noten");

  assert.equal(erg.treffer.length, 2);
  assert.deepEqual(erg.treffer.map((t) => [t.schuelerId, t.wert]), [["a", 2], ["b", 4]]);
  assert.deepEqual(erg.ohneSchueler, []);
  assert.deepEqual(erg.ohneArbeit, ["Zander, Ann"], "wer keine Zeile hat, wird genannt");
});

test("Ein fremder Code wird gemeldet, nicht verteilt", () => {
  const erg = E.zuordnen(klasse(), [{ code: "9d-99", erreicht: 30, maximal: 40, prozent: 75 }], "noten");
  assert.equal(erg.treffer.length, 0);
  assert.deepEqual(erg.ohneSchueler, ["9d-99"]);
});

test("Schreibweise trennt nicht", () => {
  const erg = E.zuordnen(klasse(), [{ code: " 9D-01 ", erreicht: 40, maximal: 40, prozent: 100 }], "noten");
  assert.equal(erg.treffer[0].schuelerId, "a");
  assert.equal(erg.treffer[0].wert, 1);
});

test("Doppelte Codes werden gemeldet, der erste zählt", () => {
  const erg = E.zuordnen(klasse(), [
    { code: "9d-01", erreicht: 40, maximal: 40, prozent: 100 },
    { code: "9d-01", erreicht: 0, maximal: 40, prozent: 0 }
  ], "noten");
  assert.equal(erg.treffer.length, 1);
  assert.equal(erg.treffer[0].wert, 1);
  assert.deepEqual(erg.doppelt, ["9d-01"]);
});

test("Wer nicht mitgeschrieben hat, bekommt keine Sechs", () => {
  const erg = E.zuordnen(klasse(), [{ code: "9d-03", erreicht: 0, maximal: 0, prozent: 0 }], "noten");
  assert.equal(erg.treffer.length, 0, "0 von 0 ist keine Leistung, sondern keine Arbeit");
  assert.ok(erg.ohneArbeit.includes("Zander, Ann"));
});

test("Vorhandene Werte werden nicht überschrieben", () => {
  const treffer = [
    { schuelerId: "a", wert: 2 },
    { schuelerId: "b", wert: 4 }
  ];
  const erg = E.zusammenfuehren({ a: 3 }, treffer);
  assert.equal(erg.ergebnisse.a, 3, "von Hand eingetragen gewinnt");
  assert.equal(erg.ergebnisse.b, 4);
  assert.equal(erg.neu, 1);
  assert.equal(erg.behalten, 1);
});

test("Oberstufe rechnet in Punkten", () => {
  assert.equal(E.wertAusProzent(96, "punkte"), 15);
  assert.equal(E.wertAusProzent(50, "punkte"), 6);
  assert.equal(E.wertAusProzent(10, "punkte"), 0);
  assert.equal(E.wertAusProzent(96, "noten"), 1);
});
