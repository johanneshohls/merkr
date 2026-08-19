/**
 * Notenvorschlag für die Mitarbeit: Basis und zwei Ausschläge.
 *
 * Das Modell folgt der Praxis, nicht der Rechenbequemlichkeit. Wer sich nie
 * meldet, aber schriftlich ordentlich arbeitet, steht bei einer Drei minus -
 * nicht bei "kein Vorschlag". Von dort aus zieht Beteiligung nach oben und
 * Stören nach unten.
 *
 *     Note = BASIS  −  mündlich  −  schriftlich  +  Störung
 *
 * Der entscheidende Unterschied zum Stufenmittel in noten.js: dort kürzt sich
 * die Anzahl heraus. Eine einzige Notiz "++" ergibt dasselbe Mittel wie zwanzig
 * davon, und damit lässt sich Quantität nicht bewerten. Hier ist die Quote der
 * Träger und die Stufe verstärkt sie nur.
 *
 * Reine Funktionen ohne DOM und ohne Zustand, prüfbar in `node --test`.
 * bau.mjs setzt die Datei beim Bauen in die Oberfläche ein.
 */
const MerkrMitarbeit = (function () {
  const TAG_MS = 24 * 60 * 60 * 1000;

  const MUENDLICH   = ["qual_m", "quant_m"];
  const SCHRIFTLICH = ["qual_s", "quant_s"];
  /** Zieht die Note nach unten. Hausaufgaben sind dabei, weil sie über selbr
      nachprüfbar sind - Arbeitsverhalten mit Beleg, keine Bauchentscheidung. */
  const STOEREND    = ["stoerung", "ha_vergessen"];

  /**
   * Vorgabewerte. Alle einzeln überschreibbar, damit die Kurve ohne Eingriff in
   * den Code justierbar bleibt - die Zahlen sind eine pädagogische Setzung und
   * keine Naturkonstante.
   */
  const VORGABE = {
    /** Note bei gar keiner Notiz und keiner Störung. */
    basis: 3.5,
    /** Um so viel hebt volle mündliche Beteiligung bei mittlerer Stufe. */
    muendlich: 1.5,
    /** Wie stark die Stufe die mündliche Beteiligung verstärkt oder dreht. */
    muendlichStufe: 0.75,
    /** Schriftliches wiegt halb - es ist Beiwerk zur mündlichen Note, nicht ihr Ersatz. */
    schriftlich: 0.75,
    schriftlichStufe: 0.375,
    /** Malus je Störung und Unterrichtsstunde. Bei jeder zweiten Stunde eine
        Störung ergibt das 0,7 - aus der Basis wird eine Vier. */
    stoerung: 1.4,
    /** Weiter als zwei Noten zieht Stören nicht. Sonst landet ein schwieriges
        Halbjahr bei einer Sechs, und die ist für Leistung reserviert. */
    stoerungDeckel: 2.0,
    halbwertszeitWochen: 8
  };

  function alsDatum(x) { return x instanceof Date ? x : new Date(x); }
  function begrenzen(x, min, max) { return Math.max(min, Math.min(max, x)); }

  /** Alter in Tagen zwischen zwei ISO-Daten oder Date-Objekten. */
  function alterTage(ts, jetzt) {
    return (alsDatum(jetzt) - alsDatum(ts)) / TAG_MS;
  }

  /** Exponentielles Gewicht nach Alter. Älteres wird leiser, ohne zu verschwinden. */
  function zeitgewicht(tage, halbwertszeitWochen) {
    if (!(tage > 0)) return 1;
    return Math.pow(0.5, tage / ((halbwertszeitWochen || VORGABE.halbwertszeitWochen) * 7));
  }

  /**
   * Anteil und Stufenmittel einer Gruppe von Kategorien.
   *
   * Beides zeitgewichtet, und zwar über dieselben Stundengewichte: eine Stunde
   * aus dem September zählt im Zähler so wenig wie im Nenner. Ohne das wäre die
   * Quote ein Jahresdurchschnitt, während die Stufe schon auf das Halbjahresende
   * schaut - zwei Maßstäbe in einer Formel.
   */
  function anteilUndStufe(stunden, ereignisse, typen, opt) {
    const o = opt || {};
    const jetzt = o.jetzt || new Date();
    const hw = o.halbwertszeitWochen;
    const passt = new Set(typen);

    const proStunde = new Map();
    let stufeSumme = 0, stufeGewicht = 0, anzahl = 0;

    for (const e of ereignisse || []) {
      if (!e || !passt.has(e.typ)) continue;
      if (o.ab && String(e.ts || "").slice(0, 10) < o.ab) continue;
      if (o.bis && String(e.ts || "").slice(0, 10) > o.bis) continue;
      if (!proStunde.has(e.stundeId)) proStunde.set(e.stundeId, true);
      anzahl++;
      if (e.stufe == null || !e.ts) continue;
      const g = zeitgewicht(alterTage(e.ts, jetzt), hw);
      stufeSumme += Number(e.stufe) * g;
      stufeGewicht += g;
    }

    let mitNotiz = 0, alle = 0;
    for (const st of stunden || []) {
      if (!st || st.ausfall) continue;
      if (o.ab && st.datum < o.ab) continue;
      if (o.bis && st.datum > o.bis) continue;
      const g = zeitgewicht(alterTage(st.datum, jetzt), hw);
      alle += g;
      if (proStunde.has(st.id)) mitNotiz += g;
    }

    return {
      quote: alle > 0 ? mitNotiz / alle : 0,
      mittel: stufeGewicht > 0 ? stufeSumme / stufeGewicht : 0,
      anzahl: anzahl,
      stunden: (stunden || []).filter(s => s && !s.ausfall &&
        (!o.ab || s.datum >= o.ab) && (!o.bis || s.datum <= o.bis)).length
    };
  }

  /** Störungen je gehaltener Unterrichtsstunde, zeitgewichtet wie alles andere. */
  function stoerungsanteil(stunden, ereignisse, opt) {
    const o = opt || {};
    const jetzt = o.jetzt || new Date();
    const passt = new Set(STOEREND);
    let summe = 0, anzahl = 0;

    for (const e of ereignisse || []) {
      if (!e || !passt.has(e.typ)) continue;
      if (o.ab && String(e.ts || "").slice(0, 10) < o.ab) continue;
      if (o.bis && String(e.ts || "").slice(0, 10) > o.bis) continue;
      anzahl++;
      summe += zeitgewicht(alterTage(e.ts || (o.datumVon && o.datumVon(e)) || jetzt, jetzt), o.halbwertszeitWochen);
    }

    let alle = 0;
    for (const st of stunden || []) {
      if (!st || st.ausfall) continue;
      if (o.ab && st.datum < o.ab) continue;
      if (o.bis && st.datum > o.bis) continue;
      alle += zeitgewicht(alterTage(st.datum, jetzt), o.halbwertszeitWochen);
    }
    return { je: alle > 0 ? summe / alle : 0, anzahl: anzahl };
  }

  /**
   * Runden zugunsten des Schülers.
   *
   * Bei Noten ist kleiner besser, bei Punkten größer - eine glatte 3,5 wird also
   * zur 3 und 7,5 Punkte werden 8. Das ist keine Rechenschwäche, sondern die
   * übliche Richtung im Zweifel; die Basis liegt bewusst genau auf so einer
   * Kante.
   */
  function runden(wert, typ) {
    if (typ === "punkte") return Math.floor(wert + 0.5);
    return Math.ceil(wert - 0.5);
  }

  /** Note in die Punkteskala der Oberstufe. 3 → 8, 1 → 14, 6 → 0. */
  function alsPunkte(note) { return begrenzen(17 - 3 * note, 0, 15); }

  /**
   * @param stunden     [{id, datum, ausfall}] - gehaltene Stunden des Zeitraums
   * @param ereignisse  [{ts, typ, stufe, stundeId}] - Notizen dieses Schülers
   * @param opt         {jetzt, typ, ...VORGABE}
   * @returns {wert, genau, basis, muendlich, schriftlich, stoerung, anteile}
   */
  function vorschlag(stunden, ereignisse, opt) {
    const o = Object.assign({}, VORGABE, opt || {});
    const m = anteilUndStufe(stunden, ereignisse, MUENDLICH, o);
    const s = anteilUndStufe(stunden, ereignisse, SCHRIFTLICH, o);
    const stoer = stoerungsanteil(stunden, ereignisse, o);

    const teilM = m.quote * (o.muendlich + o.muendlichStufe * m.mittel);
    const teilS = s.quote * (o.schriftlich + o.schriftlichStufe * s.mittel);
    const teilStoer = Math.min(o.stoerungDeckel, o.stoerung * stoer.je);

    const roh = o.basis - teilM - teilS + teilStoer;
    const note = begrenzen(roh, 1, 6);
    const inPunkten = o.typ === "punkte";
    const genau = inPunkten ? alsPunkte(note) : note;

    return {
      wert: runden(genau, o.typ),
      genau: Math.round(genau * 10) / 10,
      note: Math.round(note * 10) / 10,
      basis: o.basis,
      muendlich: Math.round(teilM * 100) / 100,
      schriftlich: Math.round(teilS * 100) / 100,
      stoerung: Math.round(teilStoer * 100) / 100,
      gedeckelt: o.stoerung * stoer.je > o.stoerungDeckel,
      anteile: { m: m, s: s, stoer: stoer },
      anzahl: m.anzahl + s.anzahl + stoer.anzahl,
      stunden: m.stunden
    };
  }

  return {
    VORGABE: VORGABE,
    MUENDLICH: MUENDLICH,
    SCHRIFTLICH: SCHRIFTLICH,
    STOEREND: STOEREND,
    zeitgewicht: zeitgewicht,
    anteilUndStufe: anteilUndStufe,
    stoerungsanteil: stoerungsanteil,
    runden: runden,
    alsPunkte: alsPunkte,
    vorschlag: vorschlag
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = MerkrMitarbeit;
