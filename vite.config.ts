import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // mode: development | production
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err)
            })
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log(
                'Sending Request to the Target:',
                req.method,
                req.url
              )
            })
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log(
                'Received Response from the Target:',
                proxyRes.statusCode,
                req.url
              )
            })
          },
        },
      },
    },
  }
})