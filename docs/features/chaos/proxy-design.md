# Chaos proxy (allowlisted forward)

## Intent

Forward client traffic through ZenoMock to a **single configured upstream** so you can apply Phase 4 chaos (latency / 500 / corrupt JSON) on responses that look like a real API — without an open reverse proxy (SSRF).

```text
Client → ANY /proxy/{**path}
       → UpstreamBaseUrl + path + query
       → (optional chaos middleware)
       → client
```

## Configuration (`Proxy` section)

| Key | Default (Production) | Development |
| :--- | :--- | :--- |
| `Enabled` | `true` | `true` |
| `UpstreamBaseUrl` | `https://httpbin.org` | `http://127.0.0.1:8080` |
| `AllowedHosts` | `[httpbin.org]` | `[127.0.0.1, localhost]` |
| `TimeoutSeconds` | `10` | `10` |
| `MaxRequestBodyBytes` | `65536` | `65536` |
| `MaxResponseBodyBytes` | `1048576` | `1048576` |

Empty `AllowedHosts` → **deny all**. Host match is exact (case-insensitive), no ports in the list.

## Routes

| Method | Path | Chaos? | Behavior |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/proxy/config` | No | Read effective allowlist / upstream |
| `ANY` | `/proxy/{**path}` | **Yes** | Forward if host allowlisted |

Response headers on success: `X-ZenoMock-Proxy: 1`, `X-ZenoMock-Upstream: {path}`.

## SSRF / threat notes

| Guard | Detail |
| :--- | :--- |
| Default deny | Host must appear in `AllowedHosts` |
| Schemes | `http` / `https` only |
| No userinfo | Credentials in URI rejected |
| No redirects | `AllowAutoRedirect = false` |
| Metadata hard-block | `169.254.169.254`, `metadata.google.internal` never allowed |
| Recursion | Remnant path must not start with `proxy/` |
| Body limits | Request / response size caps |
| Timeout | HttpClient timeout from config |

**Not covered (v0):** DNS rebinding (hostname allowlisted but resolves to unexpected IP). Prefer pinning known hosts; do not put this proxy on a public internet-facing host without additional controls.

## Chaos interaction

`ChaosMiddleware` applies to `/proxy/*` the same way as `/api/*` (except `/api/v1/chaos/*` and `/api/v1/proxy/*`). Order: delay → optional 500 → forward → optional JSON corrupt on 2xx.

## Playground

`ChaosProxyPanel` (`#chaos-proxy`): shows config, path input, Probe. Combine with Chaos Control Panel Apply.

## Runtime configuration (Docker / production)

`appsettings.json` is baked into the image. Override without editing files:

```bash
docker run -p 8080:8080 \
  -e Proxy__UpstreamBaseUrl=https://staging.example.com \
  -e Proxy__AllowedHosts__0=staging.example.com \
  ghcr.io/goldhoang/zenomock:latest
```

Vietnamese deep-dive (theory + SSRF + workflows): [`../../guides/chaos-and-proxy-deep-dive.md`](../../guides/chaos-and-proxy-deep-dive.md).

## Verification

See `tests/http/proxy.http`. Dev self-loop:

```bash
curl -s http://localhost:8080/api/v1/proxy/config
curl -s -D - http://localhost:8080/proxy/api/v1/boundary/strings/xss-payloads -o -
```
