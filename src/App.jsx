import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Papa from 'papaparse';
import {
  isThunderbirdFormat, mapThunderbirdToOutlook,
  deduplicateContacts, toCSV, getStats, getOutlookColumns
} from './converter.js';

const MAX_PREVIEW = 8;

function FileTag({ name, count, onRemove }) {
  const { t } = useTranslation();
  return (
    <div className="file-tag">
      <div className="file-tag-inner">
        <span className="file-icon">📋</span>
        <div className="file-info">
          <span className="file-name">{name}</span>
          <span className="file-count">{count} {t('result.contacts_count').toLowerCase()}</span>
        </div>
        <button className="remove-btn" onClick={onRemove} title={t('upload.remove')}>✕</button>
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
  const { t, i18n } = useTranslation();
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [dedup, setDedup] = useState(true);
  const [processing, setProcessing] = useState(false);
  const dropRef = useRef(null);

  const step = files.length === 0 ? 1 : result ? 3 : 2;

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('it') ? 'en' : 'it';
    i18n.changeLanguage(newLang);
    setResult(null); // Clear results on lang change because columns differ
  };

  function parseFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        let text = e.target.result;
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          encoding: 'UTF-8',
          complete: (res) => {
            if (res.data.length === 0 || !isThunderbirdFormat(res.meta.fields || [])) {
              const reader2 = new FileReader();
              reader2.onload = (e2) => {
                Papa.parse(e2.target.result, {
                  header: true,
                  skipEmptyLines: true,
                  complete: (res2) => {
                    if (!isThunderbirdFormat(res2.meta.fields || [])) {
                      reject(new Error(t('upload.error_format', { name: file.name })));
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
    const csvFiles = Array.from(fileList).filter(f => f.name.toLowerCase().endsWith('.csv'));
    if (csvFiles.length === 0) {
      setError(t('upload.no_files'));
      return;
    }

    const parsed = [];
    const currentLang = i18n.language;
    for (const f of csvFiles) {
      if (files.find(x => x.name === f.name)) continue;
      try {
        const data = await parseFile(f);
        const stats = getStats(data.rows, currentLang);
        parsed.push({ name: data.name, rows: data.rows, stats, tag: data.name.replace(/\.csv$/i, '') });
      } catch (err) {
        setError(err.message);
        return;
      }
    }

    setFiles(prev => [...prev, ...parsed]);
    setResult(null);
  }, [files, i18n.language, t]);

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
    const lang = i18n.language;
    setTimeout(() => {
      try {
        let allContacts = [];
        files.forEach(f => {
          const mapped = f.rows.map(row => mapThunderbirdToOutlook(row, f.tag, lang));
          allContacts = allContacts.concat(mapped);
        });

        const beforeDedup = allContacts.length;
        const contacts = dedup ? deduplicateContacts(allContacts, lang) : allContacts;
        const afterDedup = contacts.length;

        setResult({
          contacts,
          stats: getStats(contacts, lang),
          dedupRemoved: dedup ? beforeDedup - afterDedup : 0,
          csv: toCSV(contacts, lang)
        });
      } catch (err) {
        setError(t('options.error', { message: err.message }));
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

  const isIt = i18n.language.startsWith('it');

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-monogram">iB<span>_</span></div>
            <div>
              <div className="logo-title">{t('header.title')}</div>
              <div className="logo-sub">{t('header.subtitle')}</div>
            </div>
          </div>
          <div className="steps-row">
            {[
              { n: 1, label: t('header.step1') },
              { n: 2, label: t('header.step2') },
              { n: 3, label: t('header.step3') },
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
            <h2>{t('upload.title')}</h2>
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
                {t('upload.drag_text')}<br />
                <span>{t('upload.click_text')}</span>
              </div>
              <div className="drop-hint">
                {t('upload.hint').split('\n').map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
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
              <span>
                <strong>{files.length}</strong> {files.length === 1 ? t('upload.summary_files_one') : t('upload.summary_files_other', { count: '' }).trim()}
              </span>
              <span className="sep">·</span>
              <span><strong>{totalInput}</strong> {t('upload.summary_contacts', { count: '' }).trim()}</span>
            </div>
          )}
        </section>

        {/* Options + Convert */}
        {files.length > 0 && (
          <section className="section">
            <div className="section-header">
              <StepBadge n={2} active={step === 2} done={step > 2} />
              <h2>{t('options.title')}</h2>
            </div>

            <div className="options-row">
              <label className="toggle-label">
                <div className={`toggle ${dedup ? 'on' : ''}`} onClick={() => setDedup(!dedup)}>
                  <div className="toggle-knob" />
                </div>
                <div>
                  <div className="opt-title">{t('options.dedup_title')}</div>
                  <div className="opt-desc">{t('options.dedup_desc')}</div>
                </div>
              </label>
            </div>

            <div className="mapping-preview">
              <div className="mapping-title">📋 {t('options.mapping_title')}</div>
              <div className="mapping-grid">
                {[
                  ['Email primaria', isIt ? 'Indirizzo posta elettronica' : 'E-mail Address'],
                  ['Email secondaria', isIt ? 'Indirizzo posta elettronica 2' : 'E-mail 2 Address'],
                  ['Telefono lavoro', isIt ? 'Ufficio' : 'Business Phone'],
                  ['Numero cellulare', isIt ? 'Cellulare' : 'Mobile Phone'],
                  ['Telefono casa', isIt ? 'Abitazione' : 'Home Phone'],
                  ['Numero fax', isIt ? 'Fax (uff.)' : 'Business Fax'],
                  ['Organizzazione', isIt ? 'Società' : 'Company'],
                  ['Qualifica', isIt ? 'Posizione' : 'Job Title'],
                  ['Indirizzo di lavoro', isIt ? 'Via (uff.)' : 'Business Street'],
                  ['Città di lavoro', isIt ? 'Città (uff.)' : 'Business City'],
                  ['Indirizzo di casa', isIt ? 'Via (ab.)' : 'Home Street'],
                  ['Città di residenza', isIt ? 'Città (ab.)' : 'Home City'],
                  ['Pagina web 1', isIt ? 'Pagina Web' : 'Web Page'],
                  ['Note', 'Notes'],
                  ['Anno/Mese/Giorno nascita', isIt ? 'Compleanno' : 'Birthday'],
                  ['Personalizzato 1-4', isIt ? 'Notes (append)' : 'Notes (append)'],
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
                <><span className="spinner" />{t('options.converting')}</>
              ) : (
                <>⚡ {t('options.convert_btn', { count: totalInput })}</>
              )}
            </button>
          </section>
        )}

        {/* Result */}
        {result && (
          <section className="section result-section">
            <div className="section-header">
              <StepBadge n={3} active done />
              <h2>{t('result.title')}</h2>
            </div>

            <div className="stats-grid">
              <div className="stat-card accent">
                <div className="stat-num">{result.contacts.length}</div>
                <div className="stat-label">{t('result.contacts_count')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{result.stats.withEmail}</div>
                <div className="stat-label">{t('result.with_email')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{result.stats.withPhone}</div>
                <div className="stat-label">{t('result.with_phone')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{result.stats.withCompany}</div>
                <div className="stat-label">{t('result.with_company')}</div>
              </div>
              {result.dedupRemoved > 0 && (
                <div className="stat-card success">
                  <div className="stat-num">-{result.dedupRemoved}</div>
                  <div className="stat-label">{t('result.dedup_removed')}</div>
                </div>
              )}
            </div>

            {/* Preview table */}
            <div className="preview-wrap">
              <div className="preview-title">{t('result.preview_title', { max: MAX_PREVIEW })}</div>
              <div className="table-scroll">
                <table className="preview-table">
                  <thead>
                    <tr>
                      {(isIt 
                        ? ['Nome', 'Cognome', 'Società', 'Indirizzo posta elettronica', 'Cellulare', 'Ufficio']
                        : ['First Name', 'Last Name', 'Company', 'E-mail Address', 'Mobile Phone', 'Business Phone']
                      ).map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.contacts.slice(0, MAX_PREVIEW).map((c, i) => (
                      <tr key={i}>
                        {(isIt 
                          ? ['Nome', 'Cognome', 'Società', 'Indirizzo posta elettronica', 'Cellulare', 'Ufficio']
                          : ['First Name', 'Last Name', 'Company', 'E-mail Address', 'Mobile Phone', 'Business Phone']
                        ).map(col => (
                          <td key={col}>{c[col] || <span className="empty">{t('result.empty_cell')}</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.contacts.length > MAX_PREVIEW && (
                <div className="preview-more">
                  {t('result.preview_more', { remaining: result.contacts.length - MAX_PREVIEW })}
                </div>
              )}
            </div>

            <div className="download-row">
              <button className="download-btn" onClick={download}>
                ⬇️ {t('result.download_btn')}
              </button>
              <div className="download-hint">
                {t('result.download_hint')}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <div className="footer-left">
          <span className="footer-claim">{t('footer.claim')}</span>
          <br/>
          <span>{t('footer.privacy')}</span>
        </div>
        <div className="lang-switcher">
          <button className={`lang-btn ${isIt ? 'active' : ''}`} onClick={() => i18n.changeLanguage('it')}>IT</button>
          <button className={`lang-btn ${!isIt ? 'active' : ''}`} onClick={() => i18n.changeLanguage('en')}>EN</button>
        </div>
      </footer>
    </div>
  );
}
