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

export function ChaosControlPanel({ status }: Props) {
  const engineReady =
    status.mode === 'offline' || status.mode === 'hybrid'
  const [latencyMs, setLatencyMs] = useState(0)
  const [error500Rate, setError500Rate] = useState(0)
  const [corruptedJsonRate, setCorruptedJsonRate] = useState(0)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [probe, setProbe] = useState<string | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const loadConfig = async () => {
    if (!engineReady) {
      return
    }
    try {
      const result = await getJson<ChaosConfig>('/api/v1/chaos/config', { status })
      setLatencyMs(result.data.latencyMs ?? 0)
      setError500Rate(result.data.error500Rate ?? 0)
      setCorruptedJsonRate(result.data.corruptedJsonRate ?? 0)
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
      const body: ChaosConfig = {
        latencyMs,
        error500Rate,
        corruptedJsonRate,
      }
      const result = await postJson<ChaosConfig & { message?: string }>(
        '/api/v1/chaos/config',
        body,
        { status },
      )
      setLatencyMs(result.data.latencyMs)
      setError500Rate(result.data.error500Rate)
      setCorruptedJsonRate(result.data.corruptedJsonRate)
      setNotice(
        result.data.message ??
          `Applied · latency ${result.data.latencyMs}ms · 500 ${(result.data.error500Rate * 100).toFixed(0)}% · corrupt ${(result.data.corruptedJsonRate * 100).toFixed(0)}%`,
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
      await postJson('/api/v1/chaos/reset', {}, { status })
      setLatencyMs(0)
      setError500Rate(0)
      setCorruptedJsonRate(0)
      setNotice('Chaos reset to defaults (all zero)')
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

    setBusy(true)
    setError(null)
    const started = performance.now()
    try {
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
          {engineReady ? 'via engine' : 'engine required'}
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
          Latency <strong>{latencyMs} ms</strong>
        </span>
        <input
          type="range"
          min={0}
          max={5000}
          step={50}
          value={latencyMs}
          disabled={!engineReady || busy}
          onChange={(e) => setLatencyMs(Number(e.target.value))}
        />
      </label>

      <label className="chaos__slider">
        <span>
          Error 500 rate <strong>{(error500Rate * 100).toFixed(0)}%</strong>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(error500Rate * 100)}
          disabled={!engineReady || busy}
          onChange={(e) => setError500Rate(Number(e.target.value) / 100)}
        />
      </label>

      <label className="chaos__slider">
        <span>
          Corrupted JSON rate <strong>{(corruptedJsonRate * 100).toFixed(0)}%</strong>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(corruptedJsonRate * 100)}
          disabled={!engineReady || busy}
          onChange={(e) => setCorruptedJsonRate(Number(e.target.value) / 100)}
        />
      </label>

      <div className="explorer__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy || !engineReady}
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
        Tip: raise 500 rate to ~40%, Apply, then Probe a few times. Defaults live on{' '}
        {status.apiBaseUrl ?? LOCAL_API_URL}.
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
