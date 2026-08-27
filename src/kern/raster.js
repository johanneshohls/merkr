/**
 * Das Wochenraster aus planr, in merkrs Sprache.
 *
 * planr führt den Stundenplan in `class_slots`: Wochentyp A oder B, Wochentag,
 * Doppelstunden-Block (1 = 1./2. Stunde). merkr führt ihn je Kurs als
 * `{tag, stunde, woche}` mit der Anfangsstunde und "AB" für beide Wochen -
 * dieselbe Auskunft, andere Zählung.
 *
 * Die Umrechnung steht hier und nicht im Importer, weil sie zwei Fallen hat,
 * die man beim Hinsehen nicht bemerkt: dieselbe Stunde steht in A und in B und
 * ergibt zusammen "AB", und `block*2-1` ist dieselbe Rechnung, die der
 * Tagesplan macht - stünde sie zweimal, liefe sie irgendwann auseinander.
 */
const MerkrRaster = (function () {

  /** Die Anfangsstunde des Blocks: 1 = 1./2., 2 = 3./4. */
  function stundeVon(block) {
    return Number(block) * 2 - 1;
  }

  /**
   * @param roh [{woche, tag, block, raum}] aus /api/stoffverteilung
   * @returns [{tag, stunde, woche}] sortiert, "AB" wo A und B dasselbe sagen
   */
  function ausPlanr(roh) {
    const gefunden = {};
    for (const e of roh || []) {
      if (!e) continue;
      const tag = Number(e.tag);
      const block = Number(e.block);
      const woche = String(e.woche || "").toUpperCase();
      if (!(tag >= 1 && tag <= 5)) continue;
      if (!(block >= 1)) continue;
      if (woche !== "A" && woche !== "B") continue;
      const schluessel = tag + "-" + block;
      const bisher = gefunden[schluessel];
      /* Steht dieselbe Stunde in beiden Wochen, ist der A/B-Wechsel für sie
         keine Information - genau das meint "AB". */
      gefunden[schluessel] = { tag: tag, stunde: stundeVon(block),
        woche: bisher && bisher.woche !== woche ? "AB" : woche };
    }
    return Object.keys(gefunden).map(function (s) { return gefunden[s]; })
      .sort(function (a, b) { return a.tag - b.tag || a.stunde - b.stunde; });
  }

  /**
   * Sagen zwei Raster dasselbe?
   *
   * Für die Frage, ob merkrs Stundenplan noch zu planrs passt. Verglichen wird
   * nur, was merkr führt - ein Raumwechsel in planr ist hier kein Unterschied.
   */
  function gleich(a, b) {
    const schluessel = function (liste) {
      return (liste || []).slice()
        .sort(function (x, y) { return x.tag - y.tag || x.stunde - y.stunde; })
        .map(function (s) { return s.tag + "-" + s.stunde + "-" + (s.woche || "AB"); })
        .join(",");
    };
    return schluessel(a) === schluessel(b);
  }

  return { ausPlanr: ausPlanr, gleich: gleich, stundeVon: stundeVon };
})();

if (typeof module !== "undefined" && module.exports) module.exports = MerkrRaster;
