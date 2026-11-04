/**
 * Abwesenheiten aus iServ, für die Anwesenheitsliste.
 *
 * Die Schule erwartet, dass vor der Stunde im iServ-Modul "Abwesenheiten"
 * nachgesehen wird, wer abgemeldet ist. Das wurde regelmäßig vergessen. merkr
 * holt die Einträge deshalb selbst, direkt vom iPad - die Namen gehen über
 * keinen anderen Rechner, planr bekommt sie nie.
 *
 * Drei Regeln aus der Datenschutz-Prüfung (Dieter, 04.11.2026):
 * - Gefiltert wird in der Anfrage, nicht danach: iServ liefert nur die
 *   Kursgruppe und nur den einen Tag. Das Konto sieht alle Klassen, das gibt
 *   aber kein Recht, alle abzurufen.
 * - Was iServ sagt, wird angezeigt, nicht gespeichert. Es lebt im
 *   Arbeitsspeicher der Seite; in die Datendatei kommt nur, was die Lehrkraft
 *   selbst einträgt ("fehlt").
 * - Gründe werden nie gelesen. Der Export hat keine Spalte dafür, und dabei
 *   bleibt es.
 *
 * Diese Datei läuft zweimal: im WebView (Auswertung) und im Scriptable-Rahmen
 * (der Abruf, `abrufen`). bau.mjs setzt sie an beiden Stellen ein.
 */
