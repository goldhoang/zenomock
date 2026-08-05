# Chaos injection (local API)

## Intent

Simulate flaky networks and bad payloads against **your** client code by injecting latency, HTTP 500 responses, and corrupted JSON into ZenoMock `/api/*` routes — without touching `/health` or the chaos config endpoints themselves.

## Routes

| Method | Path | Behavior |
| :--- | :--- | :--- |
| `GET` | `/api/v1/chaos/config` | Read current process config |
| `POST` | `/api/v1/chaos/config` | Update `latencyMs`, `error500Rate`, `corruptedJsonRate` |
| `POST` | `/api/v1/chaos/reset` | Reset all knobs to `0` |

### Config body

```json
{
  "latencyMs": 800,
  "error500Rate": 0.4,
  "corruptedJsonRate": 0.2
}
```

| Field | Range |
| :--- | :--- |
| `latencyMs` | 0–30000 |
| `error500Rate` | 0–1 |
| `corruptedJsonRate` | 0–1 |

## Middleware rules

Implementation: `Middleware/ChaosMiddleware.cs` + `Services/Chaos/ChaosConfigStore.cs`.

1. Applies to `/api/*` **and** `/proxy/*`.
2. **Skips** `/api/v1/chaos/*` and `/api/v1/proxy/*` so controls stay reachable.
3. Does **not** run for `/health` or static SPA files.
4. Order per request: delay → optional short-circuit `500` → otherwise call next → optional JSON corruption on 2xx JSON bodies.
5. Rates snap to whole percents; **0% never**, **100% always** (`ChaosChance`). Mid values use `Next(100) < percent`.
6. Injected `500` short-circuits — corrupt JSON is not evaluated on that request.

Corruption strategies (random): truncated payload, swapped quotes, missing braces.

Allowlisted upstream forward: [`proxy-design.md`](./proxy-design.md).

## Playground

`ChaosControlPanel` (`#chaos-control`): sliders (draft) → **Apply config** (persist to engine) → Probe / Reset. Unsaved slider changes block Probe until Apply.

Showroom can preview config JSON statically but **cannot** inject live chaos without the engine.

## Verification

```bash
curl -s -X POST http://localhost:8080/api/v1/chaos/config \
  -H "Content-Type: application/json" \
  -d "{\"latencyMs\":500,\"error500Rate\":0.5,\"corruptedJsonRate\":0.3}"

# Repeat — expect mix of slow OK, 500, or broken JSON:
curl -s -o - -w "\nHTTP %{http_code} time %{time_total}\n" \
  http://localhost:8080/api/v1/boundary/strings/xss-payloads

curl -s -X POST http://localhost:8080/api/v1/chaos/reset
```

Also: `tests/http/chaos.http`.
