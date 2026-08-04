import { defineConfig, loadEnv } from 'vite'
import plugin from '@vitejs/plugin-react'

// Pages: VITE_BASE=/zenomock/  |  Docker / local engine: VITE_BASE=/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE || process.env.VITE_BASE || '/'

  return {
    plugins: [plugin()],
    base,
    server: {
      port: 49231,
    },
  }
})
