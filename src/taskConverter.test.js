/**
 * taskConverter.test.js
 * Vitest unit tests for convertIcsToOutlookCsv
 */

import { describe, it, expect } from 'vitest';
import Papa from 'papaparse';
import { convertIcsToOutlookCsv, OUTLOOK_TASK_COLUMNS } from './taskConverter.js';

// ─── MOCK ICS DATA ────────────────────────────────────────────────────────────

/** A complete VTODO with all supported fields */
const ICS_COMPLETE = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//IT
BEGIN:VTODO
UID:abc-123@test
SUMMARY:Inviare report mensile
DTSTART:20260430
DUE:20260505
DESCRIPTION:Preparare il report\\nIncludere i KPI\\nInviare al manager
PRIORITY:1
PERCENT-COMPLETE:50
CATEGORIES:Lavoro
END:VTODO
END:VCALENDAR`;

/** A minimal VTODO — only SUMMARY and DTSTART */
const ICS_MINIMAL = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:xyz-456@test
SUMMARY:Telefonata cliente
DTSTART:20260601
END:VTODO
END:VCALENDAR`;

/** A completed VTODO (PERCENT-COMPLETE:100) */
const ICS_COMPLETED = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:done-789@test
SUMMARY:Progetto consegnato
DTSTART:20260101
DUE:20260115
PERCENT-COMPLETE:100
PRIORITY:5
COMPLETED:20260115
END:VTODO
END:VCALENDAR`;

/** A VTODO with low priority and STATUS field */
const ICS_LOW_PRIORITY = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:low-000@test
SUMMARY:Archiviazione documenti
DTSTART:20260301
PRIORITY:9
STATUS:NEEDS-ACTION
END:VTODO
END:VCALENDAR`;

/** ICS with RFC 5545 line folding */
const ICS_FOLDED = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:folded-001@test
SUMMARY:Attività con riga molto lunga che viene spezzata secondo la specifica
 RFC 5545 per il folding delle righe
DTSTART:20260715
END:VTODO
END:VCALENDAR`;

/** An ICS with no VTODO blocks */
const ICS_NO_VTODO = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:event-001@test
SUMMARY:Riunione
DTSTART:20260430T100000Z
END:VEVENT
END:VCALENDAR`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Parse the CSV output back into rows for assertions.
 * Strips the UTF-8 BOM before parsing.
 */
function parseCsvOutput(csvString) {
  const stripped = csvString.replace(/^\uFEFF/, '');
  const result = Papa.parse(stripped, { header: true, skipEmptyLines: false });
  return result.data;
}

// ─── TEST SUITES ──────────────────────────────────────────────────────────────

describe('convertIcsToOutlookCsv — output structure', () => {
  it('returns a non-empty string for valid ICS', () => {
    const csv = convertIcsToOutlookCsv(ICS_COMPLETE);
    expect(typeof csv).toBe('string');
    expect(csv.length).toBeGreaterThan(0);
  });

  it('starts with a UTF-8 BOM (\\uFEFF)', () => {
    const csv = convertIcsToOutlookCsv(ICS_COMPLETE);
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
  });

  it('returns empty string for null/undefined input', () => {
    expect(convertIcsToOutlookCsv(null)).toBe('');
    expect(convertIcsToOutlookCsv(undefined)).toBe('');
    expect(convertIcsToOutlookCsv('')).toBe('');
  });

  it('returns empty string when no VTODO blocks found', () => {
    expect(convertIcsToOutlookCsv(ICS_NO_VTODO)).toBe('');
  });

  it('outputs exactly 22 header columns in correct order', () => {
    const csv = convertIcsToOutlookCsv(ICS_COMPLETE);
    const rows = parseCsvOutput(csv);
    const headers = Object.keys(rows[0]);
    expect(headers).toEqual(OUTLOOK_TASK_COLUMNS);
  });
});

describe('convertIcsToOutlookCsv — date formatting', () => {
  it('formats DTSTART YYYYMMDD → DD/MM/YYYY', () => {
    const csv = convertIcsToOutlookCsv(ICS_COMPLETE);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Data inizio']).toBe('30/04/2026');
  });

  it('formats DUE correctly', () => {
    const csv = convertIcsToOutlookCsv(ICS_COMPLETE);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Scadenza']).toBe('05/05/2026');
  });

  it('falls back to DTSTART when DUE is absent (minimal VTODO)', () => {
    const csv = convertIcsToOutlookCsv(ICS_MINIMAL);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Data inizio']).toBe('01/06/2026');
    expect(rows[0]['Scadenza']).toBe('01/06/2026');
  });

  it('formats COMPLETED date correctly', () => {
    const csv = convertIcsToOutlookCsv(ICS_COMPLETED);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Data completamento']).toBe('15/01/2026');
  });
});

