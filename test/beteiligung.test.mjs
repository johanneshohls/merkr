import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const B = require("../src/kern/beteiligung.js");

const STUNDEN = [
  { id: "s1", datum: "2026-08-25" },
  { id: "s2", datum: "2026-08-27" },
  { id: "s3", datum: "2026-09-01" },
  { id: "s4", datum: "2026-09-03" },
];
const SUS = [{ id: "a" }, { id: "b" }, { id: "c" }];

test("Zählt nur mündliche Notizen", () => {
  const ev = [
    { schuelerId: "a", stundeId: "s1", typ: "qual_m", stufe: 2 },
    { schuelerId: "a", stundeId: "s2", typ: "qual_s", stufe: 1 },   // schriftlich
    { schuelerId: "a", stundeId: "s3", typ: "quant_m", stufe: 1 },
  ];
  const u = B.uebersicht(SUS, STUNDEN, ev).find((x) => x.id === "a");
  assert.equal(u.anzahl, 2, "das schriftliche zählt hier nicht mit");
  assert.equal(u.mittel, 1.5);
});

test("Stunden ohne Notiz zählen in Stunden, nicht in Tagen", () => {
  const ev = [{ schuelerId: "a", stundeId: "s2", typ: "qual_m", stufe: 1 }];
  const u = B.uebersicht(SUS, STUNDEN, ev);
  assert.equal(u.find((x) => x.id === "a").stundenOhne, 2, "s3 und s4 liegen danach");
  assert.equal(u.find((x) => x.id === "b").stundenOhne, 4, "ohne jede Notiz zählen alle Stunden");
});

test("Ausgefallene Stunden zählen nicht mit", () => {
  const mitAusfall = [...STUNDEN, { id: "s5", datum: "2026-09-08", ausfall: true }];
  const u = B.uebersicht(SUS, mitAusfall, []).find((x) => x.id === "a");
  assert.equal(u.stundenOhne, 4, "die ausgefallene bleibt außen vor");
});

test("Die Halbjahresgrenze schneidet ab", () => {
  const ev = [{ schuelerId: "a", stundeId: "s1", typ: "qual_m", stufe: 2 }];
  const u = B.uebersicht(SUS, STUNDEN, ev, { ab: "2026-09-01" }).find((x) => x.id === "a");
  assert.equal(u.anzahl, 0, "die Notiz aus dem ersten Halbjahr zählt nicht mehr");
  assert.equal(u.stundenOhne, 2, "und es bleiben zwei Stunden im zweiten");
});

test("Das Gewicht wächst mit der Zeit und ist gedeckelt", () => {
  assert.equal(B.gewicht(0), 1);
  assert.equal(B.gewicht(3), 4);
  assert.equal(B.gewicht(50), 9, "gedeckelt, damit ein Einzelfall nicht die Runde bestimmt");
});

test("Gewichtet ziehen bevorzugt den Vernachlässigten", () => {
  const gewichte = { a: 1, b: 1, c: 9 };
  let c = 0;
  for (let i = 0; i < 400; i++) if (B.zieheGewichtet(["a", "b", "c"], gewichte) === "c") c++;
  assert.ok(c > 250, "c sollte klar überwiegen, war bei " + c + " von 400");
  assert.ok(c < 400, "aber nicht immer");
});

test("Ohne Topf gibt es nichts zu ziehen", () => {
  assert.equal(B.zieheGewichtet([], {}), null);
});
