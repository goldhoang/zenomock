import { BoundaryExplorer } from './components/BoundaryExplorer'
import { ChaosControlPanel } from './components/ChaosControlPanel'
import { ChaosProxyPanel } from './components/ChaosProxyPanel'
import { DockerCopyCommand } from './components/DockerCopyCommand'
import { EnvironmentBanner } from './components/EnvironmentBanner'
import { ModeCatalog } from './components/ModeCatalog'
import { PanelPlaceholder } from './components/PanelPlaceholder'
import { SchemaPlayground } from './components/SchemaPlayground'
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
      <div className="reveal">
        <EnvironmentBanner
          mode={status.mode}
          health={status.health}
          displayTarget={status.displayTarget}
        />
      </div>

      <header className="hero reveal reveal--delay-1">
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

      <div className="reveal reveal--delay-2">
        <ModeCatalog status={status} />
      </div>

      <div className="reveal reveal--delay-3">
        <BoundaryExplorer status={status} />
      </div>

      <div className="reveal reveal--delay-4">
        <SchemaPlayground status={status} />
      </div>

      <div className="reveal reveal--delay-4">
        <ChaosControlPanel status={status} />
      </div>

      <div className="reveal reveal--delay-4">
        <ChaosProxyPanel status={status} />
      </div>

      <section className="panels reveal reveal--delay-4" aria-label="Roadmap modules">
        <PanelPlaceholder
          phase="Phase 2"
          status="ready"
          href="#boundary-explorer"
          title="Boundary Data Explorer"
          description="Zalgo, XSS samples, overflow strings, and fuzzed JSON with one-click copy."
        />
        <PanelPlaceholder
          phase="Phase 3"
          status="ready"
          href="#schema-playground"
          title="Schema & API Playground"
          description="Register a JSON Schema, seed records, then list / create / fetch by id in memory."
        />
        <PanelPlaceholder
          phase="Phase 4"
          status="ready"
          href="#chaos-control"
          title="Chaos Control Panel"
          description="Latency, 5xx rates, and corrupted JSON injection against /api/* — not /health."
        />
        <PanelPlaceholder
          phase="Phase 5"
          status="ready"
          href="#chaos-proxy"
          title="Chaos Proxy"
          description="Allowlisted /proxy forward with SSRF guards; chaos knobs apply to proxied calls."
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
