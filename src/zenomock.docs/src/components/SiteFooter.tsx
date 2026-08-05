type Props = {
  modeLabel: string
}

export function SiteFooter({ modeLabel }: Props) {
  return (
    <footer className="site-footer" id="author">
      <div className="site-footer__glow" aria-hidden="true" />
      <div className="site-footer__grid">
        <div className="site-footer__brand">
          <p className="site-footer__eyebrow">Crafted by</p>
          <a
            className="site-footer__name"
            href="https://goldhoang.dev"
            target="_blank"
            rel="noreferrer"
          >
            GoldHoang
          </a>
          <p className="site-footer__tagline">
            ZenoMock — Zero Network Mock Engine · Tri-Mode · Local-first.
          </p>
        </div>

        <div className="site-footer__col">
          <p className="site-footer__label">Project</p>
          <a href="https://github.com/goldhoang/zenomock" target="_blank" rel="noreferrer">
            GitHub repository
          </a>
          <a href="https://goldhoang.github.io/zenomock/" target="_blank" rel="noreferrer">
            Live playground
          </a>
          <a href="https://github.com/goldhoang/zenomock/pkgs/container/zenomock" target="_blank" rel="noreferrer">
            GHCR image
          </a>
        </div>

        <div className="site-footer__col">
          <p className="site-footer__label">Author</p>
          <a href="https://goldhoang.dev" target="_blank" rel="noreferrer">
            goldhoang.dev
          </a>
          <a href="https://goldhoang.github.io" target="_blank" rel="noreferrer">
            goldhoang.github.io
          </a>
          <a href="https://github.com/goldhoang" target="_blank" rel="noreferrer">
            @goldhoang
          </a>
        </div>
      </div>

      <div className="site-footer__bar">
        <span>Mode · {modeLabel}</span>
        <span>
          © {new Date().getFullYear()} GoldHoang · ZenoMock · MIT
        </span>
      </div>
    </footer>
  )
}
