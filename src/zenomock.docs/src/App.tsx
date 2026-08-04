import { useEffect, useState } from 'react'
import { DockerCopyCommand } from './components/DockerCopyCommand'
import { EnvironmentBanner } from './components/EnvironmentBanner'
import { PanelPlaceholder } from './components/PanelPlaceholder'
import { HEALTH_POLL_MS, resolveEngineStatus, type EngineStatus } from './lib/api'
import './App.css'

const initialStatus: EngineStatus = {
  mode: 'checking',
  health: null,
  apiBaseUrl: null,
}

function App() {
  const [status, setStatus] = useState<EngineStatus>(initialStatus)

  useEffect(() => {
    const controller = new AbortController()

    const tick = async () => {
      const next = await resolveEngineStatus(controller.signal)
      if (!controller.signal.aborted) {
        setStatus(next)
      }
    }

    void tick()
    const id = window.setInterval(() => void tick(), HEALTH_POLL_MS)
    return () => {
      controller.abort()
      window.clearInterval(id)
    }
  }, [])

  return (
    <div className="app">
      <EnvironmentBanner mode={status.mode} health={status.health} />

      <header className="hero">
        <p className="hero__eyebrow">Local-first mock engine</p>
        <h1 className="hero__brand">ZenoMock</h1>
        <p className="hero__lead">
          Containerized CRUD mocks, boundary data, and chaos — zero-cost via GHCR
          and GitHub Pages.
        </p>
        <div className="hero__actions">
          <a
            className="btn btn--primary"
            href="https://github.com/goldhoang/zenomock"
            target="_blank"
            rel="noreferrer"
          >
            Repository
          </a>
          <DockerCopyCommand />
        </div>
      </header>

      <section className="panels" aria-label="Roadmap modules">
        <PanelPlaceholder
          phase="Phase 2"
          status="coming-soon"
          title="Boundary Data Explorer"
          description="Zalgo, XSS samples, overflow strings, and fuzzed JSON with one-click copy."
        />
        <PanelPlaceholder
          phase="Phase 3"
          status="coming-soon"
          title="Schema & API Playground"
          description="Define a JSON Schema and exercise in-memory mock CRUD after Boundary."
        />
        <PanelPlaceholder
          phase="Phase 4"
          status="coming-soon"
          title="Chaos Control Panel"
          description="Latency, 5xx rates, and corrupted JSON injection against /api/* — not /health."
        />
      </section>

      <footer className="footer">
        <span>
          Mode:{' '}
          {status.mode === 'local'
            ? 'Hybrid / Local'
            : status.mode === 'showroom'
              ? 'Showroom'
              : 'Detecting'}
        </span>
        <a href="https://goldhoang.github.io/zenomock/">Playground</a>
      </footer>
    </div>
  )
}

export default App
