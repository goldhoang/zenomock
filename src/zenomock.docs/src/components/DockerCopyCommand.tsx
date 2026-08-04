import { useEffect, useRef, useState } from 'react'

const DOCKER_CMD = 'docker run -p 8080:8080 ghcr.io/goldhoang/zenomock:latest'

export function DockerCopyCommand() {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(DOCKER_CMD)
      setCopied(true)
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
      timerRef.current = window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="hero__cmd-wrap">
      <code className="hero__cmd">{DOCKER_CMD}</code>
      <button
        type="button"
        className="hero__copy"
        onClick={() => void handleCopy()}
        aria-label="Copy Docker command"
      >
        <svg
          className="hero__copy-icon"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
          />
        </svg>
        {copied ? (
          <span className="hero__copy-tip" role="status">
            Copied!
          </span>
        ) : null}
      </button>
    </div>
  )
}
