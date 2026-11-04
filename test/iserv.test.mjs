import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const I = require("../src/kern/iserv.js");

const KOPF = '"Abwesenheitszeit";"Dauer";"Name";"Klasse/Information";"Status";"Aktualisiert am"';

test("CSV mit Anführungszeichen und BOM wird gelesen", () => {
  const csv = "﻿" + KOPF + "\n" +
    '"04.11.2026";"1 Tag";"Anna Müller";"8D";"unentschuldigt";"04.11.2026 06:30"\n' +
    '"04.11.2026 (09:40 - 13:10)";"3:30 Stunden";"Ben Schmidt";"8D";"entschuldigt";"04.11.2026 07:00"\n';
  const e = I.csvLesen(csv);
  assert.equal(e.length, 2);
  assert.deepEqual(e[0], { zeit: "04.11.2026", name: "Anna Müller", status: "unentschuldigt" });
  assert.equal(e[1].zeit, "04.11.2026 (09:40 - 13:10)");
});

test("eine Anmeldeseite statt der Liste wirft", () => {
  assert.throws(() => I.csvLesen("<!doctype html><html>"), /keine Abwesenheitsliste/);
});

test("ganzer Tag, Zeitraum und Teilzeit", () => {
  assert.equal(I.betrifft("04.11.2026", "2026-11-04", "11:40", "13:10"), true);
  assert.equal(I.betrifft("03.11.2026", "2026-11-04", "11:40", "13:10"), false);
  assert.equal(I.betrifft("01.10.2026 - 21.02.2027", "2026-11-04"), true);
  assert.equal(I.betrifft("02.11.2026 - 03.11.2026", "2026-11-04"), false);
  // Teilzeit überschneidet die Stunde
  assert.equal(I.betrifft("04.11.2026 (09:40 - 13:10)", "2026-11-04", "11:40", "13:10"), true);
  // endet, bevor die Stunde beginnt
  assert.equal(I.betrifft("04.11.2026 (07:40 - 09:10)", "2026-11-04", "11:40", "13:10"), false);
  // Stundenzeit unbekannt: Teilzeit am Tag zählt mit
  assert.equal(I.betrifft("04.11.2026 (07:40 - 09:10)", "2026-11-04", null, null), true);
});

test("Doppelstunde aus dem EBG-Raster", () => {
  assert.deepEqual(I.stundenZeit(1), { von: "07:40", bis: "09:10" });
  assert.deepEqual(I.stundenZeit(5), { von: "11:40", bis: "13:10" });
  assert.equal(I.stundenZeit(9), null);
});

test("Namen werden zugeordnet, auch mit zweitem Vornamen", () => {
  const schueler = [
    { id: "a", vorname: "Anna", name: "Müller" },
    { id: "b", vorname: "Ben", name: "Schmidt-Ost" },
    { id: "c", vorname: "Clara", name: "Weiß" },
  ];
  const r = I.zuordnen([
    { zeit: "04.11.2026", name: "Anna Müller", status: "unentschuldigt" },
    { zeit: "04.11.2026", name: "Ben Lukas Schmidt-Ost", status: "entschuldigt" },
    { zeit: "04.11.2026", name: "Dora Fremd", status: "entschuldigt" },
  ], schueler);
  assert.deepEqual(r.treffer.a, { entschuldigt: false, teilzeit: null });
  assert.deepEqual(r.treffer.b, { entschuldigt: true, teilzeit: null });
  assert.equal(r.treffer.c, undefined);
  assert.deepEqual(r.unbekannt, ["Dora Fremd"]);
});

test("zwei mögliche Schüler: nicht raten", () => {
  const schueler = [
    { id: "a", vorname: "Max", name: "Lange" },
    { id: "b", vorname: "Max", name: "Lange" },
  ];
  const r = I.zuordnen([{ zeit: "04.11.2026", name: "Max Lange", status: "entschuldigt" }], schueler);
  assert.deepEqual(r.treffer, {});
  assert.deepEqual(r.unbekannt, ["Max Lange"]);
});

test("doppelter Eintrag: entschuldigt und ganzer Tag gewinnen", () => {
  const schueler = [{ id: "a", vorname: "Anna", name: "Müller" }];
  const r = I.zuordnen([
    { zeit: "04.11.2026 (07:40 - 09:10)", name: "Anna Müller", status: "unentschuldigt" },
    { zeit: "04.11.2026", name: "Anna Müller", status: "entschuldigt" },
  ], schueler);
  assert.deepEqual(r.treffer.a, { entschuldigt: true, teilzeit: null });
});

test("Abruf folgt Weiterleitungen und nimmt Cookies mit", async () => {
  const gesehen = [];
  const http = async (url, opt) => {
    gesehen.push([opt.method, url, opt.cookie]);
    if (url.endsWith("/iserv/auth/login") && opt.method === "POST")
      return { status: 302, location: "/iserv/auth/home", cookies: [{ name: "IServSession", value: "s1" }] };
    if (url.endsWith("/iserv/absence/"))
      return { status: 200, text: '<meta http-equiv="refresh" content="0;url=/iserv/absence/?ok=1&amp;x=2">' };
    if (url.includes("/iserv/absence/?ok=1&x=2"))
      return { status: 200, text: '<select name="filter[groups][]"><option value="11111111-2222-3333-4444-555555555555" >Mathe 9D</option>' };
    if (url.includes("/iserv/absence/.csv"))
      return { status: 200, text: KOPF + '\n"04.11.2026";"1 Tag";"Anna Müller";"9D";"entschuldigt";"x"' };
    return { status: 200, text: "" };
  };
  const e = await I.abrufen(http, { host: "https://iserv.test/", benutzer: "u", passwort: "p" }, "mathe 9d", "2026-11-04");
  assert.equal(e.length, 1);
  const csvAufruf = gesehen.find((g) => g[1].includes(".csv"));
  assert.match(csvAufruf[1], /filter%5Bgroups%5D%5B%5D=11111111-2222-3333-4444-555555555555/);
  assert.match(csvAufruf[1], /filter%5Bfrom%5D=04.11.2026/);
  assert.equal(csvAufruf[2], "IServSession=s1");
});

test("unbekannte Gruppe wird gemeldet", async () => {
  const http = async (url) => ({ status: 200, text: url.endsWith("/absence/") ? 'filter[groups][]' : "" });
  await assert.rejects(I.abrufen(http, { host: "https://iserv.test", benutzer: "u", passwort: "p" }, "Physik 9A", "2026-11-04"), /nicht gefunden/);
});
