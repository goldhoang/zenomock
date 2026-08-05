# ZenoMock API Specification

Base URL (local engine): `http://localhost:8080`  
JSON: **camelCase**

Status legend: **Done** (Phase 0+) · **Showroom static** (Phase 1 fallback) · **Planned** (later phases)

---

## Diagnostics

### `GET /health` — **Done**

Liveness probe for Tri-Mode detection. Must not be affected by chaos middleware (when chaos exists).

**Response `200`**

```json
{
  "status": "ok",
  "service": "zenomock",
  "mode": "local-engine",
  "version": "0.1.0"
}
```

---

## Boundary — **Planned (Phase 2)**

| Method | Path | Notes |
| :--- | :--- | :--- |
| `GET` | `/api/v1/boundary/strings/zalgo` | UI-breaking combining marks |
| `GET` | `/api/v1/boundary/strings/xss-payloads` | Sample XSS/SQLi strings |
| `GET` | `/api/v1/boundary/strings/overflow?length=10000` | Long string for layout stress |
| `POST` | `/api/v1/boundary/fuzz-json` | Body = sample JSON; returns mutated shape/types |

---

## Schema & mock CRUD — **Planned (Phase 3)**

| Method | Path | Notes |
| :--- | :--- | :--- |
| `POST` | `/api/v1/schemas` | Register entity JSON Schema |
| `GET` | `/api/v1/mock/{entity}` | List generated/stored records |
| `POST` | `/api/v1/mock/{entity}` | Create record (in-memory) |
| `GET` | `/api/v1/mock/{entity}/{id}` | Get by id |

Storage: process memory only for MVP. Limits TBD in feature design.

---

## Chaos — **Planned (Phase 4)**

### `POST /api/v1/chaos/config`

```json
{
  "latencyMs": 2000,
  "error500Rate": 0.3,
  "corruptedJsonRate": 0.1
}
```

Middleware applies to `/api/*` only (exclude `/health` and static files).

### Chaos proxy — **Planned (Phase 5, optional)**

`ANY /proxy/{**path}` — forward to allowlisted upstream only (SSRF guards required).

---

## Static showroom fallback (frontend, not API)

When the engine is offline (or a live route is not implemented yet), `getJson` reads files under Vite `base` + path in `mockRoutes.ts`.

| Logical path | Static file |
| :--- | :--- |
| `/health` | `mock/health.json` |
| `/mock-catalog` | `mock/demo.json` |
| `/api/v1/boundary/strings/zalgo` | `mock/boundary/zalgo.json` |
| `/api/v1/boundary/strings/xss-payloads` | `mock/boundary/xss-payloads.json` |
| `/api/v1/boundary/strings/overflow` | `mock/boundary/overflow.json` |
| `/api/v1/schemas` | `mock/schema/catalog.json` |
| `/api/v1/chaos/config` | `mock/chaos/config.json` |

On GitHub Pages these resolve under `/zenomock/mock/…`. Payloads are **previews** until the matching phase ships a live generator.
