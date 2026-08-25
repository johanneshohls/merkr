/**
 * Notenvorschlag für die Mitarbeit: ein Wert je Unterrichtsstunde.
 *
 * Das Modell folgt der Beschlussvorlage der Fachschaft Mathematik am EBG
 * ("Bewertung der mündlichen Mitarbeit", Tabelle Seite 2). Sie beschreibt jede
 * Note über die Häufigkeit der Äußerungen *pro Unterrichtsstunde*, dann über
 * ihre Richtigkeit, dann über die Menge bearbeiteter Aufgaben.
 *
 *     Note = BASIS  −  SPANNE_M · Stundenwert(mündlich)
 *                   −  SPANNE_S · Stundenwert(schriftlich)
 *
 * Der Stundenwert ist das zeitgewichtete Mittel über **alle** gehaltenen
 * Stunden, auch die ohne Notiz. Darin liegt der Unterschied zu einem Mittel
 * über die Notizen: eine einzelne Glanzleistung im Halbjahr ergibt einen
 * kleinen Stundenwert, zwanzig ergeben einen großen. Die Menge ist damit im
 * Nenner aufgehoben, statt sich herauszukürzen.
 *
 * Drei Eigenschaften, die aus dem Abgleich mit der Tabelle folgen:
 *
 * 1. **Die Skala reicht nach unten.** Ein Beitrag der Stufe "−−" ist −1 wert,
 *    eine Verweigerung ebenso. Ohne das endet jede Rechnung bei der Basis, und
 *    die Zeilen 5 und 6 der Tabelle wären unerreichbar.
 * 2. **Mehrere Beiträge in einer Stunde zählen mehrfach.** Die Tabelle trennt
 *    Note 1 und 2 über "besonders häufig" gegen "häufig pro Unterrichtsstunde" -
 *    ein Unterschied innerhalb einer Stunde, den ein blosser Anteil wegwirft.
 * 3. **Stören ist keine eigene Achse.** Wer stört, arbeitet nicht mit; das ist
 *    fehlende Leistung und keine Verhaltensnote. Es zählt deshalb als negativer
 *    Beitrag derselben Stunde und nicht als Abzug daneben.
 *
 * Reine Funktionen ohne DOM und ohne Zustand, prüfbar in `node --test`.
 * bau.mjs setzt die Datei beim Bauen in die Oberfläche ein.
 */
