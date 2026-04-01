# Thunderbird → Outlook Converter
**Where IT Infrastructure meets Intelligent Automation**

A professional web utility developed by **impe-byte** designed to seamlessly migrate address books from **Mozilla Thunderbird** to **Microsoft Outlook**. It converts one or more CSVs exported from Thunderbird into a unified CSV ready for import into Outlook, automatically adapting column layout maps based on your locale (supporting Italian and US English).

## ✨ Advanced Wizard & Features

- **Smart Upload & Grouping**: Group your CSVs into Virtual Groups and rename them on the fly.
- **Intelligent Deduplication Engine**: Automatically detects data clashes and prompts you to manually resolve them as 'Merge' or 'Keep Both' within a visual Conflict Manager.
- **Scrubbing Utilities**: Bulk fix name casing (`JOHN DOE` -> `John Doe`) and auto-format phone numbers (`+39` prefixes).
- **Dynamic Schema Mapping**: Visually override output fields mapping custom inputs to any Outlook field, directly adjusting the output CSV headers to match your language of choice.
- **Live Preview & Export**: Editable preview grid with Data Health Indicators highlighting missing or bad fields before exporting.

## 🛡️ Privacy First & Enterprise Compliance

**GDPR Compliant by Design.** 
This tool handles potentially sensitive personally identifiable information (PII). To respect strict privacy regulations, the conversion engine operates entirely **100% Client-Side** within the user's browser runtime. 
No contact data is ever logged, cached, transmitted out of the browser, or stored on external servers. All operations happen in-memory.

## 💡 Technical Highlights

- **Deduplication Algorithm**: The engine normalizes phone numbers (prefix validation) and emails (lowercase scrubbing), and merges duplicates seamlessly. When it detects matching emails or phones but conflicting full names, it surfaces a smart Conflict Manager panel allowing user intervention.
- **React 18 & Vite**: Lightning-fast modern UI stack with Glassmorphism styling representing the core impe-byte brand identity (Deep Navy, Signal Blue).
- **i18n Localization**: Uses `react-i18next` for real-time translation extracting language preferences directly from the browser to dynamically structure Outlook headers without server roundtrips.

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
