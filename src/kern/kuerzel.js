/**
 * Kürzel: der Schlüssel zwischen merkr und checkr.
 *
 * checkr speichert nie Klarnamen - beim Job-Start wird der Name durch den Code
 * ersetzt, die Auflösung findet ausdrücklich außerhalb statt. merkr ist dieses
 * Außerhalb. Hinaus geht das Kürzel, der Name bleibt hier.
 *
 * Warum der Code und nicht eine UUID: checkrs Notenbuch ordnet die Schüler einer
 * Arbeit dem Klassen-Roster über den normalisierten Namen zu, nicht über die Id.
 * Wer denselben Code auf beiden Seiten führt, trifft genau diesen Weg, ohne dass
 * in checkr eine Zeile geändert werden muss.
 */
const MerkrKuerzel = (function () {

  /** Wie checkr vergleicht: klein, getrimmt, Mehrfach-Leerzeichen zusammengezogen. */
  function normalisiert(x) {
    return String(x == null ? "" : x).toLowerCase().split(/\s+/).filter(Boolean).join(" ");
  }

  function sortierschluessel(s) {
    return ((s.name || "") + " " + (s.vorname || "")).toLowerCase();
  }

  /**
   * Fehlende Kürzel vergeben, vorhandene unangetastet lassen - ein Kürzel, das
   * schon auf einer Arbeit steht, darf sich nie ändern.
   *
   * @param schueler [{id, name, vorname, kuerzel}] - die des Kurses
   * @param praefix z.B. "9d"
   * @param belegt Iterable schon vergebener Kürzel, auch aus anderen Kursen
   * @returns [{id, kuerzel}] nur für die, die eines bekommen haben
   */
  function vergeben(schueler, praefix, belegt) {
    const genommen = new Set();
    for (const x of belegt || []) if (normalisiert(x)) genommen.add(normalisiert(x));
    for (const s of schueler) if (normalisiert(s.kuerzel)) genommen.add(normalisiert(s.kuerzel));

    const stamm = String(praefix || "SuS").trim().replace(/\s+/g, "");
    const neu = [];
    let lfd = 1;
    for (const s of schueler.slice().sort((a, b) => sortierschluessel(a).localeCompare(sortierschluessel(b), "de"))) {
      if (normalisiert(s.kuerzel)) continue;
      let kandidat;
      do {
        kandidat = stamm + "-" + String(lfd).padStart(2, "0");
        lfd++;
      } while (genommen.has(normalisiert(kandidat)));
      genommen.add(normalisiert(kandidat));
      neu.push({ id: s.id, kuerzel: kandidat });
    }
    return neu;
  }

  /**
   * Kürzel, die mehrfach vorkommen. Zwei gleiche Codes wären in checkr ein
   * einziger Schüler - die Arbeit des einen landete beim anderen.
   */
  function doppelte(schueler) {
    const zaehler = new Map();
    for (const s of schueler) {
      const k = normalisiert(s.kuerzel);
      if (!k) continue;
      zaehler.set(k, (zaehler.get(k) || 0) + 1);
    }
    return [...zaehler.entries()].filter(([, n]) => n > 1).map(([k]) => k);
  }

  /**
   * Das, was nach checkr geht: `PUT /api/classes/{id}/students` erwartet
   * [{name}] und vergibt die UUIDs selbst. Namen gehen nicht mit - das ist der
   * ganze Punkt.
   */
  function checkrListe(schueler) {
    return schueler
      .filter((s) => normalisiert(s.kuerzel))
      .map((s) => ({ name: String(s.kuerzel).trim() }))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  }

  return {
    normalisiert: normalisiert,
    vergeben: vergeben,
    doppelte: doppelte,
    checkrListe: checkrListe
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = MerkrKuerzel;
