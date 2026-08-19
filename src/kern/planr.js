/**
 * Zuordnung zwischen planr-Kursen und merkr-Kursen.
 *
 * Die Stelle, an der es schiefgeht: planr führt "9a" zweimal, einmal Mathematik
 * und einmal Physik, und in merkr heißt derselbe Kurs vielleicht "Mathe 9a".
 * Deshalb ein eigenes Feld `planrKlasse` am Kurs statt eines Namensvergleichs -
 * dasselbe Muster, das planr für `selbrKlasse` nutzt, und aus demselben Grund:
 * Namen wandern, Kopplungen sollen es nicht.
 */
const MerkrPlanr = (function () {

  function norm(x) {
    return String(x == null ? "" : x).trim().toLowerCase();
  }

  /**
   * Welcher merkr-Kurs gehört zu diesem planr-Eintrag?
   *
   * Reihenfolge: gepflegte Zuordnung schlägt alles. Ist keine gepflegt, gilt der
   * Kursname - so funktioniert der Abruf ohne Einrichtung, solange die Namen
   * zufällig passen.
   *
   * @param kurse [{id, name, planrKlasse, schuljahrId}]
   * @param eintrag {kurs, klasseId} aus der planr-Antwort
   * @param schuljahrId nur Kurse dieses Schuljahres
   */
  function kursFuer(kurse, eintrag, schuljahrId) {
    const gesucht = norm(eintrag && eintrag.kurs);
    const kennung = eintrag && eintrag.klasseId != null ? String(eintrag.klasseId) : "";

    for (const k of kurse || []) {
      if (schuljahrId != null && k.schuljahrId !== schuljahrId) continue;
      const zuordnung = norm(k.planrKlasse);
      if (!zuordnung) continue;
      if (zuordnung === gesucht || (kennung && zuordnung === kennung)) return k;
    }
    for (const k of kurse || []) {
      if (schuljahrId != null && k.schuljahrId !== schuljahrId) continue;
      if (norm(k.planrKlasse)) continue;
      if (norm(k.name) === gesucht) return k;
    }
    return null;
  }

  return { norm: norm, kursFuer: kursFuer };
})();

if (typeof module !== "undefined" && module.exports) module.exports = MerkrPlanr;
