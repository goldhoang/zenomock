import {
  HEALTH_POLL_MS,
  HEALTH_POLL_SHOWROOM_MS,
  HEALTH_PROBE_TIMEOUT_MS,
  LOCAL_API_URL,
  type DataSource,
  type EngineStatus,
  type HealthPayload,
} from './config'
import { resolveStaticMockUrl } from './mockRoutes'

export type { DataSource, EngineStatus, HealthPayload }
export { HEALTH_POLL_MS, HEALTH_POLL_SHOWROOM_MS, LOCAL_API_URL }

export type ApiResult<T> = {
  data: T
  source: DataSource
}

function mergeSignals(external?: AbortSignal, timeoutMs?: number): AbortSignal {
  const controller = new AbortController()

  const abort = () => controller.abort()

  if (timeoutMs !== undefined) {
    const timer = window.setTimeout(abort, timeoutMs)
    controller.signal.addEventListener('abort', () => window.clearTimeout(timer), {
      once: true,
    })
  }

  if (external) {
    if (external.aborted) {
      controller.abort()
    } else {
      external.addEventListener('abort', abort, { once: true })
    }
  }

  return controller.signal
}

async function readJson<T>(response: Response): Promise<T | null> {
  if (!response.ok) {
    return null
  }

  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

/** True when this page is served by the local engine (Mode 1), not Pages/Vite. */
export function isHostedByLocalEngine(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const { hostname, port } = window.location
  if (hostname.endsWith('github.io')) {
    return false
  }

  return port === '8080'
}

async function fetchHealth(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<HealthPayload | null> {
  const root = baseUrl.replace(/\/$/, '')
  const url = `${root}/health`

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: mergeSignals(signal, HEALTH_PROBE_TIMEOUT_MS),
      headers: { Accept: 'application/json' },
    })
    const payload = await readJson<HealthPayload>(response)
    return payload?.status === 'ok' ? payload : null
  } catch {
    return null
  }
}

async function fetchShowroomHealth(signal?: AbortSignal): Promise<HealthPayload | null> {
  const url = resolveStaticMockUrl('/health')
  if (!url) {
    return null
  }

  try {
    const response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    })
    return await readJson<HealthPayload>(response)
  } catch {
    return null
  }
}

export async function resolveEngineStatus(signal?: AbortSignal): Promise<EngineStatus> {
  if (isHostedByLocalEngine()) {
    const origin = window.location.origin
    const local = await fetchHealth(origin, signal)
    if (local) {
      return {
        mode: 'offline',
        health: local,
        apiBaseUrl: origin,
        displayTarget: origin,
      }
    }
  }

  const remote = await fetchHealth(LOCAL_API_URL, signal)
  if (remote) {
    return {
      mode: 'hybrid',
      health: remote,
      apiBaseUrl: LOCAL_API_URL,
      displayTarget: LOCAL_API_URL,
    }
  }

  const showroom = await fetchShowroomHealth(signal)
  return {
    mode: 'showroom',
    health: showroom,
    apiBaseUrl: null,
    displayTarget: 'static mock',
  }
}

class ApiRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string }
    if (payload?.error) {
      return payload.error
    }
  } catch {
    /* ignore */
  }
  return `HTTP ${response.status}`
}

async function fetchEngineJson<T>(
  apiBaseUrl: string,
  path: string,
  signal?: AbortSignal,
): Promise<T | null> {
  const url = `${apiBaseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal,
      headers: { Accept: 'application/json' },
    })
    if (response.status === 404 || response.status === 400 || response.status === 409) {
      throw new ApiRequestError(await readErrorMessage(response))
    }
    return await readJson<T>(response)
  } catch (err) {
    if (err instanceof ApiRequestError) {
      throw err
    }
    return null
  }
}

async function fetchEnginePostJson<T>(
  apiBaseUrl: string,
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T | null> {
  const url = `${apiBaseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      throw new ApiRequestError(await readErrorMessage(response))
    }
    return await readJson<T>(response)
  } catch (err) {
    if (err instanceof ApiRequestError) {
      throw err
    }
    return null
  }
}

async function fetchStaticJson<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  const url = resolveStaticMockUrl(path)
  if (!url) {
    return null
  }

  try {
    const response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    })
    return await readJson<T>(response)
  } catch {
    return null
  }
}

/** GET JSON: engine first when reachable, then Showroom static fallback. */
export async function getJson<T>(
  path: string,
  options?: { signal?: AbortSignal; status?: EngineStatus },
): Promise<ApiResult<T>> {
  const status = options?.status ?? (await resolveEngineStatus(options?.signal))

  if ((status.mode === 'offline' || status.mode === 'hybrid') && status.apiBaseUrl) {
    try {
      const engineData = await fetchEngineJson<T>(status.apiBaseUrl, path, options?.signal)
      if (engineData !== null) {
        return { data: engineData, source: 'engine' }
      }
    } catch (err) {
      const staticData = await fetchStaticJson<T>(path, options?.signal)
      if (staticData !== null) {
        return { data: staticData, source: 'static' }
      }
      throw err
    }
  }

  const staticData = await fetchStaticJson<T>(path, options?.signal)
  if (staticData !== null) {
    return { data: staticData, source: 'static' }
  }

  throw new Error(`No engine response or static mock for ${path}`)
}

/**
 * POST JSON to the local engine when reachable.
 * Callers should provide a Showroom fallback (e.g. client-side fuzz) when this throws.
 */
export async function postJson<T>(
  path: string,
  body: unknown,
  options?: { signal?: AbortSignal; status?: EngineStatus },
): Promise<ApiResult<T>> {
  const status = options?.status ?? (await resolveEngineStatus(options?.signal))

  if ((status.mode === 'offline' || status.mode === 'hybrid') && status.apiBaseUrl) {
    const engineData = await fetchEnginePostJson<T>(
      status.apiBaseUrl,
      path,
      body,
      options?.signal,
    )
    if (engineData !== null) {
      return { data: engineData, source: 'engine' }
    }
  }

  throw new Error(`Engine unavailable for POST ${path}`)
}
