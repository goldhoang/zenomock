export type CatalogRoute = {
  path: string
  title: string
  phase: number
  live: boolean
}

export type MockCatalog = {
  phase: string
  message: string
  hint?: string
  routes: CatalogRoute[]
}
