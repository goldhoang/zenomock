import { useEffect, useRef, useState } from 'react'
import { getJson, postJson, type EngineStatus } from '../lib/api'

type Props = {
  status: EngineStatus
}

type SchemaListResponse = {
  count: number
  schemas: Array<{
    entity: string
    recordCount: number
  }>
}

type RecordListResponse = {
  entity: string
  count: number
  items: unknown[]
}

const DEFAULT_SCHEMA = `{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "price": { "type": "number" },
    "active": { "type": "boolean" }
  },
  "required": ["name"]
}`

const DEFAULT_CREATE = `{
  "name": "Zeno Mug",
  "price": 12.5,
  "active": true
}`

export function SchemaPlayground({ status }: Props) {
  const engineReady =
    status.mode === 'offline' || status.mode === 'hybrid'
  const [entity, setEntity] = useState('products')
  const [seedCount, setSeedCount] = useState(3)
  const [schemaText, setSchemaText] = useState(DEFAULT_SCHEMA)
  const [createText, setCreateText] = useState(DEFAULT_CREATE)
  const [lookupId, setLookupId] = useState('')
  const [schemas, setSchemas] = useState<SchemaListResponse['schemas']>([])
  const [output, setOutput] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const refreshSchemas = async () => {
    if (!engineReady) {
      return
    }
    try {
      const result = await getJson<SchemaListResponse>('/api/v1/schemas', { status })
      setSchemas(result.data.schemas ?? [])
    } catch {
      /* ignore list errors while typing */
    }
  }

  useEffect(() => {
    if (!engineReady) {
      setSchemas([])
      return
    }
    void refreshSchemas()
  }, [status.mode, status.apiBaseUrl])

  const showResult = (message: string, data: unknown) => {
    setNotice(message)
    setOutput(data)
    setError(null)
    window.requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      setNotice(null)
      setError(err instanceof Error ? err.message : 'Request failed')
      window.requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    } finally {
      setBusy(false)
    }
  }

  const registerSchema = () =>
    run(async () => {
      if (!engineReady) {
        throw new Error('Local engine required — start Docker or dotnet on :8080')
      }
      const schema = JSON.parse(schemaText) as unknown
      const result = await postJson<{
        entity?: string
        seeded?: number
        recordCount?: number
      }>('/api/v1/schemas', { entity, seedCount, schema }, { status })
      await refreshSchemas()
      showResult(
        `Registered “${result.data.entity ?? entity}” · seeded ${result.data.seeded ?? 0} · total ${result.data.recordCount ?? 0}`,
        result.data,
      )
    })

  const listRecords = () =>
    run(async () => {
      if (!engineReady) {
        throw new Error('Local engine required — start Docker or dotnet on :8080')
      }
      const result = await getJson<RecordListResponse>(`/api/v1/mock/${entity}`, {
        status,
      })
      showResult(
        `Listed “${result.data.entity}” · ${result.data.count} record(s)`,
        result.data,
      )
      const first = result.data.items[0] as { id?: string } | undefined
      if (first?.id && !lookupId) {
        setLookupId(first.id)
      }
    })

  const createRecord = () =>
    run(async () => {
      if (!engineReady) {
        throw new Error('Local engine required — start Docker or dotnet on :8080')
      }
      const body = JSON.parse(createText) as unknown
      const result = await postJson<{ id?: string }>(`/api/v1/mock/${entity}`, body, {
        status,
      })
      await refreshSchemas()
      if (result.data.id) {
        setLookupId(result.data.id)
      }
      showResult(
        `Created record${result.data.id ? ` · id ${result.data.id}` : ''}`,
        result.data,
      )
    })

  const getById = () =>
    run(async () => {
      if (!engineReady) {
        throw new Error('Local engine required — start Docker or dotnet on :8080')
      }
      if (!lookupId.trim()) {
        throw new Error('Enter a record id')
      }
      const result = await getJson<unknown>(
        `/api/v1/mock/${entity}/${lookupId.trim()}`,
        { status },
      )
      showResult(`Fetched “${entity}/${lookupId.trim()}”`, result.data)
    })

  return (
    <section id="schema-playground" className="explorer playground">
      <div className="explorer__head">
        <h2 className="explorer__title">Schema & API Playground</h2>
        <span className="explorer__source">
          {engineReady ? 'via engine' : 'engine required'}
        </span>
      </div>
      <p className="explorer__lead">
        Register a JSON Schema, seed in-memory records, then list / create / fetch
        by id — process memory only (resets when the engine restarts).
      </p>

      {!engineReady ? (
        <p className="explorer__error">
          Showroom mode cannot persist mocks. Start the local engine for CRUD.
        </p>
      ) : null}

      <div className="playground__grid">
        <label className="explorer__field">
          Entity
          <input
            value={entity}
            onChange={(e) => setEntity(e.target.value.toLowerCase())}
            spellCheck={false}
          />
        </label>
        <label className="explorer__field">
          Seed count
          <input
            type="number"
            min={0}
            max={50}
            value={seedCount}
            onChange={(e) => setSeedCount(Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <label className="explorer__field explorer__field--block">
        JSON Schema
        <textarea
          value={schemaText}
          onChange={(e) => setSchemaText(e.target.value)}
          rows={9}
          spellCheck={false}
        />
      </label>

      <div className="explorer__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy || !engineReady}
          onClick={() => void registerSchema()}
        >
          {busy ? 'Working…' : 'Register schema'}
        </button>
        <button
          type="button"
          className="explorer__copy"
          disabled={busy || !engineReady}
          onClick={() => void listRecords()}
        >
          List records
        </button>
      </div>

      <label className="explorer__field explorer__field--block">
        Create record body
        <textarea
          value={createText}
          onChange={(e) => setCreateText(e.target.value)}
          rows={5}
          spellCheck={false}
        />
      </label>

      <div className="playground__grid">
        <button
          type="button"
          className="explorer__copy"
          disabled={busy || !engineReady}
          onClick={() => void createRecord()}
        >
          Create record
        </button>
        <label className="explorer__field">
          Get by id
          <input
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder="record id"
            spellCheck={false}
          />
        </label>
        <button
          type="button"
          className="explorer__copy"
          disabled={busy || !engineReady}
          onClick={() => void getById()}
        >
          Fetch
        </button>
      </div>

      {schemas.length > 0 ? (
        <p className="explorer__muted">
          Registered: {schemas.map((s) => `${s.entity} (${s.recordCount})`).join(' · ')}
        </p>
      ) : null}

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
        {output ? (
          <pre className="explorer__preview">{JSON.stringify(output, null, 2)}</pre>
        ) : (
          <p className="explorer__muted">
            Results appear here after Register / List / Create / Fetch.
          </p>
        )}
      </div>
    </section>
  )
}
