/**
 * Ergebnisse einer Arbeit aus checkr übernehmen.
 *
 * checkr liefert je Schüler den Code vom Deckblatt und die Punkte. Die
 * Auflösung Code zu Mensch passiert hier - checkr kennt keine Namen.
 *
 * Zwei Regeln stecken darin, beide aus dem gleichen Grund: eine Arbeit, deren
 * Punkte beim falschen Kind landen, merkt man erst im Elterngespräch.
 *   1. Nicht raten. Ein Code ohne passenden Schüler wird gemeldet, nicht verteilt.
 *   2. Nichts überschreiben. Was schon eingetragen ist, bleibt stehen.
 */
const MerkrErgebnisse = (function () {

  /**
   * Notenschlüssel Sek I M-V. Die Prozentgrenzen sind vorgegeben, nicht
   * verhandelbar - dieselben, die auch planr fürs Korrekturformular führt.
   */
  const SCHLUESSEL = [
    { note: 1, abProzent: 96 },
    { note: 2, abProzent: 80 },
    { note: 3, abProzent: 60 },
    { note: 4, abProzent: 40 },
    { note: 5, abProzent: 20 },
    { note: 6, abProzent: 0 },
  ];

  function norm(x) {
    return String(x == null ? "" : x).trim().toLowerCase();
  }

  function noteAusProzent(prozent) {
    const p = Number(prozent);
    if (!isFinite(p)) return null;
    for (const stufe of SCHLUESSEL) if (p >= stufe.abProzent) return stufe.note;
    return 6;
  }

  /**
   * Punkte der Oberstufe aus dem Prozentsatz.
   *
   * Anders als der Notenschlüssel ist diese Staffel NICHT amtlich vorgegeben -
   * sie bildet nur die übliche Zuordnung ab (15 Punkte ab 95 %, 5 Punkte an der
   * Vier-Grenze). Wer sie anders braucht, ändert sie hier an einer Stelle.
   */
  function punkteAusProzent(prozent) {
    const p = Number(prozent);
    if (!isFinite(p)) return null;
    const staffel = [95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 33, 27, 20];
    for (let i = 0; i < staffel.length; i++) if (p >= staffel[i]) return 15 - i;
    return 0;
  }

  function wertAusProzent(prozent, typ) {
    return typ === "punkte" ? punkteAusProzent(prozent) : noteAusProzent(prozent);
  }

  /**
   * Die Zeilen aus checkr den Schülern zuordnen.
   *
   * Gesucht wird unter dem Kürzel und, wo keines steht, unter dem selbr-Code:
   * die Deckblätter des Terme-Tests 8d trugen die selbr-Codes, und zwei
   * Codespalten für dasselbe Kind zu pflegen ist eine Fehlerquelle ohne Gewinn.
   * Das Kürzel gewinnt, wo es gesetzt ist. Ein selbr-Code, den zwei Kinder
   * teilen, ordnet nichts zu - lieber eine Meldung als die Punkte beim
   * falschen Kind.
   *
   * @param schueler [{id, name, vorname, kuerzel, selbrCode}]
   * @param zeilen [{code, erreicht, maximal, prozent}]
   * @param typ "noten" | "punkte"
   * @returns {treffer, ohneSchueler, ohneArbeit, doppelt}
   *   treffer      - was eingetragen werden kann
   *   ohneSchueler - Codes aus checkr, zu denen hier niemand passt
   *   ohneArbeit   - Schüler ohne Zeile in checkr (nicht mitgeschrieben)
   *   doppelt      - Codes, die checkr mehrfach liefert
   */
  function zuordnen(schueler, zeilen, typ) {
    const nachKuerzel = new Map();
    const nachSelbr = new Map();
    for (const s of schueler || []) {
      const k = norm(s.kuerzel);
      if (k) nachKuerzel.set(k, s);
    }
    // Der Rückfall auf den selbr-Code, nachrangig: ein Kürzel, das jemand von
    // Hand gesetzt hat, darf davon nicht verdrängt werden.
    const mehrdeutig = new Set();
    for (const s of schueler || []) {
      const c = norm(s.selbrCode);
      if (!c || nachKuerzel.has(c)) continue;
      if (nachSelbr.has(c)) { mehrdeutig.add(c); continue; }
      nachSelbr.set(c, s);
    }

    const treffer = [];
    const ohneSchueler = [];
    const doppelt = [];
    const gesehen = new Set();
    const getroffen = new Set();

    for (const z of zeilen || []) {
      const code = String(z && z.code != null ? z.code : "").trim();
      const key = norm(code);
      if (!key) continue;
      if (gesehen.has(key)) { doppelt.push(code); continue; }
      gesehen.add(key);

      const s = nachKuerzel.get(key) || (mehrdeutig.has(key) ? null : nachSelbr.get(key));
      if (!s) { ohneSchueler.push(code); continue; }

      // Wer nicht mitgeschrieben hat, steht in checkr bei 0 von 0. Daraus eine
      // Sechs zu machen wäre eine Note für nichts.
      if (!(Number(z.maximal) > 0)) continue;

      getroffen.add(s.id);
      treffer.push({
        schuelerId: s.id,
        code: code,
        erreicht: Number(z.erreicht) || 0,
        maximal: Number(z.maximal) || 0,
        prozent: Number(z.prozent) || 0,
        wert: wertAusProzent(z.prozent, typ),
      });
    }

    const ohneArbeit = (schueler || [])
      .filter((s) => !getroffen.has(s.id))
      .map((s) => (s.name ? s.name + ", " + s.vorname : s.vorname) || String(s.id));

    return { treffer, ohneSchueler, ohneArbeit, doppelt };
  }

  /**
   * Treffer in die Ergebnisse einer Arbeit schreiben, ohne Vorhandenes zu
   * überschreiben. Von Hand nachgetragene Werte gewinnen gegen den Abruf - wer
   * etwas eingetragen hat, hatte einen Grund.
   */
  function zusammenfuehren(vorhanden, treffer) {
    const ergebnisse = Object.assign({}, vorhanden || {});
    let neu = 0, behalten = 0;
    for (const t of treffer || []) {
      const alt = ergebnisse[t.schuelerId];
      if (alt !== undefined && alt !== null && alt !== "") { behalten++; continue; }
      ergebnisse[t.schuelerId] = t.wert;
      neu++;
    }
    return { ergebnisse, neu, behalten };
  }

  /**
   * Welcher Kurs zu einem Bericht aus checkr gehört.
   *
   * checkr nennt Klasse und Fach ("8d", "Mathematik") - dieselben Angaben, die
   * auch aus planr kommen. Die Klasse allein reicht nicht: in der 9a wird Mathe
   * und Physik unterrichtet, und eine Mathearbeit in der Physiknote ist kein
   * Fehler, den man später noch sieht. Bleibt es mehrdeutig, kommt null zurück
   * und der Abruf legt nichts an.
   */
  function kursFuerBericht(kurse, bericht, schuljahrId) {
    const klasse = norm(bericht && bericht.klasse);
    const fach = norm(bericht && bericht.fach);
    if (!klasse) return null;

    const passt = (kurse || []).filter((k) => {
      if (schuljahrId != null && k.schuljahrId !== schuljahrId) return false;
      return norm(k.planrName) === klasse || norm(k.name) === klasse;
    });
    if (passt.length === 1) return passt[0];
    if (!fach) return null;

    const mitFach = passt.filter(
      (k) => norm(k.fach) === fach || norm(k.planrFach) === fach
    );
    return mitFach.length === 1 ? mitFach[0] : null;
  }

  return {
    SCHLUESSEL: SCHLUESSEL,
    kursFuerBericht: kursFuerBericht,
    noteAusProzent: noteAusProzent,
    punkteAusProzent: punkteAusProzent,
    wertAusProzent: wertAusProzent,
    zuordnen: zuordnen,
    zusammenfuehren: zusammenfuehren,
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = MerkrErgebnisse;
