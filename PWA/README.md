# Stalkerware IoC PWA

Vue 3 + Vite + vite-plugin-pwa + sql.js. Loads `stalkerware_iocs.db` in-browser; no server.

## Setup

```bash
cd PWA
npm install
npm run dev
```

Drop the SQLite file at `public/stalkerware_iocs.db` before running. The scraper in the project root generates it.

## Build

```bash
npm run build      # outputs dist/, deploy as static
npm run preview    # local preview of the production build
```

## Layout

- `src/main.js` — app entry
- `src/App.vue` — root layout
- `src/router.js` — routes (search, apps, iocs, permissions, help)
- `src/db.js` — sql.js loader + `query()` helper
- `src/views/` — one component per route (to be implemented)
- `public/` — static assets copied as-is, including the `.db` file
