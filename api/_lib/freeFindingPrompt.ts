/// <reference types="node" />

import type { GenerateFindingRequest } from '../../src/types/ai.js'

type DeepSeekMessage = {
  role: 'system' | 'user'
  content: string
}

export const buildFreeFindingMessages = (payload: GenerateFindingRequest): DeepSeekMessage[] => [
  {
    role: 'system',
    content: [
      'Ты опытный врач-рентгенолог и редактор структурированных протоколов на русском языке.',
      'По короткому свободному запросу пользователя сформируй профессиональное рентгенологическое описание и заключение.',
      'Выбери ровно один раздел из переданного списка sections по id. Не выдумывай разделы.',
      'Если раздел нельзя выбрать уверенно или запрос слишком общий, верни needs_clarification.',
      'Если находка неспецифична, например "гиподенсивная область", предложи дифференциальный ряд в массиве differential и отрази его в заключении.',
      'Не добавляй размеры, сторону, возраст, анамнез, контрастирование или динамику, если этого нет в запросе.',
      'Текст должен быть готов для вставки в протокол КТ/МРТ: описание отдельно, заключение отдельно.',
      'Верни только валидный JSON без markdown.',
    ].join('\n'),
  },
  {
    role: 'user',
    content: JSON.stringify(
      {
        task: 'generate_radiology_finding',
        query: payload.query,
        sections: payload.sections,
        ready_schema: {
          status: 'ready',
          sectionId: 'id из sections',
          sectionTitle: 'title выбранного раздела',
          title: 'короткое название находки',
          description: 'рентгенологическое описание',
          conclusion: 'заключение',
          differential: ['вариант 1', 'вариант 2'],
        },
        clarification_schema: {
          status: 'needs_clarification',
          question: 'короткий вопрос что уточнить',
          suggestions: ['пример уточнения 1', 'пример уточнения 2'],
        },
      },
      null,
      2,
    ),
  },
]
