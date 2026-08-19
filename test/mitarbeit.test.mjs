import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const M = require("../src/kern/mitarbeit.js");

const JETZT = new Date("2026-11-20T10:00:00Z");

/** 20 Unterrichtsstunden, alle zwei Tage vor heute. */
function stunden(n = 20, opt = {}) {
  const liste = [];
  for (let i = n; i >= 1; i--) {
    const d = new Date(JETZT.getTime() - i * 2 * 86400000);
    liste.push({ id: "st" + i, datum: d.toISOString().slice(0, 10), ausfall: false });
  }
  return opt.dazu ? liste.concat(opt.dazu) : liste;
}

/** Notiz in jeder k-ten Stunde. */
function notizen(sts, typ, stufe, jede) {
  return sts.filter((_, i) => i % jede === 0)
    .map((st, n) => ({ id: "e" + typ + n, typ, stufe, stundeId: st.id, ts: st.datum + "T09:00:00Z" }));
}

test("wer gar nicht auffällt, bekommt die Basis", () => {
  const r = M.vorschlag(stunden(), [], { jetzt: JETZT });
  assert.equal(r.note, 3.5);
  assert.equal(r.wert, 3, "3,5 rundet zugunsten des Schülers auf 3");
  assert.equal(r.anzahl, 0);
});

test("volle mündliche Beteiligung bei mittlerer Stufe ergibt eine 2", () => {
  const sts = stunden();
  const r = M.vorschlag(sts, notizen(sts, "quant_m", 0, 1), { jetzt: JETZT });
  assert.equal(r.anteile.m.quote, 1);
  assert.equal(r.note, 2);
});

test("Qualität verstärkt die Beteiligung, statt eigenständig zu wirken", () => {
  const sts = stunden();
  const viel = M.vorschlag(sts, notizen(sts, "qual_m", 1, 1), { jetzt: JETZT });
  const selten = M.vorschlag(sts, notizen(sts, "qual_m", 1, 10), { jetzt: JETZT });
  assert.ok(viel.note < 1.5, "jede Stunde stark: " + viel.note);
  assert.ok(selten.note > 3, "zweimal stark im Halbjahr bleibt nahe der Basis: " + selten.note);
});

test("wer stört, landet bei einer 4 oder schlechter", () => {
  const sts = stunden();
  const r = M.vorschlag(sts, notizen(sts, "stoerung", null, 2), { jetzt: JETZT });
  assert.ok(r.note >= 4, "jede zweite Stunde eine Störung: " + r.note);
});

test("vergessene Hausaufgaben zählen wie Störungen", () => {
  const sts = stunden();
  const ha = M.vorschlag(sts, notizen(sts, "ha_vergessen", null, 2), { jetzt: JETZT });
  const st = M.vorschlag(sts, notizen(sts, "stoerung", null, 2), { jetzt: JETZT });
  assert.equal(ha.note, st.note);
});

test("Beteiligung und Störung verrechnen sich nicht weg, beide stehen einzeln", () => {
  const sts = stunden();
  const evs = notizen(sts, "quant_m", 0, 2).concat(notizen(sts, "stoerung", null, 3));
  const r = M.vorschlag(sts, evs, { jetzt: JETZT });
  assert.ok(r.muendlich > 0 && r.stoerung > 0);
  const ausTeilen = 3.5 - r.muendlich - r.schriftlich + r.stoerung;
  assert.ok(Math.abs(r.note - ausTeilen) < 0.06,
    "die ausgewiesenen Teile ergeben die Note: " + r.note + " gegen " + ausTeilen);
});

test("Stören zieht höchstens zwei Noten", () => {
  const sts = stunden();
  const evs = [];
  for (const st of sts) for (let i = 0; i < 5; i++)
    evs.push({ id: "s" + st.id + i, typ: "stoerung", stufe: null, stundeId: st.id, ts: st.datum + "T09:00:00Z" });
  const r = M.vorschlag(sts, evs, { jetzt: JETZT });
  assert.equal(r.stoerung, 2);
  assert.ok(r.gedeckelt);
});

test("Schriftliches wiegt halb so schwer wie Mündliches", () => {
  const sts = stunden();
  const m = M.vorschlag(sts, notizen(sts, "quant_m", 0, 1), { jetzt: JETZT });
  const s = M.vorschlag(sts, notizen(sts, "quant_s", 0, 1), { jetzt: JETZT });
  assert.equal(Math.round(m.muendlich * 100), Math.round(s.schriftlich * 200));
});

test("künftige Stunden zählen nicht in den Nenner", () => {
  const sts = stunden();
  const kuenftig = [{ id: "zukunft1", datum: "2026-12-15", ausfall: false },
                    { id: "zukunft2", datum: "2027-01-10", ausfall: false }];
  const evs = notizen(sts, "quant_m", 0, 1);
  const ohne = M.vorschlag(sts, evs, { jetzt: JETZT, bis: "2026-11-20" });
  const mit = M.vorschlag(sts.concat(kuenftig), evs, { jetzt: JETZT, bis: "2026-11-20" });
  assert.equal(mit.note, ohne.note, "der importierte Plan darf die Quote nicht verwässern");
  assert.equal(mit.stunden, 20);
});

test("ausgefallene Stunden zählen nicht", () => {
  const sts = stunden();
  sts[0].ausfall = true;
  const r = M.vorschlag(sts, [], { jetzt: JETZT });
  assert.equal(r.stunden, 19);
});

test("die Halbjahresgrenze schneidet Notizen und Stunden ab", () => {
  const sts = stunden().concat([{ id: "alt", datum: "2026-06-01", ausfall: false }]);
  const evs = [{ id: "e1", typ: "quant_m", stufe: 2, stundeId: "alt", ts: "2026-06-01T09:00:00Z" }];
  const r = M.vorschlag(sts, evs, { jetzt: JETZT, ab: "2026-08-01" });
  assert.equal(r.anzahl, 0);
  assert.equal(r.note, 3.5);
  assert.equal(r.stunden, 20);
});

test("frische Notizen wiegen schwerer als alte", () => {
  const sts = stunden(40);
  const frueh = sts.slice(0, 20), spaet = sts.slice(20);
  const a = M.vorschlag(sts, notizen(frueh, "quant_m", 0, 1), { jetzt: JETZT });
  const b = M.vorschlag(sts, notizen(spaet, "quant_m", 0, 1), { jetzt: JETZT });
  assert.ok(b.note < a.note, "spätere Beteiligung ergibt die bessere Note: " + b.note + " vs " + a.note);
});

test("Punkteskala: die Basis wird zu 7 Punkten, volle Beteiligung zu 11", () => {
  const sts = stunden();
  const leer = M.vorschlag(sts, [], { jetzt: JETZT, typ: "punkte" });
  assert.equal(leer.genau, 6.5);
  assert.equal(leer.wert, 7, "6,5 Punkte runden zugunsten des Schülers auf 7");
  const voll = M.vorschlag(sts, notizen(sts, "quant_m", 0, 1), { jetzt: JETZT, typ: "punkte" });
  assert.equal(voll.wert, 11);
});

test("die Note bleibt zwischen 1 und 6", () => {
  const sts = stunden();
  const evs = notizen(sts, "qual_m", 2, 1).concat(notizen(sts, "quant_m", 2, 1));
  const r = M.vorschlag(sts, evs, { jetzt: JETZT });
  assert.equal(r.note, 1);
});
