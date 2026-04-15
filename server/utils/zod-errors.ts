/**
 * zod-errors — общий хелпер для маппинга ZodError → 422 field map.
 *
 * Используется в API-эндпоинтах для унификации ответов валидации.
 * Клиент получает { fieldErrors: { email: 'Invalid email', ... } } и
 * раскладывает ошибки по UFormField через useFormValidation.setServerErrors().
 */
import type { z, ZodError, ZodTypeAny } from 'zod'
import type { H3Event } from 'h3'

export function zodToFieldErrors(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of err.issues) {
    const field = issue.path.map(String).join('.') || '_root'
    // Первая ошибка на поле — самая информативная
    if (!(field in out)) {
      out[field] = issue.message
    }
  }
  return out
}

/**
 * Валидирует тело запроса zod-схемой. При ошибке кидает 422 с fieldErrors.
 * Замена для readValidatedBody(event, schema.parse), которая возвращает 400.
 *
 * Возвращает z.infer<S> — инференс идёт через output-тип схемы, поэтому
 * `.default(...)` корректно сужает тип поля до не-undefined.
 */
export async function validateBody<S extends ZodTypeAny>(
  event: H3Event,
  schema: S,
): Promise<z.infer<S>> {
  const body = await readBody(event)
  const result = schema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validation failed',
      data: {
        message: 'Validation failed',
        fieldErrors: zodToFieldErrors(result.error),
      },
    })
  }
  return result.data
}
