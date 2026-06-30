import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 2834,
    allowedHosts: 'all'
  },
  preview: {
    host: '0.0.0.0',
    port: 2834,
    allowedHosts: 'all'
  }
})