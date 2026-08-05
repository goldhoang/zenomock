<div align="center">

# ⚡ ZenoMock

### Zero Network Mock Engine

### by [GoldHoang](https://goldhoang.dev)

> **A containerized, zero-cost, local-first mock engine combining instant CRUD API generation, boundary edge-case data, and chaos engineering for resilient frontend & QA testing.**

[![Docker Image](https://img.shields.io/badge/Docker-GHCR-blue?logo=docker)](https://github.com/goldhoang/zenomock/pkgs/container/zenomock)
[![Live Playground](https://img.shields.io/badge/Live-Playground-brightgreen?logo=github)](https://goldhoang.github.io/zenomock/)
[![Author](https://img.shields.io/badge/Author-GoldHoang-3de0d0)](https://goldhoang.dev)
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
- 💥 **Chaos-ready** — latency, 5xx, corrupted JSON on `/api/*` and `/proxy/*`.
- 🧪 **Boundary data** — Zalgo, XSS samples, overflow, fuzz JSON.
- 🔀 **Allowlisted proxy** — forward to staging/httpbin with SSRF guards.
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
- **Frontend:** React, TypeScript, Vite, highlight.js
- **DevOps:** GitHub Actions, multi-stage Docker, GHCR, GitHub Pages

## 📚 Documentation

Start here: [`docs/README.md`](./docs/README.md)

| Doc | Purpose |
| :--- | :--- |
| [`docs/guides/using-zenomock.md`](./docs/guides/using-zenomock.md) | How to use (Vietnamese) |
| [`docs/guides/chaos-and-proxy-deep-dive.md`](./docs/guides/chaos-and-proxy-deep-dive.md) | Chaos + Proxy theory (Vietnamese) |
| [`docs/roadmap/mvp-and-phases.md`](./docs/roadmap/mvp-and-phases.md) | MVP scope & phases |
| [`docs/roadmap/future-upgrades.md`](./docs/roadmap/future-upgrades.md) | Post-MVP polish & upgrades |
| [`docs/architecture/tri-mode-architecture.md`](./docs/architecture/tri-mode-architecture.md) | Runtime model |
| [`docs/api/API_SPECIFICATION.md`](./docs/api/API_SPECIFICATION.md) | HTTP contracts |
| [`docs/deploy/ghcr-and-pages.md`](./docs/deploy/ghcr-and-pages.md) | Deploy & GHCR |
| [`docs/deploy/tri-mode-smoke.md`](./docs/deploy/tri-mode-smoke.md) | Mode 1 / 2 / 3 smoke |

## 🧭 Current status

**v0.1 archive slice:** Phases 0–5 + Wave A UI polish.  
See [`SECURITY.md`](./SECURITY.md) and optional backlog in [`docs/roadmap/future-upgrades.md`](./docs/roadmap/future-upgrades.md).

---

<div align="center">

## Author & License

**ZenoMock** is designed and maintained by **[GoldHoang](https://goldhoang.dev)** (Tran Huy Hoang).

[goldhoang.dev](https://goldhoang.dev) · [GitHub @goldhoang](https://github.com/goldhoang) · [Pages](https://goldhoang.github.io/zenomock/) · [MIT License](./LICENSE)

</div>
