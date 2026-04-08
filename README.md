# ASTRO Letters — Bonnesante Medicals Letterhead PWA

A Progressive Web App for generating professional corporate letterheads for **Bonnesante Medicals (ASTRO BSM)**.

## Features

- **Live preview** — fill in the form and see the letter rendered in real time
- **PDF download** — export pixel-perfect A4 PDFs via html2pdf.js (html2canvas + jsPDF)
- **Offline-capable** — installable PWA with service worker caching
- **Responsive** — works on desktop and tablet
- **Keyboard shortcut** — `Ctrl+Enter` to preview

## Project Structure

```
astro-letters/
├── index.html              # Main HTML (PWA entry point)
├── manifest.json           # PWA manifest
├── service-worker.js       # Offline caching
├── .gitignore
├── README.md
├── assets/
│   ├── logo.png            # ASTRO BSM company logo
│   └── signature.png       # Director's signature
├── css/
│   └── styles.css          # All styles (app shell + letter page)
├── js/
│   ├── app.js              # Form handling, bullets, preview, PDF trigger
│   ├── letter-template.js  # HTML template builder
│   └── pdf-generator.js    # PDF engine (lazy-loads html2pdf.js CDN)
└── icons/
    ├── icon-192.png        # PWA icon 192×192
    └── icon-512.png        # PWA icon 512×512
```

## Usage

1. Serve over HTTP (required for PWA and CDN scripts):
   ```bash
   python -m http.server 8080
   ```
2. Open `http://localhost:8080/`
3. Fill in the form fields → click **Preview** → click **Download PDF**

## Tech Stack

- Vanilla HTML / CSS / JavaScript (no frameworks)
- [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) — PDF generation (CDN, lazy-loaded)
- [Google Fonts: Inter](https://fonts.google.com/specimen/Inter)
- Service Worker + Web App Manifest (PWA)

## Company

**Bonnesante Medicals** — *Innovative Health Care Solutions*  
No 17A Isuofia / No 6B Peace Avenue, Federal Housing Estate, Trans-Ekulu, Enugu, Enugu State  
📧 astrobsm@gmail.com | 📞 +234 909 253 4292
