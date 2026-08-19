import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const M = require("../src/kern/mitarbeit.js");

const JETZT = new Date("2026-11-20T10:00:00Z");

function stunden(n = 20) {
  const liste = [];
  for (let i = n; i >= 1; i--)
    liste.push({ id: "st" + i, datum: new Date(JETZT.getTime() - i*2*86400000).toISOString().slice(0,10), ausfall: false });
  return liste;
}

let z = 0;
/** `proStunde` Einträge in jeder `jede`-ten Stunde. */
function notizen(sts, typ, stufe, jede, proStunde = 1) {
  const out = [];
  sts.forEach((st, i) => { if (i % jede === 0) for (let j = 0; j < proStunde; j++)
    out.push({ id: "e" + (z++), typ, stufe, stundeId: st.id, ts: st.datum + "T09:00:00Z" }); });
  return out;
}

test("wer nicht auffällt, steht bei der Basis", () => {
  const r = M.vorschlag(stunden(), [], { jetzt: JETZT });
  assert.equal(r.note, 3.5);
  assert.equal(r.wert, 3, "3,5 rundet zugunsten des Schülers");
});

test("die sechs Zeilen der Beschlussvorlage treffen ihre Punktspanne", () => {
  const sts = stunden();
  const faelle = [
    [notizen(sts,"qual_m",1,1,2).concat(notizen(sts,"quant_s",1,2)), 13, 15],
    [notizen(sts,"qual_m",0,1).concat(notizen(sts,"quant_s",0,3)),   10, 12],
    [notizen(sts,"quant_m",0,2),                                      7,  9],
    [notizen(sts,"quant_m",-1,3).concat(notizen(sts,"stoerung",null,4)), 4, 6],
    [notizen(sts,"keine_antwort",null,2).concat(notizen(sts,"qual_m",-2,5)), 1, 3],
    [notizen(sts,"keine_antwort",null,1).concat(notizen(sts,"ha_vergessen",null,2)), 0, 0]
  ];
  faelle.forEach(([evs, lo, hi], i) => {
    const p = M.vorschlag(sts, evs, { jetzt: JETZT, typ: "punkte" }).wert;
    assert.ok(p >= lo && p <= hi, "Zeile " + (i+1) + ": " + p + " nicht in " + lo + "-" + hi);
  });
});

test("mehrere Beiträge in einer Stunde zählen mehrfach", () => {
  const sts = stunden();
  const einmal  = M.vorschlag(sts, notizen(sts, "quant_m", 0, 1, 1), { jetzt: JETZT });
  const zweimal = M.vorschlag(sts, notizen(sts, "quant_m", 0, 1, 2), { jetzt: JETZT });
  assert.ok(zweimal.note < einmal.note, "besonders häufig muss von häufig trennbar sein");
  assert.equal(einmal.achsen.m.wert, 1);
  assert.equal(zweimal.achsen.m.wert, 2);
});

test("die Menge kürzt sich nicht heraus - ein Glanzstück ist kein Halbjahr", () => {
  const sts = stunden();
  const einmal = M.vorschlag(sts, notizen(sts, "qual_m", 2, 20), { jetzt: JETZT });
  const immer  = M.vorschlag(sts, notizen(sts, "qual_m", 2, 1), { jetzt: JETZT });
  assert.ok(einmal.note > 3, "eine einzige Spitzennotiz bleibt nahe der Basis: " + einmal.note);
  assert.equal(immer.note, 1);
});

test("Stören ist fehlende Mitarbeit, kein Abzug daneben", () => {
  const sts = stunden();
  const nurStoerung   = M.vorschlag(sts, notizen(sts, "stoerung", null, 1), { jetzt: JETZT });
  const nurVerweigert = M.vorschlag(sts, notizen(sts, "keine_antwort", null, 1), { jetzt: JETZT });
  assert.equal(nurStoerung.note, nurVerweigert.note, "beides ist dieselbe fehlende Leistung");
  assert.equal(nurStoerung.schriftlich, 0, "es darf keine zweite Achse belasten");
  assert.ok(nurStoerung.note >= 5);
});

test("wer sich beteiligt und stört, wird verrechnet statt doppelt belegt", () => {
  const sts = stunden();
  const evs = notizen(sts, "quant_m", 0, 1).concat(notizen(sts, "stoerung", null, 2));
  const r = M.vorschlag(sts, evs, { jetzt: JETZT, halbwertszeitWochen: 1e6 });
  assert.equal(Math.round(r.achsen.m.wert*1e4)/1e4, 0.5, "20 Beiträge, 10 Verweigerungen, 20 Stunden");
  assert.ok(r.note > 2.5 && r.note < 3.5);
});

test("vergessene Hausaufgaben zählen als fehlende praktische Leistung", () => {
  const sts = stunden();
  const r = M.vorschlag(sts, notizen(sts, "ha_vergessen", null, 1), { jetzt: JETZT });
  assert.ok(r.schriftlich < 0, "sie gehören auf die schriftliche Achse");
  assert.equal(r.muendlich, 0, "und nicht auf die mündliche");
});

test("hohe Aufgabenmenge rettet bei wenig Beteiligung mindestens die Drei", () => {
  const sts = stunden();
  const r = M.vorschlag(sts, notizen(sts, "quant_s", 0, 1), { jetzt: JETZT });
  assert.ok(r.wert <= 3, "Regel aus dem informellen Teil, Seite 1: " + r.note);
});

test("die Skala reicht nach unten steiler als nach oben", () => {
  const sts = stunden();
  const o = { jetzt: JETZT, halbwertszeitWochen: 1e6 };
  const hoch = M.vorschlag(sts, notizen(sts, "quant_m", 0, 1), o);
  const tief = M.vorschlag(sts, notizen(sts, "keine_antwort", null, 1), o);
  assert.equal(hoch.achsen.m.wert, 1);
  assert.equal(tief.achsen.m.wert, -1);
  assert.equal(hoch.muendlich, 1.25, "je Punkt nach oben");
  assert.equal(tief.muendlich, -1.75, "je Punkt nach unten");
});

