import {
  HEALTH_POLL_MS,
  LOCAL_API_URL,
  type EngineMode,
  type HealthPayload,
} from './config'

async function fetchLocalHealth(signal?: AbortSignal): Promise<HealthPayload | null> {
  try {
    const response = await fetch(`${LOCAL_API_URL}/health`, {
      method: 'GET',
      signal,
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      return null
    }
    return (await response.json()) as HealthPayload
  } catch {
    return null
  }
}

async function fetchShowroomHealth(): Promise<HealthPayload | null> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}mock/health.json`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      return null
    }
    return (await response.json()) as HealthPayload
  } catch {
    return null
  }
}

export type EngineStatus = {
  mode: EngineMode
  health: HealthPayload | null
  apiBaseUrl: string | null
}

export async function resolveEngineStatus(signal?: AbortSignal): Promise<EngineStatus> {
  const local = await fetchLocalHealth(signal)
  if (local?.status === 'ok') {
    return {
      mode: 'local',
      health: local,
      apiBaseUrl: LOCAL_API_URL,
    }
  }

  const showroom = await fetchShowroomHealth()
  return {
    mode: 'showroom',
    health: showroom,
    apiBaseUrl: null,
  }
}

export { HEALTH_POLL_MS, LOCAL_API_URL }
