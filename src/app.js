/* Nahbei Alltagshilfe
   Büro: Kundschaft, Team, Einsatzplan, Abrechnung mit der Pflegekasse (Entlastungsbetrag).
   Helfende: Einsätze des Tages, Zeiten erfassen, Unterschrift auf dem Handy, eigene Stunden.
   Vorschau: alle Daten nur auf diesem Gerät (localStorage), mit ausgedachten Beispielen. */
(() => {
  'use strict';

  /* ===== Kleine Helfer ===== */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const id = (vor) => vor + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const lesen = (key, standard) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : standard; } catch (e) { return standard; } };
  const schreiben = (key, wert) => { try { localStorage.setItem(key, JSON.stringify(wert)); return true; } catch (e) { return false; } };

  const ICONS = {
    heute: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3.5h6v3H9z"/><path d="M8.5 11h7M8.5 15h5"/>',
    plan: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
    kunden: '<path d="M3.5 11L12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
    team: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19c.7-3.4 3.1-5.2 6-5.2s5.3 1.8 6 5.2"/><path d="M15.5 5.2a3 3 0 010 5.6M17.5 14c1.8.6 3 2.3 3.5 5"/>',
    abrechnung: '<path d="M6 3.5h9l3.5 3.5v13.5H6z"/><path d="M15 3.5V7h3.5"/><path d="M14.2 11.3a3.2 3.2 0 100 4.4M9 12.8h4.2M9 14.3h4.2"/>',
    stunden: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    telefon: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 004.9 4.9L15 13l5 2v4a1.5 1.5 0 01-1.6 1.5A16 16 0 013.5 5.6 1.5 1.5 0 015 4z"/>',
    ort: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
    stift: '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19z"/><path d="M14.5 6.5l3 3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    haken: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    warnung: '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.5v.5"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 8v.5"/>',
    rechts: '<path d="M9 5l7 7-7 7"/>',
    links: '<path d="M15 5l-7 7 7 7"/>',
    drucken: '<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="1.5"/><path d="M7 14h10v6.5H7z"/>',
    zu: '<path d="M6 6l12 12M18 6L6 18"/>',
    regler: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    datei: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M4.5 16.5V20h15v-3.5"/>',
    person: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c.9-3.9 3.9-6 7.5-6s6.6 2.1 7.5 6"/>'
  };
  const icon = (name, extra = '') => `<svg class="i ${extra}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  /* ===== Datum und Zeit (immer Ortszeit, als Text JJJJ-MM-TT) ===== */
  const TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  const TAGE_K = ['Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.', 'So.'];
  const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const MONATE_K = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const ausIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d || 1); };
  const heute = () => iso(new Date());
  const plusTage = (s, n) => { const d = ausIso(s); d.setDate(d.getDate() + n); return iso(d); };
  const wochentag = (s) => (ausIso(s).getDay() + 6) % 7;
  const montagVon = (s) => plusTage(s, -wochentag(s));
  const monatVon = (s) => s.slice(0, 7);
  const plusMonate = (m, n) => { const [y, mo] = m.split('-').map(Number); const d = new Date(y, mo - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
  const monateZwischen = (a, b) => { const [ya, ma] = a.split('-').map(Number), [yb, mb] = b.split('-').map(Number); return (yb - ya) * 12 + (mb - ma); };
  const datumKurz = (s) => { const d = ausIso(s); return `${TAGE_K[wochentag(s)]} ${d.getDate()}. ${MONATE_K[d.getMonth()]}`; };
  const datumLang = (s) => { const d = ausIso(s); return `${TAGE[wochentag(s)]}, ${d.getDate()}. ${MONATE[d.getMonth()]} ${d.getFullYear()}`; };
  const datumZahl = (s) => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${d}.${m}.${y}`; };
  const monatName = (m) => { const [y, mo] = m.split('-').map(Number); return `${MONATE[mo - 1]} ${y}`; };
  const kalenderwoche = (s) => { const d = ausIso(s); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7)); const w1 = new Date(d.getFullYear(), 0, 4); return 1 + Math.round(((d - w1) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7); };
  const minuten = (z) => { if (!z) return 0; const [h, m] = z.split(':').map(Number); return h * 60 + m; };
  const uhrzeit = (min) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;
  const jetztZeit = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const ZAHL = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });
  const EURO = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  const euro = (n) => EURO.format(Math.round(n * 100) / 100);
  const std = (min) => ZAHL.format(Math.round(min / 60 * 100) / 100) + ' Std.';

  /* ===== Daten ===== */
  const SPEICHER = 'nahbei-demo-v1';
  const ANSICHT = 'nahbei-ansicht';
  const ROLLE = 'nahbei-rolle';
  const TAETIGKEITEN = [['haushalt', 'Haushalt'], ['einkauf', 'Einkauf'], ['begleitung', 'Begleitung (Arzt, Amt)'], ['gesellschaft', 'Gesellschaft, Spaziergang'], ['waesche', 'Wäsche'], ['garten', 'Garten, Balkon']];
  const taetigkeitName = (k) => (TAETIGKEITEN.find(([w]) => w === k) || [k, k])[1];
  const KASSEN = ['AOK Niedersachsen', 'Barmer', 'DAK-Gesundheit', 'Techniker Krankenkasse', 'IKK classic', 'KKH', 'hkk', 'BKK', 'Knappschaft', 'Andere'];

  let D = null;
  const ansicht = Object.assign({ thema: 'auto', schrift: 'normal' }, lesen(ANSICHT, {}));
  const ui = { rolle: lesen(ROLLE, 'p-buero'), dialogZu: null };

  function speichern() {
    if (!schreiben(SPEICHER, D)) meldung('Speichern auf diesem Gerät hat nicht geklappt. Bitte privaten Modus beenden.');
  }

  // Ein gleichbleibender Zufall aus einem Text (für Beispiel-Unterschriften)
  function zufall(text) { let h = 2166136261; for (const c of text) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }
  function beispielUnterschrift(name) {
    const r = zufall(name); let x = 40 + r() * 30, y = 120; let d = `M${Math.round(x)} ${y}`;
    const buchstaben = Math.min(9, name.replace(/[^A-Za-zÄÖÜäöüß]/g, '').length);
    for (let i = 0; i < buchstaben; i++) {
      const hoch = 40 + r() * 55, breit = 26 + r() * 22;
      d += ` C${Math.round(x + breit * .2)} ${Math.round(y - hoch)} ${Math.round(x + breit * .9)} ${Math.round(y - hoch * .8)} ${Math.round(x + breit * .55)} ${Math.round(y + 6)}`;
      x += breit; y = 118 + r() * 14;
      d += ` S${Math.round(x)} ${Math.round(y + 10)} ${Math.round(x)} ${Math.round(y)}`;
    }
    d += ` M${Math.round(40 + r() * 20)} ${Math.round(150 + r() * 10)} L${Math.round(x + 10)} ${Math.round(142 + r() * 8)}`;
    return d;
  }

  function beispielDaten() {
    const t = heute(), mo = montagVon(t);
    const firma = { name: 'Nahbei', zusatz: 'Alltagshilfe', inhaber: 'Vorname Nachname', anschrift: 'Beispielweg 1, 30823 Garbsen', telefon: '05131 000000',
      email: 'kontakt@example.org', ik: '460000000 (Beispiel)', steuernr: '', anerkennung: 'Beispiel: anerkannt nach § 45a SGB XI, Az. 000-00',
      satz: 38, anfahrt: 5, takt: 15, entlastung: 131, minijob: 603,
      ustText: 'Umsatzsteuerfrei nach § 4 Nr. 16 UStG (bitte von der Steuerberatung bestätigen lassen).' };
    const personen = [
      { id: 'p-buero', name: 'Büro', rolle: 'buero', telefon: '', lohn: 0 },
      { id: 'p-lena', name: 'Lena Kröger', rolle: 'helfer', telefon: '0151 00000001', email: '', lohn: 15, minijob: true, schulung: '2026-03-14', ersteHilfe: '2025-02-08', fz: '2026-02-20', notiz: 'Studentin, kann Mo bis Fr' },
      { id: 'p-murat', name: 'Murat Yıldız', rolle: 'helfer', telefon: '0151 00000002', email: '', lohn: 15, minijob: true, schulung: '2025-11-22', ersteHilfe: '2024-12-06', fz: '2025-10-30', notiz: 'Im Ruhestand, hat ein Auto' },
      { id: 'p-anja', name: 'Anja Becker', rolle: 'helfer', telefon: '0151 00000003', email: '', lohn: 14.5, minijob: true, schulung: '', ersteHilfe: '2026-05-10', fz: '2026-04-02', notiz: 'Neu im Team, Schulung im Dezember' }
    ];
    const ab = plusMonate(monatVon(t), -3);
    const kunden = [
      { id: 'k-albers', vorname: 'Gerda', name: 'Albers', strasse: 'Lindenstraße 14', ort: '30823 Garbsen', telefon: '05131 000101', angehoerige: 'Tochter Petra Albers, 0170 0000101',
        pflegegrad: 2, kasse: 'AOK Niedersachsen', versnr: 'A123456780', abtretung: plusTage(t, -100), guthaben: 420, stand: ab, umwandlung: 0,
        hinweise: 'Einkaufsliste liegt auf dem Küchentisch. Sie bezahlt gern selbst an der Kasse.', aktiv: true },
      { id: 'k-wiebe', vorname: 'Heinz', name: 'Wiebe', strasse: 'Birkenweg 3', ort: '30826 Garbsen', telefon: '05131 000102', angehoerige: 'Sohn Jan Wiebe, 0170 0000102',
        pflegegrad: 3, kasse: 'Barmer', versnr: 'B987654321', abtretung: plusTage(t, -80), guthaben: 131, stand: ab, umwandlung: 0, zuzahlung: true,
        hinweise: 'Hört schwer: klingeln und klopfen, deutlich sprechen. Rollator steht im Flur.', aktiv: true },
      { id: 'k-marten', vorname: 'Ilse', name: 'Marten', strasse: 'Schulstraße 21', ort: '30827 Garbsen', telefon: '05131 000103', angehoerige: '',
        pflegegrad: 1, kasse: 'Techniker Krankenkasse', versnr: 'T456789012', abtretung: '', guthaben: 260, stand: ab, umwandlung: 0,
        hinweise: 'Kleiner Hund (Lotte), freundlich.', aktiv: true },
      { id: 'k-rose', vorname: 'Karl-Heinz', name: 'Rose', strasse: 'Gartenweg 5', ort: '30823 Garbsen', telefon: '05131 000104', angehoerige: 'Nachbarin Frau Kurz hat einen Schlüssel',
        pflegegrad: 2, kasse: 'DAK-Gesundheit', versnr: 'D234567890', abtretung: plusTage(t, -60), guthaben: 1179, stand: ab, umwandlung: 0,
        hinweise: 'Schlüssel im Schlüsselkasten neben der Tür, Code steht im Büro.', aktiv: true },
      { id: 'k-lueders', vorname: 'Edith', name: 'Lüders', strasse: 'Am Markt 7', ort: '30823 Garbsen', telefon: '05131 000105', angehoerige: 'Neffe Thomas Lüders, 0170 0000105',
        pflegegrad: 4, kasse: 'AOK Niedersachsen', versnr: 'A345678901', abtretung: plusTage(t, -120), guthaben: 131, stand: ab, umwandlung: 250,
        hinweise: 'Mag Spaziergänge zum Park. Brille nicht vergessen.', aktiv: true }
    ];
    // Feste Termine: [Kunde, Wochentag 0=Mo, von, bis, Helfende, Tätigkeiten, alle n Wochen]
    // 131 € im Monat reichen bei 38 €/Std. für gut 3 Stunden. Wer öfter kommt, braucht Erspartes oder die Umwandlung.
    const muster = [
      ['k-albers', 1, '10:00', '11:30', 'p-lena', ['haushalt', 'einkauf'], 2],
      ['k-wiebe', 0, '14:00', '15:00', 'p-murat', ['einkauf', 'gesellschaft'], 1],
      ['k-wiebe', 3, '10:00', '11:00', 'p-murat', ['begleitung'], 2],
      ['k-marten', 2, '09:00', '10:30', 'p-anja', ['haushalt'], 2],
      ['k-rose', 4, '10:00', '12:00', 'p-lena', ['haushalt', 'waesche'], 1],
      ['k-lueders', 0, '09:00', '11:00', 'p-anja', ['haushalt'], 1],
      ['k-lueders', 2, '15:00', '16:30', 'p-lena', ['gesellschaft'], 2]
    ];
    const einsaetze = [], r = zufall(t), jetzt = jetztZeit();
    const abschliessen = (e) => {
      if (r() < .04) { e.status = 'abgesagt'; e.grund = 'Krankenhausaufenthalt'; return; }
      const vor = r() < .6 ? 0 : Math.round((r() - .5) * 8), nach = r() < .6 ? 0 : Math.round((r() - .5) * 8);
      e.status = 'erledigt'; e.ist = { von: uhrzeit(minuten(e.von) + vor), bis: uhrzeit(minuten(e.bis) + nach) };
      const k = kunden.find((x) => x.id === e.kunde);
      e.unterschrift = { pfad: beispielUnterschrift(k.vorname + k.name), name: k.vorname + ' ' + k.name, zeit: e.datum + 'T' + e.ist.bis };
    };
    for (let w = -10; w <= 3; w++) {
      muster.forEach(([k, tag, von, bis, p, ta, alle]) => {
        if (((w % alle) + alle) % alle) return;
        const datum = plusTage(mo, w * 7 + tag);
        if (datum < ab + '-01') return;
        const e = { id: 'e-' + k.slice(2) + '-' + datum, kunde: k, helfer: p, datum, von, bis, taetigkeiten: ta.slice(), notiz: '', status: 'geplant' };
        if (datum < t || (datum === t && bis < jetzt)) abschliessen(e);
        einsaetze.push(e);
      });
    }
    // Eine Unterschrift fehlt noch (das Büro soll es sehen)
    const ohne = einsaetze.filter((e) => e.status === 'erledigt' && e.helfer === 'p-lena' && e.datum < t).pop();
    if (ohne) delete ohne.unterschrift;
    // Heute zwei Einsätze für Lena, damit die Ansicht für Helfende etwas zeigt. Nur in freie Zeiten, nie doppelt.
    const frei = (kid, von, bis) => !einsaetze.some((e) => e.datum === t && (e.helfer === 'p-lena' || e.kunde === kid) && minuten(e.von) < minuten(bis) && minuten(von) < minuten(e.bis));
    [['k-albers', '11:00', '12:30', ['einkauf'], 'Zusatztermin: Wocheneinkauf, Liste liegt bereit'], ['k-marten', '14:00', '15:00', ['gesellschaft'], ''],
      ['k-rose', '16:30', '17:30', ['einkauf'], 'Apotheke, Rezept liegt im Flur'], ['k-albers', '08:00', '09:00', ['haushalt'], '']].forEach(([k, von, bis, ta, notiz], i) => {
      if (einsaetze.filter((e) => e.datum === t && e.helfer === 'p-lena').length >= 2 || !frei(k, von, bis)) return;
      const e = { id: `e-extra${i}-${t}`, kunde: k, helfer: 'p-lena', datum: t, von, bis, taetigkeiten: ta, notiz, status: 'geplant' };
      if (bis < jetzt) abschliessen(e);
      einsaetze.push(e);
    });
    // Nächste Woche ein Termin ohne Helfende
    einsaetze.push({ id: 'e-offen-' + t, kunde: 'k-rose', helfer: '', datum: plusTage(mo, 8), von: '14:00', bis: '15:30', taetigkeiten: ['begleitung'], notiz: 'Arzttermin, Begleitung hin und zurück', status: 'geplant' });
    einsaetze.sort((a, b) => (a.datum + a.von).localeCompare(b.datum + b.von));
    D = { version: 1, demo: true, firma, personen, kunden, einsaetze, rechnungen: [] };
    // Vorvormonat schon abgerechnet
    const vorvor = plusMonate(monatVon(t), -2);
    kunden.forEach((k) => { const a = abrechnung(k, vorvor); if (a.liste.length && !a.ohneUnterschrift) rechnungAnlegen(k, vorvor, a); });
    return D;
  }

  /* ===== Rechnen ===== */
  const person = (pid) => D.personen.find((p) => p.id === pid);
  const kunde = (kid) => D.kunden.find((k) => k.id === kid);
  const einsatz = (eid) => D.einsaetze.find((e) => e.id === eid);
  const kundenName = (k) => k ? `${k.vorname} ${k.name}` : 'Unbekannt';
  const vorname = (p) => p ? p.name.split(' ')[0] : '';
  const helfende = () => D.personen.filter((p) => p.rolle === 'helfer');
  const istBuero = () => (person(ui.rolle) || {}).rolle !== 'helfer';

  const dauer = (e) => { const z = e.ist && e.ist.von && e.ist.bis ? e.ist : e; return Math.max(0, minuten(z.bis) - minuten(z.von)); };
  const abrechenbar = (e) => { const t = D.firma.takt || 15; return Math.ceil(dauer(e) / t) * t; };
  const preisEinsatz = (e) => abrechenbar(e) / 60 * D.firma.satz + (D.firma.anfahrt || 0);

  // Was steht noch im Topf? Guthaben laut Pflegekasse zum Stand-Monat, jeden Monat kommt der Entlastungsbetrag dazu,
  // abgerechnete Kassenanteile gehen ab. Umwandlung (bis 40 % der Sachleistung) gilt nur im jeweiligen Monat.
  function topf(k, monat) {
    const leer = { verfuegbar: 0, umwandlung: 0, neuesJahr: false };
    if (!k.stand || monat < k.stand) return leer;
    const umw = k.pflegegrad >= 2 ? (k.umwandlung || 0) : 0;
    let rest = k.guthaben || 0;
    for (let m = k.stand; m < monat; m = plusMonate(m, 1)) {
      const r = D.rechnungen.find((x) => x.kunde === k.id && x.monat === m);
      let ausTopf;
      if (r) ausTopf = Math.max(0, r.kasse - (r.umwandlung || 0));
      else {
        const summe = D.einsaetze.filter((e) => e.kunde === k.id && monatVon(e.datum) === m && e.status === 'erledigt').reduce((s, e) => s + preisEinsatz(e), 0);
        ausTopf = Math.max(0, Math.min(summe, rest + umw) - Math.min(umw, summe));
      }
      rest = Math.max(0, rest - ausTopf) + (D.firma.entlastung || 131);
    }
    return { verfuegbar: rest, umwandlung: umw, neuesJahr: monat.slice(0, 4) !== k.stand.slice(0, 4) };
  }
  function abrechnung(k, monat) {
    const liste = D.einsaetze.filter((e) => e.kunde === k.id && monatVon(e.datum) === monat && e.status === 'erledigt').sort((a, b) => (a.datum + a.von).localeCompare(b.datum + b.von));
    const geplant = D.einsaetze.filter((e) => e.kunde === k.id && monatVon(e.datum) === monat && (e.status === 'geplant' || e.status === 'laeuft'));
    const min = liste.reduce((s, e) => s + abrechenbar(e), 0);
    const summe = liste.reduce((s, e) => s + preisEinsatz(e), 0);
    const geplantSumme = geplant.reduce((s, e) => s + preisEinsatz(e), 0);
    const tp = topf(k, monat), rechnung = D.rechnungen.find((r) => r.kunde === k.id && r.monat === monat);
    const deckung = tp.verfuegbar + tp.umwandlung;
    const kasse = rechnung ? rechnung.kasse : Math.min(summe, deckung);
    return { liste, geplant, min, summe, geplantSumme, topf: tp, deckung, kasse, selbst: rechnung ? rechnung.selbst : Math.max(0, summe - kasse),
      rechnung, ohneUnterschrift: liste.filter((e) => !e.unterschrift && !e.papier).length };
  }
  function rechnungAnlegen(k, monat, a) {
    const jahr = monat.slice(0, 4);
    D.letzteNr = D.letzteNr || {};
    const hoechste = Math.max(D.letzteNr[jahr] || 0, ...D.rechnungen.filter((r) => r.nr.startsWith(jahr + '-')).map((r) => Number(r.nr.slice(5)) || 0));
    D.letzteNr[jahr] = hoechste + 1;
    const nr = jahr + '-' + String(hoechste + 1).padStart(3, '0');
    const umw = Math.min(a.topf.umwandlung, a.summe);
    D.rechnungen.push({ id: id('r'), nr, kunde: k.id, monat, datum: heute(), einsaetze: a.liste.map((e) => e.id), summe: a.summe, kasse: Math.min(a.summe, a.deckung), umwandlung: umw, selbst: Math.max(0, a.summe - a.deckung) });
  }
  function lohnMonat(pid, monat, mitGeplant) {
    const p = person(pid);
    const liste = D.einsaetze.filter((e) => e.helfer === pid && monatVon(e.datum) === monat && (e.status === 'erledigt' || (mitGeplant && (e.status === 'geplant' || e.status === 'laeuft'))));
    const min = liste.reduce((s, e) => s + dauer(e), 0);
    return { liste, min, lohn: min / 60 * (p ? p.lohn : 0) };
  }
  // Nachweise: Erste Hilfe alle 2 Jahre auffrischen, Führungszeugnis nach 5 Jahren neu (Einstellung des Büros, keine Vorschrift)
  function nachweise(p) {
    const t = heute(), aus = [];
    const pruefe = (datum, name, jahre) => {
      if (!datum) { aus.push({ name, art: 'fehlt', text: `${name} fehlt` }); return; }
      if (!jahre) return;
      const bis = plusTage(datum, Math.round(jahre * 365.25));
      if (bis < t) aus.push({ name, art: 'abgelaufen', text: `${name} abgelaufen seit ${datumZahl(bis)}`, bis });
      else if (bis < plusTage(t, 60)) aus.push({ name, art: 'bald', text: `${name} läuft am ${datumZahl(bis)} ab`, bis });
    };
    pruefe(p.schulung, 'Schulung (30 Std.)', 0);
    pruefe(p.ersteHilfe, 'Erste-Hilfe-Kurs', 2);
    pruefe(p.fz, 'Führungszeugnis', 5);
    return aus;
  }
  function ueberschneidung(e) {
    if (!e.helfer) return null;
    return D.einsaetze.find((x) => x.id !== e.id && x.helfer === e.helfer && x.datum === e.datum && x.status !== 'abgesagt' &&
      minuten(x.von) < minuten(e.bis) && minuten(e.von) < minuten(x.bis)) || null;
  }

  /* ===== Hinweise fürs Büro ===== */
  function hinweise() {
    const t = heute(), m = monatVon(t), aus = [];
    const ohneU = D.einsaetze.filter((e) => e.status === 'erledigt' && !e.unterschrift && !e.papier);
    if (ohneU.length) aus.push(['fehler', `${ohneU.length} ${ohneU.length === 1 ? 'Einsatz' : 'Einsätze'} ohne Unterschrift`, 'Ohne Unterschrift zahlt die Pflegekasse nicht. Nachholen lassen oder Papier-Nachweis vermerken.', '#einsatz/' + ohneU[0].id]);
    const offen = D.einsaetze.filter((e) => !e.helfer && e.status === 'geplant' && e.datum >= t && e.datum <= plusTage(t, 14));
    if (offen.length) aus.push(['warn', `${offen.length} ${offen.length === 1 ? 'Einsatz braucht' : 'Einsätze brauchen'} noch Helfende`, offen.map((e) => `${datumKurz(e.datum)}, ${kundenName(kunde(e.kunde))}`).join(' · '), '#plan/' + montagVon(offen[0].datum)]);
    const vormonat = plusMonate(m, -1);
    const offenRechnung = D.kunden.filter((k) => { const a = abrechnung(k, vormonat); return a.liste.length && !a.rechnung; });
    if (offenRechnung.length) aus.push(['warn', `${monatName(vormonat)} noch nicht abgerechnet`, `${offenRechnung.length} ${offenRechnung.length === 1 ? 'Leistungsnachweis' : 'Leistungsnachweise'} an die Pflegekassen schicken.`, '#abrechnung/' + vormonat]);
    D.kunden.filter((k) => k.aktiv).forEach((k) => {
      const a = abrechnung(k, m), gesamt = a.summe + a.geplantSumme;
      if (gesamt > a.deckung + 0.01 && !k.zuzahlung) aus.push(['warn', `${kundenName(k)}: Budget reicht diesen Monat nicht`, `Geplant ${euro(gesamt)}, von der Pflegekasse ${euro(a.deckung)}. Den Rest (${euro(gesamt - a.deckung)}) zahlt die Kundschaft selbst: vorher absprechen oder weniger planen.`, '#kunde/' + k.id]);
      if (!k.abtretung) aus.push(['warn', `${kundenName(k)}: Abtretungserklärung fehlt`, 'Ohne sie zahlt die Pflegekasse nicht direkt an dich, die Kundschaft muss die Rechnung selbst einreichen.', '#kunde/' + k.id]);
    });
    helfende().forEach((p) => {
      if (p.minijob) {
        const l = lohnMonat(p.id, m, true), grenze = D.firma.minijob || 603;
        if (l.lohn > grenze) aus.push(['fehler', `${p.name}: über der Minijob-Grenze`, `Geplant ${euro(l.lohn)} im ${MONATE[Number(m.slice(5)) - 1]}, Grenze ${euro(grenze)}. Einsätze umverteilen.`, '#person/' + p.id]);
        else if (l.lohn > grenze * .9) aus.push(['warn', `${p.name}: fast an der Minijob-Grenze`, `Geplant ${euro(l.lohn)} von ${euro(grenze)}.`, '#person/' + p.id]);
      }
      nachweise(p).forEach((n) => aus.push([n.art === 'bald' ? 'warn' : 'fehler', `${p.name}: ${n.text}`, n.art === 'fehlt' ? 'Für die Anerkennung brauchen alle Helfenden Schulung, Erste-Hilfe-Kurs und erweitertes Führungszeugnis.' : 'Termin für die Auffrischung planen.', '#person/' + p.id]));
    });
    return aus;
  }

  /* ===== Darstellung ===== */
  const main = $('#inhalt');
  function rolleAnzeigen() {
    const p = person(ui.rolle) || D.personen[0];
    $('#rolle-name').textContent = p.rolle === 'buero' ? 'Büro' : p.name.split(' ')[0];
    $('#firmen-name').textContent = D.firma.name || 'Alltagshilfe';
    $('#firmen-zusatz').textContent = D.firma.zusatz || '';
    $('#demo-band').hidden = !D.demo;
    document.title = `${D.firma.name || ''} ${D.firma.zusatz || ''}`.trim();
  }
  function leiste(aktiv) {
    const punkte = istBuero()
      ? [['heute', 'Heute', 'heute'], ['plan', 'Plan', 'plan'], ['kunden', 'Kunden', 'kunden'], ['team', 'Team', 'team'], ['abrechnung', 'Abrechnung', 'abrechnung']]
      : [['heute', 'Heute', 'heute'], ['woche', 'Woche', 'plan'], ['stunden', 'Stunden', 'stunden']];
    $('#leiste').innerHTML = punkte.map(([r, name, ic]) => `<a href="#${r}"${r === aktiv ? ' aria-current="page"' : ''}>${icon(ic)}<span>${name}</span></a>`).join('');
  }
  const vermerk = (art, text) => `<span class="vermerk v-${art}">${esc(text)}</span>`;
  function statusVermerk(e) {
    if (e.status === 'abgesagt') return vermerk('offen', 'abgesagt');
    if (e.status === 'laeuft') return vermerk('tinte', 'läuft');
    if (e.status === 'erledigt') return e.unterschrift ? vermerk('ok', 'unterschrieben') : e.papier ? vermerk('ok', 'Papier') : vermerk('fehler', 'Unterschrift fehlt');
    if (!e.helfer) return vermerk('warn', 'noch niemand');
    return e.datum < heute() ? vermerk('warn', 'nicht erfasst') : '';
  }
  // sicht: 'kunde' (Seite einer Kundin), 'person' (Seite einer Helferin) oder leer
  function einsatzZeile(e, mitDatum, sicht) {
    const k = kunde(e.kunde), p = person(e.helfer), was = e.taetigkeiten.map(taetigkeitName).join(', ');
    const titel = sicht === 'kunde' ? (p ? p.name : 'noch niemand') : kundenName(k);
    const unter = sicht === 'kunde' ? was : `${istBuero() && sicht !== 'person' ? (p ? vorname(p) : 'noch niemand') : (k ? k.strasse : '')} · ${was}`;
    const ok = e.status === 'erledigt' && (e.unterschrift || e.papier);
    const status = ok ? `<span class="ok-haken" title="${e.unterschrift ? 'unterschrieben' : 'Unterschrift auf Papier'}">${icon('haken')}<span class="sr">${e.unterschrift ? 'unterschrieben' : 'Unterschrift auf Papier'}</span></span>` : statusVermerk(e);
    return `<li><a class="zeile" href="#einsatz/${esc(e.id)}">
      <span class="zeile-zeit">${esc(e.von)}<small>${mitDatum ? esc(datumKurz(e.datum)) : 'bis ' + esc(e.bis)}</small></span>
      <span class="zeile-haupt"><span class="zeile-name">${esc(titel)}</span>${status ? ' ' + status : ''}<br><span class="zeile-unter">${esc(unter)}</span></span>
      ${icon('rechts', 'pfeil')}</a></li>`;
  }
  const unterschriftBild = (u, klein) => u ? `<svg class="unterschrift-bild" viewBox="0 0 600 200" role="img" aria-label="Unterschrift ${esc(u.name || '')}"${klein ? ' style="max-width:120px"' : ''}><path d="${esc(u.pfad)}"/></svg>` : '';

  /* ----- Büro: Heute ----- */
  function seiteBueroHeute() {
    const t = heute(), heuteListe = D.einsaetze.filter((e) => e.datum === t).sort((a, b) => a.von.localeCompare(b.von));
    const morgen = plusTage(t, 1), morgenListe = D.einsaetze.filter((e) => e.datum === morgen && e.status !== 'abgesagt');
    const fertig = heuteListe.filter((e) => e.status === 'erledigt').length;
    const h = hinweise();
    return `<div class="seitenkopf"><div><h1>Heute</h1><p>${esc(datumLang(t))} · ${heuteListe.length} ${heuteListe.length === 1 ? 'Einsatz' : 'Einsätze'}, ${fertig} erledigt</p></div>
      <button class="knopf knopf-zweit knopf-klein" data-a="einsatz-neu" data-datum="${t}">${icon('plus')}Einsatz</button></div>
      <div class="abschnitt"><h2>Zu erledigen</h2>${h.length ? `<span class="klein">${h.length} ${h.length === 1 ? 'Punkt' : 'Punkte'}</span>` : ''}</div>
      ${h.length ? `<div class="blatt"><ul class="zeilen aufgaben">${h.map(([art, titel, text, ziel]) => `<li><a class="zeile a-${art}" href="${esc(ziel)}">${icon('warnung')}
        <span class="zeile-haupt"><span class="zeile-titel">${esc(titel)}</span><br><span class="zeile-unter">${esc(text)}</span></span>${icon('rechts', 'pfeil')}</a></li>`).join('')}</ul></div>`
        : `<div class="hinweis h-ok">${icon('haken')}<span><strong>Alles erledigt</strong>Keine offenen Unterschriften, Abrechnungen oder Nachweise.</span></div>`}
      <div class="abschnitt"><h2>Einsätze heute</h2></div>
      <div class="blatt">${heuteListe.length ? `<ul class="zeilen">${heuteListe.map((e) => einsatzZeile(e)).join('')}</ul>` : '<p class="leer">Heute ist nichts geplant.</p>'}</div>
      <div class="abschnitt"><h2>Morgen</h2><a class="knopf knopf-still knopf-klein" href="#plan">Ganze Woche</a></div>
      <div class="blatt">${morgenListe.length ? `<ul class="zeilen">${morgenListe.map((e) => einsatzZeile(e)).join('')}</ul>` : '<p class="leer">Morgen ist nichts geplant.</p>'}</div>`;
  }

  /* ----- Büro: Plan (Woche) ----- */
  function seitePlan(start) {
    const mo = montagVon(start || heute()), t = heute();
    const tage = Array.from({ length: 7 }, (_, i) => plusTage(mo, i));
    return `<div class="seitenkopf"><div><h1>Plan</h1><p>Woche ${kalenderwoche(mo)}: ${esc(datumZahl(mo))} bis ${esc(datumZahl(tage[6]))}</p></div>
      <button class="knopf knopf-klein" data-a="einsatz-neu" data-datum="${mo <= t && t <= tage[6] ? t : mo}">${icon('plus')}Einsatz</button></div>
      <div class="woche-nav"><a class="knopf knopf-zweit knopf-klein" href="#plan/${plusTage(mo, -7)}" aria-label="Woche davor">${icon('links')}</a>
        <a class="knopf knopf-zweit knopf-klein" href="#plan/${montagVon(t)}">Diese Woche</a>
        <a class="knopf knopf-zweit knopf-klein" href="#plan/${plusTage(mo, 7)}" aria-label="Woche danach">${icon('rechts')}</a></div>
      ${tage.map((d) => {
        const liste = D.einsaetze.filter((e) => e.datum === d).sort((a, b) => a.von.localeCompare(b.von));
        return `<section class="tag${d === t ? ' tag-heute' : ''}"><div class="tag-kopf"><h3>${esc(datumKurz(d))}</h3>
          <button class="knopf knopf-still knopf-klein" data-a="einsatz-neu" data-datum="${d}" aria-label="Einsatz am ${esc(datumKurz(d))} planen">${icon('plus')}</button></div>
          <div class="blatt">${liste.length ? `<ul class="zeilen">${liste.map((e) => einsatzZeile(e)).join('')}</ul>` : '<p class="leer-tag">Nichts geplant</p>'}</div></section>`;
      }).join('')}`;
  }

  /* ----- Büro: Kundschaft ----- */
  function topfHTML(k, monat) {
    const a = abrechnung(k, monat), gesamt = a.summe + a.geplantSumme, deckung = a.deckung;
    const basis = Math.max(deckung, gesamt, 1);
    const verbr = Math.min(a.summe, deckung), gepl = Math.min(a.geplantSumme, Math.max(0, deckung - a.summe)), zuviel = Math.max(0, gesamt - deckung);
    const rest = Math.max(0, deckung - gesamt);
    return `<div class="topf"><div class="topf-balken" role="img" aria-label="Budget ${esc(monatName(monat))}: ${euro(a.summe)} erledigt, ${euro(a.geplantSumme)} geplant, ${euro(deckung)} von der Pflegekasse verfügbar">
      <span class="topf-verbraucht" style="width:${verbr / basis * 100}%"></span><span class="topf-geplant" style="width:${gepl / basis * 100}%"></span><span class="topf-zuviel" style="width:${zuviel / basis * 100}%"></span></div>
      <div class="topf-text"><span>${euro(a.summe)} erledigt${a.geplantSumme ? ` · ${euro(a.geplantSumme)} geplant` : ''}</span>
      <span>${zuviel > 0 ? `<strong style="color:var(--rot)">${euro(zuviel)} selbst zahlen</strong>` : `noch ${euro(rest)} frei${rest >= D.firma.satz ? `, reicht für etwa ${Math.floor(rest / D.firma.satz)}\u00a0Std.` : ''}`}</span></div></div>`;
  }
  function seiteKunden() {
    const m = monatVon(heute()), liste = D.kunden.slice().sort((a, b) => (b.aktiv - a.aktiv) || a.name.localeCompare(b.name));
    return `<div class="seitenkopf"><div><h1>Kundschaft</h1><p>${liste.filter((k) => k.aktiv).length} aktiv · Budget im ${esc(MONATE[Number(m.slice(5)) - 1])}</p></div>
      <button class="knopf knopf-klein" data-a="kunde-neu">${icon('plus')}Kunde</button></div>
      <div class="blatt">${liste.length ? `<ul class="zeilen">${liste.map((k) => `<li><a class="zeile" href="#kunde/${esc(k.id)}"><span class="zeile-haupt">
        <span class="zeile-name">${esc(kundenName(k))}</span> ${k.aktiv ? '' : vermerk('offen', 'pausiert')} ${k.abtretung ? '' : vermerk('fehler', 'Abtretung fehlt')}<br>
        <span class="zeile-unter">Pflegegrad ${esc(k.pflegegrad)} · ${esc(k.kasse)} · ${esc(k.strasse)}</span>${k.aktiv ? topfHTML(k, m) : ''}</span>${icon('rechts', 'pfeil')}</a></li>`).join('')}</ul>`
        : `<div class="leer">Noch keine Kundschaft.<br><button class="knopf" data-a="kunde-neu">${icon('plus')}Erste Kundin, ersten Kunden anlegen</button></div>`}</div>`;
  }
  function seiteKunde(kid) {
    const k = kunde(kid); if (!k) return nichtGefunden();
    const t = heute(), m = monatVon(t), a = abrechnung(k, m);
    const naechste = D.einsaetze.filter((e) => e.kunde === kid && e.datum >= t && e.status !== 'abgesagt').slice(0, 5);
    const letzte = D.einsaetze.filter((e) => e.kunde === kid && e.datum < t).slice(-5).reverse();
    return `<p class="nicht-drucken"><a href="#kunden" class="knopf knopf-still knopf-klein">${icon('links')}Kundschaft</a></p>
      <div class="seitenkopf"><div><h1>${esc(kundenName(k))}</h1><p>Pflegegrad ${esc(k.pflegegrad)} · ${esc(k.kasse)}</p></div>
        <div class="knopfreihe" style="margin:0"><button class="knopf knopf-zweit knopf-klein" data-a="kunde-bearbeiten" data-id="${esc(k.id)}">${icon('stift')}Bearbeiten</button>
        <button class="knopf knopf-klein" data-a="einsatz-neu" data-kunde="${esc(k.id)}" data-datum="${t}">${icon('plus')}Einsatz</button></div></div>
      <div class="zwei-spalten">
        <div class="blatt blatt-innen"><h3>Kontakt</h3><p style="margin-top:8px">${esc(k.strasse)}<br>${esc(k.ort)}</p>
          ${k.telefon ? `<p><a href="tel:${esc(k.telefon.replace(/\s/g, ''))}">${esc(k.telefon)}</a></p>` : ''}${k.angehoerige ? `<p class="klein">Angehörige: ${esc(k.angehoerige)}</p>` : ''}</div>
        <div class="blatt blatt-innen"><h3>Pflegekasse</h3><div class="nachweis-karte" style="margin-top:8px"><dl>
          <dt>Kasse</dt><dd>${esc(k.kasse)}</dd><dt>Versicherten-Nr.</dt><dd>${esc(k.versnr || '–')}</dd>
          <dt>Abtretung</dt><dd>${k.abtretung ? 'liegt vor seit ' + esc(datumZahl(k.abtretung)) : '<span style="color:var(--rot)">fehlt</span>'}</dd></dl></div></div>
      </div>
      <div class="blatt blatt-innen" style="margin-top:12px"><h3>Budget im ${esc(monatName(m))}</h3>
        <p class="klein" style="margin:6px 0 0">Von der Pflegekasse verfügbar: <strong>${euro(a.deckung)}</strong> (Entlastungsbetrag ${euro(a.topf.verfuegbar)}${a.topf.umwandlung ? `, Umwandlung ${euro(a.topf.umwandlung)}` : ''}).
        Grundlage: Guthaben ${euro(k.guthaben || 0)} laut Pflegekasse im ${esc(k.stand ? monatName(k.stand) : '–')}, dazu ${euro(D.firma.entlastung)} je Monat.${k.zuzahlung ? ' Zahlt den Rest selbst (abgesprochen).' : ''}</p>
        ${topfHTML(k, m)}${a.topf.neuesJahr ? `<p class="klein" style="margin-top:8px">${icon('info')} Neues Jahr: Guthaben bei der Pflegekasse erfragen und unter „Bearbeiten“ eintragen (Reste aus dem Vorjahr verfallen am 30. Juni).</p>` : ''}
        <div class="knopfreihe"><a class="knopf knopf-zweit knopf-klein" href="#nachweis/${esc(k.id)}/${plusMonate(m, -1)}">${icon('abrechnung')}Nachweis ${esc(monatName(plusMonate(m, -1)))}</a>
        <a class="knopf knopf-zweit knopf-klein" href="#nachweis/${esc(k.id)}/${m}">${icon('abrechnung')}Nachweis ${esc(monatName(m))}</a></div></div>
      ${k.hinweise ? `<div class="hinweis h-ok" style="margin-top:12px">${icon('info')}<span><strong>Hinweise für Einsätze</strong>${esc(k.hinweise)}</span></div>` : ''}
      <div class="abschnitt"><h2>Nächste Einsätze</h2></div><div class="blatt">${naechste.length ? `<ul class="zeilen">${naechste.map((e) => einsatzZeile(e, true, 'kunde')).join('')}</ul>` : '<p class="leer">Nichts geplant.</p>'}</div>
      <div class="abschnitt"><h2>Zuletzt</h2></div><div class="blatt">${letzte.length ? `<ul class="zeilen">${letzte.map((e) => einsatzZeile(e, true, 'kunde')).join('')}</ul>` : '<p class="leer">Noch keine Einsätze.</p>'}</div>`;
  }

  /* ----- Büro: Team ----- */
  function minijobHTML(p, monat) {
    const l = lohnMonat(p.id, monat, true), erl = lohnMonat(p.id, monat, false), grenze = D.firma.minijob || 603, basis = Math.max(grenze, l.lohn);
    return `<div class="topf"><div class="topf-balken" role="img" aria-label="Minijob ${esc(monatName(monat))}: ${euro(erl.lohn)} erledigt, ${euro(l.lohn)} mit geplanten Einsätzen, Grenze ${euro(grenze)}">
      <span class="topf-verbraucht" style="width:${Math.min(erl.lohn, grenze) / basis * 100}%"></span><span class="topf-geplant" style="width:${Math.max(0, Math.min(l.lohn, grenze) - erl.lohn) / basis * 100}%"></span>
      <span class="topf-zuviel" style="width:${Math.max(0, l.lohn - grenze) / basis * 100}%"></span></div>
      <div class="topf-text"><span>${std(l.min)} · ${euro(l.lohn)} mit Geplantem</span><span>Grenze ${euro(grenze)}</span></div></div>`;
  }
  function seiteTeam() {
    const m = monatVon(heute()), liste = helfende();
    return `<div class="seitenkopf"><div><h1>Team</h1><p>${liste.length} Helfende · Stunden im ${esc(MONATE[Number(m.slice(5)) - 1])}</p></div>
      <button class="knopf knopf-klein" data-a="person-neu">${icon('plus')}Person</button></div>
      <div class="blatt">${liste.length ? `<ul class="zeilen">${liste.map((p) => { const n = nachweise(p); return `<li><a class="zeile" href="#person/${esc(p.id)}"><span class="zeile-haupt">
        <span class="zeile-name">${esc(p.name)}</span> ${n.length ? n.map((x) => vermerk(x.art === 'bald' ? 'warn' : 'fehler', x.art === 'fehlt' ? x.name + ' fehlt' : x.name)).join(' ') : vermerk('ok', 'Nachweise da')}<br>
        <span class="zeile-unter">${euro(p.lohn)} je Std.${p.minijob ? ' · Minijob' : ''}${p.notiz ? ' · ' + esc(p.notiz) : ''}</span>${p.minijob ? minijobHTML(p, m) : ''}</span>${icon('rechts', 'pfeil')}</a></li>`; }).join('')}</ul>`
        : `<div class="leer">Noch niemand im Team.<br><button class="knopf" data-a="person-neu">${icon('plus')}Erste Person anlegen</button></div>`}</div>
      <p class="klein" style="margin-top:12px">Für die Anerkennung in Niedersachsen brauchen alle Helfenden eine Schulung (mind. 30 Std.), einen Erste-Hilfe-Kurs und ein erweitertes Führungszeugnis.</p>`;
  }
  function seitePerson(pid) {
    const p = person(pid); if (!p || p.rolle !== 'helfer') return nichtGefunden();
    const t = heute(), m = monatVon(t), n = nachweise(p);
    const naechste = D.einsaetze.filter((e) => e.helfer === pid && e.datum >= t && e.status !== 'abgesagt').slice(0, 8);
    const zeile = (name, datum, hinweis) => `<dt>${name}</dt><dd>${datum ? esc(datumZahl(datum)) : '<span style="color:var(--rot)">fehlt</span>'}${hinweis ? ` <span class="klein">${hinweis}</span>` : ''}</dd>`;
    return `<p><a href="#team" class="knopf knopf-still knopf-klein">${icon('links')}Team</a></p>
      <div class="seitenkopf"><div><h1>${esc(p.name)}</h1><p>${euro(p.lohn)} je Stunde${p.minijob ? ' · Minijob' : ''}</p></div>
        <button class="knopf knopf-zweit knopf-klein" data-a="person-bearbeiten" data-id="${esc(p.id)}">${icon('stift')}Bearbeiten</button></div>
      ${n.map((x) => `<div class="hinweis h-${x.art === 'bald' ? 'warn' : 'fehler'}">${icon('warnung')}<span><strong>${esc(x.text)}</strong></span></div>`).join('')}
      <div class="zwei-spalten" style="margin-top:12px">
        <div class="blatt blatt-innen"><h3>Kontakt</h3>${p.telefon ? `<p style="margin-top:8px"><a href="tel:${esc(p.telefon.replace(/\s/g, ''))}">${esc(p.telefon)}</a></p>` : '<p class="klein" style="margin-top:8px">Keine Telefonnummer</p>'}${p.notiz ? `<p class="klein">${esc(p.notiz)}</p>` : ''}</div>
        <div class="blatt blatt-innen nachweis-karte"><h3>Nachweise</h3><dl style="margin-top:8px">${zeile('Schulung', p.schulung)}${zeile('Erste Hilfe', p.ersteHilfe, p.ersteHilfe ? '(2 Jahre gültig)' : '')}${zeile('Führungszeugnis', p.fz)}</dl></div>
      </div>
      ${p.minijob ? `<div class="blatt blatt-innen" style="margin-top:12px"><h3>Minijob im ${esc(monatName(m))}</h3>${minijobHTML(p, m)}</div>` : ''}
      <div class="abschnitt"><h2>Nächste Einsätze</h2></div><div class="blatt">${naechste.length ? `<ul class="zeilen">${naechste.map((e) => einsatzZeile(e, true, 'person')).join('')}</ul>` : '<p class="leer">Nichts geplant.</p>'}</div>`;
  }

  /* ----- Büro: Abrechnung ----- */
  function seiteAbrechnung(monat) {
    const m = monat || plusMonate(monatVon(heute()), -1);
    const zeilen = D.kunden.map((k) => ({ k, a: abrechnung(k, m) })).filter((x) => x.a.liste.length || x.a.rechnung);
    const summe = zeilen.reduce((s, x) => s + x.a.summe, 0), kasse = zeilen.reduce((s, x) => s + x.a.kasse, 0);
    const team = helfende().map((p) => ({ p, l: lohnMonat(p.id, m, false) })).filter((x) => x.l.min);
    return `<div class="seitenkopf"><div><h1>Abrechnung</h1><p>${esc(monatName(m))} · ${euro(summe)}, davon ${euro(kasse)} von den Pflegekassen</p></div></div>
      <div class="woche-nav"><a class="knopf knopf-zweit knopf-klein" href="#abrechnung/${plusMonate(m, -1)}" aria-label="Monat davor">${icon('links')}</a>
        <span class="knopf knopf-still knopf-klein" style="pointer-events:none">${esc(monatName(m))}</span>
        <a class="knopf knopf-zweit knopf-klein" href="#abrechnung/${plusMonate(m, 1)}" aria-label="Monat danach">${icon('rechts')}</a></div>
      <div class="abschnitt"><h2>Leistungsnachweise</h2></div>
      <div class="blatt">${zeilen.length ? `<ul class="zeilen">${zeilen.map(({ k, a }) => `<li><a class="zeile" href="#nachweis/${esc(k.id)}/${m}"><span class="zeile-haupt">
        <span class="zeile-name">${esc(kundenName(k))}</span><br><span class="zeile-unter">${a.liste.length} Einsätze · ${std(a.min)} · ${euro(a.summe)}${a.selbst > 0 ? ` · ${euro(a.selbst)} selbst` : ''}</span></span>
        ${a.rechnung ? vermerk('ok', 'abgerechnet') : a.ohneUnterschrift ? vermerk('fehler', a.ohneUnterschrift + ' ohne Unterschrift') : vermerk('offen', 'offen')}${icon('rechts', 'pfeil')}</a></li>`).join('')}</ul>`
        : '<p class="leer">In diesem Monat gibt es nichts abzurechnen.</p>'}</div>
      <div class="abschnitt"><h2>Löhne</h2><button class="knopf knopf-still knopf-klein" data-a="lohn-csv" data-monat="${m}">${icon('datei')}Liste für die Lohnabrechnung</button></div>
      <div class="blatt">${team.length ? `<div class="tabelle-huelle"><table class="tabelle"><thead><tr><th>Name</th><th class="r">Stunden</th><th class="r">Lohn</th><th>Minijob</th></tr></thead><tbody>
        ${team.map(({ p, l }) => `<tr><td>${esc(p.name)}</td><td class="r">${std(l.min)}</td><td class="r">${euro(l.lohn)}</td><td>${p.minijob ? (l.lohn > (D.firma.minijob || 603) ? vermerk('fehler', 'über der Grenze') : vermerk('ok', 'passt')) : '–'}</td></tr>`).join('')}
        </tbody></table></div>` : '<p class="leer">Keine erledigten Einsätze.</p>'}</div>
      <p class="klein" style="margin-top:12px">Die Lohnliste gibst du deiner Steuerberatung für die Lohnabrechnung und die Meldung an die Minijob-Zentrale.</p>`;
  }
  function seiteNachweis(kid, m) {
    const k = kunde(kid); if (!k) return nichtGefunden();
    const a = abrechnung(k, m), f = D.firma, r = a.rechnung;
    const zeilen = r ? r.einsaetze.map(einsatz).filter(Boolean) : a.liste;
    const umwTeil = r ? (r.umwandlung || 0) : Math.min(a.topf.umwandlung, a.kasse);
    return `<div class="nicht-drucken"><p><a href="#abrechnung/${m}" class="knopf knopf-still knopf-klein">${icon('links')}Abrechnung ${esc(monatName(m))}</a></p>
      ${a.ohneUnterschrift && !r ? `<div class="hinweis h-fehler">${icon('warnung')}<span><strong>${a.ohneUnterschrift} ${a.ohneUnterschrift === 1 ? 'Einsatz' : 'Einsätze'} ohne Unterschrift</strong>Erst nachholen oder Papier-Nachweis vermerken, dann abrechnen.</span></div>` : ''}
      ${!k.abtretung ? `<div class="hinweis h-fehler">${icon('warnung')}<span><strong>Abtretungserklärung fehlt</strong>Ohne sie zahlt die Pflegekasse nicht direkt an dich. Dann bekommt die Kundin oder der Kunde die Rechnung und reicht sie selbst ein.</span></div>` : ''}
      <div class="knopfreihe" style="margin-bottom:14px"><button class="knopf knopf-zweit" data-a="drucken">${icon('drucken')}Drucken oder als PDF</button>
      ${r ? `<button class="knopf knopf-still" data-a="rechnung-zurueck" data-id="${esc(r.id)}">Wieder auf „offen“ setzen</button>`
        : `<button class="knopf" data-a="rechnung-anlegen" data-kunde="${esc(k.id)}" data-monat="${m}"${!a.liste.length || a.ohneUnterschrift ? ' disabled' : ''}>${icon('haken')}Als abgerechnet markieren</button>`}</div></div>
      <article class="dokument">
        <div class="dok-kopf"><div><span class="marke-name">${esc(f.name)} ${esc(f.zusatz)}</span><br>${esc(f.inhaber)}<br>${esc(f.anschrift)}<br>${esc(f.telefon)} · ${esc(f.email)}</div>
          <div style="text-align:right">IK ${esc(f.ik || '–')}${f.steuernr ? `<br>Steuernummer ${esc(f.steuernr)}` : ''}<br><span class="klein" style="color:#555">${esc(f.anerkennung || '')}</span></div></div>
        <h1>Leistungsnachweis und Rechnung${r ? ' Nr. ' + esc(r.nr) : ''}</h1>
        <p style="margin:4px 0 14px">Angebot zur Unterstützung im Alltag (§ 45a SGB XI), Abrechnung über den Entlastungsbetrag (§ 45b SGB XI)</p>
        <dl class="dok-bloecke"><div><dt>Versicherte Person</dt><dd><strong>${esc(kundenName(k))}</strong><br>${esc(k.strasse)}, ${esc(k.ort)}</dd>
          <dt>Pflegegrad</dt><dd>${esc(k.pflegegrad)}</dd></div>
          <div><dt>Pflegekasse</dt><dd>${esc(k.kasse)}</dd><dt>Versichertennummer</dt><dd>${esc(k.versnr || '–')}</dd>
          <dt>Zeitraum</dt><dd>${esc(monatName(m))}</dd><dt>Rechnungsdatum</dt><dd>${esc(datumZahl(r ? r.datum : heute()))}</dd></div></dl>
        <div class="tabelle-huelle"><table class="tabelle"><thead><tr><th>Datum</th><th>Zeit</th><th class="r">Dauer</th><th>Leistung</th><th>Helfende</th><th>Bestätigt</th></tr></thead><tbody>
          ${zeilen.length ? zeilen.map((e) => { const z = e.ist || e; const p = person(e.helfer); return `<tr><td>${esc(datumZahl(e.datum))}</td><td>${esc(z.von)}–${esc(z.bis)}</td><td class="r">${std(abrechenbar(e))}</td>
            <td>${esc(e.taetigkeiten.map(taetigkeitName).join(', '))}</td><td>${esc(p ? p.name : '–')}</td><td>${e.unterschrift ? unterschriftBild(e.unterschrift, true) : e.papier ? 'auf Papier' : '<strong style="color:#A3302B">fehlt</strong>'}</td></tr>`; }).join('')
            : '<tr><td colspan="6">Keine erledigten Einsätze in diesem Monat.</td></tr>'}</tbody></table></div>
        <div class="dok-summe">
          <div><span>${std(a.min)} × ${euro(f.satz)}</span><span>${euro(a.min / 60 * f.satz)}</span></div>
          ${f.anfahrt ? `<div><span>Anfahrt ${zeilen.length} × ${euro(f.anfahrt)}</span><span>${euro(zeilen.length * f.anfahrt)}</span></div>` : ''}
          <div class="gross"><span>Gesamt</span><span>${euro(r ? r.summe : a.summe)}</span></div>
          <div><span>davon an die Pflegekasse</span><span>${euro(a.kasse)}</span></div>
          ${umwTeil > 0 ? `<div class="unter"><span>Entlastungsbetrag (§ 45b SGB XI)</span><span>${euro(a.kasse - umwTeil)}</span></div><div class="unter"><span>Umwandlung (§ 45a Abs. 4 SGB XI)</span><span>${euro(umwTeil)}</span></div>` : ''}
          <div><span>Eigenanteil der versicherten Person</span><span>${euro(a.selbst)}</span></div>
        </div>
        <div class="dok-fuss"><p>${esc(f.ustText || '')}</p>
          ${k.abtretung ? `<p>Die versicherte Person hat ihren Anspruch auf Erstattung am ${esc(datumZahl(k.abtretung))} an ${esc(f.name)} ${esc(f.zusatz)} abgetreten. Bitte zahlen Sie den Kassenanteil auf unser Konto.</p>` : ''}
          <p>Die Leistungen wurden von der versicherten Person (oder Angehörigen) mit Unterschrift auf dem Handy bestätigt.</p>
          ${r ? `<p class="stempel-zeile"><span class="stempel">abgerechnet am ${esc(datumZahl(r.datum))}</span></p>` : ''}</div>
      </article>`;
  }

  /* ----- Büro: Einstellungen ----- */
  function seiteEinstellungen() {
    const f = D.firma;
    const feld = (name, label, wert, typ = 'text', extra = '') => `<label class="feld${extra.includes('voll') ? ' feld-voll' : ''}"><span>${label}</span><input name="${name}" type="${typ}" value="${esc(wert == null ? '' : wert)}"${typ === 'number' ? ' step="0.01" min="0" inputmode="decimal"' : ''}></label>`;
    return `<p><a href="#heute" class="knopf knopf-still knopf-klein">${icon('links')}Heute</a></p><div class="seitenkopf"><div><h1>Einstellungen</h1><p>Angaben für Leistungsnachweise und Rechnungen</p></div></div>
      <form class="blatt blatt-innen" data-form="firma"><div class="felder">
        ${feld('name', 'Name der Firma', f.name)}${feld('zusatz', 'Zusatz', f.zusatz)}
        ${feld('inhaber', 'Inhaberin, Inhaber', f.inhaber)}${feld('telefon', 'Telefon', f.telefon, 'tel')}
        ${feld('anschrift', 'Anschrift', f.anschrift, 'text', 'voll')}${feld('email', 'E-Mail', f.email, 'email')}
        ${feld('ik', 'IK-Nummer (für die Pflegekassen)', f.ik)}${feld('steuernr', 'Steuernummer', f.steuernr)}
        ${feld('anerkennung', 'Anerkennung (Aktenzeichen, Datum)', f.anerkennung, 'text', 'voll')}
        ${feld('satz', 'Preis je Stunde (€)', f.satz, 'number')}${feld('anfahrt', 'Anfahrt je Einsatz (€)', f.anfahrt, 'number')}
        <label class="feld"><span>Abrechnen in Schritten von</span><select name="takt">${[5, 10, 15, 30].map((x) => `<option value="${x}"${f.takt === x ? ' selected' : ''}>${x} Minuten (aufgerundet)</option>`).join('')}</select></label>
        ${feld('entlastung', 'Entlastungsbetrag je Monat (€)', f.entlastung, 'number')}
        ${feld('minijob', 'Minijob-Grenze je Monat (€)', f.minijob, 'number')}
        ${feld('ustText', 'Satz zur Umsatzsteuer auf der Rechnung', f.ustText, 'text', 'voll')}
      </div><div class="knopfreihe"><button class="knopf" type="submit">${icon('haken')}Speichern</button></div></form>
      <p class="klein" style="margin-top:12px">Preise für den Entlastungsbetrag müssen zu den Vorgaben deines Bundeslandes passen. Die Angaben zur Umsatzsteuer bitte von der Steuerberatung bestätigen lassen.</p>`;
  }

  /* ----- Gemeinsam: Einsatz ----- */
  function seiteEinsatz(eid) {
    const e = einsatz(eid); if (!e) return nichtGefunden();
    const k = kunde(e.kunde), p = person(e.helfer), buero = istBuero();
    if (!buero && e.helfer !== ui.rolle) return nichtGefunden();
    const zurueck = buero ? `#plan/${montagVon(e.datum)}` : '#heute';
    const z = e.ist || {};
    let aktion = '';
    if (!buero) {
      if (e.status === 'geplant') aktion = `<button class="knopf knopf-breit" data-a="angekommen" data-id="${esc(e.id)}">${icon('haken')}Ich bin da (Beginn ${jetztZeit()})</button>
        <button class="knopf knopf-still knopf-breit" data-a="absagen" data-id="${esc(e.id)}" style="margin-top:6px">Kann nicht stattfinden</button>`;
      else if (e.status === 'laeuft') aktion = `<button class="knopf knopf-breit" data-a="fertig" data-id="${esc(e.id)}">${icon('haken')}Fertig (Ende ${jetztZeit()})</button>`;
      else if (e.status === 'erledigt' && !e.unterschrift && !e.papier) aktion = `<a class="knopf knopf-breit" href="#unterschrift/${esc(e.id)}">${icon('stift')}Unterschrift einholen</a>`;
    } else if (e.status === 'erledigt' && !e.unterschrift && !e.papier) {
      aktion = `<button class="knopf knopf-zweit knopf-breit" data-a="papier" data-id="${esc(e.id)}">${icon('haken')}Unterschrift liegt auf Papier vor</button>`;
    }
    const zeitenAendern = (e.status === 'laeuft' || (e.status === 'erledigt' && !e.unterschrift)) ? `<form class="felder" data-form="zeiten" data-id="${esc(e.id)}" style="margin-top:12px">
      <label class="feld"><span>Beginn</span><input type="time" name="von" value="${esc(z.von || e.von)}" required></label>
      <label class="feld"><span>Ende</span><input type="time" name="bis" value="${esc(z.bis || '')}"${e.status === 'erledigt' ? ' required' : ''}></label>
      <div class="feld-voll"><button class="knopf knopf-zweit knopf-klein" type="submit">Zeiten speichern</button></div></form>` : '';
    return `<p><a href="${zurueck}" class="knopf knopf-still knopf-klein">${icon('links')}${buero ? 'Plan' : 'Heute'}</a></p>
      <div class="seitenkopf"><div><h1>${esc(kundenName(k))}</h1><p>${esc(datumLang(e.datum))}, ${esc(e.von)} bis ${esc(e.bis)} ${statusVermerk(e)}</p></div>
        ${buero ? `<button class="knopf knopf-zweit knopf-klein" data-a="einsatz-bearbeiten" data-id="${esc(e.id)}">${icon('stift')}Bearbeiten</button>` : ''}</div>
      <div class="blatt blatt-innen"><div class="kb-adresse">${esc(k.strasse)}, ${esc(k.ort)}</div>
        <div class="kb-knoepfe">${k.telefon ? `<a class="knopf knopf-zweit knopf-klein" href="tel:${esc(k.telefon.replace(/\s/g, ''))}">${icon('telefon')}Anrufen</a>` : ''}
          <a class="knopf knopf-zweit knopf-klein" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(k.strasse + ', ' + k.ort)}" target="_blank" rel="noopener">${icon('ort')}Weg zeigen</a></div>
        ${buero ? `<p class="klein" style="margin-top:12px">Helfende: <strong>${esc(p ? p.name : 'noch niemand')}</strong></p>` : ''}
        ${e.notiz ? `<p style="margin-top:10px">${esc(e.notiz)}</p>` : ''}</div>
      ${k.hinweise ? `<div class="hinweis h-ok" style="margin-top:12px">${icon('info')}<span><strong>Gut zu wissen</strong>${esc(k.hinweise)}</span></div>` : ''}
      ${k.angehoerige ? `<p class="klein" style="margin-top:10px">Angehörige: ${esc(k.angehoerige)}</p>` : ''}
      <div class="blatt blatt-innen" style="margin-top:12px"><form data-form="taetigkeiten" data-id="${esc(e.id)}"><fieldset><legend>Was wird gemacht?</legend><div class="haken">
        ${TAETIGKEITEN.map(([w, n]) => `<label><input type="checkbox" name="t" value="${w}"${e.taetigkeiten.includes(w) ? ' checked' : ''}${e.unterschrift || e.status === 'abgesagt' ? ' disabled' : ''}>${esc(n)}</label>`).join('')}</div></fieldset></form>
        ${z.von ? `<p style="margin-top:12px">Erfasst: ${esc(z.von)}${z.bis ? ' bis ' + esc(z.bis) + ` (${std(dauer(e))}, abgerechnet ${std(abrechenbar(e))})` : ' bis jetzt'}</p>` : ''}
        ${zeitenAendern}
        ${e.status === 'abgesagt' ? `<p style="margin-top:12px">Abgesagt${e.grund ? ': ' + esc(e.grund) : ''}</p>` : ''}
        ${e.unterschrift ? `<hr class="trenn"><p class="klein">Bestätigt von ${esc(e.unterschrift.name)}${e.unterschrift.zeit ? ', ' + esc(datumZahl(e.unterschrift.zeit.slice(0, 10))) + ' ' + esc(e.unterschrift.zeit.slice(11, 16)) : ''}</p>${unterschriftBild(e.unterschrift)}` : ''}
        ${aktion ? `<div style="margin-top:14px">${aktion}</div>` : ''}</div>`;
  }

  /* ----- Helfende ----- */
  function seiteHelferHeute() {
    const p = person(ui.rolle), t = heute();
    const meine = D.einsaetze.filter((e) => e.helfer === p.id && e.status !== 'abgesagt');
    const heuteListe = meine.filter((e) => e.datum === t).sort((a, b) => a.von.localeCompare(b.von));
    const jetzt = jetztZeit();
    const aktiv = heuteListe.find((e) => e.status === 'laeuft') || heuteListe.find((e) => e.status === 'geplant' && e.bis >= jetzt) || heuteListe.find((e) => e.status === 'geplant');
    const offenU = meine.filter((e) => e.status === 'erledigt' && !e.unterschrift && !e.papier);
    const naechster = !aktiv ? meine.filter((e) => e.datum > t).sort((a, b) => (a.datum + a.von).localeCompare(b.datum + b.von))[0] : null;
    const kb = (e) => { const k = kunde(e.kunde); return `<div class="klemmbrett"><div class="blatt blatt-innen">
      <div class="kb-kopf"><span class="kb-zeit">${esc(e.von)}</span><span class="klein">bis ${esc(e.bis)} · ${e.datum === t ? 'heute' : esc(datumKurz(e.datum))}</span>${statusVermerk(e)}</div>
      <div class="kb-name">${esc(kundenName(k))}</div><div class="kb-adresse">${esc(k.strasse)}, ${esc(k.ort)}</div>
      <p class="klein" style="margin:6px 0 0">${esc(e.taetigkeiten.map(taetigkeitName).join(', '))}</p>
      <div class="kb-knoepfe">${k.telefon ? `<a class="knopf knopf-zweit knopf-klein" href="tel:${esc(k.telefon.replace(/\s/g, ''))}">${icon('telefon')}Anrufen</a>` : ''}
        <a class="knopf knopf-zweit knopf-klein" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(k.strasse + ', ' + k.ort)}" target="_blank" rel="noopener">${icon('ort')}Weg zeigen</a></div>
      <a class="knopf knopf-breit" href="#einsatz/${esc(e.id)}" style="margin-top:8px">${e.status === 'laeuft' ? 'Einsatz läuft: öffnen' : 'Einsatz öffnen'}</a></div></div>`; };
    return `<div class="seitenkopf"><div><h1>Hallo ${esc(vorname(p))}</h1><p>${esc(datumLang(t))} · ${heuteListe.length ? `${heuteListe.length} ${heuteListe.length === 1 ? 'Einsatz' : 'Einsätze'} heute` : 'heute frei'}</p></div></div>
      ${offenU.length ? `<a class="hinweis h-fehler" href="#unterschrift/${esc(offenU[0].id)}">${icon('stift')}<span><strong>${offenU.length === 1 ? 'Eine Unterschrift fehlt' : offenU.length + ' Unterschriften fehlen'}</strong>Beim nächsten Besuch nachholen: ${esc(kundenName(kunde(offenU[0].kunde)))}, ${esc(datumKurz(offenU[0].datum))}</span></a>` : ''}
      ${aktiv ? kb(aktiv) : naechster ? `<p style="margin-top:18px">Dein nächster Einsatz:</p>${kb(naechster)}` : '<div class="blatt"><p class="leer">Keine Einsätze geplant. Das Büro meldet sich.</p></div>'}
      ${heuteListe.length > 1 || (heuteListe.length && !aktiv) ? `<div class="abschnitt"><h2>Heute</h2></div><div class="blatt"><ul class="zeilen">${heuteListe.map((e) => einsatzZeile(e)).join('')}</ul></div>` : ''}`;
  }
  function seiteHelferWoche() {
    const p = person(ui.rolle), t = heute();
    const tage = Array.from({ length: 14 }, (_, i) => plusTage(t, i));
    const meine = D.einsaetze.filter((e) => e.helfer === p.id && e.status !== 'abgesagt' && e.datum >= t && e.datum <= tage[13]);
    return `<div class="seitenkopf"><div><h1>Die nächsten zwei Wochen</h1><p>${meine.length} Einsätze · ${std(meine.reduce((s, e) => s + dauer(e), 0))}</p></div></div>
      ${tage.map((d) => { const l = meine.filter((e) => e.datum === d).sort((a, b) => a.von.localeCompare(b.von)); return l.length ? `<section class="tag${d === t ? ' tag-heute' : ''}"><div class="tag-kopf"><h3>${esc(datumKurz(d))}</h3></div>
        <div class="blatt"><ul class="zeilen">${l.map((e) => einsatzZeile(e)).join('')}</ul></div></section>` : ''; }).join('') || '<div class="blatt"><p class="leer">Nichts geplant.</p></div>'}`;
  }
  function seiteHelferStunden(monat) {
    const p = person(ui.rolle), m = monat || monatVon(heute()), l = lohnMonat(p.id, m, false);
    return `<div class="seitenkopf"><div><h1>Meine Stunden</h1><p>${esc(monatName(m))}</p></div></div>
      <div class="woche-nav"><a class="knopf knopf-zweit knopf-klein" href="#stunden/${plusMonate(m, -1)}" aria-label="Monat davor">${icon('links')}</a>
        <a class="knopf knopf-zweit knopf-klein" href="#stunden/${monatVon(heute())}">Dieser Monat</a>
        <a class="knopf knopf-zweit knopf-klein" href="#stunden/${plusMonate(m, 1)}" aria-label="Monat danach">${icon('rechts')}</a></div>
      <div class="zwei-spalten" style="margin-top:14px"><div class="blatt blatt-innen"><span class="klein">Gearbeitet</span><div class="kennzahl">${std(l.min)}</div></div>
        <div class="blatt blatt-innen"><span class="klein">Verdient (brutto)</span><div class="kennzahl">${euro(l.lohn)}</div></div></div>
      ${p.minijob ? `<div class="blatt blatt-innen" style="margin-top:12px"><h3>Minijob</h3>${minijobHTML(p, m)}</div>` : ''}
      <div class="abschnitt"><h2>Erledigt</h2></div>
      <div class="blatt">${l.liste.length ? `<ul class="zeilen">${l.liste.map((e) => einsatzZeile(e, true)).join('')}</ul>` : '<p class="leer">Noch nichts erledigt.</p>'}</div>`;
  }
  function seiteUnterschrift(eid) {
    const e = einsatz(eid); if (!e || (!istBuero() && e.helfer !== ui.rolle)) return nichtGefunden();
    const k = kunde(e.kunde), p = person(e.helfer), z = e.ist || e;
    return `<p><a href="#einsatz/${esc(e.id)}" class="knopf knopf-still knopf-klein">${icon('links')}Zurück</a></p>
      <div class="klemmbrett"><div class="blatt blatt-innen nachweis-karte">
        <h2>Leistungsnachweis</h2><p class="klein" style="margin-top:4px">Bitte prüfen und unterschreiben.</p>
        <dl><dt>Für</dt><dd>${esc(kundenName(k))}</dd><dt>Datum</dt><dd>${esc(datumLang(e.datum))}</dd><dt>Zeit</dt><dd>${esc(z.von)} bis ${esc(z.bis)} (${std(dauer(e))})</dd>
          <dt>Geholfen bei</dt><dd>${esc(e.taetigkeiten.map(taetigkeitName).join(', '))}</dd><dt>Von</dt><dd>${esc(p ? p.name : '')}</dd></dl>
        <div class="unterschrift-feld" id="u-feld"><span class="unterschrift-x" aria-hidden="true">×</span><span class="unterschrift-linie"></span>
          <span class="unterschrift-text">Unterschrift ${esc(kundenName(k))}</span><canvas id="u-flaeche" aria-label="Hier mit dem Finger unterschreiben"></canvas></div>
        <label class="feld" style="margin-top:12px"><span>Unterschrieben von</span><input id="u-name" value="${esc(kundenName(k))}" autocomplete="off"></label>
        <div class="knopfreihe"><button class="knopf knopf-zweit" data-a="u-leeren">Neu</button><button class="knopf" data-a="u-fertig" data-id="${esc(e.id)}" disabled id="u-ok">${icon('haken')}Bestätigen</button></div>
      </div></div>
      <p class="klein" style="margin-top:12px">Kann die Kundin oder der Kunde nicht unterschreiben, dürfen Angehörige unterschreiben (Namen oben ändern). Sonst unterschreibt sie oder er beim nächsten Mal auf Papier, dann im Büro Bescheid sagen.</p>`;
  }
  function nichtGefunden() { return `<div class="blatt"><div class="leer">Das gibt es hier nicht (mehr).<br><a class="knopf" href="#heute">Zur Übersicht</a></div></div>`; }

  /* ===== Weiterleiten ===== */
  function zeigen() {
    const [route, a, b] = (location.hash.slice(1) || 'heute').split('/');
    const buero = istBuero();
    rolleAnzeigen();
    let html = '', aktiv = route;
    if (buero) {
      if (route === 'plan') html = seitePlan(a);
      else if (route === 'kunden') html = seiteKunden();
      else if (route === 'kunde') { html = seiteKunde(a); aktiv = 'kunden'; }
      else if (route === 'team') html = seiteTeam();
      else if (route === 'person') { html = seitePerson(a); aktiv = 'team'; }
      else if (route === 'abrechnung') html = seiteAbrechnung(a);
      else if (route === 'nachweis') { html = seiteNachweis(a, b); aktiv = 'abrechnung'; }
      else if (route === 'einstellungen') { html = seiteEinstellungen(); aktiv = ''; }
      else if (route === 'einsatz') { html = seiteEinsatz(a); aktiv = 'plan'; }
      else if (route === 'unterschrift') { html = seiteUnterschrift(a); aktiv = 'plan'; }
      else { html = seiteBueroHeute(); aktiv = 'heute'; }
    } else {
      if (route === 'woche') html = seiteHelferWoche();
      else if (route === 'stunden') html = seiteHelferStunden(a);
      else if (route === 'einsatz') { html = seiteEinsatz(a); aktiv = 'heute'; }
      else if (route === 'unterschrift') { html = seiteUnterschrift(a); aktiv = 'heute'; }
      else { html = seiteHelferHeute(); aktiv = 'heute'; }
    }
    main.innerHTML = html;
    leiste(aktiv);
    if (route === 'unterschrift') unterschriftStarten();
  }

  /* ===== Unterschrift (Finger oder Stift, als Linienzug gespeichert) ===== */
  let striche = [];
  function unterschriftStarten() {
    const cv = $('#u-flaeche'); if (!cv) return;
    striche = [];
    const ctx = cv.getContext('2d');
    const groesse = () => { const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1; cv.width = r.width * dpr; cv.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); malen(); };
    const malen = () => {
      const r = cv.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--tinte').trim() || '#1F3A93';
      ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      striche.forEach((s) => { ctx.beginPath(); s.forEach(([x, y], i) => { const px = x / 600 * r.width, py = y / 200 * r.height; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }); if (s.length === 1) ctx.lineTo(s[0][0] / 600 * r.width + .1, s[0][1] / 200 * r.height); ctx.stroke(); });
    };
    const punkt = (ev) => { const r = cv.getBoundingClientRect(); return [Math.round((ev.clientX - r.left) / r.width * 600), Math.round((ev.clientY - r.top) / r.height * 200)]; };
    let zeichnet = false;
    cv.addEventListener('pointerdown', (ev) => { ev.preventDefault(); zeichnet = true; cv.setPointerCapture(ev.pointerId); striche.push([punkt(ev)]); malen(); });
    cv.addEventListener('pointermove', (ev) => { if (!zeichnet) return; const s = striche[striche.length - 1], p = punkt(ev), l = s[s.length - 1]; if (Math.abs(p[0] - l[0]) + Math.abs(p[1] - l[1]) > 2) { s.push(p); malen(); } });
    const ende = () => { if (!zeichnet) return; zeichnet = false; $('#u-ok').disabled = striche.reduce((n, s) => n + s.length, 0) < 8; };
    cv.addEventListener('pointerup', ende); cv.addEventListener('pointercancel', ende);
    new ResizeObserver(groesse).observe(cv);
    unterschriftStarten.leeren = () => { striche = []; malen(); $('#u-ok').disabled = true; };
  }
  const pfadAus = (s) => s.map((st) => 'M' + st.map(([x, y]) => `${x} ${y}`).join(' L')).join(' ');

  /* ===== Dialoge (Formulare) ===== */
  const dlg = $('#dialog');
  function dialogOeffnen(titel, inhalt, fuss, form) {
    dlg.innerHTML = `<form data-form="${esc(form)}" novalidate><div class="dialog-kopf"><h2 id="dialog-titel">${esc(titel)}</h2><button class="zu" type="button" data-a="dialog-zu" aria-label="Schließen">${icon('zu')}</button></div>
      <div class="dialog-inhalt">${inhalt}</div><div class="dialog-fuss">${fuss}</div></form>`;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    const erstes = dlg.querySelector('.dialog-inhalt input, .dialog-inhalt select'); if (erstes && matchMedia('(pointer: fine)').matches) erstes.focus();
  }
  function dialogZu() { if (dlg.open) { if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); } }
  const optionen = (liste, wert) => liste.map(([w, n]) => `<option value="${esc(w)}"${String(w) === String(wert) ? ' selected' : ''}>${esc(n)}</option>`).join('');

  function einsatzDialog(e, vorgaben = {}) {
    const neu = !e;
    e = e || { kunde: vorgaben.kunde || '', helfer: '', datum: vorgaben.datum || heute(), von: '10:00', bis: '11:00', taetigkeiten: ['haushalt'], notiz: '' };
    const kunden = D.kunden.filter((k) => k.aktiv || k.id === e.kunde).map((k) => [k.id, kundenName(k)]);
    const inhalt = `<div class="felder">
      <label class="feld feld-voll"><span>Kundin, Kunde</span><select name="kunde" required><option value="">Bitte wählen</option>${optionen(kunden, e.kunde)}</select></label>
      <label class="feld feld-voll"><span>Helfende</span><select name="helfer"><option value="">Noch offen</option>${optionen(helfende().map((p) => [p.id, p.name]), e.helfer)}</select></label>
      <label class="feld feld-voll"><span>Datum</span><input type="date" name="datum" value="${esc(e.datum)}" required></label>
      <label class="feld"><span>Von</span><input type="time" name="von" value="${esc(e.von)}" required step="300"></label>
      <label class="feld"><span>Bis</span><input type="time" name="bis" value="${esc(e.bis)}" required step="300"></label>
      <fieldset class="feld-voll"><legend>Tätigkeiten</legend><div class="haken">${TAETIGKEITEN.map(([w, n]) => `<label><input type="checkbox" name="t" value="${w}"${e.taetigkeiten.includes(w) ? ' checked' : ''}>${esc(n)}</label>`).join('')}</div></fieldset>
      <label class="feld feld-voll"><span>Notiz für die Helfenden</span><textarea name="notiz" maxlength="400">${esc(e.notiz || '')}</textarea></label>
      ${neu ? `<label class="feld"><span>Wiederholen</span><select name="wdh">${optionen([['', 'Nein, einmalig'], ['7', 'Jede Woche'], ['14', 'Alle 2 Wochen']], '')}</select></label>
        <label class="feld"><span>Bis einschließlich</span><input type="date" name="wdhBis" value="${esc(plusTage(e.datum, 56))}"></label>` : ''}
      <p class="feld-voll klein" id="einsatz-pruefung" aria-live="polite"></p></div>`;
    const fuss = neu ? `<button class="knopf" type="submit">${icon('haken')}Planen</button>`
      : `${e.status !== 'abgesagt' && e.status !== 'erledigt' ? `<button class="knopf knopf-gefahr" type="button" data-a="einsatz-absagen" data-id="${esc(e.id)}">Absagen</button>` : ''}<button class="knopf" type="submit">${icon('haken')}Speichern</button>`;
    dialogOeffnen(neu ? 'Einsatz planen' : 'Einsatz bearbeiten', inhalt, fuss, 'einsatz');
    dlg.querySelector('form').dataset.id = neu ? '' : e.id;
    einsatzPruefen();
  }
  function einsatzAusForm(form) {
    const f = new FormData(form);
    return { kunde: f.get('kunde'), helfer: f.get('helfer') || '', datum: f.get('datum'), von: f.get('von'), bis: f.get('bis'), taetigkeiten: f.getAll('t'), notiz: (f.get('notiz') || '').trim(), id: form.dataset.id || '' };
  }
  function einsatzPruefen() {
    const form = dlg.querySelector('form[data-form="einsatz"]'); if (!form) return;
    const e = einsatzAusForm(form), aus = [];
    if (e.von && e.bis && minuten(e.bis) <= minuten(e.von)) aus.push('Das Ende liegt vor dem Beginn.');
    const ue = e.datum && e.von && e.bis ? ueberschneidung(e) : null;
    if (ue) aus.push(`${person(e.helfer).name} ist da schon bei ${kundenName(kunde(ue.kunde))} (${ue.von} bis ${ue.bis}).`);
    if (e.helfer && e.datum) {
      const p = person(e.helfer), l = lohnMonat(e.helfer, monatVon(e.datum), true);
      const alt = e.id ? einsatz(e.id) : null, plus = (minuten(e.bis) - minuten(e.von)) / 60 * p.lohn - (alt && alt.helfer === e.helfer && monatVon(alt.datum) === monatVon(e.datum) ? dauer(alt) / 60 * p.lohn : 0);
      if (p.minijob && l.lohn + plus > (D.firma.minijob || 603)) aus.push(`Damit käme ${p.name} im ${MONATE[Number(e.datum.slice(5, 7)) - 1]} auf ${euro(l.lohn + plus)}, über der Minijob-Grenze.`);
      if (nachweise(p).some((n) => n.art !== 'bald')) aus.push(`${p.name}: Nachweise fehlen oder sind abgelaufen (siehe Team).`);
    }
    const k = kunde(e.kunde);
    if (k && e.datum && e.von && e.bis) {
      const a = abrechnung(k, monatVon(e.datum)), neu = Math.ceil((minuten(e.bis) - minuten(e.von)) / D.firma.takt) * D.firma.takt / 60 * D.firma.satz + D.firma.anfahrt;
      const alt = e.id && einsatz(e.id) && einsatz(e.id).status !== 'erledigt' ? preisEinsatz(einsatz(e.id)) : 0;
      if (a.summe + a.geplantSumme - alt + neu > a.deckung + .01) aus.push(`Das Budget von ${kundenName(k)} reicht im ${MONATE[Number(e.datum.slice(5, 7)) - 1]} nicht ganz, der Rest wäre selbst zu zahlen.`);
    }
    const p = $('#einsatz-pruefung'); if (p) p.innerHTML = aus.map((x) => `<span style="color:var(--ocker);display:block">${icon('warnung')} ${esc(x)}</span>`).join('');
  }

  function kundeDialog(k) {
    const neu = !k;
    k = k || { vorname: '', name: '', strasse: '', ort: '', telefon: '', angehoerige: '', pflegegrad: 2, kasse: '', versnr: '', abtretung: '', guthaben: '', stand: monatVon(heute()), umwandlung: 0, hinweise: '', aktiv: true };
    const f = (n, l, w, typ = 'text', voll, extra = '') => `<label class="feld${voll ? ' feld-voll' : ''}"><span>${l}</span><input name="${n}" type="${typ}" value="${esc(w == null ? '' : w)}"${extra}></label>`;
    const inhalt = `<div class="felder">
      ${f('vorname', 'Vorname', k.vorname, 'text', false, ' required autocomplete="off"')}${f('name', 'Nachname', k.name, 'text', false, ' required autocomplete="off"')}
      ${f('strasse', 'Straße und Hausnummer', k.strasse, 'text', false, ' required')}${f('ort', 'PLZ und Ort', k.ort, 'text', false, ' required')}
      ${f('telefon', 'Telefon', k.telefon, 'tel')}${f('angehoerige', 'Angehörige (Name, Telefon)', k.angehoerige)}
      <label class="feld"><span>Pflegegrad</span><select name="pflegegrad">${optionen([1, 2, 3, 4, 5].map((x) => [x, 'Pflegegrad ' + x]), k.pflegegrad)}</select></label>
      <label class="feld"><span>Pflegekasse</span><select name="kasse">${optionen(KASSEN.map((x) => [x, x]), k.kasse)}</select></label>
      ${f('versnr', 'Versichertennummer', k.versnr, 'text', false, ' autocomplete="off" pattern="[A-Za-z][0-9]{9}"')}
      ${f('abtretung', 'Abtretungserklärung unterschrieben am', k.abtretung, 'date')}
      ${f('guthaben', 'Guthaben Entlastungsbetrag laut Pflegekasse (€)', k.guthaben, 'number', false, ' step="0.01" min="0" inputmode="decimal"')}
      ${f('stand', 'Stand des Guthabens (Monat)', k.stand, 'month')}
      ${f('umwandlung', 'Umwandlung je Monat (€, nur Pflegegrad 2 bis 5)', k.umwandlung, 'number', true, ' step="0.01" min="0" inputmode="decimal"')}
      <label class="feld feld-voll"><span>Hinweise für Einsätze (Schlüssel, Haustiere, Gewohnheiten)</span><textarea name="hinweise" maxlength="600">${esc(k.hinweise)}</textarea></label>
      <div class="feld-voll haken haken-spalte"><label><input type="checkbox" name="zuzahlung" ${k.zuzahlung ? 'checked' : ''}>Zahlt den Rest über dem Budget selbst (ist abgesprochen)</label>
        <label><input type="checkbox" name="aktiv" ${k.aktiv ? 'checked' : ''}>Aktiv (bekommt Einsätze)</label></div>
      <p class="feld-voll klein">Gesundheitsdaten: Nur so viel eintragen, wie für Einsätze und Abrechnung nötig ist. Diagnosen gehören nicht hierher.</p></div>`;
    dialogOeffnen(neu ? 'Neue Kundschaft' : 'Kundschaft bearbeiten', inhalt, `<button class="knopf" type="submit">${icon('haken')}Speichern</button>`, 'kunde');
    dlg.querySelector('form').dataset.id = neu ? '' : k.id;
  }
  function personDialog(p) {
    const neu = !p;
    p = p || { name: '', telefon: '', email: '', lohn: 15, minijob: true, schulung: '', ersteHilfe: '', fz: '', notiz: '' };
    const f = (n, l, w, typ = 'text', voll, extra = '') => `<label class="feld${voll ? ' feld-voll' : ''}"><span>${l}</span><input name="${n}" type="${typ}" value="${esc(w == null ? '' : w)}"${extra}></label>`;
    const inhalt = `<div class="felder">${f('name', 'Vor- und Nachname', p.name, 'text', true, ' required autocomplete="off"')}
      ${f('telefon', 'Telefon', p.telefon, 'tel')}${f('email', 'E-Mail', p.email, 'email')}
      ${f('lohn', 'Stundenlohn (€)', p.lohn, 'number', false, ' step="0.01" min="0" inputmode="decimal" required')}
      <label class="feld"><span>Anstellung</span><select name="minijob">${optionen([['1', 'Minijob'], ['0', 'Teilzeit oder anderes']], p.minijob ? '1' : '0')}</select></label>
      ${f('schulung', 'Schulung (mind. 30 Std.) abgeschlossen am', p.schulung, 'date')}${f('ersteHilfe', 'Erste-Hilfe-Kurs am', p.ersteHilfe, 'date')}
      ${f('fz', 'Erweitertes Führungszeugnis vom', p.fz, 'date')}${f('notiz', 'Notiz (Zeiten, Auto, Sprachen)', p.notiz)}</div>
      <p class="klein" style="margin-top:10px">Der Mindestlohn liegt 2026 bei 13,90 € je Stunde.</p>`;
    dialogOeffnen(neu ? 'Neue Person im Team' : 'Person bearbeiten', inhalt, `<button class="knopf" type="submit">${icon('haken')}Speichern</button>`, 'person');
    dlg.querySelector('form').dataset.id = neu ? '' : p.id;
  }
  function rolleDialog() {
    const inhalt = `${D.demo ? `<fieldset><legend>Ansehen als (nur in der Vorschau)</legend><div class="haken" style="flex-direction:column;align-items:stretch">
        ${D.personen.map((p) => `<label><input type="radio" name="rolle" value="${esc(p.id)}"${p.id === ui.rolle ? ' checked' : ''}>${p.rolle === 'buero' ? 'Büro (du)' : esc(p.name) + ' (Helfende)'}</label>`).join('')}</div></fieldset><hr class="trenn">` : ''}
      <fieldset><legend>Darstellung</legend><div class="umschalter">${[['auto', 'Automatisch'], ['hell', 'Hell'], ['dunkel', 'Dunkel']].map(([w, n]) => `<button type="button" data-a="thema" data-wert="${w}" aria-pressed="${ansicht.thema === w}">${n}</button>`).join('')}</div></fieldset>
      <fieldset style="margin-top:12px"><legend>Schrift</legend><div class="umschalter">${[['normal', 'Normal'], ['gross', 'Groß']].map(([w, n]) => `<button type="button" data-a="schrift" data-wert="${w}" aria-pressed="${ansicht.schrift === w}">${n}</button>`).join('')}</div></fieldset>
      ${istBuero() ? `<hr class="trenn"><a class="knopf knopf-zweit knopf-breit" href="#einstellungen" data-a="dialog-zu">${icon('regler')}Firma, Preise, Grenzen</a>
        <div class="knopfreihe"><button class="knopf knopf-still" type="button" data-a="sichern">${icon('datei')}Daten sichern</button><button class="knopf knopf-still" type="button" data-a="laden">Daten laden</button></div>` : ''}
      ${D.demo ? `<button class="knopf knopf-still knopf-breit" type="button" data-a="zuruecksetzen" style="margin-top:8px">Beispieldaten neu laden</button>` : ''}`;
    dialogOeffnen('Ansicht', inhalt, `<button class="knopf" type="submit">Fertig</button>`, 'rolle');
  }

  /* ===== Rückfragen (eigener Dialog statt confirm/prompt: sieht gleich aus und klappt auch in eingebetteten Seiten) ===== */
  const frageDlg = $('#frage');
  function fragen({ titel, text = '', ja = 'OK', gefahr = false, eingabe = null }) {
    return new Promise((fertig) => {
      frageDlg.innerHTML = `<form novalidate><div class="dialog-kopf"><h2 id="frage-titel">${esc(titel)}</h2></div>
        <div class="dialog-inhalt">${text ? `<p>${esc(text)}</p>` : ''}${eingabe ? `<label class="feld"><span>${esc(eingabe.label)}</span><input name="antwort" value="${esc(eingabe.wert || '')}" maxlength="200" autocomplete="off"></label>` : ''}</div>
        <div class="dialog-fuss"><button class="knopf knopf-zweit" type="button" data-frage="nein">Abbrechen</button><button class="knopf${gefahr ? ' knopf-gefahr' : ''}" type="submit">${esc(ja)}</button></div></form>`;
      let antwort = null;
      const zu = () => { frageDlg.removeEventListener('close', zu); fertig(antwort); };
      frageDlg.addEventListener('close', zu);
      frageDlg.querySelector('form').addEventListener('submit', (ev) => { ev.preventDefault(); ev.stopPropagation(); const i = frageDlg.querySelector('input'); antwort = i ? i.value.trim() : true; frageDlg.close(); });
      frageDlg.querySelector('[data-frage="nein"]').addEventListener('click', () => frageDlg.close());
      if (typeof frageDlg.showModal === 'function') frageDlg.showModal(); else frageDlg.setAttribute('open', '');
      const i = frageDlg.querySelector('input'); if (i) { i.focus(); i.select(); }
    });
  }
  frageDlg.addEventListener('click', (ev) => { if (ev.target === frageDlg) frageDlg.close(); });

  /* ===== Aktionen ===== */
  let toastZeit;
  function meldung(text) { const t = $('#toast'); t.textContent = text; t.classList.add('zeigen'); clearTimeout(toastZeit); toastZeit = setTimeout(() => t.classList.remove('zeigen'), Math.min(9000, 3500 + text.length * 45)); }
  function ansichtAnwenden() {
    const r = document.documentElement;
    if (ansicht.thema === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', ansicht.thema === 'dunkel' ? 'dark' : 'light');
    if (ansicht.schrift === 'gross') r.setAttribute('data-schrift', 'gross'); else r.removeAttribute('data-schrift');
    schreiben(ANSICHT, ansicht);
  }
  function herunterladen(name, inhalt, typ) {
    const url = URL.createObjectURL(new Blob([inhalt], { type: typ }));
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  const csv = (zeilen) => '﻿' + zeilen.map((z) => z.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\r\n');

  const AKTIONEN = {
    'dialog-zu': () => dialogZu(),
    'rolle-menue': () => rolleDialog(),
    'einsatz-neu': (el) => einsatzDialog(null, { datum: el.dataset.datum, kunde: el.dataset.kunde }),
    'einsatz-bearbeiten': (el) => einsatzDialog(einsatz(el.dataset.id)),
    'einsatz-absagen': async (el) => { const e = einsatz(el.dataset.id); if (!e) return;
      const grund = await fragen({ titel: 'Einsatz absagen?', text: `${kundenName(kunde(e.kunde))}, ${datumKurz(e.datum)}, ${e.von} Uhr`, ja: 'Absagen', gefahr: true, eingabe: { label: 'Grund (für die Übersicht)', wert: '' } });
      if (grund == null) return; e.status = 'abgesagt'; e.grund = grund || 'vom Büro abgesagt'; speichern(); dialogZu(); zeigen(); meldung('Einsatz abgesagt.'); },
    'kunde-neu': () => kundeDialog(null),
    'kunde-bearbeiten': (el) => kundeDialog(kunde(el.dataset.id)),
    'person-neu': () => personDialog(null),
    'person-bearbeiten': (el) => personDialog(person(el.dataset.id)),
    'angekommen': (el) => { const e = einsatz(el.dataset.id); e.status = 'laeuft'; e.ist = { von: jetztZeit(), bis: '' }; speichern(); zeigen(); meldung(`Beginn ${e.ist.von} erfasst. Gute Zeit!`); },
    'fertig': (el) => { const e = einsatz(el.dataset.id); e.ist.bis = jetztZeit(); if (minuten(e.ist.bis) <= minuten(e.ist.von)) e.ist.bis = uhrzeit(minuten(e.ist.von) + 5); e.status = 'erledigt'; speichern(); location.hash = '#unterschrift/' + e.id; },
    'absagen': async (el) => { const e = einsatz(el.dataset.id);
      const grund = await fragen({ titel: 'Kann nicht stattfinden?', text: 'Das Büro sieht es sofort.', ja: 'Absagen', gefahr: true, eingabe: { label: 'Warum?', wert: 'Niemand öffnet' } });
      if (grund == null) return; e.status = 'abgesagt'; e.grund = (grund || 'ohne Angabe').slice(0, 200); speichern(); zeigen(); meldung('Abgesagt. Das Büro sieht es sofort.'); },
    'papier': (el) => { const e = einsatz(el.dataset.id); e.papier = true; speichern(); zeigen(); meldung('Vermerkt: Unterschrift liegt auf Papier vor.'); },
    'u-leeren': () => unterschriftStarten.leeren && unterschriftStarten.leeren(),
    'u-fertig': (el) => { const e = einsatz(el.dataset.id); const name = ($('#u-name').value || '').trim(); if (!name) { meldung('Bitte den Namen eintragen.'); return; }
      e.unterschrift = { pfad: pfadAus(striche), name: name.slice(0, 80), zeit: heute() + 'T' + jetztZeit() }; speichern(); location.hash = '#einsatz/' + e.id; meldung('Unterschrieben. Danke!'); },
    'rechnung-anlegen': (el) => { const k = kunde(el.dataset.kunde), m = el.dataset.monat, a = abrechnung(k, m); if (!a.liste.length || a.ohneUnterschrift) return; rechnungAnlegen(k, m, a); speichern(); zeigen(); meldung('Als abgerechnet markiert. Jetzt drucken oder als PDF an die Pflegekasse schicken.'); },
    'rechnung-zurueck': async (el) => {
      if (!await fragen({ titel: 'Wieder auf „offen“ setzen?', text: 'Nur, wenn die Rechnung noch nicht verschickt ist. Eine verschickte Rechnung wird nicht gelöscht, sondern mit einer Stornorechnung aufgehoben (Steuerberatung fragen). Die Nummer wird nicht noch einmal vergeben.', ja: 'Auf offen setzen', gefahr: true })) return;
      D.rechnungen = D.rechnungen.filter((r) => r.id !== el.dataset.id); speichern(); zeigen(); },
    'drucken': () => window.print(),
    'lohn-csv': (el) => { const m = el.dataset.monat; const z = [['Name', 'Monat', 'Stunden', 'Stundenlohn', 'Lohn brutto', 'Minijob']];
      helfende().forEach((p) => { const l = lohnMonat(p.id, m, false); if (l.min) z.push([p.name, monatName(m), ZAHL.format(Math.round(l.min / 60 * 100) / 100), ZAHL.format(p.lohn), ZAHL.format(Math.round(l.lohn * 100) / 100), p.minijob ? 'ja' : 'nein']); });
      herunterladen(`Loehne-${m}.csv`, csv(z), 'text/csv;charset=utf-8'); },
    'thema': (el) => { ansicht.thema = el.dataset.wert; ansichtAnwenden(); $$('[data-a="thema"]').forEach((b) => b.setAttribute('aria-pressed', String(b === el))); },
    'schrift': (el) => { ansicht.schrift = el.dataset.wert; ansichtAnwenden(); $$('[data-a="schrift"]').forEach((b) => b.setAttribute('aria-pressed', String(b === el))); },
    'sichern': () => herunterladen(`Alltagshilfe-Sicherung-${heute()}.json`, JSON.stringify(D, null, 1), 'application/json'),
    'laden': () => { const i = Object.assign(document.createElement('input'), { type: 'file', accept: 'application/json,.json' });
      i.onchange = () => { const f = i.files[0]; if (!f) return; f.text().then((t) => { const neu = JSON.parse(t); if (!neu || !Array.isArray(neu.kunden) || !Array.isArray(neu.einsaetze)) throw new Error('Format'); D = neu; speichern(); dialogZu(); zeigen(); meldung('Daten geladen.'); }).catch(() => meldung('Diese Datei passt nicht.')); };
      i.click(); },
    'zuruecksetzen': async () => { if (!await fragen({ titel: 'Beispieldaten neu laden?', text: 'Deine Änderungen in der Vorschau gehen verloren.', ja: 'Neu laden', gefahr: true })) return; D = beispielDaten(); speichern(); dialogZu(); zeigen(); meldung('Beispieldaten neu geladen.'); }
  };
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-a]'); if (!el) return;
    const f = AKTIONEN[el.dataset.a]; if (!f) return;
    if (el.tagName !== 'A') ev.preventDefault();
    f(el, ev);
  });
  dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dialogZu(); });
  dlg.addEventListener('input', (ev) => {
    const form = ev.target.closest('form[data-form="einsatz"]'); if (!form) return;
    // „Bis einschließlich“ wandert mit dem Datum mit (8 Wochen), solange niemand es selbst geändert hat
    if (ev.target.name === 'wdhBis') ev.target.dataset.selbst = '1';
    if (ev.target.name === 'datum' && form.wdhBis && !form.wdhBis.dataset.selbst && ev.target.value) form.wdhBis.value = plusTage(ev.target.value, 56);
    einsatzPruefen();
  });
  dlg.addEventListener('change', (ev) => {
    if (ev.target.name === 'rolle') { ui.rolle = ev.target.value; schreiben(ROLLE, ui.rolle); dialogZu(); location.hash = '#heute'; zeigen(); meldung(istBuero() ? 'Ansicht: Büro' : `Ansicht: ${person(ui.rolle).name} (so sieht es auf ihrem Handy aus)`); }
    if (ev.target.closest('form[data-form="einsatz"]')) einsatzPruefen();
  });

  const zahl = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };
  document.addEventListener('submit', (ev) => {
    const form = ev.target, art = form.dataset.form; if (!art) return;
    ev.preventDefault();
    const f = new FormData(form);
    if (art === 'rolle') { dialogZu(); return; }
    if (art === 'einsatz') {
      const e = einsatzAusForm(form);
      if (!e.kunde || !e.datum || !e.von || !e.bis) { meldung('Bitte Kundschaft, Datum und Zeiten ausfüllen.'); return; }
      if (minuten(e.bis) <= minuten(e.von)) { meldung('Das Ende muss nach dem Beginn liegen.'); return; }
      if (!e.taetigkeiten.length) { meldung('Bitte mindestens eine Tätigkeit anhaken.'); return; }
      if (e.id) { Object.assign(einsatz(e.id), { kunde: e.kunde, helfer: e.helfer, datum: e.datum, von: e.von, bis: e.bis, taetigkeiten: e.taetigkeiten, notiz: e.notiz }); meldung('Gespeichert.'); }
      else {
        const schritt = Number(f.get('wdh') || 0), bis = f.get('wdhBis') || e.datum; let d = e.datum, n = 0;
        do { D.einsaetze.push({ id: id('e'), kunde: e.kunde, helfer: e.helfer, datum: d, von: e.von, bis: e.bis, taetigkeiten: e.taetigkeiten.slice(), notiz: e.notiz, status: 'geplant' }); n++; d = plusTage(d, schritt); }
        while (schritt && d <= bis && n < 60);
        meldung(n === 1 ? 'Einsatz geplant.' : `${n} Einsätze geplant.`);
      }
      D.einsaetze.sort((a, b) => (a.datum + a.von).localeCompare(b.datum + b.von));
      speichern(); dialogZu(); zeigen(); return;
    }
    if (art === 'kunde') {
      const daten = { vorname: f.get('vorname').trim(), name: f.get('name').trim(), strasse: f.get('strasse').trim(), ort: f.get('ort').trim(), telefon: f.get('telefon').trim(), angehoerige: f.get('angehoerige').trim(),
        pflegegrad: Number(f.get('pflegegrad')), kasse: f.get('kasse'), versnr: f.get('versnr').trim().toUpperCase(), abtretung: f.get('abtretung'), guthaben: zahl(f.get('guthaben')), stand: f.get('stand') || monatVon(heute()),
        umwandlung: zahl(f.get('umwandlung')), zuzahlung: f.get('zuzahlung') === 'on', hinweise: f.get('hinweise').trim(), aktiv: f.get('aktiv') === 'on' };
      if (!daten.vorname || !daten.name || !daten.strasse || !daten.ort) { meldung('Bitte Name und Anschrift ausfüllen.'); return; }
      if (daten.versnr && !/^[A-Z][0-9]{9}$/.test(daten.versnr)) { meldung('Die Versichertennummer hat einen Buchstaben und 9 Ziffern, z. B. A123456789.'); return; }
      if (form.dataset.id) Object.assign(kunde(form.dataset.id), daten); else { daten.id = id('k'); D.kunden.push(daten); }
      speichern(); dialogZu(); if (!form.dataset.id) location.hash = '#kunde/' + daten.id; zeigen(); meldung('Gespeichert.'); return;
    }
    if (art === 'person') {
      const daten = { name: f.get('name').trim(), telefon: f.get('telefon').trim(), email: f.get('email').trim(), lohn: zahl(f.get('lohn')), minijob: f.get('minijob') === '1',
        schulung: f.get('schulung'), ersteHilfe: f.get('ersteHilfe'), fz: f.get('fz'), notiz: f.get('notiz').trim() };
      if (!daten.name) { meldung('Bitte den Namen eintragen.'); return; }
      if (daten.lohn < 13.9) { meldung('Der Stundenlohn liegt unter dem Mindestlohn (13,90 €).'); return; }
      if (form.dataset.id) Object.assign(person(form.dataset.id), daten); else { daten.id = id('p'); daten.rolle = 'helfer'; D.personen.push(daten); }
      speichern(); dialogZu(); zeigen(); meldung('Gespeichert.'); return;
    }
    if (art === 'firma') {
      const nz = ['satz', 'anfahrt', 'entlastung', 'minijob'];
      ['name', 'zusatz', 'inhaber', 'telefon', 'anschrift', 'email', 'ik', 'steuernr', 'anerkennung', 'ustText'].forEach((k) => { D.firma[k] = (f.get(k) || '').trim(); });
      nz.forEach((k) => { D.firma[k] = zahl(f.get(k)); }); D.firma.takt = Number(f.get('takt')) || 15;
      speichern(); zeigen(); meldung('Einstellungen gespeichert.'); return;
    }
    if (art === 'zeiten') {
      const e = einsatz(form.dataset.id), von = f.get('von'), bis = f.get('bis');
      if (bis && minuten(bis) <= minuten(von)) { meldung('Das Ende muss nach dem Beginn liegen.'); return; }
      e.ist = { von, bis: bis || '' }; if (bis && e.status === 'laeuft') e.status = 'erledigt';
      speichern(); zeigen(); meldung('Zeiten gespeichert.'); return;
    }
  });
  document.addEventListener('change', (ev) => {
    const form = ev.target.closest('form[data-form="taetigkeiten"]'); if (!form) return;
    const e = einsatz(form.dataset.id); e.taetigkeiten = $$('input[name="t"]:checked', form).map((x) => x.value);
    if (!e.taetigkeiten.length) { e.taetigkeiten = [ev.target.value]; ev.target.checked = true; meldung('Mindestens eine Tätigkeit bleibt angehakt.'); }
    speichern();
  });

  /* ===== Start ===== */
  D = lesen(SPEICHER, null);
  if (!D || !D.version) { D = beispielDaten(); speichern(); }
  if (!person(ui.rolle)) ui.rolle = 'p-buero';
  ansichtAnwenden();
  window.addEventListener('hashchange', () => { dialogZu(); zeigen(); window.scrollTo(0, 0); });
  zeigen();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
