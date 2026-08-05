import { useEffect, useState } from 'react'
import { getJson, type DataSource, type EngineStatus } from '../lib/api'
import type { CatalogRoute, MockCatalog } from '../lib/catalog'

type Props = {
  status: EngineStatus
}

type PreviewState = {
  path: string
  source: DataSource
  body: unknown
} | null

export function ModeCatalog({ status }: Props) {
  const { mode, apiBaseUrl } = status
  const [catalog, setCatalog] = useState<MockCatalog | null>(null)
  const [catalogSource, setCatalogSource] = useState<DataSource | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewState>(null)
  const [loadingPath, setLoadingPath] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'checking') {
      return
    }

    const snapshot: EngineStatus = {
      mode,
      apiBaseUrl,
      health: status.health,
      displayTarget: status.displayTarget,
    }
    const controller = new AbortController()
    void getJson<MockCatalog>('/mock-catalog', {
      signal: controller.signal,
      status: snapshot,
    })
      .then((result) => {
        if (controller.signal.aborted) {
          return
        }
        setCatalog(result.data)
        setCatalogSource(result.source)
        setError(null)
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return
        }
        setCatalog(null)
        setCatalogSource(null)
        setError('Catalog unavailable')
      })

    return () => controller.abort()
  }, [mode, apiBaseUrl])

  const loadRoute = async (route: CatalogRoute) => {
    setLoadingPath(route.path)
    try {
      const result = await getJson<unknown>(route.path, { status })
      setPreview({ path: route.path, source: result.source, body: result.data })
      setError(null)
    } catch {
      setError(`No payload for ${route.path}`)
    } finally {
      setLoadingPath(null)
    }
  }

  if (mode === 'checking') {
    return null
  }

  return (
    <section className="catalog" aria-label="Mode glue catalog">
      <div className="catalog__head">
        <h2 className="catalog__title">Showroom catalog</h2>
        {catalogSource ? (
          <span className="catalog__source">via {catalogSource}</span>
        ) : null}
      </div>
      <p className="catalog__lead">
        Static route map for Tri-Mode demos. Click a chip to preview JSON (engine
        when live, otherwise packaged mock files).
      </p>
      {error ? <p className="catalog__error">{error}</p> : null}
      <ul className="catalog__list">
        {(catalog?.routes ?? []).map((route) => (
          <li key={route.path}>
            <button
              type="button"
              className="catalog__item"
              disabled={loadingPath === route.path}
              onClick={() => void loadRoute(route)}
            >
              <span>{route.title}</span>
              <span className="catalog__phase">P{route.phase}</span>
            </button>
          </li>
        ))}
      </ul>
      {preview ? (
        <pre className="catalog__preview">
          <span className="catalog__preview-meta">
            {preview.path} · {preview.source}
          </span>
          {JSON.stringify(preview.body, null, 2)}
        </pre>
      ) : null}
    </section>
  )
}
