<div align="center">

# ⚡ ZenoMock

> **A containerized, zero-cost, local-first mock engine combining instant CRUD API generation, boundary edge-case data, and chaos engineering for resilient frontend & QA testing.**

[![Docker Image](https://img.shields.io/badge/Docker-GHCR-blue?logo=docker)](https://github.com/your-username/zenomock/pkgs/container/zenomock)
[![Live Playground](https://img.shields.io/badge/Live-Playground-brightgreen?logo=github)](https://your-username.github.io/zenomock)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 🚀 Quick Start (Zero-Install Local Engine)

Run the local engine in seconds using Docker:

```bash
docker run -p 8080:8080 ghcr.io/your-username/zenomock:latest
```
- Open your browser at http://localhost:8080 for Full Offline Mode, or visit the Online Playground Dashboard.

## 💡 Why ZenoMock?

- 🔒 100% Privacy & Local-First: No backend schema or sensitive business rules are sent to third-party SaaS platforms.

- 💥 Chaos Engineering Built-in: Inject simulated latency, random HTTP 500/502 errors, and corrupted JSON payloads directly into your dev workflow.

- 🧪 Boundary & QA Data Generator: Get instant nightmare test data (Zalgo strings, XSS payloads, CSS overflow texts, mismatched types).

- 🌐 Tri-Mode Hybrid Architecture: Smooth fallback from cloud static demo to local Docker engine.

## 🏗 Tri-Mode Operational Architecture

```text
                            [ USER OPENS APP ]
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
[ GitHub Pages CDN ]                               [ http://localhost:8080 ]
(Cloud Hosted Showroom)                            (Local Docker Container)
         │                                                  │                                                     
   Ping localhost:8080                                      ▼
         │                                          MODE 1: FULL OFFLINE
   ┌─────┴─────┐                                  (UI & API served directly
   ▼           ▼                                      from Docker Container)
[ ALIVE ]   [ DEAD ]
   │           │
   ▼           ▼
MODE 3:     MODE 2:
HYBRID      SHOWROOM DEMO
ONLINE      (Static Mock Data)
```

| Mode | Environment | UI Source | API Backend Target | Description |
| :--- | :--- | :--- | :--- | :--- |
| **MODE 1: Full Offline** | `http://localhost:8080` | Local Container | `.NET 10 API` | Full-stack app running 100% inside local Docker container. |
| **MODE 2: Showroom Demo** | `github.io CDN` | GitHub Pages | Static `.json` Mock | Static web demo using fallback data when local engine is offline. |
| **MODE 3: Hybrid Online** | `github.io CDN` | GitHub Pages | `http://localhost:8080` | Hosted CDN frontend auto-pings and connects to local Docker API. |

## 🛠 Tech Stack & Infrastructure

- Backend: .NET 10 Minimal API, C#

- Frontend: React, TypeScript, Vite, Tailwind CSS

- DevOps: GitHub Actions, Docker Multi-Stage Build, GitHub Container Registry (GHCR), GitHub Pages

---

<div align="center">

## License & Author

ZenoMock

Built and maintained by **[Tran Huy Hoang](https://github.com/goldhoang)**

[Pages](https://goldhoang.github.io/zenomock) · [Repository](https://github.com/goldhoang/zenomock) · [MIT License](./LICENSE.txt)

</div>