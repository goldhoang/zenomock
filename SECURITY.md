# Security Policy

ZenoMock is a **local-first learning / portfolio mock engine**, not a multi-tenant SaaS.

## Supported versions

The `main` branch and GHCR image `ghcr.io/goldhoang/zenomock:latest` receive fixes.

## Threat model (please read)

| Surface | Expectation |
| :--- | :--- |
| GitHub Pages showroom | Static UI only — no live chaos/proxy |
| Local / Docker engine (`:8080`) | Intended for **trusted local networks** (developer laptop, lab) |
| Chaos config API | **Unauthenticated by design** — anyone who can reach `:8080` can inject latency/500/corrupt |
| `/proxy/*` | Allowlisted forwarder — still not a hardened public edge proxy |

**Do not** expose the engine to the public internet without an additional reverse proxy, auth, and network policy.

## Reporting a vulnerability

Please open a [GitHub Security Advisory](https://github.com/goldhoang/zenomock/security/advisories/new) or email via the contact on [goldhoang.dev](https://goldhoang.dev).

Include: affected version/commit, reproduction steps, and impact.

## Known deliberate limits

- Chaos and schema stores are process memory only.
- Proxy SSRF guards are host-allowlist based (see `docs/features/chaos/proxy-design.md`); DNS rebinding is out of scope for v0.
- Production image defaults proxy upstream to `httpbin.org` for demos — override with `Proxy__*` env vars.
