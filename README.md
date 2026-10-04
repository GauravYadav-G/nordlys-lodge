# Nordlys — Fjord Lodge & Aurora Observatory · Lofoten

**Nordic Hospitality & Wilderness Lodge · Lofoten, Norway** · Standalone Production Website

A fjord lodge on the edge of the Norwegian sea with two distinct seasonal modes: Winter polar darkness & aurora, and Summer midnight sun.

---

## Key Highlights & Features

- **Dual-Season Toggle**: Instant switch between Winter (Oct-Mar, blue ice & aurora) and Summer (Apr-Sep, golden midnight sun).
- **Cabin Suite Directory**: Blåhytta (waterfront cabin), Grønnhuset (family lodge), and Naustet (converted boathouse) with seasonal rates.
- **Interactive Booking Flow**: Modal reservation drawer with night counter, guest count, and real-time total calculation.
- **Lofoten Expedition Guide**: Guided fjord kayaking, wood-fired sauna dips, and aurora watchtower excursions.

---

## Quick Start

Run this website locally in development mode:

```bash
# Navigate to this website
cd websites/nordlys

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

## Project Structure

```
websites/nordlys/
├── index.html           # Bespoke page title, fonts, meta & theme color
├── package.json         # Standalone dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Bundler config with Tailwind CSS v4 & single-file
├── README.md            # Quick-start documentation
├── public/              # Dedicated assets
└── src/
    ├── main.tsx         # React root
    ├── App.tsx          # Standalone application entry
    ├── index.css        # Tailwind v4 theme & animation tokens
    ├── lib/             # Shared motion, WebGL canvas, smooth scroll & images
    └── ...              # Dedicated components and data
```
