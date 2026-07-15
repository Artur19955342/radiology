import type { AdaptFindingRequest } from '../../src/types/ai.js'

export type DeepSeekMessage = {
  role: 'system' | 'user'
  content: string
}

export const buildDeepSeekAdaptMessages = (payload: AdaptFindingRequest): DeepSeekMessage[] => [
  {
    role: 'system',
    content: [
      'Ты помогаешь врачу-рентгенологу адаптировать готовую находку под указанную локализацию.',
      'Меняй только грамматику, падежи, род, число и согласование.',
      'Не добавляй новых медицинских фактов, не удаляй смысловые данные и сохраняй числовые значения.',
      'Ответ верни только как непустой json-объект.',
      '',
      'EXAMPLE JSON OUTPUT:',
      '{"title":"Очаг","description":"В левой лобной доле определяется очаг 5 мм.","conclusion":"Очаговые изменения в левой лобной доле."}',
    ].join('\n'),
  },
  {
    role: 'user',
    content: [
      'Адаптируй текст находки под локализацию.',
      '',
      `Локализация: ${payload.localization}`,
      `Тип записи: ${payload.kind}`,
      `Название: ${payload.title}`,
      '',
      'Описание:',
      payload.description,
      '',
      'Заключение:',
      payload.conclusion || '',
      '',
      'Верни строгий json без markdown и пояснений в формате:',
      '{"title":"...","description":"...","conclusion":"..."}',
    ].join('\n'),
  },
]
