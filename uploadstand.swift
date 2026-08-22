// Sagt, ob eine Datei in iCloud wirklich oben ist.
//
// Der Anlass: am 21.08.2026 lag merkr.js aktuell auf der Platte, kam aber nicht
// aufs iPad, und nichts zeigte den Unterschied - brctl listete den
// Scriptable-Container nicht einmal auf ("Client zone not found"). Erst ein Klick
// auf das Wolkensymbol im Finder brachte den Sync in Gang.
//
// Diese Abfrage beantwortet die Frage, die dabei offen blieb: liegt es am Mac
// oder am Gerät? Steht hier "hochgeladen: true", ist der Mac fertig - dann hilft
// nur noch, in Scriptable die Liste neu zu laden.
//
//   swift uploadstand.swift <datei>
import Foundation

let pfad = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : ""
guard !pfad.isEmpty else {
  print("Aufruf: swift uploadstand.swift <datei>")
  exit(2)
}
let url = URL(fileURLWithPath: pfad)
let keys: Set<URLResourceKey> = [
  .isUbiquitousItemKey, .ubiquitousItemIsUploadedKey,
  .ubiquitousItemIsUploadingKey, .ubiquitousItemUploadingErrorKey,
]
do {
  let v = try url.resourceValues(forKeys: keys)
  let oben = v.ubiquitousItemIsUploaded ?? false
  print("iCloud-Datei: \(v.isUbiquitousItem ?? false)")
  print("hochgeladen: \(oben)")
  print("laedt gerade: \(v.ubiquitousItemIsUploading ?? false)")
  if let fehler = v.ubiquitousItemUploadingError {
    print("Fehler: \(fehler.localizedDescription)")
  }
  exit(oben ? 0 : 1)
} catch {
  print("Datei nicht lesbar: \(error.localizedDescription)")
  exit(2)
}
