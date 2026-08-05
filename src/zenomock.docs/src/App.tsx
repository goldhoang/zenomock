import { DockerCopyCommand } from './components/DockerCopyCommand'
import { EnvironmentBanner } from './components/EnvironmentBanner'
import { ModeCatalog } from './components/ModeCatalog'
import { PanelPlaceholder } from './components/PanelPlaceholder'
import type { EngineMode } from './lib/config'
import { useEngineStatus } from './lib/useEngineStatus'
import './App.css'

function modeLabel(mode: EngineMode): string {
  switch (mode) {
    case 'offline':
      return 'Mode 1 · Full Offline'
    case 'hybrid':
      return 'Mode 3 · Hybrid'
    case 'showroom':
      return 'Mode 2 · Showroom'
    default:
      return 'Detecting'
  }
}

function App() {
  const status = useEngineStatus()

  return (
    <div className="app">
      <EnvironmentBanner
        mode={status.mode}
        health={status.health}
        displayTarget={status.displayTarget}
      />

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

      <ModeCatalog status={status} />

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
        <span>Mode: {modeLabel(status.mode)}</span>
        <a href="https://goldhoang.github.io/zenomock/">Playground</a>
      </footer>
    </div>
  )
}

export default App
