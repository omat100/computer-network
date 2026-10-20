import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Proxying /api in development keeps the Flask backend free of CORS setup.
const proxy = {
  '/api': {
    target: 'http://127.0.0.1:6050',
    changeOrigin: true,
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
})
