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

  /**
   * Die Lösungen zur TÜ, wie planr sie schickt (dort aus drillr geholt und in
   * Klartext übersetzt): {name, link, aufgaben: [{nr, aufgabe, loesung}]}.
   * Hier wird nur in Form gebracht - Zeichenketten, fortlaufende Nummern,
   * nichts Leeres. null, wenn keine einzige Lösung dabei ist.
   */
  function loesungenAusPlanr(roh) {
    if (!roh || !Array.isArray(roh.aufgaben)) return null;
    const aufgaben = [];
    for (const a of roh.aufgaben) {
      if (!a) continue;
      const loesung = String(a.loesung == null ? "" : a.loesung).trim();
      const aufgabe = String(a.aufgabe == null ? "" : a.aufgabe).trim();
      if (!loesung && !aufgabe) continue;
      const nr = Number(a.nr);
      aufgaben.push({ nr: isFinite(nr) && nr > 0 ? nr : aufgaben.length + 1, aufgabe: aufgabe, loesung: loesung });
    }
    if (!aufgaben.some((a) => a.loesung)) return null;
    return {
      name: String(roh.name == null ? "" : roh.name).trim(),
      link: String(roh.link == null ? "" : roh.link).trim(),
      aufgaben: aufgaben
    };
  }

  return { norm: norm, kursFuer: kursFuer, loesungenAusPlanr: loesungenAusPlanr };
})();

if (typeof module !== "undefined" && module.exports) module.exports = MerkrPlanr;
