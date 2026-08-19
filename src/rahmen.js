// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: magic;
// merkr – Klassenbuch für Scriptable (alles in einer Datei)
// Die Oberfläche ist eingebettet; erzeugt aus src/ über bau.mjs, nicht von Hand ändern.
//
// Daten: iCloud Drive → Scriptable → MerkrDaten. Vorher lagen sie nur auf dem
// Gerät - ein Notenbuch, das ein Schuljahr trägt, darf nicht mit dem iPad
// verschwinden. Ist iCloud nicht erreichbar, läuft merkr lokal weiter und sagt
// es beim Start; ein stiller Wechsel der Ablage wäre schlimmer als gar keiner.

const fmLokal = FileManager.local();
const ORDNER_NAME = "MerkrDaten";
const DATEI_NAME = "merkr-daten.json";

// Altbestand aus der Kursbuch-Zeit, nur zum einmaligen Übernehmen.
const ALT_ORDNER = fmLokal.joinPath(fmLokal.documentsDirectory(), "KursbuchDaten");
const ALT_DATEI = fmLokal.joinPath(ALT_ORDNER, "kursbuch-daten.json");

// Eine Sicherung je Kalendertag, 60 Tage Vorhalt. Vorher waren es zehn Dateien
// rollierend, angelegt bei jedem Start - bei vier Starts am Tag reichte die
// älteste bis vorgestern, ein Fehler vom Freitag war am Montag nicht mehr
// rückholbar.
const VORHALT_TAGE = 60;

/**
 * Wo die Daten liegen. iCloud, wenn erreichbar und beschreibbar - die
 * Schreibprobe ist nötig, weil FileManager.iCloud() auch dann ein Objekt
 * liefert, wenn iCloud Drive für Scriptable ausgeschaltet ist.
 */
function ablageWaehlen() {
  let fmC;
  try {
    fmC = FileManager.iCloud();
  } catch (e) {
    return { fm: fmLokal, icloud: false, hinweis: "iCloud steht nicht zur Verfügung: " + e };
  }
  try {
    const ordner = fmC.joinPath(fmC.documentsDirectory(), ORDNER_NAME);
    if (!fmC.fileExists(ordner)) fmC.createDirectory(ordner, true);
    const probe = fmC.joinPath(ordner, ".schreibprobe");
    fmC.writeString(probe, "ok");
    fmC.remove(probe);
    return { fm: fmC, icloud: true, hinweis: "" };
  } catch (e) {
    return { fm: fmLokal, icloud: false, hinweis: "iCloud nicht beschreibbar: " + e };
  }
}

const ablage = ablageWaehlen();
const fm = ablage.fm;
const DATEN_ORDNER = fm.joinPath(fm.documentsDirectory(), ORDNER_NAME);
const SICHERUNGS_ORDNER = fm.joinPath(DATEN_ORDNER, "Sicherungen");
const DATEN_DATEI = fm.joinPath(DATEN_ORDNER, DATEI_NAME);

/**
 * Eine Datei wirklich lesbar machen. In iCloud kann sie als Platzhalter
 * vorliegen; readString gäbe dann leeren Text zurück, und der Startlauf hielte
 * das für "keine Daten".
 */
/**
 * Eine über den DocumentPicker gewählte Datei lesen. Sie kann in iCloud liegen
 * und dort nur als Platzhalter - vorher las das Skript mit FileManager.local()
 * und bekam in dem Fall leeren Text, ohne dass ein Fehler sichtbar wurde.
 */
async function gewaehlteLesen(pfad) {
  try {
    const fmC = FileManager.iCloud();
    if (fmC.fileExists(pfad) && !fmC.isFileDownloaded(pfad)) await fmC.downloadFileFromiCloud(pfad);
    return fmC.readString(pfad);
  } catch (e) {
    return fmLokal.readString(pfad);
  }
}

async function bereitstellen(dateiVerwalter, pfad) {
  if (!dateiVerwalter.fileExists(pfad)) return false;
  try {
    if (!dateiVerwalter.isFileDownloaded(pfad)) await dateiVerwalter.downloadFileFromiCloud(pfad);
  } catch (e) {
    console.error("Nicht aus iCloud geladen: " + pfad + " (" + e + ")");
  }
  return true;
}

const KURSBUCH_HTML = "__OBERFLAECHE__";

function zeitstempel() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}
function tagesStempel() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
}
/**
 * Sicherung des Tages. Die erste des Tages gewinnt: sie hält damit den Stand
 * vom Vorabend, und ein Fehler, der heute passiert, überschreibt ihn nicht.
 */
