/**
 * Notenvorschlag aus Mitarbeitsnotizen.
 *
 * Reine Funktionen ohne DOM und ohne Zustand, damit sie in `node --test` prüfbar
 * sind. bau.mjs setzt diese Datei beim Bauen in die Oberfläche ein.
 *
 * Der Vorschlag ist ein Vorschlag. Die Note wird gesetzt, nicht gerechnet - der
 * pädagogische Beurteilungsspielraum ist kein Rundungsfehler. Deshalb liefert
 * `vorschlag` auch mit, worauf er beruht: ohne die Anzahl der Notizen und ihre
 * Verteilung über die Zeit ist eine Zahl nicht überprüfbar.
 */
const MerkrNoten = (function () {
  const TAG_MS = 24 * 60 * 60 * 1000;

  /** Nach so vielen Wochen zählt eine Notiz halb. */
  const HALBWERTSZEIT_WOCHEN = 8;

  /**
   * Stufenmittel 0 ("o") ergibt diese Note.
   *
   * Vorher stand hier 3,5 - durchgehend mittelmäßige Mitarbeit landete damit auf
   * einer 4. Die MV-Formulierung für befriedigend lautet "entspricht den
   * Anforderungen im Allgemeinen", und das ist ein "o". Die Punkteskala der
   * Oberstufe rechnete ohnehin schon so: 7,5 + 3,75 · 0 sind 8 Punkte, also eine
   * glatte 3. Beide Skalen sagen jetzt dasselbe.
   */
  const NULLPUNKT = 3.0;

  /** Notenschritte je Stufe. Bei ++ (Mittel 2) ergibt das eine 1, bei −− eine 6 (gerundet). */
  const SPANNE = 1.25;

  function alsDatum(x) {
    return x instanceof Date ? x : new Date(x);
  }

  function begrenzen(x, min, max) {
    return Math.max(min, Math.min(max, x));
  }

  /**
   * Gewicht einer Notiz nach ihrem Alter. Exponentiell, damit Älteres leiser
   * wird, ohne je ganz zu verschwinden - eine harte Kante ("nur die letzten acht
   * Wochen") würde eine Notiz über Nacht wertlos machen.
   */
  function gewicht(alterTage, halbwertszeitWochen) {
    if (!(alterTage > 0)) return 1;
    const hw = (halbwertszeitWochen || HALBWERTSZEIT_WOCHEN) * 7;
    return Math.pow(0.5, alterTage / hw);
  }

  /**
   * Beginn des laufenden Halbjahres. Die Grenze ist hart: in die Halbjahresnote
   * gehört nur, was im Halbjahr passiert ist. Ohne gepflegte Grenze bleibt es
   * beim Schuljahresbeginn.
   */
  function halbjahrBeginn(schuljahr, heuteIso) {
    if (!schuljahr) return null;
    const grenze = schuljahr.halbjahrGrenze;
    if (grenze && heuteIso && heuteIso >= grenze) return grenze;
    return schuljahr.beginn || null;
  }

  function noteAusMittel(mittel, typ) {
    if (typ === "punkte") return begrenzen(Math.round(7.5 + 3.75 * mittel), 0, 15);
    return begrenzen(Math.round(NULLPUNKT - SPANNE * mittel), 1, 6);
  }

  /**
   * @param ereignisse [{ts, stufe}] - ts als ISO-Zeitstempel, stufe -2..+2
   * @param opt {jetzt, ab, typ, halbwertszeitWochen}
   * @returns null ohne verwertbare Notiz, sonst
   *          {wert, mittel, anzahl, anzahlFrisch, aeltestes, juengstes}
   */
  function vorschlag(ereignisse, opt) {
    const o = opt || {};
    const jetzt = alsDatum(o.jetzt || new Date());
    const ab = o.ab || null;

    let summe = 0, gewichtSumme = 0, anzahl = 0, anzahlFrisch = 0;
    let aeltestes = null, juengstes = null;

    for (const e of ereignisse || []) {
      if (!e || e.stufe == null || !e.ts) continue;
      if (ab && String(e.ts).slice(0, 10) < ab) continue;

      const alterTage = (jetzt - alsDatum(e.ts)) / TAG_MS;
      const g = gewicht(alterTage, o.halbwertszeitWochen);
      summe += Number(e.stufe) * g;
      gewichtSumme += g;
      anzahl++;
      if (alterTage <= 28) anzahlFrisch++;
      if (!aeltestes || e.ts < aeltestes) aeltestes = e.ts;
      if (!juengstes || e.ts > juengstes) juengstes = e.ts;
    }

    if (!anzahl || !gewichtSumme) return null;
    const mittel = summe / gewichtSumme;
    return {
      wert: noteAusMittel(mittel, o.typ),
      mittel: mittel,
      anzahl: anzahl,
      anzahlFrisch: anzahlFrisch,
      aeltestes: aeltestes,
      juengstes: juengstes
    };
  }

  return {
    HALBWERTSZEIT_WOCHEN: HALBWERTSZEIT_WOCHEN,
    NULLPUNKT: NULLPUNKT,
    gewicht: gewicht,
    halbjahrBeginn: halbjahrBeginn,
    noteAusMittel: noteAusMittel,
    vorschlag: vorschlag
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = MerkrNoten;
