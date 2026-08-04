export const LOCAL_API_URL =
  import.meta.env.VITE_LOCAL_API_URL?.replace(/\/$/, '') ||
  'http://localhost:8080'

export const HEALTH_POLL_MS = 5000

export type EngineMode = 'local' | 'showroom' | 'checking'

export type HealthPayload = {
  status: string
  service?: string
  mode?: string
  version?: string
}
