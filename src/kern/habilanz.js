/**
 * Die Bilanz: wer hatte seine Hausaufgaben fertig, als sie fällig waren?
 *
 * planr rechnet den Stand bei jedem Abruf neu - wer die Aufgabe vom September im
 * Oktober nachholt, steht dort dann als fertig. Für den Stundendialog ist das
 * richtig; für die Frage "wer macht regelmäßig seine Hausaufgaben" wäre es
 * falsch. Dort zählt, ob es zum Termin fertig war.
 *
 * Deshalb wird der Stand am Fälligkeitstag einmal festgehalten und danach nie
 * mehr angefasst. Die Bilanz liegt in merkr, nicht in planr: sie gehört zu den
 * Namen, und planr soll keine bekommen.
 *
 * Nachgeholtes ist damit nicht verloren - es steht weiter im Stundendialog, wo
 * der aktuelle Stand gezeigt wird. Nur die Spalte bleibt stehen.
 */
const MerkrHaBilanz = (function () {

  const norm = (x) => String(x == null ? "" : x).trim().toUpperCase();

  /**
   * Fällige Aufgaben festschreiben, die noch keinen Eintrag haben.
   *
   * `bilanz` ist der bisherige Bestand (Objekt nach quelleRef), `kursStand` ein
   * Eintrag aus planrs Antwort. Zurück kommen nur die neuen Einträge - der
   * Aufrufer mischt sie ein und speichert.
   *
   * Nicht überschrieben wird, was schon dasteht: ein zweiter Abruf am selben Tag
   * darf die Zahl vom Stundenbeginn nicht durch die vom Nachmittag ersetzen.
   */
  function festschreiben(bilanz, kursStand, schueler, heute) {
    if (!kursStand || !Array.isArray(kursStand.hausaufgaben)) return {};
    const nachCode = Object.create(null);
    for (const s of schueler) {
      const c = norm(s.selbrCode);
      if (c) nachCode[c] = s.id;
    }
    const neu = {};
    for (const h of kursStand.hausaufgaben) {
      const ref = String(h.quelleRef || "");
      if (!ref) continue;
      if (String(h.faelligAm) > String(heute)) continue;   // noch nicht fällig
      if (bilanz && bilanz[ref]) continue;                  // schon festgehalten

      const stand = {};
      for (const e of h.schueler || []) {
        const id = nachCode[norm(e.code)];
        if (id) stand[id] = Number(e.geschafft) || 0;
      }
      neu[ref] = {
        titel: String(h.titel || ""),
        ziel: Number(h.zielAufgaben) || 0,
        faelligAm: String(h.faelligAm),
        festAm: String(heute),
        stand: stand,
      };
    }
    return neu;
  }

  /**
   * Die Bilanz eines Kurses als Tabelle: Schüler in den Zeilen, Aufgaben in den
   * Spalten, dazu je Kind die Quote.
   *
   * Gezählt wird nur, was das Kind auch bekommen konnte: Aufgaben, die vor
   * seinem ersten Eintrag liegen, kommen in der Quote nicht vor. Sonst stünde
   * ein Kind, das im November dazukam, mit lauter Fehlstellen da.
   */
  /**
   * Was gerade läuft, als Spalte im selben Format wie eine festgehaltene.
   *
   * Aufgaben, deren Termin noch bevorsteht - der Zwischenstand. Er ändert sich
   * mit jedem Abruf und wird bewusst nicht in die Quote gezählt: solange die
   * Aufgabe läuft, ist "noch nicht fertig" keine Aussage über das Kind.
   */
  function laufende(kursStand, heute) {
    if (!kursStand || !Array.isArray(kursStand.hausaufgaben)) return [];
    return kursStand.hausaufgaben
      .filter((h) => String(h.faelligAm) > String(heute))
      .map((h) => ({
        ref: "laufend:" + String(h.quelleRef || ""),
        titel: String(h.titel || ""),
        ziel: Number(h.zielAufgaben) || 0,
        faelligAm: String(h.faelligAm),
        laeuft: true,
        stand: null,
        codeStand: h.schueler || [],
      }))
      .sort((a, b) => String(a.faelligAm).localeCompare(String(b.faelligAm)));
  }

  /**
   * `laufend` sind die Spalten aus `laufende()`; sie stehen rechts und zaehlen
   * in der Quote nicht mit. Ohne sie verhaelt sich alles wie vorher.
   */
  function tabelle(bilanz, schueler, laufend) {
    const codeVon = Object.create(null);
    for (const s of schueler) {
      const c = norm(s.selbrCode);
      if (c) codeVon[s.id] = c;
    }
    const spalten = Object.keys(bilanz || {})
      .map((ref) => Object.assign({ ref: ref }, bilanz[ref]))
      .sort((a, b) => String(a.faelligAm).localeCompare(String(b.faelligAm)))
      .concat(laufend || []);

    const zeilen = schueler.slice()
      .sort((a, b) => ((a.name || "") + " " + (a.vorname || ""))
        .localeCompare((b.name || "") + " " + (b.vorname || ""), "de"))
      .map((s) => {
        const felder = spalten.map((sp) => {
          let wert;
          if (sp.laeuft) {
            const code = codeVon[s.id];
            const treffer = code && (sp.codeStand || []).find((e) => norm(e.code) === code);
            wert = treffer ? Number(treffer.geschafft) || 0 : undefined;
          } else {
            wert = sp.stand ? sp.stand[s.id] : undefined;
          }
          if (wert === undefined) return { zustand: "unbekannt", geschafft: null, ziel: sp.ziel, laeuft: !!sp.laeuft };
          const fertig = sp.ziel > 0 && wert >= sp.ziel;
          return {
            zustand: fertig ? "fertig" : wert > 0 ? "teils" : "nichts",
            geschafft: wert,
            ziel: sp.ziel,
            laeuft: !!sp.laeuft,
          };
        });
        // Laufendes zaehlt nicht: "noch nicht fertig" ist vor dem Termin keine
        // Aussage ueber das Kind.
        const gezaehlt = felder.filter((f) => f.zustand !== "unbekannt" && !f.laeuft);
        const fertig = gezaehlt.filter((f) => f.zustand === "fertig").length;
        return {
          id: s.id, name: s.name, vorname: s.vorname,
          felder: felder,
          fertig: fertig,
          von: gezaehlt.length,
          quote: gezaehlt.length ? Math.round((fertig / gezaehlt.length) * 100) : null,
        };
      });

    return { spalten: spalten, zeilen: zeilen };
  }

  return { festschreiben, tabelle, laufende };
})();

if (typeof module !== "undefined" && module.exports) module.exports = MerkrHaBilanz;
