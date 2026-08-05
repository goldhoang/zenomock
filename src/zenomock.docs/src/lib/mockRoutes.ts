/** Maps engine API paths to Showroom static files under Vite `base` + this relative path. */
export const STATIC_MOCK_ROUTES: Record<string, string> = {
  '/health': 'mock/health.json',
  '/mock-catalog': 'mock/demo.json',
  '/api/v1/boundary/strings/zalgo': 'mock/boundary/zalgo.json',
  '/api/v1/boundary/strings/xss-payloads': 'mock/boundary/xss-payloads.json',
  '/api/v1/boundary/strings/overflow': 'mock/boundary/overflow.json',
  '/api/v1/schemas': 'mock/schema/catalog.json',
  '/api/v1/chaos/config': 'mock/chaos/config.json',
}

export function resolveStaticMockUrl(apiPath: string): string | null {
  const [pathname] = apiPath.split('?')
  const relative = STATIC_MOCK_ROUTES[pathname]
  if (!relative) {
    return null
  }

  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}${relative}`
}
