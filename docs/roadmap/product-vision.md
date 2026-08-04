# ZenoMock — Product Vision

> Canonical product narrative for the learning / portfolio monorepo.
> Delivery order and non-goals live in [`mvp-and-phases.md`](./mvp-and-phases.md).

## 1. Positioning

| Field | Value |
| :--- | :--- |
| **Name** | ZenoMock |
| **Repository** | [`goldhoang/zenomock`](https://github.com/goldhoang/zenomock) |
| **Tagline** | A containerized, zero-cost, local-first mock engine combining instant CRUD API generation, boundary edge-case data, and chaos engineering for resilient frontend & QA testing. |
| **Distribution** | Open-source monorepo — **$0 infrastructure** (GitHub Pages + GHCR) |
| **Canonical local port** | `8080` |
| **GHCR image** | `ghcr.io/goldhoang/zenomock` |
| **Playground** | https://goldhoang.github.io/zenomock/ |

### Audience

- **Frontend / Mobile developers** — need realistic latency/errors to test UI resilience.
- **QA / Automation engineers** — need boundary data and a stable mock for CI.
- **Security-conscious teams** — need an air-gapped / offline mock (no SaaS schema upload).

## 2. Pain points & solution

### Limits of common tools (JSONPlaceholder, Postman Mock, cloud DevMock)

- Cloud dependency: latency, rate limits, cold starts, free-tier cutoffs.
- Privacy: many teams cannot push internal schemas to third-party SaaS.
- Happy-path bias: weak support for flaky networks, 5xx, corrupted JSON, nightmare strings (XSS, Zalgo, overflow).

### ZenoMock response

One **Docker image** that covers:

1. Happy path — dynamic CRUD from JSON Schema (in-memory).
2. Boundary / edge-case generators.
3. Chaos injection (latency, error rates, corrupt payloads) — phased.

Plus a **Tri-Mode** web UI: full offline container, static GitHub Pages showroom, or hybrid (Pages UI + local engine).

## 3. Tri-Mode (summary)

| Mode | When | UI source | API target |
| :--- | :--- | :--- | :--- |
| **1 — Full Offline** | `docker run` / local engine | Container `wwwroot` | Same-origin .NET API |
| **2 — Showroom Demo** | Pages, engine offline | GitHub Pages CDN | Static `public/mock/*.json` |
| **3 — Hybrid** | Pages + local Docker running | GitHub Pages CDN | `http://localhost:8080` (CORS) |

Details: [`../architecture/tri-mode-architecture.md`](../architecture/tri-mode-architecture.md).

## 4. Backend modules (target shape)

Stack: **.NET 10 Minimal API** (extension methods + `Map*Endpoints`), React/Vite UI.

| Module | Responsibility |
| :--- | :--- |
| Diagnostics | `GET /health` — engine discovery for the UI |
| Schema & mock CRUD | Define entities; in-memory list/get/create |
| Boundary | Zalgo, XSS samples, overflow strings, fuzz JSON |
| Chaos | Latency / 5xx / corrupt JSON on API responses |
| Chaos proxy *(late phase)* | Forward to a real upstream with injection — allowlist only |

Exact routes: [`../api/API_SPECIFICATION.md`](../api/API_SPECIFICATION.md).

## 5. Frontend experience (target shape)

1. **Smart Environment Indicator** — Local Connected vs Showroom (poll `/health` ~5s).
2. **Schema & API Playground** — edit schema, call generated endpoints.
3. **Chaos Control Panel** — sliders for latency / error / corrupt rates.
4. **Boundary Data Explorer** — copy JSON / cURL for nightmare payloads.

## 6. Portfolio / learning value

- Cost-aware DevOps: Pages + GHCR, multi-stage single image.
- DX architecture: offline-first + graceful degradation between CDN and localhost.
- Clean monorepo habits: Minimal API modules, documented contracts, CI smoke paths.

This document is the **north star**. Implementation order is enforced by [`mvp-and-phases.md`](./mvp-and-phases.md).
