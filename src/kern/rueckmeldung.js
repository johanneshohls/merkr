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

  /** Was kann man für diese Stunde ankreuzen? Leer, wenn keine TÜ dran hing. */
  function wackelThemen(stunde) {
    const roh = (stunde && stunde.tuThemen) || [];
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
  function brief(kurs, stunde, auswahl) {
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
    if (!wackelt.length) return null;

    const b = {
      klasse: klasse,
      datum: stunde.datum,
      gehalten: true,
      wackelt: wackelt,
    };
    const fach = String((kurs.planrFach || "")).trim();
    if (fach) b.fach = fach;
    return b;
  }

  /** Kurzfassung fürs Protokoll am Kurs: "25.08.: Lösungsformel, Faktorisierung". */
  function notiz(brief) {
    if (!brief) return "";
    return brief.datum + ": " + brief.wackelt.join(", ");
  }

  return { wackelThemen: wackelThemen, brief: brief, notiz: notiz };
})();

if (typeof module !== "undefined" && module.exports) module.exports = MerkrRueckmeldung;
