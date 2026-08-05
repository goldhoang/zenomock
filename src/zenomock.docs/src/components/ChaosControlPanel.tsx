import { useEffect, useRef, useState } from 'react'
import { getJson, postJson, type EngineStatus } from '../lib/api'
import { LOCAL_API_URL } from '../lib/config'

type Props = {
  status: EngineStatus
}

type ChaosConfig = {
  latencyMs: number
  error500Rate: number
  corruptedJsonRate: number
}

const ZERO: ChaosConfig = {
  latencyMs: 0,
  error500Rate: 0,
  corruptedJsonRate: 0,
}

function sameConfig(a: ChaosConfig, b: ChaosConfig) {
  return (
    a.latencyMs === b.latencyMs &&
    a.error500Rate === b.error500Rate &&
    a.corruptedJsonRate === b.corruptedJsonRate
  )
}

export function ChaosControlPanel({ status }: Props) {
  const engineReady =
    status.mode === 'offline' || status.mode === 'hybrid'
  const [draft, setDraft] = useState<ChaosConfig>(ZERO)
  const [applied, setApplied] = useState<ChaosConfig>(ZERO)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [probe, setProbe] = useState<string | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const dirty = !sameConfig(draft, applied)

  const loadConfig = async () => {
    if (!engineReady) {
      return
    }
    try {
      const result = await getJson<ChaosConfig>('/api/v1/chaos/config', { status })
      const next: ChaosConfig = {
        latencyMs: result.data.latencyMs ?? 0,
        error500Rate: result.data.error500Rate ?? 0,
        corruptedJsonRate: result.data.corruptedJsonRate ?? 0,
      }
      setDraft(next)
      setApplied(next)
    } catch {
      /* keep local slider state */
    }
  }

  useEffect(() => {
    void loadConfig()
  }, [status.mode, status.apiBaseUrl])

  const reveal = () => {
    window.requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  const apply = async () => {
    if (!engineReady) {
      setError('Local engine required — start Docker or dotnet on :8080')
      setNotice(null)
      reveal()
      return
    }

    setBusy(true)
    setError(null)
    try {
      const result = await postJson<ChaosConfig & { message?: string }>(
        '/api/v1/chaos/config',
        draft,
        { status },
      )
      const next: ChaosConfig = {
        latencyMs: result.data.latencyMs,
        error500Rate: result.data.error500Rate,
        corruptedJsonRate: result.data.corruptedJsonRate,
      }
      setDraft(next)
      setApplied(next)
      setNotice(
        result.data.message ??
          `Applied · latency ${next.latencyMs}ms · 500 ${(next.error500Rate * 100).toFixed(0)}% · corrupt ${(next.corruptedJsonRate * 100).toFixed(0)}%`,
      )
      reveal()
    } catch (err) {
      setNotice(null)
      setError(err instanceof Error ? err.message : 'Failed to apply chaos config')
      reveal()
    } finally {
      setBusy(false)
    }
  }

  const reset = async () => {
    if (!engineReady) {
      setError('Local engine required')
      reveal()
      return
    }
    setBusy(true)
    try {
      const result = await postJson<ChaosConfig & { message?: string }>(
        '/api/v1/chaos/reset',
        {},
        { status },
      )
      const next: ChaosConfig = {
        latencyMs: result.data.latencyMs ?? 0,
        error500Rate: result.data.error500Rate ?? 0,
        corruptedJsonRate: result.data.corruptedJsonRate ?? 0,
      }
      setDraft(next)
      setApplied(next)
      setNotice(result.data.message ?? 'Chaos reset to defaults (all zero)')
      setProbe(null)
      setError(null)
      reveal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
      reveal()
    } finally {
      setBusy(false)
    }
  }

  const runProbe = async () => {
    if (!engineReady || !status.apiBaseUrl) {
      setError('Local engine required for probe')
      reveal()
      return
    }

    if (dirty) {
      setError('Sliders changed — click Apply config before Probe')
      setNotice(null)
      reveal()
      return
    }

    setBusy(true)
    setError(null)
    try {
      const started = performance.now()
      const response = await fetch(
        `${status.apiBaseUrl}/api/v1/boundary/strings/xss-payloads`,
        { headers: { Accept: 'application/json' } },
      )
      const elapsed = Math.round(performance.now() - started)
      const text = await response.text()
      setProbe(
        `HTTP ${response.status} · ${elapsed}ms · ${text.slice(0, 280)}${text.length > 280 ? '…' : ''}`,
      )
      setNotice(`Probe finished in ${elapsed}ms`)
      reveal()
    } catch (err) {
      setProbe(null)
      setError(err instanceof Error ? err.message : 'Probe failed')
      reveal()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="chaos-control" className="explorer playground">
      <div className="explorer__head">
        <h2 className="explorer__title">Chaos Control Panel</h2>
        <span className="explorer__source">
          {engineReady ? (dirty ? 'unsaved' : 'via engine') : 'engine required'}
        </span>
      </div>
      <p className="explorer__lead">
        Inject latency, random HTTP 500s, and corrupted JSON into <code>/api/*</code>{' '}
        (never <code>/health</code> or <code>/api/v1/chaos/*</code>). Process memory
        only.
      </p>

      {!engineReady ? (
        <p className="explorer__error">
          Showroom cannot inject live chaos. Start the local engine, then Apply.
        </p>
      ) : null}

      <label className="chaos__slider">
        <span>
          Latency <strong>{draft.latencyMs} ms</strong>
        </span>
        <input
          type="range"
          min={0}
          max={5000}
          step={50}
          value={draft.latencyMs}
          disabled={!engineReady || busy}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, latencyMs: Number(e.target.value) }))
          }
        />
      </label>

      <label className="chaos__slider">
        <span>
          Error 500 rate <strong>{(draft.error500Rate * 100).toFixed(0)}%</strong>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(draft.error500Rate * 100)}
          disabled={!engineReady || busy}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              error500Rate: Number(e.target.value) / 100,
            }))
          }
        />
      </label>

      <label className="chaos__slider">
        <span>
          Corrupted JSON rate{' '}
          <strong>{(draft.corruptedJsonRate * 100).toFixed(0)}%</strong>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(draft.corruptedJsonRate * 100)}
          disabled={!engineReady || busy}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              corruptedJsonRate: Number(e.target.value) / 100,
            }))
          }
        />
      </label>

      <div className="explorer__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy || !engineReady || !dirty}
          onClick={() => void apply()}
        >
          {busy ? 'Working…' : 'Apply config'}
        </button>
        <button
          type="button"
          className="explorer__copy"
          disabled={busy || !engineReady}
          onClick={() => void runProbe()}
        >
          Probe /boundary/xss
        </button>
        <button
          type="button"
          className="explorer__copy"
          disabled={busy || !engineReady}
          onClick={() => void reset()}
        >
          Reset
        </button>
      </div>

      <p className="explorer__muted">
        Tip: move sliders → <strong>Apply config</strong> → Probe. 0% never / 100% always.
        At 100% 500, corrupt never runs. Engine: {status.apiBaseUrl ?? LOCAL_API_URL}.
      </p>

      <div className="playground__result" ref={resultRef}>
        {notice ? (
          <p className="playground__toast playground__toast--ok" role="status">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="playground__toast playground__toast--err" role="alert">
            {error}
          </p>
        ) : null}
        {probe ? <pre className="explorer__preview">{probe}</pre> : null}
        {!notice && !error && !probe ? (
          <p className="explorer__muted">
            Apply config, then Probe to see latency / 500 / corrupt responses.
          </p>
        ) : null}
      </div>
    </section>
  )
}
