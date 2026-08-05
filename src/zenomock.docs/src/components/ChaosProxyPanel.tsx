import { useEffect, useRef, useState } from 'react'
import { getJson, type EngineStatus } from '../lib/api'
import { LOCAL_API_URL } from '../lib/config'

type Props = {
  status: EngineStatus
}

type ProxyConfig = {
  enabled: boolean
  upstreamBaseUrl: string
  allowedHosts: string[]
  timeoutSeconds: number
  usage?: string
}

export function ChaosProxyPanel({ status }: Props) {
  const engineReady =
    status.mode === 'offline' || status.mode === 'hybrid'
  const [config, setConfig] = useState<ProxyConfig | null>(null)
  const [path, setPath] = useState('/api/v1/boundary/strings/xss-payloads')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [probe, setProbe] = useState<string | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!engineReady) {
      return
    }
    void getJson<ProxyConfig>('/api/v1/proxy/config', { status })
      .then((result) => {
        setConfig(result.data)
        if (result.data.upstreamBaseUrl.includes('httpbin.org')) {
          setPath('/get')
        }
      })
      .catch(() => {
        setConfig(null)
      })
  }, [status.mode, status.apiBaseUrl])

  const reveal = () => {
    window.requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  const runProbe = async () => {
    if (!engineReady || !status.apiBaseUrl) {
      setError('Local engine required for proxy probe')
      reveal()
      return
    }

    const remnant = path.startsWith('/') ? path : `/${path}`
    setBusy(true)
    setError(null)
    try {
      const started = performance.now()
      const response = await fetch(`${status.apiBaseUrl}/proxy${remnant}`, {
        headers: { Accept: 'application/json' },
      })
      const elapsed = Math.round(performance.now() - started)
      const text = await response.text()
      const upstream = response.headers.get('X-ZenoMock-Upstream')
      setProbe(
        `HTTP ${response.status} · ${elapsed}ms` +
          (upstream ? ` · upstream ${upstream}` : '') +
          ` · ${text.slice(0, 320)}${text.length > 320 ? '…' : ''}`,
      )
      setNotice(`Proxy probe finished in ${elapsed}ms`)
      reveal()
    } catch (err) {
      setProbe(null)
      setError(err instanceof Error ? err.message : 'Proxy probe failed')
      reveal()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="chaos-proxy" className="explorer playground">
      <div className="explorer__head">
        <h2 className="explorer__title">Chaos Proxy</h2>
        <span className="explorer__source">
          {engineReady ? 'via engine' : 'engine required'}
        </span>
      </div>
      <p className="explorer__lead">
        Forward <code>{'/proxy/{**path}'}</code> to an allowlisted upstream. Same chaos
        knobs from the Control Panel apply. Default-deny SSRF guards.
      </p>

      {!engineReady ? (
        <p className="explorer__error">
          Showroom cannot live-proxy. Start the local engine on :8080.
        </p>
      ) : null}

      {config ? (
        <div className="explorer__meta">
          <p className="explorer__muted">
            Upstream: <code>{config.upstreamBaseUrl}</code>
            {config.enabled ? '' : ' (disabled)'} · timeout {config.timeoutSeconds}s
          </p>
          <p className="explorer__muted">
            Allowed hosts: <code>{config.allowedHosts.join(', ') || '(empty — deny all)'}</code>
          </p>
        </div>
      ) : engineReady ? (
        <p className="explorer__muted">Loading proxy config…</p>
      ) : null}

      <label className="explorer__field explorer__field--block">
        Path under /proxy
        <input
          type="text"
          value={path}
          disabled={!engineReady || busy}
          onChange={(e) => setPath(e.target.value)}
          spellCheck={false}
          placeholder="/api/v1/boundary/strings/xss-payloads"
        />
      </label>

      <div className="explorer__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy || !engineReady}
          onClick={() => void runProbe()}
        >
          {busy ? 'Working…' : 'Probe /proxy'}
        </button>
      </div>

      <p className="explorer__muted">
        Dev default upstream is loopback → boundary. Production image defaults to{' '}
        <code>httpbin.org</code>. Combine with Chaos Apply for flaky upstream demos. Engine:{' '}
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
            Probe forwards to UpstreamBaseUrl + path. Denied hosts return HTTP 403.
          </p>
        ) : null}
      </div>
    </section>
  )
}
