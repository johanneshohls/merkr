import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const R = require("../src/kern/raster.js");

test("Block wird zur Anfangsstunde", () => {
  assert.equal(R.stundeVon(1), 1);
  assert.equal(R.stundeVon(3), 5);
  const slots = R.ausPlanr([{ woche: "A", tag: 2, block: 3, raum: "104" }]);
  assert.deepEqual(slots, [{ tag: 2, stunde: 5, woche: "A" }]);
});

test("dieselbe Stunde in A und B wird AB", () => {
  const slots = R.ausPlanr([
    { woche: "A", tag: 1, block: 1 },
    { woche: "B", tag: 1, block: 1 }
  ]);
  assert.deepEqual(slots, [{ tag: 1, stunde: 1, woche: "AB" }]);
});

test("nur eine der beiden Wochen bleibt A oder B", () => {
  const slots = R.ausPlanr([
    { woche: "A", tag: 4, block: 2 },
    { woche: "B", tag: 5, block: 2 }
  ]);
  assert.deepEqual(slots, [
    { tag: 4, stunde: 3, woche: "A" },
    { tag: 5, stunde: 3, woche: "B" }
  ]);
});

test("sortiert nach Tag und Stunde", () => {
  const slots = R.ausPlanr([
    { woche: "A", tag: 5, block: 1 },
    { woche: "A", tag: 2, block: 4 },
    { woche: "A", tag: 2, block: 1 }
  ]);
  assert.deepEqual(slots.map(s => s.tag + "/" + s.stunde), ["2/1", "2/7", "5/1"]);
});

test("Unfug fliegt raus, nicht der ganze Abruf", () => {
  const slots = R.ausPlanr([
    null,
    { woche: "A", tag: 6, block: 1 },
    { woche: "A", tag: 0, block: 1 },
    { woche: "C", tag: 2, block: 1 },
    { woche: "A", tag: 2, block: 0 },
    { woche: "a", tag: 3, block: 2 }
  ]);
  assert.deepEqual(slots, [{ tag: 3, stunde: 3, woche: "A" }]);
});

test("leeres Raster bleibt leer", () => {
  assert.deepEqual(R.ausPlanr([]), []);
  assert.deepEqual(R.ausPlanr(null), []);
  assert.deepEqual(R.ausPlanr(undefined), []);
});

test("gleich vergleicht ohne Rücksicht auf Reihenfolge", () => {
  const a = [{ tag: 1, stunde: 1, woche: "AB" }, { tag: 3, stunde: 5, woche: "A" }];
  const b = [{ tag: 3, stunde: 5, woche: "A" }, { tag: 1, stunde: 1, woche: "AB" }];
  assert.equal(R.gleich(a, b), true);
  assert.equal(R.gleich(a, [{ tag: 1, stunde: 1, woche: "A" }, { tag: 3, stunde: 5, woche: "A" }]), false);
  assert.equal(R.gleich(a, a.slice(0, 1)), false);
  assert.equal(R.gleich([], []), true);
});

test("eine Stunde ohne Wochenangabe zählt als AB im Vergleich", () => {
  assert.equal(R.gleich([{ tag: 1, stunde: 1 }], [{ tag: 1, stunde: 1, woche: "AB" }]), true);
});
