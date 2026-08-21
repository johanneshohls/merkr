/**
 * Die TÜ-Punkte eines Halbjahres zu einer Note.
 *
 * Fünf Übungen zu je zehn Punkten, drei davon zählen. TÜ 1 bis 3 schreibt
 * jeder. TÜ 4 und 5 schreibt nur, wer sich ein Rückkaufrecht erspielt hat -
 * damit darf die schlechteste Übung gestrichen werden, mit zwei Rechten die
 * zwei schlechtesten. Am Ende zählen immer die besten drei.
 *
 * Daraus folgt eine Regel, die kürzer ist als ihre Erklärung: mit r Rechten
 * kommen die Übungen 1 bis 3+r in den Topf, und aus dem Topf zählen die drei
 * besten. Wer ein Recht hat, es aber nicht nutzt, verliert nichts; wer TÜ 4
 * ohne Recht geschrieben hat, gewinnt nichts.
 *
 * Die Note macht diese Datei nicht - sie liefert Punkte und Prozent, den
 * Schlüssel führt MerkrErgebnisse. Ein zweiter Notenschlüssel im Haus wäre
 * einer zu viel.
 *
 * Reine Funktionen ohne DOM und ohne Zustand, prüfbar in `node --test`.
 */
const MerkrTue = (function () {
  /** So viele Übungen zählen in die Note. */
  const ZAEHLEN = 3;
  /** Punkte je Übung. */
  const MAX_JE = 10;
  /** So viele Übungen gibt es im Halbjahr. */
  const ANZAHL = 5;

  function alsZahl(x) {
    if (x === null || x === undefined || x === "") return null;
    const n = Number(x);
    return isFinite(n) ? n : null;
  }

  /**
   * @param punkte    [p1..p5] - null oder "" für nicht geschrieben
   * @param rueckkauf 0, 1 oder 2 - so viele Rechte hat der Schüler
   * @returns {zaehlend, gestrichen, unzulaessig, summe, max, prozent, vollstaendig}
   *          zaehlend/gestrichen/unzulaessig sind Nummern (1-basiert).
   */
  function auswertung(punkte, rueckkauf) {
    const r = Math.max(0, Math.min(ANZAHL - ZAEHLEN, Number(rueckkauf) || 0));
    const bisNr = ZAEHLEN + r;

    const geschrieben = [];
    const unzulaessig = [];
    for (let i = 0; i < ANZAHL; i++) {
      const p = alsZahl((punkte || [])[i]);
      if (p === null) continue;
      const eintrag = { nr: i + 1, punkte: Math.max(0, Math.min(MAX_JE, p)) };
      /* Ohne Recht geschrieben: wird gezeigt, zählt aber nicht mit. Stillschweigend
         mitrechnen wäre schlimmer als der Hinweis - es wäre ein zweites Regelwerk. */
      if (eintrag.nr > bisNr) unzulaessig.push(eintrag.nr);
      else geschrieben.push(eintrag);
    }

    const sortiert = geschrieben.slice().sort(function (a, b) {
      return b.punkte - a.punkte || a.nr - b.nr;
    });
    const zaehlend = sortiert.slice(0, ZAEHLEN);
    const gestrichen = sortiert.slice(ZAEHLEN);

    const summe = zaehlend.reduce(function (s, x) { return s + x.punkte; }, 0);
    /* Solange nicht alle drei geschrieben sind, ist es ein Zwischenstand: dann
       misst sich die Summe an dem, was bisher möglich war. */
    const max = Math.max(1, zaehlend.length * MAX_JE);

    return {
      zaehlend: zaehlend.map(function (x) { return x.nr; }),
      gestrichen: gestrichen.map(function (x) { return x.nr; }).sort(function (a, b) { return a - b; }),
      unzulaessig: unzulaessig,
      summe: summe,
      max: max,
      prozent: Math.round((summe / max) * 1000) / 10,
      vollstaendig: zaehlend.length === ZAEHLEN,
      rechte: r,
      offenBis: bisNr
    };
  }

  return {
    ZAEHLEN: ZAEHLEN,
    MAX_JE: MAX_JE,
    ANZAHL: ANZAHL,
    MAX_GESAMT: ZAEHLEN * MAX_JE,
    auswertung: auswertung,
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = MerkrTue;
