import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { startTunnel } from './src/utils/tunnelService.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'localtunnel',
      configureServer: async (server) => {
        if (process.env.NODE_ENV !== 'production') {
          server.httpServer.once('listening', () => {
            const address = server.httpServer.address()
            const port = address.port
            startTunnel(port)
          })
        }
      }
    }
  ],
  server: {
    host: true, // Listen on all addresses
  }
})
