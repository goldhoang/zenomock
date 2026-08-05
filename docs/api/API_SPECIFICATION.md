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

## Boundary — **Done (Phase 2)**

| Method | Path | Notes |
| :--- | :--- | :--- |
| `GET` | `/api/v1/boundary/strings/zalgo?count=5` | Combining-mark samples (`count` 1–20, default 5) |
| `GET` | `/api/v1/boundary/strings/xss-payloads` | Curated XSS / SQLi strings |
| `GET` | `/api/v1/boundary/strings/overflow?length=10000` | Long string (`length` 1–100000, default 10000) |
| `POST` | `/api/v1/boundary/fuzz-json` | Body = sample JSON; returns `original`, `fuzzed`, `mutations` |

### Example — Zalgo `200`

```json
{
  "endpoint": "GET /api/v1/boundary/strings/zalgo",
  "count": 2,
  "samples": ["Z̷a̸l̵g̶o̸ …"]
}
```

### Example — Fuzz JSON `200`

```json
{
  "endpoint": "POST /api/v1/boundary/fuzz-json",
  "original": { "id": 1, "name": "alice" },
  "fuzzed": { "name": true },
  "mutations": ["removed:id", "typeMismatch:name"]
}
```

Invalid JSON body → `400` `{ "error": "…" }`.

Design notes: [`../features/boundary/boundary-design.md`](../features/boundary/boundary-design.md).

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

On GitHub Pages these resolve under `/zenomock/mock/…`. Boundary GET routes are **live** on the engine; static files remain Showroom fallback. Fuzz POST falls back to a client-side mutator when the engine is offline.
