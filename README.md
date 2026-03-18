# Thunderbird → Outlook Converter

Tool web per migrare rubriche da **Thunderbird** a **Outlook**.
Converte uno o più CSV esportati da Thunderbird in un singolo CSV pronto per l'importazione in Outlook (formato italiano).

## ✨ Funzionalità

- **Multi-file**: carica più rubriche insieme (Contatti, Indirizzi collezionati, Rubrica personale, ecc.)
- **Deduplicazione intelligente**: rileva duplicati per email, telefono o nome — unisce i dati senza perdite
- **Mapping completo**: mappa tutti i campi Thunderbird → Outlook (IT locale)
- **Anteprima**: mostra le prime righe prima del download
- **100% locale**: nessun dato inviato al server, elaborazione in-browser
- **UTF-8 BOM**: output compatibile con Excel/Outlook

## 🗺️ Mapping campi

| Thunderbird | Outlook |
|---|---|
| Email primaria | Indirizzo posta elettronica |
| Email secondaria | Indirizzo posta elettronica 2 |
| Telefono lavoro | Ufficio |
| Numero cellulare | Cellulare |
| Telefono casa | Abitazione |
| Numero fax | Fax (uff.) |
| Organizzazione | Società |
| Qualifica | Posizione |
| Reparto | Reparto |
| Indirizzo di lavoro / Città / CAP / Provincia / Nazione | Via (uff.) / Città (uff.) / ... |
| Indirizzo di casa / Città / CAP / Provincia / Nazione | Via (ab.) / Città (ab.) / ... |
| Pagina web 1 | Pagina Web |
| Anno/Mese/Giorno nascita | Compleanno |
| Note + Personalizzato 1-4 | Notes |
| Nome Instant Messenger | Utente 1 |

## 🚀 Deploy su Vercel

```bash
# 1. Clona il repo
git clone https://github.com/TUO_USERNAME/thunderbird-to-outlook
cd thunderbird-to-outlook

# 2. Installa dipendenze
npm install

# 3. Build
npm run build

# 4. Deploy su Vercel (prima installa Vercel CLI)
npx vercel --prod
```

Oppure connetti il repository su [vercel.com](https://vercel.com) per deploy automatico ad ogni push.

## 💻 Sviluppo locale

```bash
npm install
npm run dev
```

Apri http://localhost:5173

## 📦 Build

```bash
npm run build
# Output in /dist — pronto per deploy statico
```

## 📋 Come usare

1. In **Thunderbird**: `Rubrica → Strumenti → Esporta → Valori separati da virgola (.csv)`
2. Carica uno o più CSV nel tool
3. Opzionale: abilita la deduplicazione
4. Clicca **Converti**
5. Scarica `rubrica_outlook.csv`
6. In **Outlook**: `File → Apri ed esporta → Importa/Esporta → Importa da un altro programma o file → Valori separati da virgola`

## 🔧 Stack

- React 18 + Vite
- PapaParse (parsing CSV)
- Deploy: Vercel (static)
