import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const S = require("../src/kern/selbr.js");

const klasse = () => ([
  { id: "a", name: "Zander", vorname: "Ann", selbrCode: "" },
  { id: "b", name: "Berg", vorname: "Ben", selbrCode: "" },
  { id: "c", name: "Meyer", vorname: "Cem Luis", selbrCode: "" }
]);

test("Codes werden ohne Rand und in Grossbuchstaben verglichen", () => {
  assert.equal(S.normalisiert("  beswm "), "BESWM");
  assert.equal(S.normalisiert(null), "");
});

test("zwei Kinder mit demselben Code fallen auf", () => {
  const s = klasse();
  s[0].selbrCode = "ABC12";
  s[1].selbrCode = "abc12";
  assert.deepEqual(S.doppelte(s), ["ABC12"]);
});

test("leere Codes zaehlen nicht als doppelt", () => {
  assert.deepEqual(S.doppelte(klasse()), []);
});

test("Liste mit Tabulator wird zugeordnet", () => {
  const { treffer, unbekannt } = S.ausListe(klasse(), "Ben Berg\tBESWM\nCem Luis Meyer\tCARG5");
  assert.deepEqual(treffer, [{ id: "b", code: "BESWM" }, { id: "c", code: "CARG5" }]);
  assert.deepEqual(unbekannt, []);
});

test("Nachname, Vorname wird gedreht", () => {
  const { treffer } = S.ausListe(klasse(), "Berg, Ben; BESWM");
  assert.deepEqual(treffer, [{ id: "b", code: "BESWM" }]);
});

test("das Pfeilzeichen trennt auch", () => {
  const { treffer } = S.ausListe(klasse(), "Ann Zander → XATR3");
  assert.deepEqual(treffer, [{ id: "a", code: "XATR3" }]);
});

test("ein unbekannter Name wird gemeldet und nicht geraten", () => {
  const { treffer, unbekannt } = S.ausListe(klasse(), "Ida Unbekannt\tZZZ11\nBen Berg\tBESWM");
  assert.deepEqual(treffer, [{ id: "b", code: "BESWM" }]);
  assert.deepEqual(unbekannt, ["Ida Unbekannt\tZZZ11"]);
});

test("eine Zeile ohne Trenner wird gemeldet", () => {
  const { treffer, unbekannt } = S.ausListe(klasse(), "Ben Berg BESWM");
  assert.deepEqual(treffer, []);
  assert.equal(unbekannt.length, 1);
});

test("leere Zeilen werden uebergangen", () => {
  const { treffer, unbekannt } = S.ausListe(klasse(), "\n\nBen Berg\tBESWM\n   \n");
  assert.equal(treffer.length, 1);
  assert.deepEqual(unbekannt, []);
});
