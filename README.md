# Thunderbird → Outlook Converter
**Where IT Infrastructure meets Intelligent Automation**

A professional web utility designed to seamlessly migrate address books from **Mozilla Thunderbird** to **Microsoft Outlook**. It converts one or more CSVs exported from Thunderbird into a unified CSV ready for import into Outlook, automatically adapting column layout maps based on your locale (supporting Italian and US English).

## ✨ Features

- **Multi-file merging**: Upload multiple address books simultaneously (Contacts, Collected Addresses, Personal Address Book, etc.) and merge them into a single file.
- **Intelligent Deduplication**: Automatically detects duplicates by email, phone, or name, carefully merging their data without loss.
- **Dynamic Mapping**: Fully maps Thunderbird fields to correct Outlook headers based on detection of the user’s local language.
- **Preview Tool**: Shows the first rows generated before downloading.
- **100% Client-Side Processing**: Designed with privacy in mind, processing happens exclusively in the browser.
- **Safe Output**: Emits UTF-8 BOM CSV files required for maximum compatibility with Excel and Outlook import wizards.

## 🛡️ Enterprise Compliance

**GDPR Compliant by Design.** 
This tool handles potentially sensitive personally identifiable information (PII). To respect strict privacy regulations, the conversion engine operates entirely *offline* within the user's browser runtime. No contact data is ever logged, cached, transmitted, or stored on external servers.

## 🔧 Technical Stack

- **React 18 & Vite**: Lightning fast modern UI stack.
- **react-i18next**: Real-time language extraction and translation.
- **PapaParse**: Secure and robust client-side CSV parsing.
- **Impe-Byte Architecture**: Clean, minimal and professional design system.

## 🚀 Installation & Local Development

```bash
# 1. Clone the repository
git clone https://github.com/impe-byte/thunderbird-to-outlook
cd thunderbird-to-outlook

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open `http://localhost:5173` to view it in your browser.

## 📋 Usage

1. In **Thunderbird**: `Address Book → Tools → Export → Comma Separated Values (.csv)`
2. Drag & drop one or multiple CSVs into the web tool.
3. Optional: Toggle the intelligent deduplication feature.
4. Click **Convert**.
5. Download the final `rubrica_outlook.csv`.
6. In **Outlook**: `File → Open & Export → Import/Export → Import from another program or file → Comma Separated Values`

---

### 🇮🇹 Versione Italiana

**Where IT Infrastructure meets Intelligent Automation.** Strumento web professionale per migrare le tue rubriche da Thunderbird a Outlook in totale sicurezza. Il tool legge i tuoi CSV, mappa i campi e genera un file perfetto per l'importazione in Outlook.

**Caratteristiche Principali**:
- Elaborazione 100% locale: massima privacy, nessun dato inviato ai server.
- Deduplicazione intelligente per email, nomi o telefoni.
- Layout grafico e stringhe adattive per CSV Outlook in lingua inglese (US) o italiano (IT).

**Sviluppo Locale**:
```bash
npm install
npm run dev
```
