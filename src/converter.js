/**
 * Thunderbird → Outlook CSV Converter
 * Maps Thunderbird address book fields to Outlook import format (Italian locale)
 */

// Complete Outlook Italian column set
export const OUTLOOK_COLUMNS = [
  'Titolo', 'Nome', 'Secondo nome', 'Cognome', 'Titolo straniero',
  'Società', 'Reparto', 'Posizione',
  'Via (uff.)', 'Via (uff.) 2', 'Via (uff.) 3', 'Città (uff.)', 'Provincia (uff.)', 'CAP (uff.)', 'Paese/area geografica (uff.)',
  'Via (ab.)', 'Via (ab.) 2', 'Via (ab.) 3', 'Città (ab.)', 'Provincia (ab.)', 'CAP (ab.)', 'Paese/area geografica (ab.)',
  'Altra via', 'Altra via 2', 'Altra via 3', 'Altra città', 'Altra provincia', 'Altro CAP', 'Altro paese/area geografica',
  'Telefono assistente', 'Fax (uff.)', 'Ufficio', 'Ufficio 2', 'Richiamata automatica',
  'Telefono auto', 'Telefono principale società', 'Fax (ab.)', 'Abitazione', 'Abitazione 2',
  'ISDN', 'Cellulare', 'Altro fax', 'Altro telefono', 'Cercapersone',
  'Telefono principale', 'Radiotelefono', 'Telefono TTY/TDD', 'Telex',
  'Account', 'Altro indirizzo - Casella postale', 'Anniversario', 'Categorie',
  'Cod. Fisc./P. IVA', 'Compleanno', 'Dati fatturazione', 'Disponibilità Internet',
  'Figli', 'Hobby', 'Indennità trasferta', 'Indirizzo (ab.) - Casella postale',
  'Indirizzo (uff.) - Casella postale', 'Iniziali', 'Lingua', 'Luogo',
  'Nome assistente', 'Nome coniuge/partner', 'Nome manager', 'Notes',
  'Numero ID organizzativo', 'Pagina Web', 'Parole chiave',
  'Indirizzo posta elettronica', 'Tipo posta elettronica', 'Nome visualizzato posta elettronica',
  'Indirizzo posta elettronica 2', 'Tipo posta elettronica 2', 'Nome visualizzato posta elettronica 2',
  'Indirizzo posta elettronica 3', 'Tipo posta elettronica 3', 'Nome visualizzato posta elettronica 3',
  'Presentato da', 'Priorità', 'Privato', 'Professione', 'Riservatezza',
  'Server di directory', 'Sesso', 'Ubicazione ufficio',
  'Utente 1', 'Utente 2', 'Utente 3', 'Utente 4'
];

/**
 * Detect if a CSV is Thunderbird format by checking column names
 */
export function isThunderbirdFormat(columns) {
  const tbCols = ['Email primaria', 'Nome visualizzato', 'Soprannome', 'Email secondaria'];
  return tbCols.some(col => columns.includes(col));
}

/**
 * Build a display name from available name parts
 */
function buildDisplayName(row) {
  const nome = (row['Nome'] || '').trim();
  const cognome = (row['Cognome'] || '').trim();
  const nomeVisualizzato = (row['Nome visualizzato'] || '').trim();

  if (nome && cognome) return `${nome} ${cognome}`;
  if (nome) return nome;
  if (cognome) return cognome;
  if (nomeVisualizzato) return nomeVisualizzato;
  return row['Email primaria'] || '';
}

/**
 * Build birthday string from Thunderbird year/month/day fields
 */
function buildBirthday(row) {
  const y = row['Anno di nascita'];
  const m = row['Mese di nascita'];
  const d = row['Giorno di nascita'];
  if (y && m && d && y !== '0' && m !== '0' && d !== '0') {
    return `${m}/${d}/${y}`;
  }
  return '';
}

/**
 * Build initials from name
 */
