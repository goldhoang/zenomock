import { useEffect, useId, useRef, useState } from 'react'

export type NavItem = {
  id: string
  label: string
}

const ITEMS: NavItem[] = [
  { id: 'mode-catalog', label: 'Catalog' },
  { id: 'boundary-explorer', label: 'Boundary' },
  { id: 'schema-playground', label: 'Schema' },
  { id: 'chaos-control', label: 'Chaos' },
  { id: 'chaos-proxy', label: 'Proxy' },
  { id: 'modules', label: 'Modules' },
]

type Props = {
  items?: NavItem[]
}

export function StickyNav({ items = ITEMS }: Props) {
  const [active, setActive] = useState(items[0]?.id ?? '')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const navRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '')
    if (hash && items.some((i) => i.id === hash)) {
      const el = document.getElementById(hash)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActive(hash)
    }

    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el != null)

    if (sections.length === 0) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target.id) {
          setActive(visible[0].target.id)
        }
      },
      {
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0.1, 0.25, 0.5],
      },
    )

    for (const section of sections) {
      observer.observe(section)
    }

    return () => observer.disconnect()
  }, [items])

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia('(min-width: 768px)').matches) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }

    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null
      if (target && navRef.current && !navRef.current.contains(target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
    }
  }, [menuOpen])

  const goTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    history.replaceState(null, '', window.location.pathname)
    setMenuOpen(false)
  }

  const onNavigate = (id: string) => {
    const el = document.getElementById(id)
    if (!el) {
      return
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    history.replaceState(null, '', `#${id}`)
    setActive(id)
    setMenuOpen(false)
  }

  return (
    <nav
      ref={navRef}
      className={menuOpen ? 'sticky-nav sticky-nav--open' : 'sticky-nav'}
      aria-label="Playground sections"
    >
      <div className="sticky-nav__inner">
        <a
          className="sticky-nav__brand"
          href="#top"
          onClick={(e) => {
            e.preventDefault()
            goTop()
          }}
        >
          ZenoMock
        </a>

        <button
          ref={toggleRef}
          type="button"
          className="sticky-nav__toggle"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-haspopup="true"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="sticky-nav__burger" aria-hidden="true" />
        </button>

        <ul id={menuId} className="sticky-nav__list">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={
                  active === item.id
                    ? 'sticky-nav__chip sticky-nav__chip--active'
                    : 'sticky-nav__chip'
                }
                aria-current={active === item.id ? 'true' : undefined}
                onClick={() => onNavigate(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
