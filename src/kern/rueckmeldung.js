/**
 * Die Rückmeldung an planr: was in der Stunde gewackelt hat.
 *
 * planr sagt vor der Stunde, woraus die TÜ gebaut ist (`tuThemen` je Termin in
 * der Stoffverteilung). Nach der Stunde tippt die Lehrkraft an, welches dieser
 * Themen Probleme gemacht hat; planr zieht es in der nächsten TÜ vor.
 *
 * Hier liegt nur die Rechnung: was zur Auswahl steht und wie der Brief aussieht.
 * Der Versand steht im Rahmen, die Bedienung in der Oberfläche.
 *
 * Namen gehen nie hinaus - die Rückmeldung kennt Kurs, Datum und Thema, sonst
 * nichts. Das ist die Regel des Hauses, und sie fällt hier leicht: planr hat für
 * Schülerdaten ohnehin keine Felder.
 */
const MerkrRueckmeldung = (function () {

  /** Die drei Zustände, die planr für das Stundenziel kennt. */
  const ZIELSTAND = ["ja", "teilweise", "nein"];

  /**
   * Was kann man für diese Stunde ankreuzen?
   *
   * Zuerst die Themen der TÜ - sie sind das Genaueste, was es gibt. Sie stehen
   * aber nur da, wenn die TÜ über planrs Knopf in drillr entstanden ist; wird
   * sie direkt in drillr gebaut und hier nur verlinkt, bleibt das Feld leer.
   * Genau das war der Normalfall, und deshalb erschien der Wackelblock nie:
   * in planr standen am 27.08.2026 null Wiederholungssignale, seit es die
   * Tabelle gibt.
   *
   * `wackelThemen` ist der Rückfall auf den laufenden Themenblock, den planr
   * seitdem mitschickt. Leer bleibt es nur, wenn der Kurs gar keine Grobplanung
   * hat.
   */
  function wackelThemen(stunde) {
    const roh = (stunde && stunde.tuThemen && stunde.tuThemen.length ? stunde.tuThemen
      : (stunde && stunde.wackelThemen)) || [];
    const raus = [];
    for (const t of roh) {
      const s = String(t == null ? "" : t).trim();
      if (s && raus.indexOf(s) < 0) raus.push(s);
    }
    return raus;
  }

  /**
   * Der Brief an POST /api/rueckmeldung.
   *
   * `klasse` und `fach` kommen aus dem, was planr beim Abruf über sich gesagt hat
   * (`planrName`, `planrFach`), nicht aus merkrs eigenem Kursnamen: drüben heißt
   * der Kurs "9a" mit Fach "Mathematik", hier vielleicht "Mathe 9a". Fehlt die
   * Angabe, ist der Kurs nie aus planr gekommen - dann gibt es nichts zu melden.
   *
   * Gibt null zurück, wenn nichts zu senden ist. Der Aufrufer muss dann nichts
   * prüfen, sondern nur auf null achten.
   */
  function brief(kurs, stunde, auswahl, zusatz) {
    if (!kurs || !stunde || !stunde.datum) return null;
    const klasse = String((kurs.planrName || "")).trim();
    if (!klasse) return null;

    const erlaubt = wackelThemen(stunde);
    const wackelt = [];
    for (const a of auswahl || []) {
      const s = String(a == null ? "" : a).trim();
      // Nur, was auch auf dem Blatt stand: ein freier Text wäre drüben ein
      // Thema, das keine Aufgabe trifft, und stünde für immer offen.
      if (s && erlaubt.indexOf(s) >= 0 && wackelt.indexOf(s) < 0) wackelt.push(s);
    }

    const z = zusatz || {};
    const zielErreicht = ZIELSTAND.indexOf(z.zielErreicht) >= 0 ? z.zielErreicht : null;
    const notizText = String(z.notiz == null ? "" : z.notiz).trim();

    // Ein Brief ohne Inhalt bleibt zu Hause.
    if (!wackelt.length && !zielErreicht && !notizText) return null;

    const b = {
      klasse: klasse,
      datum: stunde.datum,
      gehalten: true,
    };
    if (wackelt.length) b.wackelt = wackelt;
    if (zielErreicht) b.zielErreicht = zielErreicht;
    if (notizText) b.notiz = notizText;
    const fach = String((kurs.planrFach || "")).trim();
    if (fach) b.fach = fach;
    return b;
  }

  /**
   * Was aus den abgehakten Phasen für planr wird.
   *
   * planr kennt drei Zustände - ja, teilweise, nein. Die Haken sagen genauer, was
   * liegen blieb; das geht als Notiz mit, weil eine Phase drüben kein eigenes
   * Feld hat. Der Text ist knapp gehalten: er landet in der Reflexion und wird
   * beim Planen der nächsten Stunde gelesen, nicht archiviert.
   *
   * @param phasen   [{schluessel, name}] - was planr für diese Stunde vorsah
   * @param erledigt [schluessel] - was abgehakt wurde
   */
  function zielstand(phasen, erledigt) {
    const alle = (phasen || []).filter(function (p) { return p && p.schluessel; });
    if (!alle.length) return { zielErreicht: null, notiz: "", offen: [] };
    const fertig = new Set(erledigt || []);
    const offen = alle.filter(function (p) { return !fertig.has(p.schluessel); });

    return {
      zielErreicht: offen.length === 0 ? "ja" : offen.length === alle.length ? "nein" : "teilweise",
      offen: offen.map(function (p) { return p.name; }),
      notiz: offen.length ? "Offen geblieben: " + offen.map(function (p) { return p.name; }).join(", ") : ""
    };
  }

  /** Kurzfassung fürs Protokoll am Kurs: "25.08.: Lösungsformel, Faktorisierung". */
  function notiz(brief) {
    if (!brief) return "";
    return brief.datum + ": " + brief.wackelt.join(", ");
  }

  return { wackelThemen: wackelThemen, brief: brief, notiz: notiz,
    zielstand: zielstand, ZIELSTAND: ZIELSTAND };
})();

if (typeof module !== "undefined" && module.exports) module.exports = MerkrRueckmeldung;
