import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy tile requests to TileServer GL (running via docker-compose on port 8080)
      // This allows the frontend dev server to fetch tiles without CORS issues
      // and keeps the TileLayer URL as /tiles/... for both dev and (with proper hosting) prod.
      '/tiles': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tiles/, '/styles/basic/rendered'),
      },
    },
  },
})
