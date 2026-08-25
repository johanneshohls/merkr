import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const T = require("../src/kern/tagesplan.js");
const P = require("../src/kern/planr.js");

const kurse = () => ([
  { id: "m9d", name: "Mathe 9d", planrKlasse: "Mathematik 9d", schuljahrId: "sj" },
  { id: "p7b", name: "Physik 7b", planrKlasse: "Physik 7b", schuljahrId: "sj" }
]);
const zuordnen = (k) => (e) => P.kursFuer(k, e, "sj");

const plan = (stunden) => ({
  tage: ["2026-08-25"],
  geholtAm: "2026-08-25T06:00:00.000Z",
  tage_stunden: { "2026-08-25": stunden }
});

const regulaer = {
  classId: 4, kurs: "Mathematik 9d", klasse: "9d", block: 1,
  stunden: [1, 2], raum: "104", art: "regulaer", hinweis: null
};

test("Nur über die genannten Tage sagt der Plan etwas", () => {
  const tp = plan([regulaer]);
  assert.equal(T.gilt(tp, "2026-08-25"), true);
  assert.equal(T.gilt(tp, "2026-08-26"), false, "sonst gälte er als Tag ohne Unterricht");
  assert.equal(T.gilt(null, "2026-08-25"), false);
  assert.deepEqual(T.amTag(tp, "2026-08-26", zuordnen(kurse())), []);
});

test("Eine reguläre Stunde findet ihren merkr-Kurs", () => {
  const [e] = T.amTag(plan([regulaer]), "2026-08-25", zuordnen(kurse()));
  assert.equal(e.kurs.id, "m9d");
  assert.equal(e.stunde, 1, "merkrs Raster rechnet in Einzelstunden");
  assert.equal(e.fremd, false);
  assert.equal(e.raum, "104");
});

test("Ein Ausfall bleibt sichtbar, zählt aber nicht als Unterricht", () => {
  const liste = T.amTag(
    plan([{ ...regulaer, art: "ausfall", hinweis: "fällt aus" }]),
    "2026-08-25", zuordnen(kurse()));
  assert.equal(liste.length, 1, "die Kachel bleibt stehen - sonst sieht der Tag aus wie ein Fehler");
  assert.equal(T.hatUnterricht(liste, "m9d"), false);
});

test("Eine Vertretung in einer fremden Klasse steht ohne Kurs im Tag", () => {
  const [e] = T.amTag(
    plan([{ classId: null, kurs: null, klasse: "7a", block: 3, stunden: [5, 6],
            raum: "201", art: "zusatz", hinweis: "Vertretung Ma 7a" }]),
    "2026-08-25", zuordnen(kurse()));
  assert.equal(e.kurs, null);
  assert.equal(e.fremd, true);
  assert.equal(e.name, "7a");
  assert.equal(e.stunde, 5);
});

test("Eine Aufsicht heißt Aufsicht, auch ohne Klasse", () => {
  const [e] = T.amTag(
    plan([{ classId: null, kurs: null, klasse: null, block: 2, stunden: [3, 4],
            raum: null, art: "aufsicht", hinweis: "Hof" }]),
    "2026-08-25", zuordnen(kurse()));
  assert.equal(e.name, "Aufsicht");
  assert.equal(T.hatUnterricht([e], "m9d"), false);
});

test("Der Tag steht in der Reihenfolge der Stunden", () => {
  const liste = T.amTag(
    plan([{ ...regulaer, block: 3, stunden: [5, 6] }, { ...regulaer, block: 1, stunden: [1, 2] }]),
    "2026-08-25", zuordnen(kurse()));
  assert.deepEqual(liste.map(e => e.stunde), [1, 5]);
});

test("Fehlen die Einzelstunden, werden sie aus dem Block gerechnet", () => {
  const [e] = T.amTag(plan([{ ...regulaer, block: 2, stunden: undefined }]),
    "2026-08-25", zuordnen(kurse()));
  assert.deepEqual(e.stunden, [3, 4]);
});
