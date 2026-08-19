import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const P = require("../src/kern/planr.js");

const kurse = () => ([
  { id: "m9a", name: "Mathe 9a", planrKlasse: "Mathematik 9a", schuljahrId: "sj" },
  { id: "p9a", name: "Physik 9a", planrKlasse: "Physik 9a", schuljahrId: "sj" },
  { id: "m8d", name: "8d", planrKlasse: "", schuljahrId: "sj" },
  { id: "alt", name: "Mathe 9a", planrKlasse: "Mathematik 9a", schuljahrId: "vorjahr" }
]);

test("Die gepflegte Zuordnung trennt die beiden 9a", () => {
  assert.equal(P.kursFuer(kurse(), { kurs: "Mathematik 9a", klasseId: 3 }, "sj").id, "m9a");
  assert.equal(P.kursFuer(kurse(), { kurs: "Physik 9a", klasseId: 7 }, "sj").id, "p9a");
});

test("Ohne Zuordnung greift der Kursname", () => {
  assert.equal(P.kursFuer(kurse(), { kurs: "8d" }, "sj").id, "m8d");
});

test("Die Zuordnung schlägt den Namen", () => {
  const k = kurse();
  k[2].planrKlasse = "Mathematik 8d";
  assert.equal(P.kursFuer(k, { kurs: "8d" }, "sj"), null, "der Name zählt nicht mehr, wenn eine Zuordnung steht");
  assert.equal(P.kursFuer(k, { kurs: "Mathematik 8d" }, "sj").id, "m8d");
});

test("Die Id taugt auch als Zuordnung", () => {
  const k = kurse();
  k[0].planrKlasse = "3";
  assert.equal(P.kursFuer(k, { kurs: "Mathematik 9a", klasseId: 3 }, "sj").id, "m9a");
});

test("Kurse anderer Schuljahre bleiben außen vor", () => {
  assert.equal(P.kursFuer(kurse(), { kurs: "Mathematik 9a" }, "vorjahr").id, "alt");
});

test("Ohne Treffer kommt null", () => {
  assert.equal(P.kursFuer(kurse(), { kurs: "Chemie 10b" }, "sj"), null);
});
