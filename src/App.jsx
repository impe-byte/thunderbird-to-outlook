import { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import {
  isThunderbirdFormat, mapThunderbirdToOutlook,
  deduplicateContacts, toCSV, getStats, OUTLOOK_COLUMNS
} from './converter.js';

const MAX_PREVIEW = 8;

function FileTag({ name, count, onRemove }) {
  return (
    <div className="file-tag">
      <div className="file-tag-inner">
        <span className="file-icon">📋</span>
        <div className="file-info">
          <span className="file-name">{name}</span>
          <span className="file-count">{count} contatti</span>
        </div>
        <button className="remove-btn" onClick={onRemove} title="Rimuovi">✕</button>
      </div>
    </div>
  );
}

function StepBadge({ n, active, done }) {
  return (
    <div className={`step-badge ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
      {done ? '✓' : n}
    </div>
  );
}

export default function App() {
  const [files, setFiles] = useState([]);   // [{name, rows, stats, tag}]
  const [result, setResult] = useState(null); // {contacts, stats, dedupStats}
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [dedup, setDedup] = useState(true);
  const [processing, setProcessing] = useState(false);
  const dropRef = useRef(null);

  const step = files.length === 0 ? 1 : result ? 3 : 2;

  function parseFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        let text = e.target.result;
        // Try UTF-8 first, fall back to latin-1
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          encoding: 'UTF-8',
          complete: (res) => {
            if (res.data.length === 0 || !isThunderbirdFormat(res.meta.fields || [])) {
              // Try latin-1
              const reader2 = new FileReader();
              reader2.onload = (e2) => {
                Papa.parse(e2.target.result, {
                  header: true,
                  skipEmptyLines: true,
                  complete: (res2) => {
                    if (!isThunderbirdFormat(res2.meta.fields || [])) {
                      reject(new Error(`"${file.name}" non sembra un CSV di rubrica Thunderbird`));
                    } else {
                      resolve({ name: file.name, rows: res2.data, fields: res2.meta.fields });
                    }
                  },
                  error: reject
                });
              };
              reader2.readAsText(file, 'latin-1');
            } else {
              resolve({ name: file.name, rows: res.data, fields: res.meta.fields });
            }
          },
          error: reject
        });
      };
      reader.readAsText(file, 'UTF-8');
    });
  }

  const handleFiles = useCallback(async (fileList) => {
    setError('');
    const csvFiles = Array.from(fileList).filter(f =>
      f.name.toLowerCase().endsWith('.csv')
    );
    if (csvFiles.length === 0) {
      setError('Nessun file CSV selezionato.');
      return;
    }

    const parsed = [];
    for (const f of csvFiles) {
      // Skip if already loaded
      if (files.find(x => x.name === f.name)) continue;
      try {
        const data = await parseFile(f);
        const stats = getStats(data.rows);
        parsed.push({ name: data.name, rows: data.rows, stats, tag: data.name.replace(/\.csv$/i, '') });
      } catch (err) {
        setError(err.message);
        return;
      }
    }

    setFiles(prev => [...prev, ...parsed]);
    setResult(null);
  }, [files]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  function removeFile(name) {
    setFiles(f => f.filter(x => x.name !== name));
    setResult(null);
  }

  function convert() {
    setProcessing(true);
    setTimeout(() => {
      try {
        let allContacts = [];
        files.forEach(f => {
          const mapped = f.rows.map(row => mapThunderbirdToOutlook(row, f.tag));
          allContacts = allContacts.concat(mapped);
        });

        const beforeDedup = allContacts.length;
        const contacts = dedup ? deduplicateContacts(allContacts) : allContacts;
        const afterDedup = contacts.length;

        setResult({
          contacts,
          stats: getStats(contacts),
          dedupRemoved: dedup ? beforeDedup - afterDedup : 0,
          csv: toCSV(contacts)
        });
      } catch (err) {
        setError('Errore durante la conversione: ' + err.message);
      }
      setProcessing(false);
    }, 50);
  }

  function download() {
    if (!result) return;
    const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rubrica_outlook.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalInput = files.reduce((s, f) => s + f.rows.length, 0);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-bird">🦅</span>
            <div>
              <div className="logo-title">TB → OL Converter</div>
              <div className="logo-sub">Thunderbird · Outlook · Migrazione rubrica</div>
            </div>
          </div>
          <div className="steps-row">
            {[
              { n: 1, label: 'Carica file' },
              { n: 2, label: 'Converti' },
              { n: 3, label: 'Scarica' },
            ].map(s => (
              <div key={s.n} className="step-item">
                <StepBadge n={s.n} active={step === s.n} done={step > s.n} />
                <span className={`step-label ${step >= s.n ? 'visible' : ''}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="main">
        {/* Drop Zone */}
        <section className="section">
          <div className="section-header">
            <StepBadge n={1} active={step === 1} done={step > 1} />
            <h2>Carica file CSV da Thunderbird</h2>
          </div>

          <div
            ref={dropRef}
            className={`drop-zone ${dragging ? 'dragging' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".csv"
              multiple
              style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files)}
            />
            <div className="drop-content">
              <div className="drop-icon">{dragging ? '📂' : '📁'}</div>
              <div className="drop-text">
                <strong>Trascina qui i tuoi CSV</strong><br />
                <span>o clicca per selezionarli</span>
              </div>
              <div className="drop-hint">
                Puoi caricare più rubriche contemporaneamente<br/>
                (Contatti, Indirizzi collezionati, Rubrica personale, ecc.)
              </div>
            </div>
          </div>

          {error && <div className="error-box">⚠️ {error}</div>}

          {files.length > 0 && (
            <div className="files-grid">
              {files.map(f => (
                <FileTag
                  key={f.name}
                  name={f.name}
                  count={f.rows.length}
                  onRemove={() => removeFile(f.name)}
                />
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div className="input-summary">
              <span>📊</span>
              <span><strong>{files.length}</strong> rubrica{files.length > 1 ? 'i' : ''} caricate</span>
              <span className="sep">·</span>
              <span><strong>{totalInput}</strong> contatti totali (pre-dedup)</span>
            </div>
          )}
        </section>

        {/* Options + Convert */}
        {files.length > 0 && (
          <section className="section">
            <div className="section-header">
              <StepBadge n={2} active={step === 2} done={step > 2} />
              <h2>Opzioni e conversione</h2>
            </div>

            <div className="options-row">
              <label className="toggle-label">
                <div className={`toggle ${dedup ? 'on' : ''}`} onClick={() => setDedup(!dedup)}>
                  <div className="toggle-knob" />
                </div>
                <div>
                  <div className="opt-title">Rimuovi duplicati</div>
                  <div className="opt-desc">Unisce contatti con stessa email, telefono o nome. I dati vengono conservati.</div>
                </div>
              </label>
            </div>

            <div className="mapping-preview">
              <div className="mapping-title">📋 Mappa campi Thunderbird → Outlook</div>
              <div className="mapping-grid">
                {[
                  ['Email primaria', 'Indirizzo posta elettronica'],
                  ['Email secondaria', 'Indirizzo posta elettronica 2'],
                  ['Telefono lavoro', 'Ufficio'],
                  ['Numero cellulare', 'Cellulare'],
                  ['Telefono casa', 'Abitazione'],
                  ['Numero fax', 'Fax (uff.)'],
                  ['Organizzazione', 'Società'],
                  ['Qualifica', 'Posizione'],
                  ['Indirizzo di lavoro', 'Via (uff.)'],
                  ['Città di lavoro', 'Città (uff.)'],
                  ['Indirizzo di casa', 'Via (ab.)'],
                  ['Città di residenza', 'Città (ab.)'],
                  ['Pagina web 1', 'Pagina Web'],
                  ['Note', 'Notes'],
                  ['Anno/Mese/Giorno nascita', 'Compleanno'],
                  ['Personalizzato 1-4', 'Notes (append)'],
                ].map(([from, to]) => (
                  <div key={from} className="mapping-row">
                    <span className="map-from">{from}</span>
                    <span className="map-arrow">→</span>
                    <span className="map-to">{to}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              className={`convert-btn ${processing ? 'loading' : ''}`}
              onClick={convert}
              disabled={processing}
            >
              {processing ? (
                <><span className="spinner" />Conversione in corso...</>
              ) : (
                <>⚡ Converti {totalInput} contatti</>
              )}
            </button>
          </section>
        )}

        {/* Result */}
        {result && (
          <section className="section result-section">
            <div className="section-header">
              <StepBadge n={3} active done />
              <h2>Risultato pronto!</h2>
            </div>

            <div className="stats-grid">
              <div className="stat-card accent">
                <div className="stat-num">{result.contacts.length}</div>
                <div className="stat-label">Contatti nel file</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{result.stats.withEmail}</div>
                <div className="stat-label">Con email</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{result.stats.withPhone}</div>
                <div className="stat-label">Con telefono</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{result.stats.withCompany}</div>
                <div className="stat-label">Con azienda</div>
              </div>
              {result.dedupRemoved > 0 && (
                <div className="stat-card success">
                  <div className="stat-num">-{result.dedupRemoved}</div>
                  <div className="stat-label">Duplicati rimossi</div>
                </div>
              )}
            </div>

            {/* Preview table */}
            <div className="preview-wrap">
              <div className="preview-title">Anteprima (prime {MAX_PREVIEW} righe)</div>
              <div className="table-scroll">
                <table className="preview-table">
                  <thead>
                    <tr>
                      {['Nome', 'Cognome', 'Società', 'Indirizzo posta elettronica', 'Cellulare', 'Ufficio'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.contacts.slice(0, MAX_PREVIEW).map((c, i) => (
                      <tr key={i}>
                        {['Nome', 'Cognome', 'Società', 'Indirizzo posta elettronica', 'Cellulare', 'Ufficio'].map(col => (
                          <td key={col}>{c[col] || <span className="empty">—</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.contacts.length > MAX_PREVIEW && (
                <div className="preview-more">
                  + altri {result.contacts.length - MAX_PREVIEW} contatti nel file
                </div>
              )}
            </div>

            <div className="download-row">
              <button className="download-btn" onClick={download}>
                ⬇️ Scarica rubrica_outlook.csv
              </button>
              <div className="download-hint">
                Pronto per l'importazione in Outlook tramite File → Apri ed esporta → Importa/Esporta
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <span>Thunderbird → Outlook Converter</span>
        <span className="sep">·</span>
        <span>Elaborazione 100% locale — nessun dato inviato al server</span>
      </footer>
    </div>
  );
}
