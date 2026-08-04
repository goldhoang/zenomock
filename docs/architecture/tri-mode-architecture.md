# Tri-Mode architecture

## Intent

ZenoMock must work **offline in Docker**, **as a zero-install showroom on GitHub Pages**, and **hybrid** (CDN UI + local engine) without forcing users through a paid cloud mock.

## Monorepo layout

```text
zenomock/
├── src/
│   ├── ZenoMock.Api/          # .NET 10 Minimal API (engine + serves wwwroot in Mode 1)
│   │   ├── Endpoints/         # Map*Endpoints per module
│   │   ├── Extensions/        # CORS, SPA, OpenAPI, ...
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
- `Program.cs` wires DI and calls:
  - `AddZenoMockCors`
  - `AddZenoMockOpenApi`
  - `MapHealthEndpoints`
  - `MapZenoMockSpa` (static files + fallback)
- Future modules add `MapBoundaryEndpoints`, `MapSchemaEndpoints`, `MapChaosEndpoints`.

## Frontend composition rules

- `VITE_BASE=/zenomock/` on Pages; `VITE_BASE=/` inside Docker.
- `VITE_LOCAL_API_URL` defaults to `http://localhost:8080`.
- Environment banner polls `/health`; on failure, load `/mock/*.json` (respecting Vite `base`).

## CORS (Mode 3)

Browser on `https://goldhoang.github.io` calling `http://localhost:8080` requires an explicit allowlist. Config key: `Cors:AllowedOrigins`.

## Security notes

- Open reverse proxy without allowlist is **out of scope** until Phase 5.
- `/health` must stay reachable without chaos so the UI can detect the engine.
