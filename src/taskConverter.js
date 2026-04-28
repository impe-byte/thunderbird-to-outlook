/**
 * taskConverter.js
 * ICS (VTODO) → Outlook Tasks CSV Converter
 *
 * Pure function — zero I/O, zero side-effects.
 * Depends only on PapaParser (already in project deps).
 */

import Papa from 'papaparse';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

/**
 * Exact 22-column header for Outlook Tasks CSV (Italian locale).
 * Order and casing are tassative.
 */
export const OUTLOOK_TASK_COLUMNS = [
  'Oggetto',
  'Data inizio',
  'Scadenza',
  'Promemoria attivato/disattivato',
  'Data promemoria',
  'Ora promemoria',
  'Data completamento',
  '% completamento',
  'Lavoro stimato',
  'Lavoro effettivo',
  'Categorie',
  'Contatti',
  'Dati fatturazione',
  'Indennità trasferta',
  'Notes',
  'Priorità',
  'Priorità Schedule+',
  'Privato',
  'Riservatezza',
  'Ruolo',
  'Società',
  'Stato',
];

/** Sentinel defaults for non-empty fixed fields. */
const FIELD_DEFAULTS = {
  'Promemoria attivato/disattivato': 'Falso',
  'Lavoro stimato': '0',
  'Lavoro effettivo': '0',
  'Riservatezza': 'Normale',
  'Privato': 'Falso',
};

// ─── ICS UTILITIES ───────────────────────────────────────────────────────────

/**
 * Unfold ICS lines: join continuation lines (lines starting with SPACE or TAB)
 * back to the previous line, per RFC 5545 §3.1.
 *
 * @param {string} icsString - raw ICS content
 * @returns {string} - unfolded content
 */
function unfoldIcs(icsString) {
  // Normalize line endings to \n, then unfold
  return icsString
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n[ \t]/g, ''); // RFC 5545 unfolding
}

/**
 * Extract all VTODO blocks from an (already-unfolded) ICS string.
 *
 * @param {string} unfolded
 * @returns {string[]} - array of raw VTODO block strings
 */
