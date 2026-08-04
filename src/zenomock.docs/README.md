# zenomock.docs

React + TypeScript + Vite playground UI for ZenoMock (GitHub Pages showroom + container `wwwroot`).

## Scripts

```bash
npm ci
npm run dev      # http://localhost:49231
npm run build    # respects VITE_BASE (default `/`)
```

## Dual base

| Target | Env |
| :--- | :--- |
| GitHub Pages | `VITE_BASE=/zenomock/` |
| Docker / Mode 1 | `VITE_BASE=/` |

Local engine probe: `VITE_LOCAL_API_URL` (default `http://localhost:8080`).

Product docs live in repo [`/docs`](../../docs/README.md) — not in this package README.