function sicherungAnlegen() {
  if (!fm.fileExists(DATEN_DATEI)) return;
  if (!fm.fileExists(SICHERUNGS_ORDNER)) fm.createDirectory(SICHERUNGS_ORDNER, true);
  const ziel = fm.joinPath(SICHERUNGS_ORDNER, "merkr-" + tagesStempel() + ".json");
  if (fm.fileExists(ziel)) return;
  fm.copy(DATEN_DATEI, ziel);
  const alle = fm.listContents(SICHERUNGS_ORDNER)
    .filter(n => n.startsWith("merkr-") && n.endsWith(".json")).sort();
  while (alle.length > VORHALT_TAGE) {
    const weg = alle.shift();
    fm.remove(fm.joinPath(SICHERUNGS_ORDNER, weg));
  }
}
function datenSchreiben(jsonText) {
  if (!fm.fileExists(DATEN_ORDNER)) fm.createDirectory(DATEN_ORDNER, true);
  const tmp = DATEN_DATEI + ".neu";
  fm.writeString(tmp, jsonText);
  if (fm.fileExists(DATEN_DATEI)) fm.remove(DATEN_DATEI);
  fm.move(tmp, DATEN_DATEI);
}

// ---------- Daten laden und einsetzen ----------
// Einmalige Übernahme aus der Kursbuch-Ablage: nur, wenn am neuen Ort noch
// nichts liegt. Die alte Datei wird nicht gelöscht, sondern umbenannt - sie ist
// der Rückweg, solange der Umzug nicht bestätigt ist.
let uebernommen = false;
if (!fm.fileExists(DATEN_DATEI) && fmLokal.fileExists(ALT_DATEI)) {
  try {
    await bereitstellen(fmLokal, ALT_DATEI);
    const inhalt = fmLokal.readString(ALT_DATEI) || "";
    JSON.parse(inhalt);
    if (!fm.fileExists(DATEN_ORDNER)) fm.createDirectory(DATEN_ORDNER, true);
    fm.writeString(DATEN_DATEI, inhalt);
    fmLokal.move(ALT_DATEI, ALT_DATEI + ".uebernommen");
    uebernommen = true;
  } catch (e) {
    console.error("Übernahme aus KursbuchDaten fehlgeschlagen: " + e);
  }
}

let daten = "null";
if (await bereitstellen(fm, DATEN_DATEI)) {
  daten = fm.readString(DATEN_DATEI) || "null";
  try { JSON.parse(daten); } catch (e) { daten = "null"; }
}
sicherungAnlegen();

// Daten als Zeichenkette uebergeben und in der Seite parsen: so kann weder ein
// </script> noch ein Zeilentrenner in einem Namen die Seite zerlegen.
function baueHtml(datenText) {
  const literal = JSON.stringify(String(datenText == null ? "null" : datenText))
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return KURSBUCH_HTML
    .replace('/*__KURSBUCH_MODE__*/"standalone"', function () { return '"scriptable"'; })
    .replace('/*__KURSBUCH_DATA__*/null', function () { return "JSON.parse(" + literal + ")"; });
}

// ---------- Oberfläche anzeigen ----------
// Zuerst eine winzige Startseite zeigen und praesentieren. Erscheint sie nicht,
// liegt es an Scriptable/der WebView; erscheint sie und bleibt dann stehen,
// liegt es am Laden der grossen Seite.
const VERSION = "2026-08-19 merkr";
const ABLAGE_TEXT = ablage.icloud
  ? "Daten in iCloud Drive → Scriptable → " + ORDNER_NAME
  : "<b style='color:#e8b25a'>Achtung: iCloud nicht erreichbar, Daten liegen nur auf diesem Gerät.</b>"
    + "<br>" + ablage.hinweis;
const STARTSEITE =
  "<meta name=viewport content='width=device-width,initial-scale=1'>" +
  "<body style=\"background:#171d19;color:#e9efe6;font:17px -apple-system,sans-serif;padding:28px\">" +
  "<b>merkr wird geladen …</b><br><br>Fassung " + VERSION +
  "<br><br><span style='color:#9fb098;font-size:14px'>" + ABLAGE_TEXT +
  (uebernommen ? "<br>Bestand aus KursbuchDaten übernommen." : "") + "</span>" +
  "<br><br><span style='color:#9fb098;font-size:14px'>Bleibt dieser Text stehen, " +
  "konnte die Oberflaeche nicht geladen werden.</span></body>";

const wv = new WebView();
await wv.loadHTML(STARTSEITE);
let laeuft = true;
const anzeige = wv.present(true).then(() => { laeuft = false; });
await new Promise(r => Timer.schedule(500, false, r));
await wv.loadHTML(baueHtml(daten));