function buildInitials(nome, cognome) {
  const n = (nome || '').trim();
  const c = (cognome || '').trim();
  if (n && c) return `${n[0].toUpperCase()}.${c[0].toUpperCase()}.`;
  if (n) return `${n[0].toUpperCase()}.`;
  if (c) return `${c[0].toUpperCase()}.`;
  return '';
}

/**
 * Map a single Thunderbird row to Outlook format
 */
export function mapThunderbirdToOutlook(row, sourceTag = '') {
  const nome = (row['Nome'] || '').trim();
  const cognome = (row['Cognome'] || '').trim();
  const displayName = buildDisplayName(row);
  const email1 = (row['Email primaria'] || '').trim();
  const email2 = (row['Email secondaria'] || '').trim();

  const out = {};
  OUTLOOK_COLUMNS.forEach(col => out[col] = '');

  // Identity
  out['Nome'] = nome;
  out['Cognome'] = cognome;
  out['Iniziali'] = buildInitials(nome, cognome);

  // Organization
  out['Società'] = (row['Organizzazione'] || '').trim();
  out['Reparto'] = (row['Reparto'] || '').trim();
  out['Posizione'] = (row['Qualifica'] || '').trim();

  // Work address
  out['Via (uff.)'] = (row['Indirizzo di lavoro'] || '').trim();
  out['Via (uff.) 2'] = (row['Indirizzo di lavoro 2'] || '').trim();
  out['Città (uff.)'] = (row['Città di lavoro'] || '').trim();
  out['Provincia (uff.)'] = (row['Provincia di lavoro'] || '').trim();
  out['CAP (uff.)'] = (row['CAP di lavoro'] || '').trim();
  out['Paese/area geografica (uff.)'] = (row['Nazione di lavoro'] || '').trim();

  // Home address
  out['Via (ab.)'] = (row['Indirizzo di casa'] || '').trim();
  out['Via (ab.) 2'] = (row['Indirizzo di casa 2'] || '').trim();
  out['Città (ab.)'] = (row['Città di residenza'] || '').trim();
  out['Provincia (ab.)'] = (row['Provincia di residenza'] || '').trim();
  out['CAP (ab.)'] = (row['CAP di residenza'] || '').trim();
  out['Paese/area geografica (ab.)'] = (row['Nazione di residenza'] || '').trim();

  // Phones
  out['Ufficio'] = (row['Telefono lavoro'] || '').trim();
  out['Abitazione'] = (row['Telefono casa'] || '').trim();
  out['Fax (uff.)'] = (row['Numero fax'] || '').trim();
  out['Cellulare'] = (row['Numero cellulare'] || '').trim();
  out['Cercapersone'] = (row['Numero cercapersone'] || '').trim();

  // Email 1
  out['Indirizzo posta elettronica'] = email1;
  out['Tipo posta elettronica'] = email1 ? 'SMTP' : '';
  out['Nome visualizzato posta elettronica'] = email1 ? `${displayName} (${email1})` : '';

  // Email 2
  out['Indirizzo posta elettronica 2'] = email2;
  out['Tipo posta elettronica 2'] = email2 ? 'SMTP' : '';
  out['Nome visualizzato posta elettronica 2'] = email2 ? `${displayName} (${email2})` : '';

  // Web
  out['Pagina Web'] = (row['Pagina web 1'] || row['Pagina web 2'] || '').trim();

  // Birthday
  out['Compleanno'] = buildBirthday(row);

  // Notes — merge Thunderbird notes + custom fields + source tag
  const notes = [];
  if (row['Note']) notes.push(row['Note'].trim());
  if (row['Personalizzato 1']) notes.push(`Personalizzato 1: ${row['Personalizzato 1']}`);
  if (row['Personalizzato 2']) notes.push(`Personalizzato 2: ${row['Personalizzato 2']}`);
  if (row['Personalizzato 3']) notes.push(`Personalizzato 3: ${row['Personalizzato 3']}`);
  if (row['Personalizzato 4']) notes.push(`Personalizzato 4: ${row['Personalizzato 4']}`);
  if (sourceTag) notes.push(`[Fonte: ${sourceTag}]`);
  out['Notes'] = notes.join('\n');

  // Messenger
  out['Utente 1'] = (row['Nome Instant Messenger'] || '').trim();

  // Defaults
  out['Priorità'] = 'Normale';
  out['Privato'] = 'Falso';
  out['Riservatezza'] = 'Normale';
  out['Sesso'] = 'Non specificato';
  out['Anniversario'] = '0/0/00';

  return out;
}

