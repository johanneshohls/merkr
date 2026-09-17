import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const B = require("../src/kern/habilanz.js");

const schueler = () => ([
  { id: "a", name: "Zander", vorname: "Ann", selbrCode: "AAA11" },
  { id: "b", name: "Berg", vorname: "Ben", selbrCode: "BBB22" },
  { id: "c", name: "Meyer", vorname: "Cem", selbrCode: "" }
]);

const stand = (faelligAm, werte) => ({
  hausaufgaben: [{
    quelleRef: "12:2", titel: "Kapitel L90", zielAufgaben: 10, gestelltAm: "2026-08-27",
    faelligAm,
    schueler: [
      { code: "AAA11", geschafft: werte[0], fertig: werte[0] >= 10 },
      { code: "BBB22", geschafft: werte[1], fertig: werte[1] >= 10 }
    ]
  }]
});

test("vor dem Termin wird nichts festgehalten", () => {
  assert.deepEqual(B.festschreiben({}, stand("2026-09-01", [10, 3]), schueler(), "2026-08-31"), {});
});

test("am Termin wird der Stand festgehalten", () => {
  const neu = B.festschreiben({}, stand("2026-09-01", [10, 3]), schueler(), "2026-09-01");
  assert.deepEqual(Object.keys(neu), ["12:2"]);
  assert.deepEqual(neu["12:2"].stand, { a: 10, b: 3 });
  assert.equal(neu["12:2"].ziel, 10);
  assert.equal(neu["12:2"].festAm, "2026-09-01");
});

test("ein zweiter Abruf überschreibt den Eintrag nicht", () => {
  const bilanz = B.festschreiben({}, stand("2026-09-01", [10, 3]), schueler(), "2026-09-01");
  // Ben holt am Nachmittag nach - die Spalte vom Stundenbeginn bleibt stehen.
  const spaeter = B.festschreiben(bilanz, stand("2026-09-01", [10, 10]), schueler(), "2026-09-01");
  assert.deepEqual(spaeter, {});
  assert.equal(bilanz["12:2"].stand.b, 3);
});

test("ein Kind ohne Code taucht in der Spalte nicht auf", () => {
  const neu = B.festschreiben({}, stand("2026-09-01", [10, 3]), schueler(), "2026-09-01");
  assert.equal(neu["12:2"].stand.c, undefined);
});

test("die Tabelle trennt fertig, teils und nichts", () => {
  const bilanz = B.festschreiben({}, stand("2026-09-01", [10, 3]), schueler(), "2026-09-01");
  const { spalten, zeilen } = B.tabelle(bilanz, schueler());
  assert.equal(spalten.length, 1);
  const ben = zeilen.find((z) => z.id === "b");
  const ann = zeilen.find((z) => z.id === "a");
  assert.equal(ann.felder[0].zustand, "fertig");
  assert.equal(ben.felder[0].zustand, "teils");
  assert.equal(ben.felder[0].geschafft, 3);
});

test("null Aufgaben heisst nichts gemacht, nicht unbekannt", () => {
  const bilanz = B.festschreiben({}, stand("2026-09-01", [0, 3]), schueler(), "2026-09-01");
  const { zeilen } = B.tabelle(bilanz, schueler());
  assert.equal(zeilen.find((z) => z.id === "a").felder[0].zustand, "nichts");
});

test("wer eine Aufgabe nie bekam, hat sie nicht in der Quote", () => {
  const bilanz = B.festschreiben({}, stand("2026-09-01", [10, 3]), schueler(), "2026-09-01");
  const { zeilen } = B.tabelle(bilanz, schueler());
  const cem = zeilen.find((z) => z.id === "c");
  assert.equal(cem.felder[0].zustand, "unbekannt");
  assert.equal(cem.von, 0);
  assert.equal(cem.quote, null);
});

test("die Quote zählt über mehrere Aufgaben", () => {
  const bilanz = {
    "12:2": { titel: "A", ziel: 10, faelligAm: "2026-09-01", festAm: "2026-09-01", stand: { a: 10, b: 2 } },
    "12:5": { titel: "B", ziel: 5, faelligAm: "2026-09-08", festAm: "2026-09-08", stand: { a: 5, b: 5 } }
  };
  const { zeilen } = B.tabelle(bilanz, schueler());
  assert.equal(zeilen.find((z) => z.id === "a").quote, 100);
  assert.equal(zeilen.find((z) => z.id === "b").quote, 50);
  assert.equal(zeilen.find((z) => z.id === "b").fertig, 1);
  assert.equal(zeilen.find((z) => z.id === "b").von, 2);
});

test("die Spalten stehen nach Fälligkeit", () => {
  const bilanz = {
    "x": { titel: "spät", ziel: 5, faelligAm: "2026-09-08", festAm: "2026-09-08", stand: {} },
    "y": { titel: "früh", ziel: 5, faelligAm: "2026-09-01", festAm: "2026-09-01", stand: {} }
  };
  assert.deepEqual(B.tabelle(bilanz, schueler()).spalten.map((s) => s.titel), ["früh", "spät"]);
});

test("laufende Aufgaben kommen als eigene Spalten", () => {
  const ks = stand("2026-09-08", [7, 0]);
  const l = B.laufende(ks, "2026-09-01");
  assert.equal(l.length, 1);
  assert.equal(l[0].laeuft, true);
  const { spalten, zeilen } = B.tabelle({}, schueler(), l);
  assert.equal(spalten.length, 1);
  assert.equal(zeilen.find((z) => z.id === "a").felder[0].geschafft, 7);
  assert.equal(zeilen.find((z) => z.id === "b").felder[0].zustand, "nichts");
});

