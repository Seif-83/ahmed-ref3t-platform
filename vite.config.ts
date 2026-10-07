import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs'

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '')
      Object.assign(process.env, env)

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next()
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
        const apiName = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '')
        const filePath = path.resolve(server.config.root, 'api', `${apiName}.ts`)

        if (!fs.existsSync(filePath)) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: `API route /api/${apiName} not found` }))
          return
        }

        try {
          let bodyBuffer = Buffer.alloc(0)
          if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
            bodyBuffer = await new Promise<Buffer>((resolve, reject) => {
              const chunks: Buffer[] = []
              req.on('data', (chunk) => chunks.push(chunk))
              req.on('end', () => resolve(Buffer.concat(chunks)))
              req.on('error', reject)
            })
          }

          let body: unknown = undefined
          if (bodyBuffer.length > 0) {
            const rawBody = bodyBuffer.toString('utf-8')
            try {
              body = JSON.parse(rawBody)
            } catch {
              body = rawBody
            }
          }

          const apiReq = {
            method: req.method,
            headers: req.headers as Record<string, string | undefined>,
            body,
            query: Object.fromEntries(url.searchParams.entries()),
          }

          let statusCode = 200
          const apiRes = {
            status(code: number) {
              statusCode = code
              res.statusCode = code
              return apiRes
            },
            setHeader(name: string, value: string) {
              res.setHeader(name, value)
              return apiRes
            },
            json(data: unknown) {
              res.statusCode = statusCode
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(data))
            },
          }

          const module = await server.ssrLoadModule(`/api/${apiName}.ts`)
          const handler = module.default
          if (typeof handler === 'function') {
            await handler(apiReq, apiRes)
          } else {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: `Handler function in /api/${apiName}.ts not found` }))
          }
        } catch (error: any) {
          console.error(`Error executing API route /api/${apiName}:`, error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error?.message || 'Internal Server Error' }))
        }
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  // Set the base path to your repository name for GitHub Pages
  base: '/',
  build: {
    // Increase the chunk size limit to suppress the warning
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Optional: Split vendor chunks to improve caching
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
})

