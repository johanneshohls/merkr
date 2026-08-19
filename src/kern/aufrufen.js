/**
 * Aufrufen ohne Zurücklegen.
 *
 * Zufällig, aber gerecht: erst wenn alle einmal dran waren, beginnt eine neue
 * Runde. Ein reiner Zufallsgriff würde manche in einer Stunde dreimal treffen
 * und andere wochenlang nie - und die Klasse merkt das sofort.
 *
 * Der Topf hält die Ids der noch nicht Gezogenen. Ist er leer, wird neu
 * gefüllt; wer zuletzt dran war, wird dabei nicht sofort wieder Erster.
 */
const MerkrAufrufen = (function () {

  /**
   * Wer ist noch im Topf? Räumt dabei auf: wer den Kurs verlassen hat, fliegt
   * raus, wer neu dazukam, kommt in die laufende Runde.
   */
  function topfPruefen(topf, ids) {
    const gueltig = new Set(ids);
    const bereinigt = (topf || []).filter((id) => gueltig.has(id));
    return bereinigt;
  }

  /**
   * Den Nächsten ziehen.
   *
   * @param ids alle, die in Frage kommen (Abwesende vorher herausfiltern)
   * @param topf die noch nicht Gezogenen dieser Runde
   * @param zuletzt wer als Letztes dran war - er wird nicht sofort wieder Erster
   * @param wuerfel Zufallsfunktion, für die Prüfung austauschbar
   * @returns {gezogen, topf, neueRunde} oder null, wenn niemand in Frage kommt
   */
  function ziehen(ids, topf, zuletzt, wuerfel) {
    const w = wuerfel || Math.random;
    const alle = (ids || []).filter(Boolean);
    if (!alle.length) return null;

    let rest = topfPruefen(topf, alle);
    let neueRunde = false;

    if (!rest.length) {
      neueRunde = true;
      rest = alle.slice();
      // Nach einer vollen Runde nicht mit demselben weitermachen - das fällt auf.
      if (rest.length > 1 && zuletzt) {
        const ohne = rest.filter((id) => id !== zuletzt);
        if (ohne.length) {
          const gezogen = ohne[Math.floor(w() * ohne.length)];
          return { gezogen, topf: rest.filter((id) => id !== gezogen), neueRunde };
        }
      }
    }

    const gezogen = rest[Math.floor(w() * rest.length)];
    return { gezogen, topf: rest.filter((id) => id !== gezogen), neueRunde };
  }

  /** Wie viele sind in dieser Runde noch nicht dran gewesen? */
  function offen(topf, ids) {
    return topfPruefen(topf, ids || []).length;
  }

  return { ziehen: ziehen, offen: offen, topfPruefen: topfPruefen };
})();

if (typeof module !== "undefined" && module.exports) module.exports = MerkrAufrufen;