test("eine einzelne Stunde kann die Rechnung nicht kippen", () => {
  const sts = stunden();
  const evs = [];
  for (let i = 0; i < 12; i++)
    evs.push({ id: "v"+i, typ: "qual_m", stufe: 2, stundeId: sts[0].id, ts: sts[0].datum+"T09:00:00Z" });
  const r = M.vorschlag(sts, evs, { jetzt: JETZT, halbwertszeitWochen: 1e6 });
  assert.equal(Math.round(r.achsen.m.wert*1e4)/1e4, 0.2, "zwölf Beiträge in einer Stunde zählen als vier");
});

test("künftige Stunden zählen nicht in den Nenner", () => {
  const sts = stunden();
  const evs = notizen(sts, "quant_m", 0, 1);
  const ohne = M.vorschlag(sts, evs, { jetzt: JETZT, bis: "2026-11-20" });
  const mit = M.vorschlag(sts.concat([
    { id: "z1", datum: "2026-12-15", ausfall: false },
    { id: "z2", datum: "2027-01-10", ausfall: false }]), evs, { jetzt: JETZT, bis: "2026-11-20" });
  assert.equal(mit.note, ohne.note, "der importierte Plan darf die Rechnung nicht verwässern");
  assert.equal(mit.stunden, 20);
});

test("ausgefallene Stunden zählen nicht", () => {
  const sts = stunden();
  sts[0].ausfall = true;
  assert.equal(M.vorschlag(sts, [], { jetzt: JETZT }).stunden, 19);
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
  const a = M.vorschlag(sts, notizen(sts.slice(0,20), "quant_m", 0, 1), { jetzt: JETZT });
  const b = M.vorschlag(sts, notizen(sts.slice(20), "quant_m", 0, 1), { jetzt: JETZT });
  assert.ok(b.note < a.note, "spätere Beteiligung ergibt die bessere Note");
});

test("die Punkteskala trifft die Spannen der Vorlage", () => {
  [[1,13,15],[2,10,12],[3,7,9],[4,4,6],[5,1,3],[6,0,0]].forEach(([note, lo, hi]) => {
    const p = M.alsPunkte(note);
    assert.ok(p >= lo && p <= hi, "Note " + note + " -> " + p + ", erwartet " + lo + "-" + hi);
  });
});

test("die Note bleibt zwischen 1 und 6", () => {
  const sts = stunden();
  const oben = M.vorschlag(sts, notizen(sts, "qual_m", 2, 1, 4), { jetzt: JETZT });
  const unten = M.vorschlag(sts, notizen(sts, "keine_antwort", null, 1, 3)
    .concat(notizen(sts, "ha_vergessen", null, 1, 3)), { jetzt: JETZT });
  assert.equal(oben.note, 1);
  assert.equal(unten.note, 6);
});

test("der Verlauf liefert einen Punkt je gehaltener Stunde", () => {
  const sts = stunden();
  const v = M.verlauf(sts, notizen(sts, "quant_m", 0, 2), { jetzt: JETZT });
  assert.equal(v.length, 20);
  assert.deepEqual(v.map(x => x.datum), sts.map(x => x.datum).sort());
});

test("der Verlauf zeigt eine Verbesserung als fallende Note", () => {
  const sts = stunden(20);
  // erst nichts, ab der Hälfte jede Stunde ein Beitrag
  const v = M.verlauf(sts, notizen(sts.slice(10), "quant_m", 0, 1), { jetzt: JETZT });
  assert.equal(v[9].note, 3.5, "vor dem Umschwung steht die Basis");
  assert.ok(v[19].note < v[9].note, "danach wird es besser: " + v[19].note);
  for (let i = 11; i < 20; i++)
    assert.ok(v[i].note <= v[i-1].note, "die Kurve läuft monoton in eine Richtung");
});

test("der Verlauf setzt am Halbjahreswechsel neu an", () => {
  const sts = stunden(20);
  const mitte = sts[10].datum;
  const evs = notizen(sts.slice(0, 10), "keine_antwort", null, 1);
  const v = M.verlauf(sts, evs, {
    jetzt: JETZT,
    halbjahrAb: d => (d >= mitte ? mitte : null)
  });
  assert.ok(v[9].note > 5, "im ersten Halbjahr schlägt die Verweigerung durch: " + v[9].note);
  assert.equal(v[10].note, 3.5, "im zweiten Halbjahr zählt sie nicht mehr mit");
});

test("der Verlauf trägt den Beitrag der einzelnen Stunde mit", () => {
  const sts = stunden();
  const v = M.verlauf(sts, notizen(sts, "qual_m", 2, 2), { jetzt: JETZT });
  assert.equal(v[0].beitrag, 3, "eine Notiz ++ ist drei wert");
  assert.equal(v[1].beitrag, 0, "eine Stunde ohne Notiz trägt nichts");
  assert.equal(v[0].notizen, 1);
});

test("der Verlauf rechnet mit demselben Weg wie der Vorschlag", () => {
  const sts = stunden();
  const evs = notizen(sts, "quant_m", 0, 2).concat(notizen(sts, "stoerung", null, 5));
  const letzte = sts[sts.length - 1].datum;
  const v = M.verlauf(sts, evs, { jetzt: JETZT });
  const direkt = M.vorschlag(sts, evs, { jetzt: new Date(letzte + "T12:00:00Z"), bis: letzte });
  assert.equal(v[v.length - 1].note, direkt.note);
});
