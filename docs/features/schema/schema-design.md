# Schema & in-memory mock CRUD

## Intent

Let developers register a lightweight JSON Schema for an entity, seed fake records in process memory, then exercise list / create / get-by-id without a database.

## Routes

| Method | Path | Behavior |
| :--- | :--- | :--- |
| `GET` | `/api/v1/schemas` | List registered entities + record counts |
| `POST` | `/api/v1/schemas` | Register/replace entity schema; optional `seedCount` |
| `GET` | `/api/v1/mock/{entity}` | List records |
| `POST` | `/api/v1/mock/{entity}` | Create record (auto `id`) |
| `GET` | `/api/v1/mock/{entity}/{id}` | Get one record |

Implementation: `Services/Schema/MockStore.cs` + `Endpoints/SchemaEndpoints.cs`.

## Register body

```json
{
  "entity": "products",
  "seedCount": 3,
  "schema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "price": { "type": "number" },
      "active": { "type": "boolean" }
    },
    "required": ["name"]
  }
}
```

Supported property `type` values for seeding: `string`, `number`, `integer`, `boolean`, `array`, `object`.

## Limits

| Limit | Value |
| :--- | :--- |
| Entities | 20 |
| Records / entity | 200 |
| Seed count | 0–50 (default 3) |
| Create body size | 64 KB |
| Entity name | `^[a-z][a-z0-9_-]{0,63}$` |

Storage is **process memory** — restart clears everything.

## Showroom

CRUD requires Mode 1 / Mode 3 (local engine). Showroom can only preview `GET /api/v1/schemas` static catalog (`schemas: []`).

## Playground

`SchemaPlayground` (`#schema-playground`): register schema, list/create/fetch. Card Phase 3 is `ready`.

## Verification

See `tests/http/schema.http` or:

```bash
curl -s -X POST http://localhost:8080/api/v1/schemas \
  -H "Content-Type: application/json" \
  -d "{\"entity\":\"products\",\"seedCount\":2,\"schema\":{\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"}}}}"
curl -s http://localhost:8080/api/v1/mock/products
```
