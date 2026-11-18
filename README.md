# Nahbei Alltagshilfe

Werkzeug für eine kleine, anerkannte Alltagshilfe (Angebot zur Unterstützung im Alltag nach § 45a SGB XI).
„Nahbei“ ist ein Arbeitstitel und lässt sich in den Einstellungen ändern.

Die alte App „Hand Drauf“ (Repo `Nachbarhand`) ist davon getrennt und bleibt unverändert.

## Was die App kann

**Büro (Handy oder PC)**
- Heute: was zu erledigen ist (fehlende Unterschriften, offene Einsätze, nicht abgerechnete Monate, knappes Budget, Minijob-Grenze, ablaufende Nachweise) und die Einsätze des Tages
- Plan: Wochenplan, Einsätze anlegen (auch jede Woche oder alle 2 Wochen), Warnung bei Überschneidungen, Minijob-Grenze und knappem Budget
- Kundschaft: Kontakt, Pflegekasse, Versichertennummer, Abtretung, Budget aus dem Entlastungsbetrag (131 € im Monat, sammelt sich an) und optional Umwandlung
- Team: Stundenlohn, Minijob-Stunden im Monat, Nachweise (Schulung, Erste Hilfe, Führungszeugnis)
- Abrechnung: Leistungsnachweis mit Rechnung je Kundin und Monat zum Drucken oder als PDF, Kassenanteil und Eigenanteil, Rechnungsnummern, Lohnliste als CSV für die Steuerberatung

**Helfende (Handy)**
- Heute: der nächste Einsatz auf dem Klemmbrett mit Anrufen und Weg zeigen
- „Ich bin da“ und „Fertig“ erfassen die Zeiten
- Unterschrift der Kundschaft mit dem Finger auf dem Handy
- Woche und eigene Stunden mit Minijob-Grenze

## Vorschau

Die Vorschau läuft nur im Browser mit ausgedachten Beispieldaten. Nichts wird verschickt.
Oben rechts lässt sich die Ansicht wechseln: Büro oder eine der Helfenden.

## Veröffentlichen (GitHub Pages)

Einmalig im Repo: Settings → Pages → „Deploy from a branch“ → Branch `main`, Ordner `/ (root)` → Save.
Danach ist die App unter `https://z6dfczy4jt-code.github.io/Alltagshilfe/` erreichbar.

Nach Änderungen in `src/`:

```
python3 tools/build.py
```

Das baut `index.html`, `sw.js` und `version.json` neu.

## Echte Daten (später)

`supabase/schema.sql` ist der Plan für die Datenbank (eigenes Supabase-Projekt, Region Frankfurt):
- Das Büro sieht alles.
- Helfende sehen nur ihre eigenen Einsätze und von der Kundschaft nur Name, Anschrift, Telefon, Angehörige und Hinweise. Pflegegrad, Kasse, Versichertennummer, Budget, Rechnungen und fremde Löhne sehen sie nicht.
- Unterschriebene Einsätze kann nur noch das Büro ändern.

Die Regeln sind gegen eine lokale Datenbank getestet. Eingespielt wird erst, wenn die Firma angemeldet ist.

Vorher klären (keine Rechtsberatung):
- Pflegegrad und Pflegekasse sind Gesundheitsdaten. Nötig sind ein Vertrag zur Auftragsverarbeitung mit Supabase, ein Verzeichnis der Verarbeitungstätigkeiten und eine Datenschutz-Information für die Kundschaft.
- Keine Diagnosen in die App schreiben.
- Ob die Leistungen umsatzsteuerfrei sind (§ 4 Nr. 16 UStG), bestätigt die Steuerberatung.

## Technik

Eine einzige HTML-Datei ohne Fremd-Bibliotheken. Schriften liegen im Repo (Lora und Carlito, SIL Open Font License, siehe `assets/fonts/LIZENZ-Schriften-OFL.txt`). Ein Service Worker hält die App offline bereit, damit sie auch im Keller bei der Kundschaft aufgeht.
