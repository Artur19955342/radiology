import type { IncomingMessage } from 'node:http'
import { defineConfig, type Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { handleDeepSeekAdaptRequest } from './api/_lib/deepseekAdapter.js'

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

const localDeepSeekApi = (): Plugin => ({
  name: 'local-deepseek-api',
  configureServer(server) {
    server.middlewares.use('/api/ai/adapt-finding', async (request, response, next) => {
      try {
        const method = request.method || 'GET'
        const body = method === 'GET' || method === 'HEAD' ? undefined : await readRawBody(request)
        const apiResponse = await handleDeepSeekAdaptRequest(
          new Request('http://localhost/api/ai/adapt-finding', {
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
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    localDeepSeekApi(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
