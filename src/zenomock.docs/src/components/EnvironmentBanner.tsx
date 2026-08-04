import type { EngineMode, HealthPayload } from '../lib/config'
import { LOCAL_API_URL } from '../lib/config'

type Props = {
  mode: EngineMode
  health: HealthPayload | null
}

export function EnvironmentBanner({ mode, health }: Props) {
  if (mode === 'checking') {
    return (
      <div className="banner banner--checking" role="status">
        <span className="banner__dot" aria-hidden />
        Checking local engine at {LOCAL_API_URL}…
      </div>
    )
  }

  if (mode === 'local') {
    return (
      <div className="banner banner--local" role="status">
        <span className="banner__dot" aria-hidden />
        Local Engine Connected: {LOCAL_API_URL}
        {health?.version ? ` · v${health.version}` : ''}
      </div>
    )
  }

  return (
    <div className="banner banner--showroom" role="status">
      <span className="banner__dot" aria-hidden />
      Showroom Mode (static demo) — start Docker on :8080 for Hybrid
    </div>
  )
}
