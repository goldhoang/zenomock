# MVP scope & delivery phases

## Canonical conventions

| Item | Value |
| :--- | :--- |
| Local engine port | **8080** |
| Health | `GET /health` |
| API style | Minimal API + `Extensions/` + `Endpoints/` |
| Pages URL | `https://goldhoang.github.io/zenomock/` |
| Image | `ghcr.io/goldhoang/zenomock` |
| Vite `base` (Pages) | `/zenomock/` |
| Vite `base` (Docker) | `/` |

## MVP Definition of Done (product-ready learning slice)

After Phases 0–3 (minimum viable product):

| Mode | Must work |
| :--- | :--- |
| **Mode 1** | `docker run -p 8080:8080 ghcr.io/goldhoang/zenomock:latest` serves UI + `/health` + at least Boundary **or** Schema CRUD |
| **Mode 2** | Pages loads without blank screen; uses static mock when engine is down |
| **Mode 3** | Pages UI detects local engine via CORS + `/health` and calls local API |

## Non-goals (v0.x)

- Authentication / multi-tenant / billing
- Persistent database (EF Core, Redis, etc.)
- Full Postman replacement or OpenAPI import suite
- Unrestricted reverse-proxy chaos (`/proxy/*`) in early phases
- Claiming Tailwind (or other UI kits) before they are actually installed

## Phased backlog

> **UI rule:** Playground feature cards MUST render in ascending phase order
> (**Phase 2 → 3 → 4**). Flip card `status` from `coming-soon` → `ready` when that module ships (ready cards get hover border + click target).

### Phase 0 — Foundation *(done)*

- Cursor rules, `/docs` layout, corrected product vision
- Minimal API host: CORS, static SPA, `/health`, thin `Program.cs`
- FE shell: environment indicator, panel placeholders, static mock JSON
- Vite dual `base`, README fixes, `.dockerignore`, CI build workflow
- **DoD:** Local `dotnet run` / Docker serve UI + health; Pages build uses `/zenomock/`; Hybrid CORS allowlist ready
- **Playground card:** none (infrastructure only)

### Phase 1 — Mode glue *(this branch)*

- Harden `apiClient` routing (Mode 1 same-origin · Mode 3 CORS probe · Mode 2 static fallback)
- Expand `public/mock/` samples for Showroom (+ catalog preview UI)
- Document smoke matrix: [`../deploy/tri-mode-smoke.md`](../deploy/tri-mode-smoke.md)
- **DoD:** All three modes demonstrable with health + static demo data
- **Playground card:** none (banner / mode detection + catalog only)

### Phase 2 — Boundary module

- `GET /api/v1/boundary/strings/zalgo`
- `GET /api/v1/boundary/strings/xss-payloads`
- `GET /api/v1/boundary/strings/overflow?length=`
- `POST /api/v1/boundary/fuzz-json`
- Boundary Explorer UI (copy JSON / cURL)
- **DoD:** Documented endpoints + UI copy actions
- **Playground card:** 1st — *Boundary Data Explorer*

### Phase 3 — Schema CRUD (happy path)

- `POST /api/v1/schemas`
- `GET|POST /api/v1/mock/{entity}`, `GET /api/v1/mock/{entity}/{id}`
- In-memory store with sensible limits (count / payload size)
- Schema Playground UI (edit + test call)
- **DoD:** Create schema → list/create records without restart (process memory)
- **Playground card:** 2nd — *Schema & API Playground*

### Phase 4 — Chaos (local API only)

- `POST /api/v1/chaos/config` (`latencyMs`, `error500Rate`, `corruptedJsonRate`)
- Middleware applies chaos to `/api/*` (not static files, not `/health`)
- Chaos Control Panel sliders
- **DoD:** Configurable failure injection visible from UI and curl
- **Playground card:** 3rd — *Chaos Control Panel*

### Phase 5 — Chaos proxy *(optional / advanced)*

- `ANY /proxy/{**path}` with **host allowlist**, timeouts, no open SSRF
- Only after Phases 0–4 are solid
- **DoD:** Documented allowlist + threat notes in `/docs/features/chaos/`
- **Playground card:** add later if shipped

## Working agreement

1. One phase goal per PR when possible.
2. Update [`../api/API_SPECIFICATION.md`](../api/API_SPECIFICATION.md) in the same PR as new routes.
3. Verify the Mode matrix in [`../deploy/tri-mode-smoke.md`](../deploy/tri-mode-smoke.md) before merging Mode-related changes.
4. Prefer extending `Endpoints/` and `Extensions/` over growing `Program.cs`.
5. Keep playground cards ordered Phase 2 → 3 → 4; never shuffle for visual preference.
