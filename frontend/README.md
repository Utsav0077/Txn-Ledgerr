# Ledger Frontend

React + Vite + TypeScript + Tailwind CSS v4 frontend for the Ledger backend.

## Run

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api to http://localhost:3000
```

## Build

```bash
npm run build       # outputs to dist/
```

No data is hardcoded — every page reads live from the backend's REST API
(`src/services/api.ts` is the single API client used everywhere).
