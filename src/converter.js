/**
 * Thunderbird → Outlook CSV Converter
 * Handles both Italian and US English mapping dynamically based on locale.
 */

export const OUTLOOK_COLUMNS_IT = [
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

export const OUTLOOK_COLUMNS_EN = [
  'Title', 'First Name', 'Middle Name', 'Last Name', 'Suffix',
  'Company', 'Department', 'Job Title',
  'Business Street', 'Business Street 2', 'Business Street 3', 'Business City', 'Business State', 'Business Postal Code', 'Business Country/Region',
  'Home Street', 'Home Street 2', 'Home Street 3', 'Home City', 'Home State', 'Home Postal Code', 'Home Country/Region',
  'Other Street', 'Other Street 2', 'Other Street 3', 'Other City', 'Other State', 'Other Postal Code', 'Other Country/Region',
  'Assistant\'s Phone', 'Business Fax', 'Business Phone', 'Business Phone 2', 'Callback',
  'Car Phone', 'Company Main Phone', 'Home Fax', 'Home Phone', 'Home Phone 2',
  'ISDN', 'Mobile Phone', 'Other Fax', 'Other Phone', 'Pager',
  'Primary Phone', 'Radio Phone', 'TTY/TDD Phone', 'Telex',
  'Account', 'Anniversary', 'Assistant\'s Name', 'Billing Information', 'Birthday',
  'Business Address PO Box', 'Categories', 'Children', 'Directory Server', 'E-mail Address',
  'E-mail Type', 'E-mail Display Name', 'E-mail 2 Address', 'E-mail 2 Type', 'E-mail 2 Display Name',
  'E-mail 3 Address', 'E-mail 3 Type', 'E-mail 3 Display Name', 'Gender', 'Government ID Number',
  'Hobby', 'Home Address PO Box', 'Initials', 'Internet Free Busy', 'Keywords',
  'Language', 'Location', 'Manager\'s Name', 'Mileage', 'Notes', 'Office Location',
  'Organizational ID Number', 'Other Address PO Box', 'Priority', 'Private', 'Profession',
  'Referred By', 'Sensitivity', 'Spouse', 'User 1', 'User 2', 'User 3', 'User 4', 'Web Page'
];

export function getOutlookColumns(lang) {
  return lang && lang.startsWith('it') ? OUTLOOK_COLUMNS_IT : OUTLOOK_COLUMNS_EN;
}

export function isThunderbirdFormat(columns) {
  const tbCols = ['Email primaria', 'Nome visualizzato', 'Soprannome', 'Email secondaria'];
  return tbCols.some(col => columns.includes(col));
}

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

function buildBirthday(row) {
  const y = row['Anno di nascita'];
  const m = row['Mese di nascita'];
  const d = row['Giorno di nascita'];
  if (y && m && d && y !== '0' && m !== '0' && d !== '0') {
    return `${m}/${d}/${y}`;
  }
  return '';
}

function buildInitials(nome, cognome) {
  const n = (nome || '').trim();
  const c = (cognome || '').trim();
  if (n && c) return `${n[0].toUpperCase()}.${c[0].toUpperCase()}.`;
  if (n) return `${n[0].toUpperCase()}.`;
  if (c) return `${c[0].toUpperCase()}.`;
  return '';
}

// SCRUBBING UTILITIES
export function applyCaseScrubbing(contacts) {
  return contacts.map(contact => {
    const newContact = { ...contact };
    ['Nome', 'First Name', 'Cognome', 'Last Name'].forEach(f => {
      if (newContact[f]) {
        // Simple title case
        newContact[f] = newContact[f].toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      }
    });
    return newContact;
  });
}

export function applyPhoneScrubbing(contacts) {
  return contacts.map(contact => {
    const newContact = { ...contact };
    const phoneFields = ['Cellulare', 'Mobile Phone', 'Ufficio', 'Business Phone', 'Abitazione', 'Home Phone'];
    phoneFields.forEach(f => {
      let val = newContact[f];
      if (val) {
        val = val.replace(/\D/g, ''); // strip
        if (val.startsWith('3') && val.length === 10) val = '+39' + val;
        else if (val.startsWith('0') && !val.startsWith('00')) val = '+39' + val;
        else if (val.startsWith('0039')) val = '+' + val.substring(2);
        else if (val.startsWith('39') && val.length > 10) val = '+' + val;
        newContact[f] = val;
      }
    });
    return newContact;
  });
}

// MAPPING
export function mapThunderbirdToOutlook(row, sourceTag = '', enableSourceTagging = false, lang = 'en', mapOverrides = {}) {
  const isIt = lang.startsWith('it');
  const nome = (row['Nome'] || '').trim();
  const cognome = (row['Cognome'] || '').trim();
  const displayName = buildDisplayName(row);
  const email1 = (row['Email primaria'] || '').trim();
  const email2 = (row['Email secondaria'] || '').trim();

  const out = {};
  const columns = getOutlookColumns(lang);
  columns.forEach(col => out[col] = '');

  const keys = {
    nome: isIt ? 'Nome' : 'First Name',
    cognome: isIt ? 'Cognome' : 'Last Name',
    iniziali: isIt ? 'Iniziali' : 'Initials',
    societa: isIt ? 'Società' : 'Company',
    reparto: isIt ? 'Reparto' : 'Department',
    posizione: isIt ? 'Posizione' : 'Job Title',
    viaUff: isIt ? 'Via (uff.)' : 'Business Street',
    viaUff2: isIt ? 'Via (uff.) 2' : 'Business Street 2',
    cittaUff: isIt ? 'Città (uff.)' : 'Business City',
    provUff: isIt ? 'Provincia (uff.)' : 'Business State',
    capUff: isIt ? 'CAP (uff.)' : 'Business Postal Code',
    paeseUff: isIt ? 'Paese/area geografica (uff.)' : 'Business Country/Region',
    viaAb: isIt ? 'Via (ab.)' : 'Home Street',
    viaAb2: isIt ? 'Via (ab.) 2' : 'Home Street 2',
    cittaAb: isIt ? 'Città (ab.)' : 'Home City',
    provAb: isIt ? 'Provincia (ab.)' : 'Home State',
    capAb: isIt ? 'CAP (ab.)' : 'Home Postal Code',
    paeseAb: isIt ? 'Paese/area geografica (ab.)' : 'Home Country/Region',
    ufficio: isIt ? 'Ufficio' : 'Business Phone',
    abitazione: isIt ? 'Abitazione' : 'Home Phone',
    faxUff: isIt ? 'Fax (uff.)' : 'Business Fax',
    cellulare: isIt ? 'Cellulare' : 'Mobile Phone',
    cercapersone: isIt ? 'Cercapersone' : 'Pager',
    email1: isIt ? 'Indirizzo posta elettronica' : 'E-mail Address',
    email1Type: isIt ? 'Tipo posta elettronica' : 'E-mail Type',
    email1Disp: isIt ? 'Nome visualizzato posta elettronica' : 'E-mail Display Name',
    email2: isIt ? 'Indirizzo posta elettronica 2' : 'E-mail 2 Address',
    email2Type: isIt ? 'Tipo posta elettronica 2' : 'E-mail 2 Type',
    email2Disp: isIt ? 'Nome visualizzato posta elettronica 2' : 'E-mail 2 Display Name',
    web: isIt ? 'Pagina Web' : 'Web Page',
    compleanno: isIt ? 'Compleanno' : 'Birthday',
    notes: isIt ? 'Notes' : 'Notes',
    utente1: isIt ? 'Utente 1' : 'User 1',
    priorita: isIt ? 'Priorità' : 'Priority',
    privato: isIt ? 'Privato' : 'Private',
    riservatezza: isIt ? 'Riservatezza' : 'Sensitivity',
    sesso: isIt ? 'Sesso' : 'Gender',
    anniversario: isIt ? 'Anniversario' : 'Anniversary'
  };

  out[keys.nome] = nome;
  out[keys.cognome] = cognome;
  out[keys.iniziali] = buildInitials(nome, cognome);

  out[keys.societa] = (row['Organizzazione'] || '').trim();
  out[keys.reparto] = (row['Reparto'] || '').trim();
  out[keys.posizione] = (row['Qualifica'] || '').trim();

  out[keys.viaUff] = (row['Indirizzo di lavoro'] || '').trim();
  out[keys.viaUff2] = (row['Indirizzo di lavoro 2'] || '').trim();
  out[keys.cittaUff] = (row['Città di lavoro'] || '').trim();
  out[keys.provUff] = (row['Provincia di lavoro'] || '').trim();
  out[keys.capUff] = (row['CAP di lavoro'] || '').trim();
  out[keys.paeseUff] = (row['Nazione di lavoro'] || '').trim();

  out[keys.viaAb] = (row['Indirizzo di casa'] || '').trim();
  out[keys.viaAb2] = (row['Indirizzo di casa 2'] || '').trim();
  out[keys.cittaAb] = (row['Città di residenza'] || '').trim();
  out[keys.provAb] = (row['Provincia di residenza'] || '').trim();
  out[keys.capAb] = (row['CAP di residenza'] || '').trim();
  out[keys.paeseAb] = (row['Nazione di residenza'] || '').trim();

  out[keys.ufficio] = (row['Telefono lavoro'] || '').trim();
  out[keys.abitazione] = (row['Telefono casa'] || '').trim();
  out[keys.faxUff] = (row['Numero fax'] || '').trim();
  out[keys.cellulare] = (row['Numero cellulare'] || '').trim();
  out[keys.cercapersone] = (row['Numero cercapersone'] || '').trim();

  out[keys.email1] = email1;
  out[keys.email1Type] = email1 ? 'SMTP' : '';
  out[keys.email1Disp] = email1 ? `${displayName} (${email1})` : '';

  out[keys.email2] = email2;
  out[keys.email2Type] = email2 ? 'SMTP' : '';
  out[keys.email2Disp] = email2 ? `${displayName} (${email2})` : '';

  out[keys.web] = (row['Pagina web 1'] || row['Pagina web 2'] || '').trim();
  out[keys.compleanno] = buildBirthday(row);

  // Field Overrides Mapping for Personalizzati
  const customMap = { ...mapOverrides };

  const notes = [];
  if (row['Note']) notes.push(row['Note'].trim());
  
  [1, 2, 3, 4].forEach(i => {
    const key = `Personalizzato ${i}`;
    const val = row[key];
    if (val) {
      if (customMap[key] && customMap[key] !== 'Notes') {
        // mapped to a specific field (e.g. User 2)
        out[customMap[key]] = val;
      } else {
        notes.push(`${key}: ${val}`);
      }
    }
  });

  if (enableSourceTagging && sourceTag) {
    notes.push(`[Group: ${sourceTag}]`);
  }
  
  out[keys.notes] = notes.join('\n');

  out[keys.utente1] = (row['Nome Instant Messenger'] || '').trim();

  out[keys.priorita] = isIt ? 'Normale' : 'Normal';
  out[keys.privato] = isIt ? 'Falso' : 'False';
  out[keys.riservatezza] = isIt ? 'Normale' : 'Normal';
  out[keys.sesso] = isIt ? 'Non specificato' : 'Unspecified';
  out[keys.anniversario] = '0/0/00';

  return out;
}

export function deduplicateContacts(contacts, lang = 'en') {
  const isIt = lang.startsWith('it');
  const emailCol = isIt ? 'Indirizzo posta elettronica' : 'E-mail Address';
  const email2Col = isIt ? 'Indirizzo posta elettronica 2' : 'E-mail 2 Address';
  const cellCol = isIt ? 'Cellulare' : 'Mobile Phone';
  const uffCol = isIt ? 'Ufficio' : 'Business Phone';
  const abCol = isIt ? 'Abitazione' : 'Home Phone';
  const nomeCol = isIt ? 'Nome' : 'First Name';
  const cognomeCol = isIt ? 'Cognome' : 'Last Name';
  const noteCol = isIt ? 'Notes' : 'Notes';
  
  const emailMap = new Map();
  const phoneMap = new Map();
  const nameMap = new Map();
  
  const resolved = [];
  const conflicts = []; // Items that need manual resolution
  
  const columns = getOutlookColumns(lang);

  function normalizePhone(p) {
    return (p || '').replace(/\D/g, '').replace(/^0039/, '39').replace(/^00/, '');
  }

  function mergeInto(target, source) {
    columns.forEach(col => {
      if (!target[col] && source[col]) target[col] = source[col];
    });
    if (source[noteCol] && target[noteCol] !== source[noteCol]) {
      const existing = target[noteCol] || '';
      const incoming = source[noteCol] || '';
      const combined = [...new Set([...existing.split('\n'), ...incoming.split('\n')])].filter(Boolean);
      target[noteCol] = combined.join('\n');
    }
  }
  
  // Conflict detector: Same email/phone but fundamentally different names
  function isNameConflict(t, s) {
    const tName = `${t[nomeCol] || ''} ${t[cognomeCol] || ''}`.trim().toLowerCase();
    const sName = `${s[nomeCol] || ''} ${s[cognomeCol] || ''}`.trim().toLowerCase();
    // if both missing, no conflict. if one missing, just merge.
    if (!tName || !sName) return false;
    // Simple naive check: if they don't share at least one name token, it's a conflict
    const tParts = tName.split(' ');
    const sParts = sName.split(' ');
    const match = tParts.some(p => sParts.includes(p));
    return !match;
  }

  contacts.forEach(contact => {
    const email = (contact[emailCol] || '').toLowerCase().trim();
    const email2 = (contact[email2Col] || '').toLowerCase().trim();
    const phone = normalizePhone(contact[cellCol] || contact[uffCol] || contact[abCol]);
    const displayName = `${contact[nomeCol]} ${contact[cognomeCol]}`.trim().toLowerCase();

    let existingIdx = -1;
    if (email && emailMap.has(email)) existingIdx = emailMap.get(email);
    else if (email2 && emailMap.has(email2)) existingIdx = emailMap.get(email2);
    else if (phone && phone.length >= 8 && phoneMap.has(phone)) existingIdx = phoneMap.get(phone);
    else if (displayName.length > 2 && nameMap.has(displayName)) existingIdx = nameMap.get(displayName);

    if (existingIdx >= 0) {
      const target = resolved[existingIdx];
      if (isNameConflict(target, contact)) {
        conflicts.push({ existing: { ...target }, incoming: { ...contact }, existingIdx });
      } else {
        mergeInto(target, contact);
      }
    } else {
      const idx = resolved.length;
      resolved.push({ ...contact });
      if (email) emailMap.set(email, idx);
      if (email2) emailMap.set(email2, idx);
      if (phone && phone.length >= 8) phoneMap.set(phone, idx);
      if (displayName.length > 2) nameMap.set(displayName, idx);
    }
  });

  return { resolved, conflicts };
}

// Function to handle merging or keeping conflicts
export function applyConflictResolution(resolved, conflicts, choices, lang = 'en') {
  const result = [...resolved];
  const columns = getOutlookColumns(lang);
  const noteCol = lang.startsWith('it') ? 'Notes' : 'Notes';
  
  function mergeInto(target, source) {
    columns.forEach(col => {
      if (!target[col] && source[col]) target[col] = source[col];
    });
    if (source[noteCol] && target[noteCol] !== source[noteCol]) {
      const existing = target[noteCol] || '';
      const incoming = source[noteCol] || '';
      const combined = [...new Set([...existing.split('\n'), ...incoming.split('\n')])].filter(Boolean);
      target[noteCol] = combined.join('\n');
    }
  }

  conflicts.forEach((conflict, i) => {
    const choice = choices[i];
    if (choice === 'merge') {
      mergeInto(result[conflict.existingIdx], conflict.incoming);
    } else {
      result.push(conflict.incoming);
    }
  });
  
  return result;
}

export function toCSV(contacts, lang = 'en') {
  if (contacts.length === 0) return '';
  const columns = getOutlookColumns(lang);
  const header = columns.join(',');
  const rows = contacts.map(c => {
    return columns.map(col => {
      let val = (c[col] || '');
      val = String(val).replace(/"/g, '""');
      return val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val}"` : val;
    }).join(',');
  });
  return '\uFEFF' + [header, ...rows].join('\r\n');
}

export function getStats(contacts, lang = 'en') {
  const isIt = lang.startsWith('it');
  const emailCol = isIt ? 'Indirizzo posta elettronica' : 'E-mail Address';
  const cellCol = isIt ? 'Cellulare' : 'Mobile Phone';
  const uffCol = isIt ? 'Ufficio' : 'Business Phone';
  const abCol = isIt ? 'Abitazione' : 'Home Phone';
  const dittaCol = isIt ? 'Società' : 'Company';

  return {
    total: contacts.length,
    withEmail: contacts.filter(c => c[emailCol] || c['Email primaria']).length,
    withPhone: contacts.filter(c => c[cellCol] || c[uffCol] || c[abCol] || c['Numero cellulare'] || c['Telefono lavoro'] || c['Telefono casa']).length,
    withCompany: contacts.filter(c => c[dittaCol] || c['Organizzazione']).length,
  };
}
