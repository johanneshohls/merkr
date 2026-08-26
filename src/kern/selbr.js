/**
 * selbr-Codes: der Schlüssel zwischen merkr und selbr.
 *
 * Anders als das Kürzel für checkr ist dieser Code kein Pseudonym, sondern die
 * vollständige Anmeldung - selbr kennt kein Passwort, wer den Code hat, ist im
 * Konto des Kindes. Deshalb ein eigenes Feld und nicht das Kürzel mitbenutzt:
 * das steht auf dem Deckblatt jeder Klassenarbeit und geht in checkrs Datenbank.
 *
 * Die Richtung ist dieselbe wie überall in merkr: Der Code darf hinaus, der Name
 * bleibt hier. planr fragt selbr nach dem Stand je Code; wer dahintersteckt,
 * löst erst dieses Gerät auf.
 */
const MerkrSelbr = (function () {

  /** Wie verglichen wird: ohne Rand, Großbuchstaben - die Codes kommen aus selbr so. */
  function normalisiert(x) {
    return String(x == null ? "" : x).trim().toUpperCase();
  }

  /** Namensschlüssel für den Abgleich: klein, ohne Mehrfach-Leerzeichen. */
  function namensschluessel(vorname, name) {
    return String(vorname + " " + name).toLowerCase().split(/\s+/).filter(Boolean).join(" ");
  }

  /**
   * Codes, die mehr als einem Kind zugeordnet sind.
   *
   * Zwei gleiche Codes heißen: zwei Kinder teilen ein Konto. Der eine sieht den
   * Lernstand des anderen, und die Hausaufgabe gilt für beide als erledigt,
   * sobald einer rechnet.
   */
  function doppelte(schueler) {
    const gesehen = Object.create(null);
    const raus = [];
    for (const s of schueler) {
      const c = normalisiert(s.selbrCode);
      if (!c) continue;
      if (gesehen[c] && raus.indexOf(c) < 0) raus.push(c);
      gesehen[c] = true;
    }
    return raus;
  }

  /**
   * Eine eingefügte Liste "Name<Trenner>Code" auf die Schüler des Kurses legen.
   *
   * Erlaubte Trenner sind Tabulator, Semikolon und das Pfeilzeichen - alles, was
   * beim Kopieren aus einer Tabelle oder einer Mail herauskommt. Der Name darf
   * "Nachname, Vorname" oder "Vorname Nachname" lauten.
   *
   * Zurück kommt, was zugeordnet wurde und was nicht - eine Liste, die still
   * die Hälfte verschluckt, ist schlimmer als eine Fehlermeldung.
   */
  function ausListe(schueler, text) {
    const treffer = [];
    const unbekannt = [];
    const zeilen = String(text || "").split(/\r?\n/);

    for (const roh of zeilen) {
      const zeile = roh.trim();
      if (!zeile) continue;
      const teile = zeile.split(/\t|;|→|->/).map((t) => t.trim()).filter(Boolean);
      if (teile.length < 2) { unbekannt.push(zeile); continue; }

      const code = normalisiert(teile[teile.length - 1]);
      const namensteil = teile.slice(0, -1).join(" ");
      // "Nachname, Vorname" umdrehen, damit beide Schreibweisen treffen.
      const gedreht = namensteil.indexOf(",") >= 0
        ? namensteil.split(",").map((t) => t.trim()).reverse().join(" ")
        : namensteil;
      const schluessel = namensschluessel("", gedreht);

      const gefunden = schueler.filter(
        (s) => namensschluessel(s.vorname, s.name) === schluessel
      );
      if (gefunden.length === 1) treffer.push({ id: gefunden[0].id, code });
      else unbekannt.push(zeile);
    }
    return { treffer, unbekannt };
  }

  return { normalisiert, namensschluessel, doppelte, ausListe };
})();

if (typeof module !== "undefined" && module.exports) module.exports = MerkrSelbr;