// Startkontrolle (mit Zeitbegrenzung, damit nichts hängen bleibt)
function mitZeitlimit(promise, ms) {
  return new Promise(resolve => {
    let fertig = false;
    Timer.schedule(ms, false, () => { if (!fertig) { fertig = true; resolve("__zeit__"); } });
    promise.then(w => { if (!fertig) { fertig = true; resolve(w); } })
      .catch(e => { if (!fertig) { fertig = true; resolve("__fehler__:" + e); } });
  });
}
// Startkontrolle: laeuft die Oberflaeche? Wenn nicht, ohne Daten erneut versuchen.
const PRUEFUNG = "(window.__KB_startOk ? 'ok|' : 'fehler|') + (window.__KB_startFehlerText || '')";
let zustand = await mitZeitlimit(wv.evaluateJavaScript(PRUEFUNG, false), 6000);
let ohneDaten = false;
if (String(zustand).indexOf("ok|") !== 0) {
  await wv.loadHTML(baueHtml("null"));
  const zweit = await mitZeitlimit(wv.evaluateJavaScript(PRUEFUNG, false), 6000);
  ohneDaten = String(zweit).indexOf("ok|") === 0;
  const bericht = "Mit Daten: " + zustand + "\nOhne Daten: " + zweit +
    "\nOberflaeche: " + KURSBUCH_HTML.length + " Zeichen, Daten: " + daten.length + " Zeichen";
  console.log(bericht);
  try { Pasteboard.copy(bericht); } catch (e) { }
  const a = new Alert();
  a.title = "Kursbuch-Startkontrolle";
  a.message = bericht + (ohneDaten
    ? "\n\nKursbuch startet ohne Ihre Daten. Es wird nichts gespeichert, damit Ihr Datenstand erhalten bleibt."
    : "") + "\n\nDer Text liegt in der Zwischenablage.";
  a.addAction("Weiter");
  await a.present();
  if (!ohneDaten) {
    try {
      await wv.loadHTML(
        "<meta name=viewport content='width=device-width,initial-scale=1'>" +
        "<body style=\"background:#7a1f1f;color:#fff;font:15px -apple-system,sans-serif;padding:24px\">" +
        "<h2>Kursbuch konnte nicht starten</h2><pre style='white-space:pre-wrap'>" +
        bericht.replace(/&/g, "&amp;").replace(/</g, "&lt;") +
        "</pre><p>Ihre Daten in KursbuchDaten sind unveraendert.</p></body>");
    } catch (e) { console.error(e); }
  }
}

// Anzeige laeuft bereits seit der Startseite.

async function bruecke() {
  while (laeuft) {
    let nachricht;
    try {
      nachricht = await wv.evaluateJavaScript("window.__KB_awaitMessage(completion)", true);
    } catch (e) { break; }
    if (!laeuft || !nachricht) break;
    let msg;
    try { msg = JSON.parse(nachricht); } catch (e) { continue; }

    if (msg.typ === "save") {
      if (ohneDaten) continue;   // Rueckfallmodus: echten Datenstand nicht ueberschreiben
      try { datenSchreiben(msg.daten); } catch (e) { console.error("Speichern fehlgeschlagen: " + e); }
    } else if (msg.typ === "exportdatei") {
      try {
        const name = String(msg.name || "kursbuch-export.dat").replace(/[^\wäöüÄÖÜß.\- ]/g, "_");
        const pfad = fm.joinPath(DATEN_ORDNER, name);
        if (!fm.fileExists(DATEN_ORDNER)) fm.createDirectory(DATEN_ORDNER, true);
        fm.write(pfad, Data.fromBase64String(msg.base64));
        await DocumentPicker.export(pfad);
        fm.remove(pfad);
      } catch (e) { /* Export abgebrochen */ }
    } else if (msg.typ === "planimport") {
      try {
        const pfade = await DocumentPicker.open(["public.json", "public.text"]);
        if (pfade && pfade.length) {
          const inhalt = await gewaehlteLesen(pfade[0]);
          await wv.evaluateJavaScript("window.__KB_planImport(" + JSON.stringify(inhalt) + ")", false);
        }
      } catch (e) { /* abgebrochen */ }
    } else if (msg.typ === "anthropic") {
      try {
        const req = new Request("https://api.anthropic.com/v1/messages");
        req.method = "POST";
        req.headers = { "content-type": "application/json", "x-api-key": msg.key, "anthropic-version": "2023-06-01" };
        req.body = JSON.stringify(msg.body);
        const antwort = await req.loadJSON();
        await wv.evaluateJavaScript("window.__KB_kiAntwort(" + JSON.stringify(JSON.stringify(antwort)) + ")", false);
      } catch (e) {
        await wv.evaluateJavaScript("window.__KB_kiAntwort(" + JSON.stringify(JSON.stringify({ fehler: String(e) })) + ")", false);
      }
    } else if (msg.typ === "export") {
      try {
        const exportPfad = fm.joinPath(DATEN_ORDNER, "merkr-sicherung-" + zeitstempel() + ".json");
        const stand = await wv.evaluateJavaScript("window.__KB_getState()", false);
        fm.writeString(exportPfad, stand);
        await DocumentPicker.export(exportPfad);
        fm.remove(exportPfad);
      } catch (e) { /* abgebrochen */ }
    } else if (msg.typ === "import") {
      try {
        const pfade = await DocumentPicker.open(["public.json", "public.text"]);
        if (pfade && pfade.length) {
          const inhalt = await gewaehlteLesen(pfade[0]);
          await wv.evaluateJavaScript("window.__KB_importData(" + JSON.stringify(inhalt) + ")", false);
        }
      } catch (e) { /* abgebrochen */ }
    }
  }
}
bruecke();

await anzeige;
try {
  const stand = await mitZeitlimit(wv.evaluateJavaScript("window.__KB_getState()", false), 4000);
  if (!ohneDaten && stand && typeof stand === "string" && stand.length > 2 && stand !== "__zeit__" && !stand.startsWith("__fehler__")) datenSchreiben(stand);
} catch (e) { /* Ansicht geschlossen */ }
Script.complete();
