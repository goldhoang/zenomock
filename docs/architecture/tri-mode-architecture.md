# Tri-Mode architecture

## Intent

ZenoMock must work **offline in Docker**, **as a zero-install showroom on GitHub Pages**, and **hybrid** (CDN UI + local engine) without forcing users through a paid cloud mock.

Author: [GoldHoang](https://goldhoang.dev).

## Monorepo layout

```text
zenomock/
├── src/
│   ├── ZenoMock.Api/          # .NET 10 Minimal API (engine + serves wwwroot in Mode 1)
│   │   ├── Endpoints/         # Map*Endpoints per module
│   │   ├── Extensions/        # CORS, SPA, OpenAPI, Proxy, Chaos, ...
│   │   ├── Middleware/        # ChaosMiddleware
│   │   ├── Services/          # Boundary, Schema, Chaos, Proxy
│   │   └── Program.cs         # Thin composition root
│   └── zenomock.docs/         # React + Vite playground / Pages site
├── docs/                      # SSOT documentation
├── tests/http/                # Manual HTTP smoke files
├── Dockerfile                 # Multi-stage: FE → BE → runtime
└── .github/workflows/         # CI, GHCR push, Pages deploy
```

## Mode decision flow

```text
                    [ User opens UI ]
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
  GitHub Pages CDN                    http://localhost:8080
  (Showroom / Hybrid)                 (Full Offline container)
         │                                   │
   Probe GET localhost:8080/health           ▼
         │                            Mode 1: UI + API
   ┌─────┴─────┐                      same origin
   ▼           ▼
 Alive       Dead
   │           │
   ▼           ▼
 Mode 3      Mode 2
 Hybrid      Static mock JSON
```

## Backend composition rules

- **Minimal APIs only** (no MVC Controllers for product routes).
- `Program.cs` wires DI and calls `AddZenoMock*` / `Use*` / `Map*Endpoints`.
- Mapped modules: `MapHealthEndpoints`, `MapBoundaryEndpoints`, `MapSchemaEndpoints`, `MapChaosEndpoints`, `MapProxyEndpoints`.
- Chaos middleware (`UseZenoMockChaos`) applies to `/api/*` and `/proxy/*`, except `/api/v1/chaos/*` and `/api/v1/proxy/*` (and never `/health` / static files).
- Phase 5 allowlisted proxy: `ANY /proxy/{**path}` — see [`../features/chaos/proxy-design.md`](../features/chaos/proxy-design.md).

## Frontend composition rules

- `VITE_BASE=/zenomock/` on Pages; `VITE_BASE=/` inside Docker.
- `VITE_LOCAL_API_URL` defaults to `http://localhost:8080`.
- All JSON reads go through `src/zenomock.docs/src/lib/api.ts` (`resolveEngineStatus` + `getJson`):
  1. **Mode 1:** UI on port `8080` → same-origin `/health` and API.
  2. **Mode 3:** Pages/Vite → probe `VITE_LOCAL_API_URL/health` (CORS).
  3. **Mode 2:** probe fails → static files via `mockRoutes.ts` + Vite `base`.
- Banner polls ~5s when engine-capable; slower (~20s) in pure Showroom.
- UI must never go blank when the engine disappears.

## CORS (Mode 3)

Browser on `https://goldhoang.github.io` calling `http://localhost:8080` requires an explicit allowlist. Config key: `Cors:AllowedOrigins`.

## Security notes

- Engine is **local-first** — see [`../../SECURITY.md`](../../SECURITY.md).
- Chaos proxy is **allowlist-only**. Never ship an open forwarder.
- `/health`, `/api/v1/chaos/*`, and `/api/v1/proxy/config` stay reachable without chaos.
