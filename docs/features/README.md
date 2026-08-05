# Features documentation

Per-module design docs are added when implementation starts. Follow phase order in [`../roadmap/mvp-and-phases.md`](../roadmap/mvp-and-phases.md).

| Folder | Phase | Module |
| :--- | :--- | :--- |
| [`boundary/`](./boundary/) | 2 | Edge-case / nightmare string generators |
| [`schema/`](./schema/) | 3 | Dynamic schema + in-memory mock CRUD |
| [`chaos/`](./chaos/) | 4–5 | Failure injection; optional allowlisted proxy (Phase 5) |

Until a folder exists, treat [`../api/API_SPECIFICATION.md`](../api/API_SPECIFICATION.md) as the contract stub.

Tri-Mode client (not a feature module): `src/zenomock.docs/src/lib/api.ts`. Smoke: [`../deploy/tri-mode-smoke.md`](../deploy/tri-mode-smoke.md).

**How to use (scenarios):** [`../guides/using-zenomock.md`](../guides/using-zenomock.md).
