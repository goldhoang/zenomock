import type { EngineMode, HealthPayload } from '../lib/config'
import { LOCAL_API_URL } from '../lib/config'

type Props = {
  mode: EngineMode
  health: HealthPayload | null
  displayTarget: string
}

export function EnvironmentBanner({ mode, health, displayTarget }: Props) {
  if (mode === 'checking') {
    return (
      <div className="banner banner--checking" role="status">
        <span className="banner__dot" aria-hidden />
        Checking local engine at {LOCAL_API_URL}…
      </div>
    )
  }

  if (mode === 'offline') {
    return (
      <div className="banner banner--local" role="status">
        <span className="banner__dot" aria-hidden />
        Mode 1 · Full Offline — same origin {displayTarget}
        {health?.version ? ` · v${health.version}` : ''}
      </div>
    )
  }

  if (mode === 'hybrid') {
    return (
      <div className="banner banner--local" role="status">
        <span className="banner__dot" aria-hidden />
        Mode 3 · Hybrid — Local Engine Connected: {displayTarget}
        {health?.version ? ` · v${health.version}` : ''}
      </div>
    )
  }

  return (
    <div className="banner banner--showroom" role="status">
      <span className="banner__dot" aria-hidden />
      Mode 2 · Showroom (static demo) — start Docker on :8080 for Hybrid
    </div>
  )
}
