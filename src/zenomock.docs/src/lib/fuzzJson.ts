/** Lightweight Showroom-mode fuzz when the local engine is offline. */
export function fuzzJsonClientSide(input: unknown): {
  endpoint: string
  original: unknown
  fuzzed: unknown
  mutations: string[]
} {
  const original = structuredClone(input)
  const mutations: string[] = []
  const fuzzed = structuredClone(input)

  if (fuzzed !== null && typeof fuzzed === 'object' && !Array.isArray(fuzzed)) {
    const record = fuzzed as Record<string, unknown>
    const keys = Object.keys(record)
    if (keys.length > 1) {
      const drop = keys[Math.floor(Math.random() * keys.length)]!
      delete record[drop]
      mutations.push(`removed:${drop}`)
    }

    for (const key of Object.keys(record)) {
      const value = record[key]
      if (typeof value === 'string') {
        record[key] = Math.random() < 0.5
        mutations.push(`typeMismatch:${key}`)
      } else if (typeof value === 'number') {
        record[key] = `not-a-number-${Math.floor(Math.random() * 1000)}`
        mutations.push(`typeMismatch:${key}`)
      } else if (typeof value === 'boolean') {
        record[key] = Math.floor(Math.random() * 100)
        mutations.push(`typeMismatch:${key}`)
      }
    }
  } else if (Array.isArray(fuzzed) && fuzzed.length > 0) {
    const index = Math.floor(Math.random() * fuzzed.length)
    fuzzed.splice(index, 1)
    mutations.push(`removed:[${index}]`)
  } else {
    mutations.push('noop:unsupported-root')
  }

  return {
    endpoint: 'POST /api/v1/boundary/fuzz-json',
    original,
    fuzzed,
    mutations,
  }
}
