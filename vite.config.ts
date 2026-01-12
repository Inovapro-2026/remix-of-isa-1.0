import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { componentTagger } from "lovable-tagger"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 8080,
      allowedHosts: [
        "isa.inovapro.cloud",
        ".inovapro.cloud",
        "localhost"
      ],
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:8081',
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: 'http://localhost:8081',
          ws: true,
          secure: false,
        }
      }
    }
  }
})
