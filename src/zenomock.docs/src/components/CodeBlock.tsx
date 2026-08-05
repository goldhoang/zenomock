import { useMemo } from 'react'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'

hljs.registerLanguage('json', json)

/** Soft cap so Overflow / huge payloads cannot freeze the main thread. */
export const CODE_BLOCK_MAX_CHARS = 12_000

type Props = {
  code: string
  meta?: string
  className?: string
}

/** Syntax-highlighted JSON preview (HLJS escapes content; fallback escapes fully). */
export function CodeBlock({ code, meta, className = '' }: Props) {
  const { body, truncated } = useMemo(() => {
    const extracted = extractJsonish(code)
    if (extracted.length <= CODE_BLOCK_MAX_CHARS) {
      return { body: extracted, truncated: false }
    }
    return {
      body: `${extracted.slice(0, CODE_BLOCK_MAX_CHARS)}\n… [truncated ${extracted.length - CODE_BLOCK_MAX_CHARS} chars]`,
      truncated: true,
    }
  }, [code])

  const html = useMemo(() => {
    if (!body.trim()) {
      return ''
    }
    try {
      return hljs.highlight(body, { language: 'json', ignoreIllegals: true }).value
    } catch {
      return escapeHtml(body)
    }
  }, [body])

  return (
    <div className={`code-block ${className}`.trim()}>
      {meta ? (
        <div className="code-block__meta">
          {meta}
          {truncated ? ' · truncated' : ''}
        </div>
      ) : truncated ? (
        <div className="code-block__meta">truncated preview</div>
      ) : null}
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
    .replaceAll("'", '&#39;')
}
