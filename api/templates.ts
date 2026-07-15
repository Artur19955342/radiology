import {
  insertTemplate,
  listTemplates,
  validateTemplatePayload,
} from './_lib/templatesDb.js'

const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  })

export default {
  async fetch(request: Request) {
    try {
      if (request.method === 'GET') {
        const templates = await listTemplates()
        return json({ templates })
      }

      if (request.method === 'POST') {
        const payload = validateTemplatePayload(await request.json())
        const template = await insertTemplate(payload)
        return json({ template }, 201)
      }

      return json({ error: 'Метод не поддерживается.' }, 405)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка базы шаблонов.'
      return json({ error: message }, 500)
    }
  },
}
