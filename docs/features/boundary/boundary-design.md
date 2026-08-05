# Boundary data generators

## Intent

Provide “nightmare” strings and lightly mutated JSON so frontend / QA can exercise validation, layout overflow, and defensive parsing **without** crafting payloads by hand.

## Routes (live engine)

| Method | Path | Behavior |
| :--- | :--- | :--- |
| `GET` | `/api/v1/boundary/strings/zalgo?count=5` | Combining-mark corrupted samples (`count` 1–20) |
| `GET` | `/api/v1/boundary/strings/xss-payloads` | Curated XSS / SQLi strings |
| `GET` | `/api/v1/boundary/strings/overflow?length=10000` | Long `A…` string (`length` 1–100000) |
| `POST` | `/api/v1/boundary/fuzz-json` | Body = sample JSON; response includes `original`, `fuzzed`, `mutations` |

Implementation: `src/ZenoMock.Api/Services/Boundary/BoundaryGenerator.cs` + `Endpoints/BoundaryEndpoints.cs`.

## Showroom (engine offline)

- GET tools fall back to `public/mock/boundary/*.json` via `getJson` / `mockRoutes`.
- Fuzz POST uses a **client-side** lightweight mutator (`src/zenomock.docs/src/lib/fuzzJson.ts`) when the engine is unreachable (`source: client`).

## Explorer UI

`BoundaryExplorer` on the playground:

- Tool tabs: Zalgo · XSS/SQLi · Overflow · Fuzz JSON
- **Copy JSON** / **Copy cURL**
- Card Phase 2 is `ready` and links to `#boundary-explorer`

## Verification

```bash
dotnet run --project src/ZenoMock.Api --launch-profile http
# then open tests/http/boundary.http or:
curl -s "http://localhost:8080/api/v1/boundary/strings/zalgo?count=2"
curl -s -X POST "http://localhost:8080/api/v1/boundary/fuzz-json" \
  -H "Content-Type: application/json" \
  -d "{\"id\":1,\"name\":\"alice\"}"
```

Contract: [`../../api/API_SPECIFICATION.md`](../../api/API_SPECIFICATION.md).
