import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8000',
      '/users': 'http://localhost:8000',
      '/conversations': 'http://localhost:8000',
      '/direct-messages': 'http://localhost:8000',
      '/groups': 'http://localhost:8000',
      '/group-messages': 'http://localhost:8000',
      '/contacts': 'http://localhost:8000',
      '/settings': { target: 'http://localhost:8000', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8000', ws: true },
    },
  },
})
