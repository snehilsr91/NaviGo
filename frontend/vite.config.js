import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { startTunnel } from './src/utils/tunnelService.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useTunnel = env.VITE_USE_TUNNEL === 'true'

  return {
    plugins: [
      react(),
      useTunnel && {
        name: 'localtunnel',
        configureServer: async (server) => {
          if (process.env.NODE_ENV !== 'production') {
            server.httpServer.once('listening', () => {
              const address = server.httpServer.address()
              const port = address.port
              try {
                startTunnel(port)
              } catch (err) {
                console.warn('Localtunnel failed, continuing without tunnel:', err?.message || err)
              }
            })
          }
        }
      }
    ].filter(Boolean),
    server: {
      host: true, // Listen on all addresses
    }
  }
})
