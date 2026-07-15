import type { IncomingMessage } from 'node:http'
import { defineConfig, type Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { handleDeepSeekAdaptRequest } from './api/_lib/deepseekAdapter.js'
import { handleGenerateFindingRequest } from './api/_lib/freeFindingGenerator.js'

const readRawBody = (request: IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    let body = ''

    request.setEncoding('utf8')
    request.on('data', (chunk: string) => {
      body += chunk
    })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })

const toHeaders = (headers: IncomingMessage['headers']) => {
  const nextHeaders = new Headers()

  Object.entries(headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      nextHeaders.set(key, value.join(', '))
    } else if (value) {
      nextHeaders.set(key, value)
    }
  })

  return nextHeaders
}

const localAiRoutes = new Map([
  ['/api/ai/adapt-finding', handleDeepSeekAdaptRequest],
  ['/api/ai/generate-finding', handleGenerateFindingRequest],
])

const localAiApi = (): Plugin => ({
  name: 'local-ai-api',
  configureServer(server) {
    localAiRoutes.forEach((handler, route) => {
      server.middlewares.use(route, async (request, response, next) => {
        try {
          const method = request.method || 'GET'
          const body = method === 'GET' || method === 'HEAD' ? undefined : await readRawBody(request)
          const apiResponse = await handler(
            new Request(`http://localhost${route}`, {
              method,
              headers: toHeaders(request.headers),
              body,
            }),
          )

          response.statusCode = apiResponse.status
          apiResponse.headers.forEach((value, key) => response.setHeader(key, value))
          response.end(await apiResponse.text())
        } catch (error) {
          next(error as Error)
        }
      })
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    localAiApi(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