function extractVtodoBlocks(unfolded) {
  const blocks = [];
  const regex = /BEGIN:VTODO([\s\S]*?)END:VTODO/g;
  let match;
  while ((match = regex.exec(unfolded)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

/**
 * Extract a property value from a VTODO block.
 * Handles property parameters (e.g. DTSTART;TZID=Europe/Rome:20260430T090000).
 *
 * @param {string} block - single VTODO block content
 * @param {string} propName - property name (e.g. 'SUMMARY')
 * @returns {string|null}
 */
function getProp(block, propName) {
  // Match: PROPNAME optionally followed by params then ':' then value
  const regex = new RegExp(`^${propName}(?:;[^:]*)?:(.*)$`, 'm');
  const match = block.match(regex);
  return match ? match[1].trim() : null;
}

// ─── DATE HELPERS ────────────────────────────────────────────────────────────

/**
 * Parse an ICS date/datetime string and format as DD/MM/YYYY.
 * Supports: YYYYMMDD, YYYYMMDDTHHMMSS, YYYYMMDDTHHMMSSZ
 *
 * @param {string|null} icsDate
 * @returns {string} - DD/MM/YYYY or empty string
 */
function formatDate(icsDate) {
  if (!icsDate) return '';
  // Strip everything after and including 'T' for date-only extraction
  const datePart = icsDate.replace(/T.*$/, '');
  if (!/^\d{8}$/.test(datePart)) return '';
  const yyyy = datePart.slice(0, 4);
  const mm = datePart.slice(4, 6);
  const dd = datePart.slice(6, 8);
  return `${dd}/${mm}/${yyyy}`;
}

// ─── FIELD MAPPERS ───────────────────────────────────────────────────────────

/**
 * Map PRIORITY integer to Italian Outlook label.
 * RFC 5545: 0 = undefined, 1–4 = High, 5 = Medium, 6–9 = Low.
 *
 * @param {string|null} raw
 * @returns {string}
 */
function mapPriority(raw) {
  if (raw === null || raw === '' || raw === '0') return 'Normale';
  const n = parseInt(raw, 10);
  if (isNaN(n)) return 'Normale';
  if (n >= 1 && n <= 4) return 'Alta';
  if (n === 5) return 'Normale';
  if (n >= 6 && n <= 9) return 'Bassa';
  return 'Normale';
}

/**
 * Map PERCENT-COMPLETE integer to Italian Outlook status label.
 * Outlook Tasks: 0=Non iniziata, 100=Completata, else=In corso.
 *
 * @param {string|null} raw
 * @returns {string}
 */
function mapStatus(raw) {
  if (raw === null || raw === '') return 'Non iniziata';
  const n = parseInt(raw, 10);
  if (isNaN(n) || n === 0) return 'Non iniziata';
  if (n === 100) return 'Completata';
  return 'In corso';
}

/**
 * Clean up DESCRIPTION: unescape ICS escape sequences.
 * RFC 5545: \n → newline, \, → comma, \; → semicolon, \\ → backslash.
 *
 * @param {string|null} raw
 * @returns {string}
 */
function cleanDescription(raw) {
  if (!raw) return '';
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

// ─── CORE PARSER ─────────────────────────────────────────────────────────────

/**
 * Parse a single VTODO block into an Outlook Tasks row object.
 *
 * @param {string} block - raw VTODO block content (unfolded)
 * @returns {Object} - keyed by OUTLOOK_TASK_COLUMNS entries
 */
function parseVtodo(block) {
  // Build base row with defaults
  const row = {};
  OUTLOOK_TASK_COLUMNS.forEach(col => {
    row[col] = FIELD_DEFAULTS[col] !== undefined ? FIELD_DEFAULTS[col] : '';
  });

  // Extract raw props
  const summary = getProp(block, 'SUMMARY');
  const dtstart = getProp(block, 'DTSTART');
  const due = getProp(block, 'DUE');
  const description = getProp(block, 'DESCRIPTION');
  const priority = getProp(block, 'PRIORITY');
  const percentComplete = getProp(block, 'PERCENT-COMPLETE');
  const status = getProp(block, 'STATUS');
  const categories = getProp(block, 'CATEGORIES');
  const dtcompleted = getProp(block, 'COMPLETED');

  // Map fields
  row['Oggetto'] = summary ? summary.trim() : '';
  row['Data inizio'] = formatDate(dtstart);

  // DUE fallback to DTSTART
  row['Scadenza'] = formatDate(due || dtstart);

  row['Notes'] = cleanDescription(description);
  row['Priorità'] = mapPriority(priority);

  // Stato: prefer PERCENT-COMPLETE if present, else try STATUS
  if (percentComplete !== null) {
    row['Stato'] = mapStatus(percentComplete);
    row['% completamento'] = percentComplete;
  } else if (status !== null) {
    // ICS STATUS: NEEDS-ACTION, IN-PROCESS, COMPLETED, CANCELLED
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        row['Stato'] = 'Completata';
        row['% completamento'] = '100';
        break;
      case 'IN-PROCESS':
        row['Stato'] = 'In corso';
        break;
      case 'CANCELLED':
        row['Stato'] = 'Non iniziata';
        break;
      case 'NEEDS-ACTION':
      default:
        row['Stato'] = 'Non iniziata';
        break;
    }
  } else {
    row['Stato'] = 'Non iniziata';
  }

  // Optional extras
  if (categories) row['Categorie'] = categories.trim();
  if (dtcompleted) row['Data completamento'] = formatDate(dtcompleted);

  return row;
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

/**
 * Convert an ICS string (possibly containing multiple VTODO components)
 * into an Outlook Tasks CSV string (Italian headers, UTF-8 BOM).
 *
 * @param {string} icsString - raw ICS file content
 * @returns {string} - CSV string ready for download
 */
export function convertIcsToOutlookCsv(icsString) {
  if (!icsString || typeof icsString !== 'string') return '';

  const unfolded = unfoldIcs(icsString);
  const blocks = extractVtodoBlocks(unfolded);

  if (blocks.length === 0) return '';

  const rows = blocks.map(parseVtodo);

  const csv = Papa.unparse({
    fields: OUTLOOK_TASK_COLUMNS,
    data: rows,
  }, {
    quotes: true,       // Always quote fields for Outlook compatibility
    quoteChar: '"',
    delimiter: ',',
    newline: '\r\n',    // Windows line endings for Outlook
  });

  // Prepend UTF-8 BOM for Excel/Outlook compatibility
  return '\uFEFF' + csv;
}
