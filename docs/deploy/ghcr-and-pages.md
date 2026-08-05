# GHCR & GitHub Pages

## What ships where

| Artifact | Trigger | Output |
| :--- | :--- | :--- |
| Docker image | `.github/workflows/push-docker.yml` (push `main` on relevant paths / manual) | `ghcr.io/goldhoang/zenomock` |
| Playground UI | `.github/workflows/deploy-docs.yml` | https://goldhoang.github.io/zenomock/ |
| CI compile | `.github/workflows/ci.yml` (PRs) | `dotnet build` + `npm run build` |

## Pages source

Repository **Settings → Pages → Source** must be **GitHub Actions** (not “Deploy from a branch”).  
If source is the branch root, GitHub may render `README.md` instead of the Vite app.

## Dual Vite base

| Build | `VITE_BASE` | Why |
| :--- | :--- | :--- |
| Pages workflow | `/zenomock/` | Project site lives under `/zenomock/` |
| Docker `Dockerfile` | `/` | UI served at container origin root |

## Local smoke

```bash
# Pull / run engine
docker pull ghcr.io/goldhoang/zenomock:latest
docker run --rm -p 8080:8080 ghcr.io/goldhoang/zenomock:latest

# Health
curl http://localhost:8080/health

# UI (Mode 1)
# open http://localhost:8080
```

### Without Docker (API only)

```bash
cd src/ZenoMock.Api
dotnet run --launch-profile http
# http://localhost:8080/health
```

If start fails with `address already in use` on `:8080`, another `ZenoMock.Api` (or Docker) is still bound — stop that process first (`Ctrl+C` in its terminal, or end the PID listening on 8080). The `/health` JSON you still see is from that **old** instance, not the failed new one.

`wwwroot` exists for local runs; Mode 1 full UI still comes from the Docker image (Vite `dist` copied at build).

### Frontend dev (Vite)

```bash
cd src/zenomock.docs
npm ci
npm run dev
# default Vite port from vite.config.ts; API still on :8080 when engine runs
```

## Mode matrix

Full click-through checklist: [`tri-mode-smoke.md`](./tri-mode-smoke.md).

| Scenario | Expect |
| :--- | :--- |
| Docker only | Mode 1 — UI + API same origin |
| Pages, Docker stopped | Mode 2 — Showroom badge + static mock |
| Pages + Docker on :8080 | Mode 3 — Local Connected badge + API calls to localhost |

## Image notes

- Multi-stage: Node FE → SDK publish → aspnet runtime, FE `dist` → `wwwroot`
- `ASPNETCORE_URLS=http://+:8080`
- Prefer `.dockerignore` to keep context small

## Package visibility

If `docker pull` fails with 403, set the GHCR package visibility to Public (or `docker login ghcr.io`).
