/**
 * Wer hat die Hausaufgaben gemacht?
 *
 * planr liefert unter /api/hausaufgaben je Kurs die laufenden Aufträge und je
 * selbr-Zugangscode, wie viele Aufgaben richtig waren. Namen stehen dort keine -
 * die Auflösung passiert hier, auf dem Gerät, über `schueler[].selbrCode`.
 *
 * Gezeigt wird die Aufgabe, die an diesem Tag fällig ist: In der Stunde am 1.9.
 * interessiert, wer bis heute fertig geworden ist, nicht was übermorgen ansteht.
 */
const MerkrHausaufgaben = (function () {

  const norm = (x) => String(x == null ? "" : x).trim().toUpperCase();

  /**
   * Die Aufträge eines Kurses, die an `datum` fällig sind, mit Namen statt Codes.
   *
   * `kursStand` ist ein Eintrag aus planrs Antwort (`kurse[]`), `schueler` sind
   * die des Kurses aus merkr.
   *
   * Drei Gruppen kommen zurück, weil drei verschiedene Dinge zu tun sind:
   * `erledigt` und `offen` sind die Klasse, `ohneCode` sind Kinder, bei denen
   * noch kein Zugang eingetragen ist - die fehlen sonst lautlos, und man hielte
   * sie für erledigt.
   */
  function fuerStunde(kursStand, datum, schueler) {
    if (!kursStand || !Array.isArray(kursStand.hausaufgaben)) return [];
    const nachCode = Object.create(null);
    for (const s of schueler) {
      const c = norm(s.selbrCode);
      if (c) nachCode[c] = s;
    }
    const ohneCode = schueler.filter((s) => !norm(s.selbrCode));

    return kursStand.hausaufgaben
      .filter((h) => String(h.faelligAm) === String(datum))
      .map((h) => {
        const erledigt = [];
        const offen = [];
        for (const eintrag of h.schueler || []) {
          const s = nachCode[norm(eintrag.code)];
          if (!s) continue;   // ein Code, der zu keinem Kind dieses Kurses gehört
          const zeile = {
            id: s.id,
            name: s.name,
            vorname: s.vorname,
            geschafft: Number(eintrag.geschafft) || 0,
            ziel: Number(h.zielAufgaben) || 0,
          };
          (eintrag.fertig ? erledigt : offen).push(zeile);
        }
        const sortiert = (liste) => liste.slice().sort((a, b) =>
          ((a.name || "") + " " + (a.vorname || "")).localeCompare((b.name || "") + " " + (b.vorname || ""), "de"));
        return {
          titel: h.titel,
          hinweis: h.hinweis || "",
          ziel: Number(h.zielAufgaben) || 0,
          gestelltAm: h.gestelltAm,
          faelligAm: h.faelligAm,
          erledigt: sortiert(erledigt),
          // Wer am wenigsten hat, steht oben - das sind die, die man anspricht.
          offen: offen.slice().sort((a, b) => a.geschafft - b.geschafft ||
            ((a.name || "") + " " + (a.vorname || "")).localeCompare((b.name || "") + " " + (b.vorname || ""), "de")),
          ohneCode: sortiert(ohneCode),
        };
      });
  }

  /**
   * Den Eintrag eines Kurses in planrs Antwort finden.
   *
   * Über `kurs.planrKlasse` - das Feld, das der Stoffplan-Import ohnehin setzt
   * und das planrs vollen Kursnamen trägt ("Mathematik 8d"). merkrs eigener Name
   * ist ein anderer ("Mathe 8d"), und die 9a gibt es zweimal: einmal Mathematik,
   * einmal Physik. Über die Klasse allein träfe man den falschen Kurs.
   *
   * Ohne planrKlasse - ein Kurs, für den noch nie ein Stoffplan geholt wurde -
   * bleibt der Rückfall auf Fach und Klassenname zusammen.
   */
  function kursStandVon(antwort, kurs) {
    if (!antwort || !Array.isArray(antwort.kurse)) return null;
    const norm = (x) => String(x == null ? "" : x).trim().toLowerCase();
    const ausPlanr = norm(kurs.planrKlasse);
    if (ausPlanr) return antwort.kurse.find((k) => norm(k.kurs) === ausPlanr) || null;
    const fach = norm(kurs.fach);
    const name = norm(kurs.name).replace(/^(mathe|mathematik|physik)\s+/, "");
    return antwort.kurse.find((k) => norm(k.klasse) === name && (!fach || norm(k.fach) === fach)) || null;
  }

  return { fuerStunde, kursStandVon };
})();

if (typeof module !== "undefined" && module.exports) module.exports = MerkrHausaufgaben;
