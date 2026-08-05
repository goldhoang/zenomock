import { useEffect, useState } from 'react'
import { HEALTH_POLL_MS, LOCAL_API_URL, resolveEngineStatus, type EngineStatus } from './api'

const initialStatus: EngineStatus = {
  mode: 'checking',
  health: null,
  apiBaseUrl: null,
  displayTarget: LOCAL_API_URL,
}

export function useEngineStatus(): EngineStatus {
  const [status, setStatus] = useState<EngineStatus>(initialStatus)

  useEffect(() => {
    const controller = new AbortController()

    const tick = async () => {
      const next = await resolveEngineStatus(controller.signal)
      if (controller.signal.aborted) {
        return
      }
      setStatus((prev) => {
        if (
          prev.mode === next.mode &&
          prev.apiBaseUrl === next.apiBaseUrl &&
          prev.displayTarget === next.displayTarget &&
          JSON.stringify(prev.health) === JSON.stringify(next.health)
        ) {
          return prev
        }
        return next
      })
    }

    void tick()
    const id = window.setInterval(() => void tick(), HEALTH_POLL_MS)
    return () => {
      controller.abort()
      window.clearInterval(id)
    }
  }, [])

  return status
}
