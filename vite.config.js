import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 2834
  },
  preview: {
    host: '0.0.0.0',
    port: 2834,
    allowedHosts: [
      'productionerp.onrender.com',
      '.onrender.com'
    ]
  }
})