import {
  insertFinding,
  listFindings,
  validateFindingPayload,
} from './_lib/findingsDb.js'

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
        const findings = await listFindings()
        return json({ findings })
      }

      if (request.method === 'POST') {
        const payload = validateFindingPayload(await request.json())
        const finding = await insertFinding(payload)
        return json({ finding }, 201)
      }

      return json({ error: 'Метод не поддерживается.' }, 405)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка базы находок.'
      return json({ error: message }, 500)
    }
  },
}
