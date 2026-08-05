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

## Schema & mock CRUD — **Done (Phase 3)**

| Method | Path | Notes |
| :--- | :--- | :--- |
| `GET` | `/api/v1/schemas` | List registered entities |
| `POST` | `/api/v1/schemas` | Register/replace entity JSON Schema + optional `seedCount` |
| `GET` | `/api/v1/mock/{entity}` | List records |
| `POST` | `/api/v1/mock/{entity}` | Create record (auto `id`, in-memory) |
| `GET` | `/api/v1/mock/{entity}/{id}` | Get by id |

### Register body

```json
{
  "entity": "products",
  "seedCount": 3,
  "schema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "price": { "type": "number" },
      "active": { "type": "boolean" }
    }
  }
}
```

Limits: 20 entities · 200 records/entity · seed 0–50 · body ≤ 64KB · entity `^[a-z][a-z0-9_-]{0,63}$`.  
Storage: process memory only. Design: [`../features/schema/schema-design.md`](../features/schema/schema-design.md).

---

## Chaos — **Done (Phase 4)**

| Method | Path | Notes |
| :--- | :--- | :--- |
| `GET` | `/api/v1/chaos/config` | Read current knobs |
| `POST` | `/api/v1/chaos/config` | Update knobs for this process |
| `POST` | `/api/v1/chaos/reset` | Reset all to `0` |

### Config body

```json
{
  "latencyMs": 2000,
  "error500Rate": 0.3,
  "corruptedJsonRate": 0.1
}
```

| Field | Range |
| :--- | :--- |
| `latencyMs` | 0–30000 |
| `error500Rate` | 0–1 |
| `corruptedJsonRate` | 0–1 |

Middleware applies to `/api/*` and `/proxy/*` (exclude `/health`, static files, `/api/v1/chaos/*`, `/api/v1/proxy/*`).  
Design: [`../features/chaos/chaos-design.md`](../features/chaos/chaos-design.md).

---

## Chaos proxy — **Done (Phase 5)**

| Method | Path | Notes |
| :--- | :--- | :--- |
| `GET` | `/api/v1/proxy/config` | Read allowlist / upstream (not chaosed) |
| `ANY` | `/proxy/{**path}` | Forward to `Proxy:UpstreamBaseUrl` + path; SSRF guards |

### Config (`appsettings` → `Proxy`)

| Key | Role |
| :--- | :--- |
| `Enabled` | Master switch |
| `UpstreamBaseUrl` | Single forward base (e.g. `https://httpbin.org` or `http://127.0.0.1:8080`) |
| `AllowedHosts` | Exact host allowlist; empty = deny all |
| `TimeoutSeconds` | Upstream timeout |
| `MaxRequestBodyBytes` / `MaxResponseBodyBytes` | Size caps |

Development defaults loopback to the local engine for self-demo; production image defaults to `httpbin.org`.  
Threat notes: [`../features/chaos/proxy-design.md`](../features/chaos/proxy-design.md).

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
| `/api/v1/proxy/config` | `mock/proxy/config.json` |

On GitHub Pages these resolve under `/zenomock/mock/…`. Boundary GET routes are **live** on the engine; static files remain Showroom fallback. Fuzz POST falls back to a client-side mutator when the engine is offline.
