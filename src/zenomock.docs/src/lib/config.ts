export const LOCAL_API_URL =
  import.meta.env.VITE_LOCAL_API_URL?.replace(/\/$/, '') ||
  'http://localhost:8080'

export const HEALTH_POLL_MS = 5000
export const HEALTH_PROBE_TIMEOUT_MS = 1500

export type EngineMode = 'checking' | 'offline' | 'hybrid' | 'showroom'

export type DataSource = 'engine' | 'static'

export type HealthPayload = {
  status: string
  service?: string
  mode?: string
  version?: string
}

export type EngineStatus = {
  mode: EngineMode
  health: HealthPayload | null
  apiBaseUrl: string | null
  displayTarget: string
}
