import { useMemo } from 'react'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'

hljs.registerLanguage('json', json)

type Props = {
  code: string
  meta?: string
  className?: string
}

/** Syntax-highlighted JSON preview for playground panels. */
export function CodeBlock({ code, meta, className = '' }: Props) {
  const body = useMemo(() => extractJsonish(code), [code])

  const html = useMemo(() => {
    if (!body.trim()) {
      return ''
    }
    try {
      return hljs.highlight(body, { language: 'json' }).value
    } catch {
      return escapeHtml(body)
    }
  }, [body])

  return (
    <div className={`code-block ${className}`.trim()}>
      {meta ? <div className="code-block__meta">{meta}</div> : null}
      <pre className="code-block__pre explorer__preview">
        <code
          className="hljs language-json"
          dangerouslySetInnerHTML={{ __html: html || escapeHtml(body) }}
        />
      </pre>
    </div>
  )
}

function extractJsonish(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) {
    return ''
  }

  const jsonStart = trimmed.search(/[{[]/)
  if (jsonStart > 0) {
    return trimmed.slice(jsonStart)
  }

  return trimmed
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
