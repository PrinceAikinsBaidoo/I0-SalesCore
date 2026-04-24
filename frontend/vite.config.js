import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    // Vite gives process.env precedence over .env files for VITE_* vars. A machine-level
    // VITE_API_BASE_URL (e.g. Vercel CLI / Windows user env) would still point the SPA at
    // Render during `npm run dev`, causing slow/canceled login and stuck CORS preflight.
    {
      name: 'dev-clear-stale-vite-api-base-url',
      enforce: 'pre',
      config(_c, { command }) {
        if (command === 'serve') delete process.env.VITE_API_BASE_URL
      },
    },
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/actuator': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
