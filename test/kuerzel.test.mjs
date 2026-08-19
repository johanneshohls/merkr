import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const K = require("../src/kern/kuerzel.js");

const klasse = () => ([
  { id: "a", name: "Zander", vorname: "Ann", kuerzel: "" },
  { id: "b", name: "Berg", vorname: "Ben", kuerzel: "" },
  { id: "c", name: "Meyer", vorname: "Cem", kuerzel: "" }
]);

test("Vergabe läuft alphabetisch und zweistellig", () => {
  const neu = K.vergeben(klasse(), "9d", []);
  assert.deepEqual(neu, [
    { id: "b", kuerzel: "9d-01" },
    { id: "c", kuerzel: "9d-02" },
    { id: "a", kuerzel: "9d-03" }
  ]);
});

test("Vorhandene Kürzel bleiben unangetastet", () => {
  const sus = klasse();
  sus[1].kuerzel = "9d-42";
  const neu = K.vergeben(sus, "9d", []);
  assert.equal(neu.length, 2);
  assert.ok(!neu.some((n) => n.id === "b"), "wer eines hat, bekommt kein neues");
});

test("Belegte Kürzel aus anderen Kursen werden übersprungen", () => {
  const neu = K.vergeben(klasse(), "9d", ["9d-01", "9d-02"]);
  assert.deepEqual(neu.map((n) => n.kuerzel), ["9d-03", "9d-04", "9d-05"]);
});

test("Doppelte werden gefunden, auch mit abweichender Schreibung", () => {
  const sus = klasse();
  sus[0].kuerzel = "9d-01";
  sus[1].kuerzel = " 9D-01 ";
  sus[2].kuerzel = "9d-02";
  assert.deepEqual(K.doppelte(sus), ["9d-01"]);
});

test("Die checkr-Liste trägt nur Kürzel, keine Namen", () => {
  const sus = klasse();
  sus[0].kuerzel = "9d-03";
  sus[1].kuerzel = "9d-01";
  const liste = K.checkrListe(sus);
  assert.deepEqual(liste, [{ name: "9d-01" }, { name: "9d-03" }]);
  const alsText = JSON.stringify(liste);
  for (const s of sus) {
    if (s.name) assert.ok(!alsText.includes(s.name), "Nachname darf nicht mitgehen: " + s.name);
    if (s.vorname) assert.ok(!alsText.includes(s.vorname), "Vorname darf nicht mitgehen: " + s.vorname);
  }
});
