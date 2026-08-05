<div align="center">

# ⚡ ZenoMock

> **A containerized, zero-cost, local-first mock engine combining instant CRUD API generation, boundary edge-case data, and chaos engineering for resilient frontend & QA testing.**

[![Docker Image](https://img.shields.io/badge/Docker-GHCR-blue?logo=docker)](https://github.com/goldhoang/zenomock/pkgs/container/zenomock)
[![Live Playground](https://img.shields.io/badge/Live-Playground-brightgreen?logo=github)](https://goldhoang.github.io/zenomock/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 🚀 Quick Start (Zero-Install Local Engine)

```bash
docker run -p 8080:8080 ghcr.io/goldhoang/zenomock:latest
```

- Engine UI + API: http://localhost:8080  
- Health: http://localhost:8080/health  
- Online playground: https://goldhoang.github.io/zenomock/

> **Note:** GitHub Pages must use **Source = GitHub Actions**. If the site still shows this README as HTML, switch Pages source away from “Deploy from a branch”.

## 💡 Why ZenoMock?

- 🔒 **Local-first privacy** — schemas stay on your machine / container.
- 💥 **Chaos-ready** *(phased)* — latency, 5xx, corrupted JSON.
- 🧪 **Boundary data** *(phased)* — Zalgo, XSS samples, overflow, fuzz JSON.
- 🌐 **Tri-Mode** — Full Offline · Showroom (Pages) · Hybrid (Pages UI + local `:8080`).

## 🏗 Tri-Mode Operational Architecture

```text
                            [ USER OPENS APP ]
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
[ GitHub Pages CDN ]                               [ http://localhost:8080 ]
(Cloud Hosted Showroom)                            (Local Docker Container)
         │                                                  │
   Ping localhost:8080/health                               ▼
         │                                          MODE 1: FULL OFFLINE
   ┌─────┴─────┐                                  (UI & API from container)
   ▼           ▼
[ ALIVE ]   [ DEAD ]
   │           │
   ▼           ▼
MODE 3:     MODE 2:
HYBRID      SHOWROOM DEMO
```

| Mode | Environment | UI Source | API Target |
| :--- | :--- | :--- | :--- |
| **1 Full Offline** | `localhost:8080` | Container `wwwroot` | Same-origin .NET API |
| **2 Showroom** | `github.io/zenomock` | GitHub Pages | Static `mock/*.json` |
| **3 Hybrid** | Pages + Docker | GitHub Pages | `http://localhost:8080` (CORS) |

## 🛠 Tech Stack

- **Backend:** .NET 10 Minimal API (Endpoints + Extensions)
- **Frontend:** React, TypeScript, Vite
- **DevOps:** GitHub Actions, multi-stage Docker, GHCR, GitHub Pages

## 📚 Documentation

Start here: [`docs/README.md`](./docs/README.md)

| Doc | Purpose |
| :--- | :--- |
| [`docs/roadmap/mvp-and-phases.md`](./docs/roadmap/mvp-and-phases.md) | MVP scope & phases |
| [`docs/architecture/tri-mode-architecture.md`](./docs/architecture/tri-mode-architecture.md) | Runtime model |
| [`docs/api/API_SPECIFICATION.md`](./docs/api/API_SPECIFICATION.md) | HTTP contracts |
| [`docs/deploy/ghcr-and-pages.md`](./docs/deploy/ghcr-and-pages.md) | Deploy & GHCR |
| [`docs/deploy/tri-mode-smoke.md`](./docs/deploy/tri-mode-smoke.md) | Mode 1 / 2 / 3 smoke |

## 🧭 Current status

**Phase 2 — Boundary:** live generators + Explorer (copy JSON / cURL). Next: **Phase 3 Schema CRUD**.

---

<div align="center">

## License & Author

Built and maintained by **[Tran Huy Hoang](https://github.com/goldhoang)**

[Pages](https://goldhoang.github.io/zenomock/) · [Repository](https://github.com/goldhoang/zenomock) · [MIT License](./LICENSE)

</div>
