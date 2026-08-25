/**
 * Der Schultag, wie er wirklich liegt - aus planr.
 *
 * merkr rechnet seinen Wochenplan sonst aus Wochentag und A/B-Woche. Das stimmt
 * für die Regel und weiß nichts von dem Dienstag, an dem die 9d ausfällt und
 * dafür eine Vertretung in der 7b liegt. planr liest den Vertretungsplan der
 * Schule ohnehin und liefert mit der Stoffverteilung den fertig gerechneten Tag.
 *
 * Der Plan reicht nur so weit wie der Vertretungsplan der Schule - drei, vier
 * Tage. Für alles danach gilt weiter merkrs Raster, deshalb `gilt`: nur für die
 * genannten Tage darf der Tagesplan das Raster ersetzen. Ein Tag, über den er
 * nichts sagt, ist kein Tag ohne Unterricht.
 */
const MerkrTagesplan = (function () {

  /** Sagt der Plan über diesen Tag etwas? */
  function gilt(tp, iso) {
    return !!(tp && Array.isArray(tp.tage) && tp.tage.indexOf(iso) >= 0);
  }

  /**
   * Der Tag als Liste, in der Form, die merkrs Wochenplan erwartet.
   *
   * @param tp        was planr geliefert hat
   * @param iso       der Tag
   * @param zuordnen  (eintrag) => merkr-Kurs oder null; kommt von MerkrPlanr
   * @returns [{kurs, stunde, block, art, hinweis, raum, fremd, name}]
   *          `kurs` ist null, wo merkr die Lerngruppe nicht führt - eine
   *          Vertretung in einer fremden Klasse oder eine Aufsicht. Sie
   *          gehören auf den Vormittag, auch wenn nichts an ihnen hängt.
   */
  function amTag(tp, iso, zuordnen) {
    if (!gilt(tp, iso)) return [];
    const roh = (tp.tage_stunden && tp.tage_stunden[iso]) || [];
    const out = [];
    for (const e of roh) {
      if (!e) continue;
      const kennbar = !!e.kurs || e.classId != null;
      const kurs = (kennbar && zuordnen) ? zuordnen({ kurs: e.kurs, klasseId: e.classId }) : null;
      const stunden = Array.isArray(e.stunden) && e.stunden.length
        ? e.stunden
        : [Number(e.block) * 2 - 1, Number(e.block) * 2];
      out.push({
        kurs: kurs || null,
        stunde: Number(stunden[0]),
        stunden: stunden.map(Number),
        block: Number(e.block),
        art: String(e.art || "regulaer"),
        raum: e.raum || null,
        hinweis: e.hinweis || null,
        fremd: !kurs,
        name: kurs ? kurs.name : (e.kurs || e.klasse || (e.art === "aufsicht" ? "Aufsicht" : "Vertretung"))
      });
    }
    return out.sort(function (a, b) { return a.stunde - b.stunde; });
  }

  /**
   * Findet an diesem Tag Unterricht dieses Kurses statt?
   *
   * Ein Ausfall zählt nicht: an einer Stunde, die nicht war, hängt keine Notiz.
   * Er bleibt trotzdem in der Liste, damit der Wochenplan ihn durchgestrichen
   * zeigen kann - eine Kachel, die grundlos fehlt, sieht aus wie ein Fehler.
   */
  function hatUnterricht(liste, kursId) {
    return liste.some(function (e) {
      return e.kurs && e.kurs.id === kursId && e.art !== "ausfall";
    });
  }

  return { gilt: gilt, amTag: amTag, hatUnterricht: hatUnterricht };
})();

if (typeof module !== "undefined" && module.exports) module.exports = MerkrTagesplan;
