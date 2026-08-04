type PanelStatus = 'ready' | 'coming-soon'

type Props = {
  title: string
  description: string
  phase: string
  status: PanelStatus
  href?: string
}

export function PanelPlaceholder({
  title,
  description,
  phase,
  status,
  href,
}: Props) {
  const isReady = status === 'ready'
  const className = [
    'panel',
    isReady ? 'panel--ready' : 'panel--coming',
  ].join(' ')

  const inner = (
    <>
      <div className="panel__meta">
        <p className="panel__phase">{phase}</p>
        <span
          className={
            isReady ? 'panel__badge panel__badge--ready' : 'panel__badge'
          }
        >
          {isReady ? 'Ready' : 'Coming soon'}
        </span>
      </div>
      <h2 className="panel__title">{title}</h2>
      <p className="panel__body">{description}</p>
    </>
  )

  if (isReady && href) {
    return (
      <a className={className} href={href}>
        {inner}
      </a>
    )
  }

  return (
    <article className={className} aria-disabled={!isReady}>
      {inner}
    </article>
  )
}
