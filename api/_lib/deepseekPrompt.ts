import type { AdaptFindingRequest } from '../../src/types/ai.js'
import { formatProtectedNumbersForPrompt } from './numberIntegrity.js'

export type DeepSeekMessage = {
  role: 'system' | 'user'
  content: string
}

export const buildDeepSeekAdaptMessages = (payload: AdaptFindingRequest): DeepSeekMessage[] => [
  {
    role: 'system',
    content: [
      'Ты помогаешь врачу-рентгенологу адаптировать готовую находку под указанную локализацию.',
      'Разрешено менять только локализацию и грамматическое согласование вокруг локализации.',
      'Запрещено менять диагноз, смысл, количество находок, размеры, плотность, интенсивность, проценты, даты, степени, стадии и любые числовые значения.',
      'Все цифры из исходного текста должны остаться в ответе в том же количестве, в том же порядке и в той же записи.',
      'Не добавляй новые числа и не удаляй существующие числа.',
      'Если число относится к размеру или измерению, единицу измерения тоже не меняй.',
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
      formatProtectedNumbersForPrompt(payload),
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
