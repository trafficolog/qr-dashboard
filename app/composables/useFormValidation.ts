/**
 * useFormValidation — единый валидатор форм на базе Zod.
 *
 * - validate(data) — прогоняет safeParse, заполняет errors по path.
 * - validateField(name, value) — валидация отдельного поля.
 * - setServerErrors({ email: 'already taken' }) — принимает 422-ответ и
 *   раскладывает ошибки по полям.
 * - touched — помечает поля, которые пользователь тронул (по @blur).
 *
 * Сообщения локализуются в самом Zod-schema (t('forms.errors.url') и т.п.)
 * либо в месте вызова validate() через переопределение через ключи.
 *
 * errors / touched возвращаются как Ref (через toRef), чтобы в потребителях
 * корректно работал доступ вида errors.value.* и совпала типизация.
 */
import { reactive, toRef } from 'vue'
import type { ZodIssue, ZodTypeAny } from 'zod'

export function useFormValidation<T extends ZodTypeAny>(schema: T) {
  const state = reactive({
    errors: {} as Record<string, string>,
    touched: {} as Record<string, boolean>,
  })

  function issuePath(issue: ZodIssue): string {
    return issue.path.map(String).join('.')
  }

  function clearErrors() {
    for (const k of Object.keys(state.errors)) {
      Reflect.deleteProperty(state.errors, k)
    }
  }

  function validate(data: unknown): boolean {
    clearErrors()
    const result = schema.safeParse(data)
    if (result.success) return true

    for (const issue of result.error.issues) {
      const key = issuePath(issue) || '_root'
      if (!(key in state.errors)) state.errors[key] = issue.message
    }
    return false
  }

  /**
   * Валидация отдельного поля. Требует, чтобы schema был объектом
   * (z.object(...)). Использует partial-подход через pick.
   */
  function validateField(name: string, value: unknown): boolean {
    Reflect.deleteProperty(state.errors, name)
    state.touched[name] = true

    const zodSchema = schema as unknown as {
      pick?: (shape: Record<string, true>) => ZodTypeAny
      shape?: Record<string, ZodTypeAny>
    }

    if (typeof zodSchema.pick === 'function' && zodSchema.shape && name in zodSchema.shape) {
      const fieldSchema = zodSchema.pick({ [name]: true })
      const result = fieldSchema.safeParse({ [name]: value })
      if (!result.success) {
        const issue = result.error.issues[0]
        state.errors[name] = issue?.message ?? 'Invalid value'
        return false
      }
      return true
    }

    return true
  }

  function setServerErrors(fieldErrors: Record<string, string>) {
    clearErrors()
    for (const [k, v] of Object.entries(fieldErrors)) {
      state.errors[k] = v
      state.touched[k] = true
    }
  }

  function reset() {
    clearErrors()
    for (const k of Object.keys(state.touched)) {
      Reflect.deleteProperty(state.touched, k)
    }
  }

  function markTouched(name: string) {
    state.touched[name] = true
  }

  return {
    errors: toRef(state, 'errors'),
    touched: toRef(state, 'touched'),
    validate,
    validateField,
    setServerErrors,
    reset,
    markTouched,
  }
}