describe('convertIcsToOutlookCsv — field mapping', () => {
  it('maps SUMMARY to Oggetto', () => {
    const csv = convertIcsToOutlookCsv(ICS_COMPLETE);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Oggetto']).toBe('Inviare report mensile');
  });

  it('maps DESCRIPTION to Notes (unescaping \\n)', () => {
    const csv = convertIcsToOutlookCsv(ICS_COMPLETE);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Notes']).toContain('Preparare il report');
    expect(rows[0]['Notes']).toContain('Includere i KPI');
  });

  it('maps PRIORITY 1-4 → Alta', () => {
    const csv = convertIcsToOutlookCsv(ICS_COMPLETE);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Priorità']).toBe('Alta');
  });

  it('maps PRIORITY 5 → Normale', () => {
    const csv = convertIcsToOutlookCsv(ICS_COMPLETED);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Priorità']).toBe('Normale');
  });

  it('maps PRIORITY 6-9 → Bassa', () => {
    const csv = convertIcsToOutlookCsv(ICS_LOW_PRIORITY);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Priorità']).toBe('Bassa');
  });

  it('maps PERCENT-COMPLETE 50 → In corso', () => {
    const csv = convertIcsToOutlookCsv(ICS_COMPLETE);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Stato']).toBe('In corso');
  });

  it('maps PERCENT-COMPLETE 100 → Completata', () => {
    const csv = convertIcsToOutlookCsv(ICS_COMPLETED);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Stato']).toBe('Completata');
  });

  it('maps STATUS:NEEDS-ACTION → Non iniziata when no PERCENT-COMPLETE', () => {
    const csv = convertIcsToOutlookCsv(ICS_LOW_PRIORITY);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Stato']).toBe('Non iniziata');
  });

  it('sets default Priorità to Normale when PRIORITY absent (minimal)', () => {
    const csv = convertIcsToOutlookCsv(ICS_MINIMAL);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Priorità']).toBe('Normale');
  });

  it('sets CATEGORIES correctly', () => {
    const csv = convertIcsToOutlookCsv(ICS_COMPLETE);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Categorie']).toBe('Lavoro');
  });
});

describe('convertIcsToOutlookCsv — fixed defaults', () => {
  it('sets Promemoria attivato/disattivato to "Falso"', () => {
    const csv = convertIcsToOutlookCsv(ICS_MINIMAL);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Promemoria attivato/disattivato']).toBe('Falso');
  });

  it('sets Lavoro stimato to "0"', () => {
    const csv = convertIcsToOutlookCsv(ICS_MINIMAL);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Lavoro stimato']).toBe('0');
  });

  it('sets Lavoro effettivo to "0"', () => {
    const csv = convertIcsToOutlookCsv(ICS_MINIMAL);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Lavoro effettivo']).toBe('0');
  });

  it('sets Riservatezza to "Normale"', () => {
    const csv = convertIcsToOutlookCsv(ICS_MINIMAL);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Riservatezza']).toBe('Normale');
  });

  it('sets Privato to "Falso"', () => {
    const csv = convertIcsToOutlookCsv(ICS_MINIMAL);
    const rows = parseCsvOutput(csv);
    expect(rows[0]['Privato']).toBe('Falso');
  });
});

describe('convertIcsToOutlookCsv — multiple VTODOs', () => {
  it('parses two VTODO blocks and returns two rows', () => {
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:a@test
SUMMARY:Task Alpha
DTSTART:20260101
END:VTODO
BEGIN:VTODO
UID:b@test
SUMMARY:Task Beta
DTSTART:20260202
END:VTODO
END:VCALENDAR`;
    const csv = convertIcsToOutlookCsv(ics);
    const rows = parseCsvOutput(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]['Oggetto']).toBe('Task Alpha');
    expect(rows[1]['Oggetto']).toBe('Task Beta');
  });
});

describe('convertIcsToOutlookCsv — ICS line folding (RFC 5545)', () => {
  it('correctly unfoldes continuation lines before parsing', () => {
    const csv = convertIcsToOutlookCsv(ICS_FOLDED);
    const rows = parseCsvOutput(csv);
    // The SUMMARY was split across two lines; should be joined
    expect(rows[0]['Oggetto']).toContain('RFC 5545');
    expect(rows[0]['Oggetto']).not.toMatch(/^\s/);
  });
});
