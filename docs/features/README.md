# Features documentation

Per-module design docs for shipped playground modules. Phase order: [`../roadmap/mvp-and-phases.md`](../roadmap/mvp-and-phases.md).

| Folder | Phase | Module |
| :--- | :--- | :--- |
| [`boundary/`](./boundary/) | 2 | Edge-case / nightmare string generators |
| [`schema/`](./schema/) | 3 | Dynamic schema + in-memory mock CRUD |
| [`chaos/`](./chaos/) | 4–5 | Failure injection + allowlisted proxy |

HTTP contract: [`../api/API_SPECIFICATION.md`](../api/API_SPECIFICATION.md).  
How-to + deep-dive: [`../guides/`](../guides/).  
Tri-Mode client: `src/zenomock.docs/src/lib/api.ts`. Smoke: [`../deploy/tri-mode-smoke.md`](../deploy/tri-mode-smoke.md).
