import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const R = require("../src/kern/rueckmeldung.js");

const kurs = { id: 1, name: "Mathe 9d", planrName: "9d", planrFach: "Mathematik" };
const stunde = {
  datum: "2026-08-25",
  tuThemen: ["lösungsformel", "faktorisierung", "prozent"],
};

test("Auswahl kommt aus den TÜ-Themen der Stunde", () => {
  assert.deepEqual(R.wackelThemen(stunde), ["lösungsformel", "faktorisierung", "prozent"]);
});

test("ohne TÜ gibt es nichts anzukreuzen", () => {
  assert.deepEqual(R.wackelThemen({ datum: "2026-08-25" }), []);
});

test("Doppelte und Leere fallen weg", () => {
  const s = { tuThemen: ["a", " a ", "", null, "b"] };
  assert.deepEqual(R.wackelThemen(s), ["a", "b"]);
});

test("Brief trägt Klasse, Fach und Datum aus planr", () => {
  const b = R.brief(kurs, stunde, ["lösungsformel"]);
  assert.deepEqual(b, {
    klasse: "9d",
    datum: "2026-08-25",
    gehalten: true,
    wackelt: ["lösungsformel"],
    fach: "Mathematik",
  });
});

test("nur was auf dem Blatt stand", () => {
  const b = R.brief(kurs, stunde, ["lösungsformel", "trigonometrie"]);
  assert.deepEqual(b.wackelt, ["lösungsformel"]);
});

test("nichts ausgewählt heißt kein Brief", () => {
  assert.equal(R.brief(kurs, stunde, []), null);
  assert.equal(R.brief(kurs, stunde, ["gibtesnicht"]), null);
});

test("ein Kurs ohne planr-Herkunft meldet nichts", () => {
  assert.equal(R.brief({ name: "AG Schach" }, stunde, ["lösungsformel"]), null);
});

test("Fach bleibt weg, wenn planr keins genannt hat", () => {
  const b = R.brief({ planrName: "8c" }, stunde, ["prozent"]);
  assert.equal("fach" in b, false);
  assert.equal(b.klasse, "8c");
});

test("Notiz fasst zusammen", () => {
  assert.equal(R.notiz(R.brief(kurs, stunde, ["lösungsformel", "faktorisierung"])),
    "2026-08-25: lösungsformel, faktorisierung");
  assert.equal(R.notiz(null), "");
});
