import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const H = require("../src/kern/hausaufgaben.js");

const schueler = () => ([
  { id: "a", name: "Zander", vorname: "Ann", selbrCode: "AAA11" },
  { id: "b", name: "Berg", vorname: "Ben", selbrCode: "BBB22" },
  { id: "c", name: "Meyer", vorname: "Cem", selbrCode: "" }
]);

const stand = () => ({
  klasse: "9d", fach: "Mathematik", erreichbar: true,
  hausaufgaben: [
    {
      titel: "Kapitel L90", hinweis: "bis Dienstag", zielAufgaben: 10,
      gestelltAm: "2026-08-27", faelligAm: "2026-09-01",
      schueler: [
        { code: "AAA11", geschafft: 10, fertig: true },
        { code: "BBB22", geschafft: 3, fertig: false },
        { code: "ZZZ99", geschafft: 7, fertig: false }
      ]
    },
    {
      titel: "Spätere Aufgabe", hinweis: "", zielAufgaben: 5,
      gestelltAm: "2026-09-01", faelligAm: "2026-09-08",
      schueler: [{ code: "AAA11", geschafft: 0, fertig: false }]
    }
  ]
});

test("nur die an diesem Tag fällige Aufgabe", () => {
  const r = H.fuerStunde(stand(), "2026-09-01", schueler());
  assert.equal(r.length, 1);
  assert.equal(r[0].titel, "Kapitel L90");
});

test("erledigt und offen werden getrennt", () => {
  const [h] = H.fuerStunde(stand(), "2026-09-01", schueler());
  assert.deepEqual(h.erledigt.map((x) => x.name), ["Zander"]);
  assert.deepEqual(h.offen.map((x) => x.name), ["Berg"]);
  assert.equal(h.offen[0].geschafft, 3);
  assert.equal(h.offen[0].ziel, 10);
});

test("ein Kind ohne Code steht eigens da und gilt nicht als erledigt", () => {
  const [h] = H.fuerStunde(stand(), "2026-09-01", schueler());
  assert.deepEqual(h.ohneCode.map((x) => x.name), ["Meyer"]);
  assert.ok(!h.erledigt.some((x) => x.name === "Meyer"));
  assert.ok(!h.offen.some((x) => x.name === "Meyer"));
});

test("ein fremder Code aus der Klasse wird übergangen", () => {
  const [h] = H.fuerStunde(stand(), "2026-09-01", schueler());
  assert.equal(h.erledigt.length + h.offen.length, 2);
});

test("offen steht nach Rückstand, der mit dem wenigsten zuerst", () => {
  const s = schueler();
  s.push({ id: "d", name: "Alt", vorname: "Dana", selbrCode: "DDD44" });
  const st = stand();
  st.hausaufgaben[0].schueler.push({ code: "DDD44", geschafft: 1, fertig: false });
  const [h] = H.fuerStunde(st, "2026-09-01", s);
  assert.deepEqual(h.offen.map((x) => x.name), ["Alt", "Berg"]);
});

test("an einem Tag ohne Fälligkeit kommt nichts", () => {
  assert.deepEqual(H.fuerStunde(stand(), "2026-08-31", schueler()), []);
});

test("ohne Stand kommt eine leere Liste, kein Fehler", () => {
  assert.deepEqual(H.fuerStunde(null, "2026-09-01", schueler()), []);
  assert.deepEqual(H.fuerStunde({}, "2026-09-01", schueler()), []);
});

test("Codes werden ohne Rücksicht auf Gross- und Kleinschreibung getroffen", () => {
  const s = schueler();
  s[0].selbrCode = " aaa11 ";
  const [h] = H.fuerStunde(stand(), "2026-09-01", s);
  assert.deepEqual(h.erledigt.map((x) => x.name), ["Zander"]);
});

test("der Kurs wird über planrKlasse gefunden", () => {
  const antwort = { kurse: [
    { kurs: "Mathematik 9d", klasse: "9d", fach: "Mathematik" },
    { kurs: "Physik 9a", klasse: "9a", fach: "Physik" },
    { kurs: "Mathematik 9a", klasse: "9a", fach: "Mathematik" }
  ] };
  assert.equal(H.kursStandVon(antwort, { name: "Mathe 9d", planrKlasse: "Mathematik 9d" }).klasse, "9d");
  // Die 9a gibt es zweimal - das Fach im planr-Namen entscheidet.
  assert.equal(H.kursStandVon(antwort, { name: "Physik 9a", planrKlasse: "Physik 9a" }).fach, "Physik");
  assert.equal(H.kursStandVon(antwort, { name: "Mathe 9a", planrKlasse: "Mathematik 9a" }).fach, "Mathematik");
  assert.equal(H.kursStandVon(antwort, { name: "Physik 8c", planrKlasse: "Physik 8c" }), null);
});

test("ohne planrKlasse hilft Fach und Klassenname", () => {
  const antwort = { kurse: [
    { kurs: "Mathematik 9a", klasse: "9a", fach: "Mathematik" },
    { kurs: "Physik 9a", klasse: "9a", fach: "Physik" }
  ] };
  assert.equal(H.kursStandVon(antwort, { name: "Mathe 9a", fach: "Mathematik" }).fach, "Mathematik");
  assert.equal(H.kursStandVon(antwort, { name: "Physik 9a", fach: "Physik" }).fach, "Physik");
});

test("gestellte Aufgabe: was die Klasse aus der Stunde mitnimmt", () => {
  const r = H.gestellteFuerStunde(stand(), "2026-09-01");
  assert.equal(r.length, 1);
  assert.equal(r[0].titel, "Spätere Aufgabe");
  assert.equal(r[0].faelligAm, "2026-09-08");
  assert.equal(r[0].ziel, 5);
  assert.equal(r[0].gesamt, 1);
  assert.equal(r[0].angefangen, 0);
  assert.equal(r[0].fertig, 0);
});

test("gestellte Aufgabe: angefangen zählt, wer mindestens eine richtig hat", () => {
  const r = H.gestellteFuerStunde(stand(), "2026-08-27");
  assert.equal(r.length, 1);
  assert.equal(r[0].gesamt, 3);
  assert.equal(r[0].angefangen, 3);
  assert.equal(r[0].fertig, 1);
});

test("gestellte Aufgabe: ohne Stand nichts", () => {
  assert.deepEqual(H.gestellteFuerStunde(null, "2026-09-01"), []);
  assert.deepEqual(H.gestellteFuerStunde({ hausaufgaben: [] }, "2026-09-01"), []);
});