test("was noch laeuft, zaehlt nicht in der Quote", () => {
  const fest = B.festschreiben({}, stand("2026-09-01", [10, 0]), schueler(), "2026-09-01");
  const l = B.laufende(stand("2026-09-15", [3, 3]), "2026-09-02");
  const { zeilen } = B.tabelle(fest, schueler(), l);
  const ann = zeilen.find((z) => z.id === "a");
  assert.equal(ann.von, 1);          // nur die abgeschlossene
  assert.equal(ann.quote, 100);
  assert.equal(ann.felder.length, 2); // beide Spalten sind aber sichtbar
  assert.equal(ann.felder[1].laeuft, true);
});

test("was schon faellig war, gilt nicht als laufend", () => {
  assert.deepEqual(B.laufende(stand("2026-09-01", [1, 1]), "2026-09-01"), []);
});

test("jede Spalte zählt, wer mehr als null Aufgaben gemacht hat", () => {
  const bilanz = B.festschreiben({}, stand("2026-09-01", [10, 3]), schueler(), "2026-09-01");
  const l = B.laufende(stand("2026-09-15", [10, 0]), "2026-09-02");
  const { spalten } = B.tabelle(bilanz, schueler(), l);
  // Cem hat keinen Code und zählt in keiner Spalte mit; Bens 3 von 10 zählen als gemacht.
  assert.equal(spalten[0].gemacht, 2);
  assert.equal(spalten[0].gewertet, 2);
  assert.equal(spalten[1].gemacht, 1);
  assert.equal(spalten[1].gewertet, 2);
});

test("laufende Spalten stehen rechts", () => {
  const fest = B.festschreiben({}, stand("2026-09-01", [10, 0]), schueler(), "2026-09-01");
  const l = B.laufende(stand("2026-08-20", [1, 1]), "2026-08-01");   // frueher faellig
  const { spalten } = B.tabelle(fest, schueler(), l);
  assert.equal(spalten[spalten.length - 1].laeuft, true);
});

test("ein Testfeedback ist eine Spalte, jedes Kind mit eigenem Ziel", () => {
  const mitFeedback = {
    hausaufgaben: [
      ...stand("2026-09-01", [10, 3]).hausaufgaben,
      { quelleRef: "testfeedback|2026-09-01|Test Terme", art: "testfeedback", titel: "Test Terme",
        zielAufgaben: 0, gestelltAm: "2026-08-28", faelligAm: "2026-09-01",
        schueler: [
          { code: "AAA11", geschafft: 6, fertig: true, ziel: 6 },
          { code: "BBB22", geschafft: 4, fertig: false, ziel: 12 }
        ] }
    ]
  };
  const neu = B.festschreiben({}, mitFeedback, schueler(), "2026-09-01");
  assert.deepEqual(Object.keys(neu).sort(), ["12:2", "testfeedback|2026-09-01|Test Terme"]);
  const { spalten, zeilen } = B.tabelle(neu, schueler());
  assert.equal(spalten.length, 2);
  const i = spalten.findIndex((sp) => sp.art === "testfeedback");
  const ann = zeilen.find((z) => z.id === "a").felder[i];
  const ben = zeilen.find((z) => z.id === "b").felder[i];
  assert.equal(ann.zustand, "fertig");
  assert.equal(ann.ziel, 6);
  assert.equal(ben.zustand, "teils");
  assert.equal(ben.ziel, 12);
  // Cem hat kein Feedback bekommen - das zählt nicht gegen ihn.
  assert.equal(zeilen.find((z) => z.id === "c").felder[i].zustand, "unbekannt");
});

test("laufendes Testfeedback nimmt das Ziel des Kindes", () => {
  const laufend = B.laufende({ hausaufgaben: [
    { quelleRef: "testfeedback|2026-09-20|Test Terme", art: "testfeedback", titel: "Test Terme",
      zielAufgaben: 0, gestelltAm: "2026-09-12", faelligAm: "2026-09-20",
      schueler: [{ code: "BBB22", geschafft: 9, fertig: true, ziel: 9 }] }
  ] }, "2026-09-17");
  const { spalten, zeilen } = B.tabelle({}, schueler(), laufend);
  assert.equal(spalten.length, 1);
  assert.equal(zeilen.find((z) => z.id === "b").felder[0].zustand, "fertig");
});

test("alte Einzelspalten je Kind verschwinden aus der Tabelle", () => {
  const bilanz = {
    "12:2": { titel: "A", ziel: 10, faelligAm: "2026-09-01", festAm: "2026-09-01", stand: { a: 10 } },
    "12f51d72-d8fa-4223-90dc-1b83197dcd4f:AAA11": { titel: "Test", ziel: 6, faelligAm: "2026-09-01", festAm: "2026-09-01", stand: { a: 2 } }
  };
  assert.equal(B.tabelle(bilanz, schueler()).spalten.length, 1);
  assert.equal(B.istHausaufgabe("12f51d72-d8fa-4223-90dc-1b83197dcd4f:AAA11"), false);
  assert.equal(B.istHausaufgabe("testfeedback|2026-09-17|Test Mathematik"), true);
});
