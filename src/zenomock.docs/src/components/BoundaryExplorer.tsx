import { useEffect, useRef, useState } from 'react'
import { getJson, postJson, type DataSource, type EngineStatus } from '../lib/api'
import { LOCAL_API_URL } from '../lib/config'
import { fuzzJsonClientSide } from '../lib/fuzzJson'
import { CodeBlock } from './CodeBlock'

type ToolId = 'zalgo' | 'xss' | 'overflow' | 'fuzz'

type Props = {
  status: EngineStatus
}

const TOOLS: { id: ToolId; label: string; path: string }[] = [
  { id: 'zalgo', label: 'Zalgo', path: '/api/v1/boundary/strings/zalgo' },
  { id: 'xss', label: 'XSS / SQLi', path: '/api/v1/boundary/strings/xss-payloads' },
  {
    id: 'overflow',
    label: 'Overflow',
    path: '/api/v1/boundary/strings/overflow',
  },
  { id: 'fuzz', label: 'Fuzz JSON', path: '/api/v1/boundary/fuzz-json' },
]

const DEFAULT_FUZZ = `{
  "id": 1,
  "name": "alice",
  "active": true,
  "tags": ["qa", "mock"],
  "profile": { "age": 30, "city": "HN" }
}`

const OVERFLOW_DEBOUNCE_MS = 350

export function BoundaryExplorer({ status }: Props) {
  const { mode, apiBaseUrl } = status
  const [tool, setTool] = useState<ToolId>('zalgo')
  const [overflowLength, setOverflowLength] = useState(256)
  const [debouncedOverflow, setDebouncedOverflow] = useState(256)
  const [fuzzInput, setFuzzInput] = useState(DEFAULT_FUZZ)
  const [payload, setPayload] = useState<unknown>(null)
  const [source, setSource] = useState<DataSource | 'client' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<'json' | 'curl' | null>(null)
  const hasPayloadRef = useRef(false)

  const active = TOOLS.find((t) => t.id === tool)!

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedOverflow(Math.min(Math.max(overflowLength, 1), 16_000))
    }, OVERFLOW_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [overflowLength])

  useEffect(() => {
    hasPayloadRef.current = payload != null
  }, [payload])

  useEffect(() => {
    if (mode === 'checking' || tool === 'fuzz') {
      return
    }

    const snapshot: EngineStatus = {
      mode,
      apiBaseUrl,
      health: status.health,
      displayTarget: status.displayTarget,
    }
    const controller = new AbortController()
    const path =
      tool === 'overflow'
        ? `${active.path}?length=${debouncedOverflow}`
        : active.path

    const showBlockingSpinner = !hasPayloadRef.current
    if (showBlockingSpinner) {
      setBusy(true)
    }

    void getJson<unknown>(path, { signal: controller.signal, status: snapshot })
      .then((result) => {
        if (controller.signal.aborted) {
          return
        }
        setPayload(result.data)
        setSource(result.source)
        setError(null)
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return
        }
        setPayload(null)
        setSource(null)
        setError('Unable to load boundary payload')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setBusy(false)
        }
      })

    return () => controller.abort()
  }, [mode, apiBaseUrl, tool, debouncedOverflow, active.path])

  const runFuzz = async () => {
    setBusy(true)
    setError(null)
    try {
      const parsed = JSON.parse(fuzzInput) as unknown
      try {
        const result = await postJson<unknown>(active.path, parsed, { status })
        setPayload(result.data)
        setSource(result.source)
      } catch {
        const local = fuzzJsonClientSide(parsed)
        setPayload(local)
        setSource('client')
      }
    } catch {
      setError('Fuzz input must be valid JSON')
      setPayload(null)
      setSource(null)
    } finally {
      setBusy(false)
    }
  }

  const jsonText = payload ? JSON.stringify(payload, null, 2) : ''
  const curlBase = apiBaseUrl ?? LOCAL_API_URL

  const curlText = (() => {
    if (tool === 'fuzz') {
      const escaped = fuzzInput.replace(/'/g, `'\\''`)
      return `curl -s -X POST "${curlBase}${active.path}" -H "Content-Type: application/json" -d '${escaped}'`
    }
    const path =
      tool === 'overflow'
        ? `${active.path}?length=${Math.min(Math.max(overflowLength, 1), 16_000)}`
        : active.path
    return `curl -s "${curlBase}${path}"`
  })()

  const copy = async (kind: 'json' | 'curl') => {
    const text = kind === 'json' ? jsonText : curlText
    if (!text) {
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 1400)
    } catch {
      setCopied(null)
    }
  }

  const onSelectTool = (id: ToolId) => {
    if (id === tool) {
      return
    }
    setTool(id)
    setPayload(null)
    setSource(null)
    setError(null)
    hasPayloadRef.current = false
  }

  return (
    <section id="boundary-explorer" className="explorer section-anchor" aria-busy={busy}>
      <div className="explorer__head">
        <h2 className="explorer__title">Boundary Data Explorer</h2>
        {source ? (
          <span className="explorer__source">via {source}</span>
        ) : null}
      </div>
      <p className="explorer__lead">
        Nightmare strings and fuzzed JSON for form / layout resilience tests.
        Copy JSON or cURL in one click.
      </p>

      <div className="explorer__tools" role="tablist" aria-label="Boundary tools">
        {TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tool === item.id}
            className={
              tool === item.id ? 'explorer__tab explorer__tab--active' : 'explorer__tab'
            }
            onClick={() => onSelectTool(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tool === 'overflow' ? (
        <label className="explorer__field">
          Length
          <input
            type="number"
            min={1}
            max={16000}
            value={overflowLength}
            onChange={(e) => setOverflowLength(Number(e.target.value) || 1)}
          />
          <span className="explorer__muted" style={{ margin: 0 }}>
            UI caps at 16k (preview truncates further)
          </span>
        </label>
      ) : null}

      {tool === 'fuzz' ? (
        <div className="explorer__fuzz">
          <label className="explorer__field explorer__field--block">
            Sample JSON
            <textarea
              value={fuzzInput}
              onChange={(e) => setFuzzInput(e.target.value)}
              rows={8}
              spellCheck={false}
            />
          </label>
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy}
            onClick={() => void runFuzz()}
          >
            Run fuzz
          </button>
        </div>
      ) : null}

      {error ? <p className="explorer__error">{error}</p> : null}

      <div className="explorer__actions">
        <button
          type="button"
          className="explorer__copy"
          disabled={!jsonText || busy}
          onClick={() => void copy('json')}
        >
          {copied === 'json' ? 'Copied JSON!' : 'Copy JSON'}
        </button>
        <button
          type="button"
          className="explorer__copy"
          onClick={() => void copy('curl')}
        >
          {copied === 'curl' ? 'Copied cURL!' : 'Copy cURL'}
        </button>
      </div>

      {busy && tool !== 'fuzz' && !jsonText ? (
        <p className="explorer__muted explorer__status" aria-live="polite">
          Loading…
        </p>
      ) : null}

      {jsonText ? (
        <CodeBlock code={jsonText} />
      ) : tool === 'fuzz' ? (
        <p className="explorer__muted">Paste JSON and run fuzz to preview mutations.</p>
      ) : null}
    </section>
  )
}