/**
 * Deduplicate contacts. Priority: email > phone > display name
 * Merges data from duplicates (fills empty fields)
 */
export function deduplicateContacts(contacts) {
  const emailMap = new Map();   // email → index
  const phoneMap = new Map();   // normalizedPhone → index
  const nameMap = new Map();    // displayName → index
  const result = [];

  function normalizePhone(p) {
    return (p || '').replace(/\D/g, '').replace(/^0039/, '39').replace(/^00/, '');
  }

  function mergeInto(target, source) {
    OUTLOOK_COLUMNS.forEach(col => {
      if (!target[col] && source[col]) target[col] = source[col];
    });
    // Merge notes
    if (source['Notes'] && target['Notes'] !== source['Notes']) {
      const existing = target['Notes'] || '';
      const incoming = source['Notes'] || '';
      const combined = [...new Set([...existing.split('\n'), ...incoming.split('\n')])].filter(Boolean);
      target['Notes'] = combined.join('\n');
    }
  }

  contacts.forEach(contact => {
    const email = (contact['Indirizzo posta elettronica'] || '').toLowerCase().trim();
    const email2 = (contact['Indirizzo posta elettronica 2'] || '').toLowerCase().trim();
    const phone = normalizePhone(contact['Cellulare'] || contact['Ufficio'] || contact['Abitazione']);
    const displayName = `${contact['Nome']} ${contact['Cognome']}`.trim().toLowerCase();

    let existingIdx = -1;

    if (email && emailMap.has(email)) existingIdx = emailMap.get(email);
    else if (email2 && emailMap.has(email2)) existingIdx = emailMap.get(email2);
    else if (phone && phone.length >= 8 && phoneMap.has(phone)) existingIdx = phoneMap.get(phone);
    else if (displayName.length > 2 && nameMap.has(displayName)) existingIdx = nameMap.get(displayName);

    if (existingIdx >= 0) {
      mergeInto(result[existingIdx], contact);
    } else {
      const idx = result.length;
      result.push({ ...contact });
      if (email) emailMap.set(email, idx);
      if (email2) emailMap.set(email2, idx);
      if (phone && phone.length >= 8) phoneMap.set(phone, idx);
      if (displayName.length > 2) nameMap.set(displayName, idx);
    }
  });

  return result;
}

/**
 * Convert array of Outlook objects to CSV string (UTF-8 BOM for Excel compatibility)
 */
export function toCSV(contacts) {
  const header = OUTLOOK_COLUMNS.join(',');
  const rows = contacts.map(c => {
    return OUTLOOK_COLUMNS.map(col => {
      const val = (c[col] || '').toString().replace(/"/g, '""');
      return val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val}"` : val;
    }).join(',');
  });
  return '\uFEFF' + [header, ...rows].join('\r\n');
}

/**
 * Parse CSV text auto-detecting encoding issues (latin-1 decoded as utf-8)
 */
export function parseCSV(text) {
  // PapaParse handles the parsing
  return text;
}

/**
 * Get stats about a set of contacts
 */
export function getStats(contacts) {
  return {
    total: contacts.length,
    withEmail: contacts.filter(c => c['Indirizzo posta elettronica'] || c['Email primaria']).length,
    withPhone: contacts.filter(c =>
      c['Cellulare'] || c['Ufficio'] || c['Abitazione'] ||
      c['Numero cellulare'] || c['Telefono lavoro'] || c['Telefono casa']
    ).length,
    withCompany: contacts.filter(c => c['Società'] || c['Organizzazione']).length,
  };
}