const MerkrMitarbeit = (function () {
  const TAG_MS = 24 * 60 * 60 * 1000;

  const MUENDLICH   = ["qual_m", "quant_m"];
  const SCHRIFTLICH = ["qual_s", "quant_s"];
  /** Zählt als mündliche Verweigerung: in dieser Stunde keine Leistung. */
  const VERWEIGERT  = ["stoerung", "keine_antwort"];
  /** Zählt als fehlende praktische Leistung - die Tabelle führt sie unter
      "Menge an bearbeiteten Aufgaben", nicht als Abzug. */
  const UNERLEDIGT  = ["ha_vergessen", "material"];

  const VORGABE = {
    /** Stundenwert 0 ergibt diese Note: die Stunde lief ohne Auffälligkeit. */
    basis: 3.5,
    /** Notenschritte je Punkt Stundenwert, mündlich.
        Nach unten steiler als nach oben, weil die Notenskala es auch ist: von
        der Drei bis zur Eins sind es zwei Stufen, bis zur Sechs drei. Mit einem
        symmetrischen Faktor bliebe entweder die Fünf unerreichbar oder die
        regelmässige Beteiligung käme zu gut weg - beides an der Tabelle geprüft. */
    muendlich: 1.25,
    muendlichAb: 1.75,
    /** Schriftliches wiegt halb. Es ergänzt die mündliche Note, ersetzt sie nicht. */
    schriftlich: 0.625,
    schriftlichAb: 0.875,
    /** Die Note einer einzelnen Stunde ohne jede Notiz.
        Drei, nicht 3,5: die Stunde lief "den Anforderungen im Allgemeinen
        entsprechend", und das ist die MV-Formulierung für befriedigend. Die
        3,5 oben gilt fürs gemittelte Modell, wo sie die Kante zwischen 3 und 4
        markiert - hier wird eine einzelne Stunde benotet, keine Bilanz. */
    stundenBasis: 3,
    /** Wieviel Beitragswert eine Stunde trägt, bevor sie über die Drei steigt.

        Der Kern der Korrektur vom 25.08.2026: vorher hob **jeder** Beitrag
        sofort, ein einziges "+" ergab die Eins. Gemessen an den 71 bestätigten
        Stundennoten dieses Tages hat die Lehrkraft das in 15 Fällen von Hand
        heruntergesetzt - ein guter Beitrag war ihr eine Drei, zwei eine Zwei.

        Drei Punkte frei heisst: ein sehr guter Beitrag (Wert 3) oder ein
        normaler plus ein guter ist die gewöhnliche Stunde. Erst was darüber
        hinausgeht, hebt - und dann steil, weil "besonders häufig" in der
        Beschlussvorlage genau der Sprung von der Zwei zur Eins ist. */
    stundeFrei: 3,
    stundeFreiS: 3,
    /** Und wieviel sie trägt, bevor sie unter die Drei fällt.

        Eine Frage nicht beantworten zu können ist noch keine Verweigerung: der
        einzige negative Fall in den Daten (`keine_antwort`) stand als Fünf im
        Vorschlag und wurde auf Drei korrigiert. Eine Störung wiegt zwei und
        schlägt deshalb sofort durch - sie ist keine misslungene Antwort,
        sondern eine, die gar nicht erst versucht wurde. */
    stundeFreiAb: 1,
    /** Notenschritte je Punkt über dem Freibetrag - für die Einzelstunde. */
    stundeHebt: 0.9,
    stundeHebtS: 0.45,
    stundeZieht: 1.0,
    stundeZiehtS: 0.5,
    /** Wertspanne, mit der eine Stunde in die Halbjahresachse eingeht. Eine
        einzelne Glanzstunde soll die Bilanz nicht kippen - deshalb hier die
        engere Kappung, während die Note derselben Stunde weiter zählt
        (stundeKappeMax). */
    stundeMax: 4,
    stundeMin: -2,
    /** Und die Spanne für die Note der Einzelstunde selbst. Sie liegt weiter,
        weil dort der Freibetrag die ersten drei Punkte ohnehin schluckt: mit
        der alten Kappung bei 4 stünden über dem Freibetrag nur noch 1 Punkt,
        und die Eins wäre unerreichbar. */
    stundeKappeMax: 9,
    stundeKappeMin: -4,
    halbwertszeitWochen: 8
  };

  /**
   * Was ein einzelner Eintrag zur Stunde beiträgt.
   *
   * Eine Notiz der Stufe s ist 1 + s wert: "o" ist ein Beitrag, "+" wiegt zwei,
   * "−−" zieht. Eine Verweigerung ist −1 - so viel, wie ein normaler Beitrag
   * einbringt, mit umgekehrtem Vorzeichen.
   */
  function beitragswert(e) {
    if (VERWEIGERT.indexOf(e.typ) >= 0 || UNERLEDIGT.indexOf(e.typ) >= 0) return -1;
    return 1 + (e.stufe == null ? 0 : Number(e.stufe));
  }

  function alsDatum(x) { return x instanceof Date ? x : new Date(x); }
  function begrenzen(x, min, max) { return Math.max(min, Math.min(max, x)); }
  function alterTage(ts, jetzt) { return (alsDatum(jetzt) - alsDatum(ts)) / TAG_MS; }

  /** Exponentielles Gewicht nach Alter. Älteres wird leiser, ohne zu verschwinden. */
  function zeitgewicht(tage, halbwertszeitWochen) {
    if (!(tage > 0)) return 1;
    return Math.pow(0.5, tage / ((halbwertszeitWochen || VORGABE.halbwertszeitWochen) * 7));
  }

  /** Die Stunden des Zeitraums, ohne Ausfall und ohne noch nicht Gehaltenes. */
  function zaehlendeStunden(stunden, o) {
    return (stunden || []).filter(function (st) {
      if (!st || st.ausfall) return false;
      if (o.ab && st.datum < o.ab) return false;
      if (o.bis && st.datum > o.bis) return false;
      return true;
    });
  }

  /**
   * Mittlerer Stundenwert einer Achse.
   *
   * Zähler und Nenner tragen dasselbe Zeitgewicht: eine Stunde aus dem September
   * zählt oben so wenig wie unten. Sonst wäre die Menge ein Jahresdurchschnitt,
   * während die Qualität schon aufs Halbjahresende schaut.
   */
  function achse(stunden, ereignisse, typen, o) {
    const passt = new Set(typen);
    const jeStunde = new Map();
    let anzahl = 0, summeRoh = 0;

    for (const e of ereignisse || []) {
      if (!e || !passt.has(e.typ)) continue;
      const tag = String(e.ts || "").slice(0, 10);
      if (o.ab && tag < o.ab) continue;
      if (o.bis && tag > o.bis) continue;
      const w = beitragswert(e);
      jeStunde.set(e.stundeId, (jeStunde.get(e.stundeId) || 0) + w);
      summeRoh += w;
      anzahl++;
    }

    const sts = zaehlendeStunden(stunden, o);
    let summe = 0, gewichtSumme = 0, mitNotiz = 0;
    for (const st of sts) {
      const g = zeitgewicht(alterTage(st.datum, o.jetzt), o.halbwertszeitWochen);
      const roh = jeStunde.get(st.id) || 0;
      if (jeStunde.has(st.id)) mitNotiz++;
      summe += begrenzen(roh, o.stundeMin, o.stundeMax) * g;
      gewichtSumme += g;
    }

    return {
      wert: gewichtSumme > 0 ? summe / gewichtSumme : 0,
      anzahl: anzahl,
      jeStunde: sts.length ? anzahl / sts.length : 0,
      stundenMitNotiz: mitNotiz,
      stunden: sts.length,
      /** Mittlere Stufe der gestuften Notizen - nur zur Anzeige, nicht in der Rechnung. */
      mittel: anzahl ? summeRoh / anzahl - 1 : 0
    };
  }

  /**
   * Runden zugunsten des Schülers: bei Noten ist kleiner besser, bei Punkten
   * größer. Eine glatte 3,5 wird zur 3, 7,5 Punkte werden 8. Die Basis liegt
   * bewusst auf so einer Kante.
   */
  function runden(wert, typ) {
    if (typ === "punkte") return Math.floor(wert + 0.5);
    return Math.ceil(wert - 0.5);
  }

  /** Note in die Punkteskala. Trifft die Spannen der Beschlussvorlage:
      1 → 14 (13-15), 2 → 11 (10-12), 3 → 8 (7-9), 4 → 5 (4-6), 5 → 2 (1-3), 6 → 0. */
  function alsPunkte(note) { return begrenzen(17 - 3 * note, 0, 15); }

  /**
   * Was ein Eintrag zur **Einzelstunde** beiträgt.
   *
   * Unterschied zur Halbjahresachse: eine Störung wiegt hier zwei. Sie ist
   * keine misslungene Antwort, sondern eine, die gar nicht erst versucht wurde,
   * und muss den Freibetrag nach unten (stundeFreiAb) allein überschreiten
   * können - sonst bliebe die gestörte Stunde eine Drei. In der Bilanz übers
   * Halbjahr bleibt sie eine Verweigerung unter anderen, dort mittelt sich das
   * ohnehin.
   */
  function stundenbeitrag(e) {
    if (e.typ === "stoerung") return -2;
    return beitragswert(e);
  }

  /**
   * @param stunden     [{id, datum, ausfall}] - Stunden des Kurses
   * @param ereignisse  [{ts, typ, stufe, stundeId}] - Notizen dieses Schülers
   * @param opt         {jetzt, ab, bis, typ, ...VORGABE}
   * @returns {wert, genau, note, basis, muendlich, schriftlich, achsen, stunden}
   */
  function vorschlag(stunden, ereignisse, opt) {
    const o = Object.assign({}, VORGABE, opt || {});
    if (!o.jetzt) o.jetzt = new Date();

    const m = achse(stunden, ereignisse, MUENDLICH.concat(VERWEIGERT), o);
    const s = achse(stunden, ereignisse, SCHRIFTLICH.concat(UNERLEDIGT), o);

    const teilM = (m.wert < 0 ? o.muendlichAb : o.muendlich) * m.wert;
    const teilS = (s.wert < 0 ? o.schriftlichAb : o.schriftlich) * s.wert;
    const roh = o.basis - teilM - teilS;
    const note = begrenzen(roh, 1, 6);
    const genau = o.typ === "punkte" ? alsPunkte(note) : note;

    return {
      wert: runden(genau, o.typ),
      genau: Math.round(genau * 10) / 10,
      note: Math.round(note * 10) / 10,
      basis: o.basis,
      muendlich: Math.round(teilM * 100) / 100,
      schriftlich: Math.round(teilS * 100) / 100,
      gedeckelt: roh < 1 || roh > 6,
      achsen: { m: m, s: s },
      anzahl: m.anzahl + s.anzahl,
      stunden: m.stunden
    };
  }

  /**
   * Der Notenverlauf über das Schuljahr: was der Vorschlag nach jeder Stunde
   * gewesen wäre.
   *
   * Rückwirkend gerechnet, indem `bis` auf jede Stunde gesetzt wird - dieselbe
   * Funktion, kein zweiter Rechenweg. Das ist wichtiger, als es klingt: eine
   * eigene Formel für die Kurve wäre irgendwann eine andere Aussage als die
   * Zahl darüber.
   *
   * Die Halbjahresgrenze wandert mit. Wer im zweiten Halbjahr steht, sieht die
   * Kurve dort neu ansetzen - das ist keine Lücke, sondern die Regel: in die
   * Halbjahresnote gehört nur, was im Halbjahr passiert ist.
   *
   * @param opt zusätzlich {halbjahrAb: (isoDatum) => isoDatum|null}
   * @returns [{datum, note, wert, wertM, wertS, beitrag, halbjahr}]
   */
  function verlauf(stunden, ereignisse, opt) {
    const o = Object.assign({}, VORGABE, opt || {});
    if (!o.jetzt) o.jetzt = new Date();
    const grenze = o.halbjahrAb || function () { return o.ab || null; };

    const sts = (stunden || []).filter(function (st) {
      if (!st || st.ausfall) return false;
      if (o.bis && st.datum > o.bis) return false;
      return true;
    }).slice().sort(function (a, b) { return String(a.datum).localeCompare(String(b.datum)); });

    /* Was an genau dieser Stunde notiert wurde - der Punkt auf der Kurve, im
       Unterschied zum Stand, den sie beschreibt. */
    const proStunde = new Map();
    for (const e of ereignisse || []) {
      if (!e) continue;
      const istM = MUENDLICH.indexOf(e.typ) >= 0 || VERWEIGERT.indexOf(e.typ) >= 0;
      const istS = SCHRIFTLICH.indexOf(e.typ) >= 0 || UNERLEDIGT.indexOf(e.typ) >= 0;
      if (!istM && !istS) continue;
      const k = proStunde.get(e.stundeId) || { m: 0, s: 0, n: 0 };
      if (istM) k.m += beitragswert(e); else k.s += beitragswert(e);
      k.n++;
      proStunde.set(e.stundeId, k);
    }

    return sts.map(function (st) {
      const r = vorschlag(stunden, ereignisse, Object.assign({}, o, {
        ab: grenze(st.datum),
        bis: st.datum,
        /* Von diesem Tag aus gesehen ist die Stunde von damals frisch. Sonst
           bekäme jeder Punkt der Kurve das Gewicht von heute, und der
           September-Stand sähe aus wie ein September-Rest im Juni. */
        jetzt: new Date(st.datum + "T12:00:00Z")
      }));
      const k = proStunde.get(st.id);
      return {
        datum: st.datum,
        note: r.note,
        wert: r.wert,
        wertM: Math.round(r.achsen.m.wert * 100) / 100,
        wertS: Math.round(r.achsen.s.wert * 100) / 100,
        beitrag: k ? begrenzen(k.m, o.stundeMin, o.stundeMax) + begrenzen(k.s, o.stundeMin, o.stundeMax) : 0,
        notizen: k ? k.n : 0,
        halbjahr: grenze(st.datum)
      };
    });
  }

  /**
   * Die Note dieser einen Stunde, aus dem, was in ihr notiert wurde.
   *
   * Derselbe Rechenweg wie `vorschlag`, nur ohne Mittelung: der Stundenwert ist
   * hier die Stunde selbst. Wer sich einmal gut beteiligt, steht in dieser
   * Stunde bei einer Eins - über zwanzig Stunden gemittelt ergibt das wieder
   * das Bild, das `vorschlag` zeichnet. Zwei Wege, dieselbe Aussage.
   *
   * Ohne Notiz kommt `stundenBasis` heraus. Das ist der Regelfall und keine
   * Verlegenheit: die meisten Kinder sind in den meisten Stunden da und
   * unauffällig, und genau dafür steht die Drei.
   *
   * @param notizen [{typ, stufe}] - nur die dieser Stunde und dieses Schülers
   * @param opt     {typ, ...VORGABE}
   */
  function stundennote(notizen, opt) {
    const o = Object.assign({}, VORGABE, opt || {});
    let m = 0, s = 0, n = 0;

    for (const e of notizen || []) {
      if (!e) continue;
      const istM = MUENDLICH.indexOf(e.typ) >= 0 || VERWEIGERT.indexOf(e.typ) >= 0;
      const istS = SCHRIFTLICH.indexOf(e.typ) >= 0 || UNERLEDIGT.indexOf(e.typ) >= 0;
      if (!istM && !istS) continue;
      if (istM) m += stundenbeitrag(e); else s += stundenbeitrag(e);
      n++;
    }

    m = begrenzen(m, o.stundeKappeMin, o.stundeKappeMax);
    s = begrenzen(s, o.stundeKappeMin, o.stundeKappeMax);
    /* Freibetrag statt gerader Linie: die ersten Punkte sind die gewöhnliche
       Stunde und bewegen nichts, erst was darüber hinausgeht, hebt oder zieht.
       Eine gerade Linie durch den Nullpunkt machte aus jedem einzelnen Beitrag
       eine Eins - siehe stundeFrei. */
    const hebt = Math.max(0, m - o.stundeFrei) * o.stundeHebt
               + Math.max(0, s - o.stundeFreiS) * o.stundeHebtS;
    const zieht = Math.max(0, -m - o.stundeFreiAb) * o.stundeZieht
                + Math.max(0, -s - o.stundeFreiAb) * o.stundeZiehtS;
    const roh = o.stundenBasis - hebt + zieht;
    const note = begrenzen(roh, 1, 6);
    const genau = o.typ === "punkte" ? alsPunkte(note) : note;

    return {
      wert: runden(genau, o.typ),
      note: Math.round(note * 10) / 10,
      notizen: n,
      muendlich: m,
      schriftlich: s,
      ohneNotiz: n === 0
    };
  }

  /**
   * Die Halbjahresnote aus den bestätigten Stundennoten.
   *
   * Ein schlichtes Mittel, mit Absicht: diese Zahl muss im Elterngespräch in
   * einem Satz erklärbar sein ("die achtzehn Stundennoten, geteilt durch
   * achtzehn"). Die Zeitgewichtung aus `vorschlag` wäre hier fehl am Platz -
   * eine bestätigte Note ist eine Entscheidung, kein Messwert, der altert.
   *
   * @param werte [Zahl] - die bestätigten Stundennoten des Halbjahres
   */
  function halbjahresnote(werte, typ) {
    const zahlen = (werte || []).map(Number).filter(function (x) { return isFinite(x); });
    if (!zahlen.length) return { wert: null, mittel: null, anzahl: 0 };
    const mittel = zahlen.reduce(function (a, b) { return a + b; }, 0) / zahlen.length;
    return {
      wert: runden(mittel, typ),
      mittel: Math.round(mittel * 100) / 100,
      anzahl: zahlen.length
    };
  }

  return {
    VORGABE: VORGABE,
    stundennote: stundennote,
    halbjahresnote: halbjahresnote,
    verlauf: verlauf,
    MUENDLICH: MUENDLICH,
    SCHRIFTLICH: SCHRIFTLICH,
    VERWEIGERT: VERWEIGERT,
    UNERLEDIGT: UNERLEDIGT,
    beitragswert: beitragswert,
    stundenbeitrag: stundenbeitrag,
    zeitgewicht: zeitgewicht,
    achse: achse,
    runden: runden,
    alsPunkte: alsPunkte,
    vorschlag: vorschlag
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = MerkrMitarbeit;
