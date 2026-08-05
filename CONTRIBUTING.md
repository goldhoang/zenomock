# Contributing

Thanks for interest in **ZenoMock** (*Zero Network Mock Engine*) by [GoldHoang](https://goldhoang.dev).

## Branches

| Branch | Role |
| :--- | :--- |
| `main` | Default / release (GitHub Pages + GHCR) |
| `feat/*`, `fix/*`, `chore/*`, `docs/*`, `test/*` | Work branches |

Open **PRs into `main`**. There is no `master` branch.

## Local checks

```bash
dotnet build src/ZenoMock.Api/ZenoMock.Api.csproj
npm --prefix src/zenomock.docs ci
npm --prefix src/zenomock.docs run build
```

## Docs

- Roadmap / phases: `docs/roadmap/`
- How-to (Vietnamese): `docs/guides/`
- API contract: `docs/api/API_SPECIFICATION.md`
- Update docs in the **same PR** as route or UX changes.

## Scope

Keep PRs focused. Large product ideas belong in `docs/roadmap/future-upgrades.md` first.

## License

MIT — see [LICENSE](./LICENSE).
