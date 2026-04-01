import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Papa from 'papaparse';
import {
  isThunderbirdFormat, mapThunderbirdToOutlook,
  deduplicateContacts, toCSV, getStats, getOutlookColumns,
  applyCaseScrubbing, applyPhoneScrubbing, applyConflictResolution
} from './converter.js';

export default function App() {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const isIt = i18n.language.startsWith('it');

  // Global State
  const [groups, setGroups] = useState([]); // { id, originalName, displayName, color, contacts }
  const [enableSourceTagging, setEnableSourceTagging] = useState(false);
  
  const [resolvedContacts, setResolvedContacts] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [conflictChoices, setConflictChoices] = useState({}); // { index: 'merge'|'keep' }
  const [mappingOverrides, setMappingOverrides] = useState({
    'Personalizzato 1': 'Notes',
    'Personalizzato 2': 'Notes',
    'Personalizzato 3': 'Notes',
    'Personalizzato 4': 'Notes'
  });
  
  const [finalContacts, setFinalContacts] = useState([]);

  const toggleLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  // --- STEP 1 LOGIC ---
  const handleFiles = async (fileList) => {
    const csvFiles = Array.from(fileList).filter(f => f.name.toLowerCase().endsWith('.csv'));
    const newGroups = [];
    for (const file of csvFiles) {
      if (groups.find(g => g.originalName === file.name)) continue;
      const data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = e => {
          Papa.parse(e.target.result, {
            header: true, skipEmptyLines: true, encoding: 'UTF-8',
            complete: res => resolve(res.data)
          });
        };
        reader.readAsText(file, 'UTF-8');
      });
      newGroups.push({
        id: Date.now() + Math.random(),
        originalName: file.name,
        displayName: file.name.replace(/\.csv$/i, ''),
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        contacts: data
      });
    }
    setGroups([...groups, ...newGroups]);
  };

  const removeGroup = (id) => setGroups(groups.filter(g => g.id !== id));
  
  const updateGroupName = (id, name) => {
    setGroups(groups.map(g => g.id === id ? { ...g, displayName: name } : g));
  };

  const processStep1 = () => {
    // Map initial formats and run deduplication
    let allContacts = [];
    groups.forEach(g => {
      const mapped = g.contacts.map(row => mapThunderbirdToOutlook(row, enableSourceTagging ? g.displayName : '', enableSourceTagging, i18n.language, mappingOverrides));
      allContacts = allContacts.concat(mapped);
    });
    
    const { resolved, conflicts } = deduplicateContacts(allContacts, i18n.language);
    setResolvedContacts(resolved);
    setConflicts(conflicts);
    setCurrentStep(2);
  };

  // --- STEP 2 LOGIC ---
  const handleScrubbing = (type) => {
    if (type === 'case') {
      setResolvedContacts(applyCaseScrubbing(resolvedContacts));
    } else if (type === 'phone') {
      setResolvedContacts(applyPhoneScrubbing(resolvedContacts));
    }
  };

  const handleConflictChoice = (idx, choice) => {
    setConflictChoices({ ...conflictChoices, [idx]: choice });
  };

  const processStep2 = () => {
    const choices = conflicts.map((_, i) => conflictChoices[i] || 'merge');
    const finalSet = applyConflictResolution(resolvedContacts, conflicts, choices, i18n.language);
    setFinalContacts(finalSet);
    setCurrentStep(3);
  };

  // --- STEP 3 LOGIC ---
  const handleOverrideChange = (field, to) => {
    setMappingOverrides(prev => ({ ...prev, [field]: to }));
  };

  const processStep3 = () => {
    // Re-run mapping logic if overrides changed
    let reMapped = [];
    groups.forEach(g => {
      const mapped = g.contacts.map(row => mapThunderbirdToOutlook(row, enableSourceTagging ? g.displayName : '', enableSourceTagging, i18n.language, mappingOverrides));
      reMapped = reMapped.concat(mapped);
    });
    const { resolved, conf } = deduplicateContacts(reMapped, i18n.language);
    // Ignore new conflicts for simplicity or auto merge
    setFinalContacts(resolved);
    setCurrentStep(4);
  };

  // --- STEP 4 LOGIC ---
  const handleCellEdit = (index, field, value) => {
    const updated = [...finalContacts];
    updated[index] = { ...updated[index], [field]: value };
    setFinalContacts(updated);
  };

  const download = () => {
    const csvStr = toCSV(finalContacts, i18n.language);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rubrica_outlook.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const emailCol = isIt ? 'Indirizzo posta elettronica' : 'E-mail Address';

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
        </div>
      </header>

      <div className="wizard-progress">
        <div className="progress-inner">
          <div className="progress-track">
             <div className="progress-track-fill" style={{ width: `${(currentStep - 1) * 33.3}%` }} />
          </div>
          {[
            { n: 1, label: t('header.step1') },
            { n: 2, label: t('header.step2') },
            { n: 3, label: t('header.step3') },
            { n: 4, label: t('header.step4') }
          ].map(s => (
            <div key={s.n} className={`step-node ${currentStep === s.n ? 'active' : ''} ${currentStep > s.n ? 'done' : ''}`}>
              {currentStep === s.n && <div className="step-monogram">iB<span>_</span></div>}
              <div className="step-marker">{currentStep > s.n ? '✓' : s.n}</div>
              <div className="step-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <main className="main">
        {currentStep === 1 && (
          <div className="step-container section">
            <div className="section-header"><h2>{t('upload.title')}</h2></div>
            <p className="section-desc">{t('upload.hint')}</p>
            
            <div className="drop-zone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
               <input id="finput" type="file" multiple accept=".csv" style={{display:'none'}} onChange={e => handleFiles(e.target.files)} />
               <div className="drop-icon">📂</div>
               <div className="drop-text" onClick={() => document.getElementById('finput').click()}>
                 {t('upload.drag_text')}<br/><span>{t('upload.click_text')}</span>
               </div>
            </div>

            {groups.length > 0 && (
              <>
                <div className="files-list">
                  {groups.map(g => (
                    <div key={g.id} className="file-row">
                      <input className="file-name-input" value={g.displayName} onChange={e => updateGroupName(g.id, e.target.value)} />
                      <span className="file-cnt">{g.contacts.length} {t('result.contacts_count').toLowerCase()}</span>
                      <button className="btn-outline" onClick={() => removeGroup(g.id)}>{t('upload.remove')}</button>
                    </div>
                  ))}
                </div>

                <div className="toggle-row">
                  <span>{t('upload.source_tag')}</span>
                  <div className={`toggle-switch ${enableSourceTagging ? 'on' : ''}`} onClick={() => setEnableSourceTagging(!enableSourceTagging)}>
                    <div className="toggle-knob" />
                  </div>
                </div>

                <div className="wizard-footer">
                  <button className="btn-primary" onClick={processStep1}>{t('upload.next_btn')}</button>
                </div>
              </>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="step-container section">
            <div className="section-header"><h2>{t('scrubbing.title')}</h2></div>
            
            <div className="actions-row" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <button className="btn-outline" onClick={() => handleScrubbing('case')}>{t('scrubbing.auto_casing')}</button>
              <button className="btn-outline" onClick={() => handleScrubbing('phone')}>{t('scrubbing.auto_phone')}</button>
            </div>

            {conflicts.length > 0 ? (
              <div>
                <h3 style={{ color: 'var(--warning)', marginBottom: '1rem' }}>{t('scrubbing.conflicts_title')}</h3>
                <p>{t('scrubbing.conflicts_desc')}</p>
                {conflicts.map((c, i) => (
                  <div key={i} className="conflict-card">
                    <div className="conflict-header">Conflict #{i+1}</div>
                    <div className="conflict-body">
                      <div className="conflict-pane">
                         <h4>Existing ({c.existing[isIt ? 'Nome' : 'First Name']} {c.existing[isIt ? 'Cognome' : 'Last Name']})</h4>
                         <pre style={{fontSize:'0.75rem'}}>{JSON.stringify({Email: c.existing[emailCol], Phone: c.existing[isIt ? 'Cellulare' : 'Mobile Phone']}, null, 2)}</pre>
                      </div>
                      <div className="conflict-pane">
                         <h4>Incoming ({c.incoming[isIt ? 'Nome' : 'First Name']} {c.incoming[isIt ? 'Cognome' : 'Last Name']})</h4>
                         <pre style={{fontSize:'0.75rem'}}>{JSON.stringify({Email: c.incoming[emailCol], Phone: c.incoming[isIt ? 'Cellulare' : 'Mobile Phone']}, null, 2)}</pre>
                      </div>
                    </div>
                    <div className="conflict-actions">
                       <button className={`btn-outline ${conflictChoices[i] === 'merge' ? 'active' : ''}`} onClick={() => handleConflictChoice(i, 'merge')}>{t('scrubbing.btn_merge')}</button>
                       <button className={`btn-outline ${conflictChoices[i] === 'keep' ? 'active' : ''}`} onClick={() => handleConflictChoice(i, 'keep')}>{t('scrubbing.btn_keep')}</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--success)', fontWeight:'bold' }}>✓ {t('scrubbing.resolved_msg')}</p>
            )}

            <div className="wizard-footer">
              <button className="btn-outline" style={{marginRight:'auto'}} onClick={() => setCurrentStep(1)}>Back</button>
              <button className="btn-primary" onClick={processStep2}>{t('scrubbing.next_btn')}</button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="step-container section">
            <div className="section-header"><h2>{t('mapping.title')}</h2></div>
            <p>{t('mapping.desc')}</p>

            <h3 style={{ margin: '1rem 0' }}>{t('mapping.field_override')}</h3>
            <div className="map-grid">
               {[1,2,3,4].map(num => (
                 <div key={num} className="map-item">
                   <span className="map-from">Personalizzato {num}</span>
                   <span style={{color: 'var(--text-muted)'}}>→</span>
                   <select 
                     className="map-select" 
                     value={mappingOverrides[`Personalizzato ${num}`]} 
                     onChange={(e) => handleOverrideChange(`Personalizzato ${num}`, e.target.value)}
                   >
                     <option value="Notes">Notes (Append)</option>
                     <option value="Utente 1">User 1</option>
                     <option value="Utente 2">User 2</option>
                     <option value="Utente 3">User 3</option>
                     <option value="Utente 4">User 4</option>
                     <option value="Categorie">Categories</option>
                   </select>
                 </div>
               ))}
            </div>

            <div className="wizard-footer">
              <button className="btn-outline" style={{marginRight:'auto'}} onClick={() => setCurrentStep(2)}>Back</button>
              <button className="btn-primary" onClick={processStep3}>{t('mapping.next_btn')}</button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="step-container section">
            <div className="section-header"><h2>{t('result.title')}</h2></div>
            
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-val">{finalContacts.length}</div>
                <div>{t('result.contacts_count')}</div>
              </div>
            </div>

            <h3 style={{ margin: '1rem 0' }}>{t('result.preview_title')}</h3>
            <div className="table-wrap">
              <table className="edit-table">
                <thead>
                  <tr>
                    {(isIt ? ['Nome', 'Cognome', 'Indirizzo posta elettronica', 'Cellulare'] : ['First Name', 'Last Name', 'E-mail Address', 'Mobile Phone']).map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {finalContacts.slice(0, 10).map((c, i) => {
                    const noEmail = !c[emailCol];
                    return (
                      <tr key={i} className={noEmail ? 'health-warn' : ''}>
                        {(isIt ? ['Nome', 'Cognome', 'Indirizzo posta elettronica', 'Cellulare'] : ['First Name', 'Last Name', 'E-mail Address', 'Mobile Phone']).map(col => (
                          <td key={col}>
                            <input 
                              className="edit-input" 
                              value={c[col] || ''} 
                              placeholder={t('result.empty_cell')}
                              onChange={e => handleCellEdit(i, col, e.target.value)} 
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {finalContacts.length > 10 && <div style={{textAlign:'center', fontSize:'0.8rem', marginTop:'0.5rem', color:'var(--text-muted)'}}>{t('result.preview_more', { remaining: finalContacts.length - 10 })}</div>}

            <div className="wizard-footer">
               <button className="btn-primary" onClick={download}>{t('result.download_btn')}</button>
            </div>
          </div>
        )}

      </main>
      
      <footer className="app-footer">
        <div>
          <b>{t('footer.claim')}</b><br/>{t('footer.privacy')}
        </div>
        <div style={{display:'flex', gap:'0.5rem'}}>
          <button className={`lang-btn ${isIt ? 'active' : ''}`} onClick={() => toggleLanguage('it')}>IT</button>
          <button className={`lang-btn ${!isIt ? 'active' : ''}`} onClick={() => toggleLanguage('en')}>EN</button>
        </div>
      </footer>
    </div>
  );
}
