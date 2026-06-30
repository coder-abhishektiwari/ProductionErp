import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 2834,
    allowedHosts: ['productionerp.onrender.com', 'all']
  },
  preview: {
    host: '0.0.0.0',
    port: 2834,
    allowedHosts: ['productionerp.onrender.com', 'all']
  }
})