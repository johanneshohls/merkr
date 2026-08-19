/**
 * Wer gerät aus dem Blick?
 *
 * Wenn nur Auffälliges notiert wird - und anders ist es bei 25 Schülern in 90
 * Minuten nicht zu machen -, sind die Stillen genau die, über die am Ende
 * nichts dasteht. Sie brauchen die Note trotzdem.
 *
 * Diese Rechnung beantwortet drei Fragen: wie viele Notizen hat jemand, wie
 * lange ist die letzte her (in Unterrichtsstunden, nicht in Tagen), und wie
 * dringend sollte er drankommen.
 */
const MerkrBeteiligung = (function () {

  /** Nur die Kategorien, die mündliche Beteiligung meinen. */
  const MUENDLICH = ["qual_m", "quant_m"];

  /**
   * Übersicht je Schüler.
   *
   * @param schueler [{id, vorname, name}]
   * @param stunden  Stunden des Kurses, aufsteigend nach Datum
   * @param ereignisse alle Ereignisse des Kurses
   * @param opt {ab} - Datum, ab dem gezählt wird (Halbjahresgrenze)
   * @returns je Schüler {id, anzahl, letzte, stundenOhne, mittel}
   */
  function uebersicht(schueler, stunden, ereignisse, opt) {
    const o = opt || {};
    const relevant = (stunden || [])
      .filter((st) => !o.ab || st.datum >= o.ab)
      .filter((st) => !st.ausfall)
      .slice()
      .sort((a, b) => String(a.datum).localeCompare(String(b.datum)));

    // Für "wie viele Stunden ist es her" zählt die Position in der Stundenfolge.
    const platzVon = new Map(relevant.map((st, i) => [st.id, i]));

    return (schueler || []).map((s) => {
      const seine = (ereignisse || []).filter(
        (e) => e.schuelerId === s.id && e.stufe != null && MUENDLICH.includes(e.typ) && platzVon.has(e.stundeId),
      );
      let letzte = null, letzterPlatz = -1, summe = 0;
      for (const e of seine) {
        summe += Number(e.stufe);
        const platz = platzVon.get(e.stundeId);
        if (platz > letzterPlatz) { letzterPlatz = platz; letzte = e; }
      }
      return {
        id: s.id,
        anzahl: seine.length,
        letzte: letzte,
        // Wie viele Stunden liegen seit der letzten Notiz? Ohne Notiz: alle.
        stundenOhne: letzterPlatz < 0 ? relevant.length : relevant.length - 1 - letzterPlatz,
        mittel: seine.length ? summe / seine.length : null,
      };
    });
  }

  /**
   * Wie dringend gehört jemand drangenommen?
   *
   * Eins ist die Grundlast, dazu kommt je verstrichener Stunde ein Punkt. Nach
   * oben gedeckelt, damit ein einzelner Langzeit-Fall nicht die ganze Runde an
   * sich zieht.
   */
  function gewicht(stundenOhne, deckel) {
    const d = deckel == null ? 8 : deckel;
    return 1 + Math.min(d, Math.max(0, Number(stundenOhne) || 0));
  }

  /**
   * Aus einem Topf ziehen, aber die Vernachlässigten bevorzugt.
   *
   * Die Runde bleibt vollständig - es ändert sich nur die Reihenfolge
   * innerhalb der Runde. Wer lange nicht dran war, kommt eher früh.
   */
  function zieheGewichtet(topf, gewichte, wuerfel) {
    const w = wuerfel || Math.random;
    const liste = (topf || []).filter(Boolean);
    if (!liste.length) return null;
    const summe = liste.reduce((acc, id) => acc + (gewichte[id] || 1), 0);
    let punkt = w() * summe;
    for (const id of liste) {
      punkt -= gewichte[id] || 1;
      if (punkt <= 0) return id;
    }
    return liste[liste.length - 1];
  }

  return { MUENDLICH: MUENDLICH, uebersicht: uebersicht, gewicht: gewicht, zieheGewichtet: zieheGewichtet };
})();

if (typeof module !== "undefined" && module.exports) module.exports = MerkrBeteiligung;