const MerkrIServ = (function () {

  /* EBG-Raster, geprüft am ICS-Vertretungsplan 2026/27. Doppelstunde =
     Anfangsstunde und die folgende. */
  const RASTER = {
    1: ["07:40", "08:25"], 2: ["08:25", "09:10"],
    3: ["09:40", "10:25"], 4: ["10:25", "11:10"],
    5: ["11:40", "12:25"], 6: ["12:25", "13:10"],
    7: ["13:40", "14:25"], 8: ["14:25", "15:10"],
  };

  /** Zeitspanne einer Doppelstunde, die bei `stunde` beginnt. */
  function stundenZeit(stunde) {
    const a = RASTER[Number(stunde)];
    if (!a) return null;
    const b = RASTER[Number(stunde) + 1] || a;
    return { von: a[0], bis: b[1] };
  }

  /** Eine CSV-Zeile mit Anführungszeichen zerlegen. */
  function zeileZerlegen(zeile, trenner) {
    const felder = [];
    let feld = "", inAnf = false;
    for (let i = 0; i < zeile.length; i++) {
      const c = zeile[i];
      if (inAnf) {
        if (c === '"' && zeile[i + 1] === '"') { feld += '"'; i++; }
        else if (c === '"') inAnf = false;
        else feld += c;
      } else if (c === '"') inAnf = true;
      else if (c === trenner) { felder.push(feld); feld = ""; }
      else feld += c;
    }
    felder.push(feld);
    return felder;
  }

  /**
   * Der CSV-Export des Moduls.
   * Spalten: Abwesenheitszeit; Dauer; Name; Klasse/Information; Status; Aktualisiert am
   * @returns [{zeit, name, status}] oder wirft, wenn das keine iServ-Liste ist
   */
  function csvLesen(text) {
    const zeilen = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).filter(function (z) { return z.trim(); });
    if (!zeilen.length) throw new Error("Leere Antwort von iServ");
    const trenner = zeilen[0].indexOf(";") >= 0 ? ";" : ",";
    const kopf = zeileZerlegen(zeilen[0], trenner);
    if (kopf[0] !== "Abwesenheitszeit") throw new Error("iServ hat keine Abwesenheitsliste geschickt");
    const iName = kopf.indexOf("Name"), iStatus = kopf.indexOf("Status");
    return zeilen.slice(1).map(function (z) {
      const f = zeileZerlegen(z, trenner);
      return { zeit: (f[0] || "").trim(), name: (f[iName] || "").trim(), status: (f[iStatus] || "").trim() };
    }).filter(function (e) { return e.name; });
  }

  function isoVonDeutsch(d) {
    const m = /^(\d\d)\.(\d\d)\.(\d{4})$/.exec(d);
    return m ? m[3] + "-" + m[2] + "-" + m[1] : null;
  }

  /**
   * Betrifft ein Eintrag den Tag `iso` und - wenn bekannt - die Stunde von/bis?
   * Formate: "04.11.2026", "02.11.2026 - 06.11.2026", "04.11.2026 (09:40 - 13:10)".
   * Unbekanntes Format zählt mit: lieber einmal zu viel nachsehen.
   */
  function betrifft(zeit, iso, von, bis) {
    const teil = /^(\d\d\.\d\d\.\d{4}) \((\d\d:\d\d) - (\d\d:\d\d)\)$/.exec(String(zeit).trim());
    if (teil) {
      if (isoVonDeutsch(teil[1]) !== iso) return false;
      if (!von || !bis) return true;
      return teil[2] < bis && teil[3] > von;
    }
    const daten = (String(zeit).match(/\d\d\.\d\d\.\d{4}/g) || []).map(isoVonDeutsch);
    if (!daten.length) return true;
    return daten[0] <= iso && iso <= daten[daten.length - 1];
  }

  /** Teilzeit "09:40 - 13:10" aus dem Eintrag, sonst null. */
  function teilzeit(zeit) {
    const m = /\((\d\d:\d\d - \d\d:\d\d)\)/.exec(String(zeit));
    return m ? m[1] : null;
  }

  function norm(s) {
    return String(s || "").normalize("NFC").toLowerCase().replace(/[-‐]/g, " ").replace(/\s+/g, " ").trim();
  }

  /**
   * iServ-Namen ("Vorname Nachname", gern mit zweitem Vornamen) den Schülern
   * des Kurses zuordnen. Erst genau, dann: alle Teile des merkr-Namens kommen
   * im iServ-Namen vor - aber nur, wenn das genau einen Schüler trifft.
   * @param eintraege [{zeit, name, status}] - schon auf den Tag gefiltert
   * @param schueler [{id, vorname, name}]
   * @returns {treffer: {schuelerId: {entschuldigt, teilzeit}}, unbekannt: [name]}
   */
  function zuordnen(eintraege, schueler) {
    const liste = (schueler || []).map(function (s) {
      const voll = norm((s.vorname || "") + " " + (s.name || ""));
      return { id: s.id, voll: voll, teile: voll.split(" ").filter(Boolean) };
    });
    const treffer = {}, unbekannt = [];
    for (const e of eintraege || []) {
      const n = norm(e.name);
      const nTeile = n.split(" ");
      let wer = liste.filter(function (s) { return s.voll === n; });
      if (wer.length !== 1) {
        wer = liste.filter(function (s) {
          return s.teile.length && s.teile.every(function (t) { return nTeile.indexOf(t) >= 0; });
        });
      }
      if (wer.length !== 1) { if (unbekannt.indexOf(e.name) < 0) unbekannt.push(e.name); continue; }
      const id = wer[0].id;
      const ent = e.status === "entschuldigt";
      const bisher = treffer[id];
      const tz = teilzeit(e.zeit);
      /* Zwei Einträge für dieselbe Person: entschuldigt schlägt unentschuldigt,
         ein ganzer Tag schlägt die Teilzeit. */
      if (!bisher) { treffer[id] = { entschuldigt: ent, teilzeit: tz }; continue; }
      bisher.entschuldigt = bisher.entschuldigt || ent;
      bisher.teilzeit = bisher.teilzeit && tz ? bisher.teilzeit + ", " + tz : null;
    }
    return { treffer: treffer, unbekannt: unbekannt };
  }

  /* ---------- Abruf (läuft im Scriptable-Rahmen) ----------
     `http(url, {method, body, cookies})` liefert {status, text, location, cookies}
     und folgt Weiterleitungen NICHT selbst - die Anmeldung setzt unterwegs
     Cookies, und die müssen mit. So läuft derselbe Ablauf unter node (fetch)
     und in Scriptable (Request). */

  function cookieKopf(dose) {
    return Object.keys(dose).map(function (k) { return k + "=" + dose[k]; }).join("; ");
  }

  /* Eine Weiterleitung gegen die bisherige Adresse auflösen. Von Hand, weil
     Scriptables JavaScript-Umgebung kein `URL` kennt - unter node gibt es es,
     deshalb lief der Test durch und das iPad nicht (04.11.2026). */
  function aufloesen(ziel, basis) {
    ziel = String(ziel).trim();
    if (/^https?:\/\//i.test(ziel)) return ziel;
    const m = /^(https?:)\/\/([^\/?#]+)([^?#]*)/i.exec(basis);
    if (!m) throw new Error("Unlesbare Adresse: " + basis);
    if (ziel.indexOf("//") === 0) return m[1] + ziel;
    if (ziel.charAt(0) === "/") return m[1] + "//" + m[2] + ziel;
    if (ziel.charAt(0) === "?") return m[1] + "//" + m[2] + (m[3] || "/") + ziel;
    const ordner = (m[3] || "/").replace(/[^\/]*$/, "");
    return m[1] + "//" + m[2] + ordner + ziel;
  }

  /* Pfad ohne Abfrage, für Fehlermeldungen: sagt, wo es hing, ohne Codes
     oder Tokens aus der Adresse zu zeigen. */
  function pfad(url) { return String(url).replace(/^https?:\/\/[^\/]+/i, "").replace(/[?#].*$/, ""); }

  async function holen(http, dose, url, opt) {
    let ziel = url, methode = (opt && opt.method) || "GET", body = opt && opt.body;
    for (let i = 0; i < 12; i++) {
      let r;
      try {
        r = await http(ziel, { method: methode, body: body, cookie: cookieKopf(dose) });
      } catch (e) {
        throw new Error(pfad(ziel) + ": " + (e && e.message || e));
      }
      for (const c of r.cookies || []) dose[c.name] = c.value;
      if (r.status >= 300 && r.status < 400 && r.location) {
        ziel = aufloesen(r.location, ziel); methode = "GET"; body = undefined; continue;
      }
      const refresh = /http-equiv="refresh" content="0;url=([^"]+)"/.exec(r.text || "");
      if (refresh) {
        ziel = aufloesen(refresh[1].replace(/&amp;/g, "&"), ziel); methode = "GET"; body = undefined; continue;
      }
      r.pfad = pfad(ziel);
      return r;
    }
    throw new Error("iServ leitet endlos weiter (" + pfad(ziel) + ")");
  }

  function formular(daten) {
    return Object.keys(daten).map(function (k) {
      const w = daten[k];
      return (Array.isArray(w) ? w : [w]).map(function (x) {
        return encodeURIComponent(k) + "=" + encodeURIComponent(x);
      }).join("&");
    }).join("&");
  }

  /**
   * Anmelden, Gruppe suchen, Tagesliste holen.
   * @returns [{zeit, name, status}] der Gruppe an `iso`
   */
  async function abrufen(http, zugang, gruppe, iso) {
    const host = String(zugang.host || "").replace(/\/+$/, "");
    if (!host || !zugang.benutzer || !zugang.passwort) throw new Error("iServ-Zugang unvollständig");
    if (!gruppe) throw new Error("Für diesen Kurs ist keine iServ-Gruppe eingetragen");
    const dose = {};
    await holen(http, dose, host + "/iserv/auth/login");
    await holen(http, dose, host + "/iserv/auth/login", {
      method: "POST", body: formular({ _username: zugang.benutzer, _password: zugang.passwort }),
    });
    const seite = await holen(http, dose, host + "/iserv/absence/");
    if ((seite.text || "").indexOf("filter[groups][]") < 0)
      throw new Error("Anmeldung bei iServ fehlgeschlagen (" + seite.status + " " + seite.pfad + ", " +
        Object.keys(dose).length + " Cookies" + (/Passwort|_password/.test(seite.text || "") ? ", Anmeldeseite" : "") + ")");
    const gesucht = norm(gruppe);
    let uid = null;
    const re = /<option value="([0-9a-f-]{36})" >([^<]+)/g;
    let m;
    while ((m = re.exec(seite.text))) if (norm(m[2]) === gesucht) { uid = m[1]; break; }
    if (!uid) throw new Error("iServ-Gruppe \"" + gruppe + "\" nicht gefunden");
    const d = iso.slice(8, 10) + "." + iso.slice(5, 7) + "." + iso.slice(0, 4);
    const csv = await holen(http, dose, host + "/iserv/absence/.csv?" + formular({
      "filter[groups][]": uid, "filter[from]": d, "filter[to]": d,
      "filter[status][]": ["excused", "unexcused"],
    }));
    return csvLesen(csv.text);
  }

  return { aufloesen: aufloesen, stundenZeit: stundenZeit, csvLesen: csvLesen, betrifft: betrifft, zuordnen: zuordnen, abrufen: abrufen };
})();

if (typeof module !== "undefined" && module.exports) module.exports = MerkrIServ;
