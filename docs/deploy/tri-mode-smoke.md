# Tri-Mode smoke matrix

Manual verification after Mode-related changes. Run locally before merging; re-check Pages/GHCR after merge to `main`.

Canonical port: **8080**. Health: `GET /health`. Playground: https://goldhoang.github.io/zenomock/

---

## Mode 1 — Full Offline (Docker only)

```bash
docker pull ghcr.io/goldhoang/zenomock:latest
docker run --rm -p 8080:8080 ghcr.io/goldhoang/zenomock:latest
```

| Check | Expect |
| :--- | :--- |
| http://localhost:8080/health | JSON `status: ok`, `mode: local-engine` |
| http://127.0.0.1:8080/health | Same (same-origin UI must not depend on the hostname `localhost`) |
| http://localhost:8080 | Playground UI loads from container `wwwroot` |
| Banner | **Mode 1 · Full Offline — same origin …** |
| Showroom catalog | Loads (static files inside image); previews tagged `static` until live APIs exist |
| Pages tab closed / no github.io | Still fully usable offline |

Also smoke without Docker (API + empty/local `wwwroot` only):

```bash
cd src/ZenoMock.Api
dotnet run --launch-profile http
```

`/health` must work. Full UI in Mode 1 still comes from the Docker image build.

---

## Mode 2 — Showroom (Pages, engine down)

1. Stop Docker / local `dotnet run` (nothing on `:8080`).
2. Open https://goldhoang.github.io/zenomock/ (or `npm run dev` with API stopped).

| Check | Expect |
| :--- | :--- |
| Page | No blank screen; assets under `/zenomock/` on Pages |
| Banner | **Mode 2 · Showroom (static demo)** |
| Catalog | `via static`; click a route → JSON from `public/mock/**` |
| Browser console | No uncaught fetch errors; failed `:8080` probe is swallowed |

Local Pages-like build:

```bash
cd src/zenomock.docs
$env:VITE_BASE="/zenomock/"
npm run build
npm run preview -- --base /zenomock/
```

---

## Mode 3 — Hybrid (Pages + local engine)

1. Start engine: `docker run --rm -p 8080:8080 ghcr.io/goldhoang/zenomock:latest` (or `dotnet run --launch-profile http`).
2. Open https://goldhoang.github.io/zenomock/ (or Vite `npm run dev` on port **49231**).

| Check | Expect |
| :--- | :--- |
| Banner | **Mode 3 · Hybrid — Local Engine Connected: http://localhost:8080** |
| Network | `GET http://localhost:8080/health` from the Pages/Vite origin succeeds (CORS) |
| Stop engine | Within ~5s banner falls back to Mode 2 (no blank page) |
| Start engine again | Within ~5s banner returns to Mode 3 |

CORS allowlist lives in `Cors:AllowedOrigins` (`appsettings.json`): must include `https://goldhoang.github.io` and the Vite origin.

---

## Dev loop (Vite + API)

```bash
# terminal A
cd src/ZenoMock.Api
dotnet run --launch-profile http

# terminal B
cd src/zenomock.docs
npm run dev
```

Open http://localhost:49231 → expect **Mode 3**. Stop terminal A → **Mode 2**.

---

## Failures to watch

| Symptom | Likely cause |
| :--- | :--- |
| Pages shows README markdown | Pages source is not **GitHub Actions** |
| Mode 3 never connects | CORS missing origin, engine not on `:8080`, mixed-content to non-localhost host |
| Mode 1 banner says Hybrid + `localhost` while using `127.0.0.1` | Regression: same-origin detection broken |
| Catalog 404 on Pages | Missing `VITE_BASE=/zenomock/` or files not under `public/mock/` |
| `address already in use` on run | Old engine still bound to `:8080` |
