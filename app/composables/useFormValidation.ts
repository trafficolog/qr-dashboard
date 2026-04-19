import type { ZodTypeAny } from 'zod'
import { ZodObject } from 'zod'

function toPathParts(path: string): string[] {
  return path.split('.').filter(Boolean)
}

function setByPath(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = toPathParts(path)
  if (parts.length === 0) return

  let cursor: Record<string, unknown> = target
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!
    const next = cursor[key]
    if (typeof next !== 'object' || next === null || Array.isArray(next)) {
      cursor[key] = {}
    }
    cursor = cursor[key] as Record<string, unknown>
  }

  const lastKey = parts[parts.length - 1]!
  cursor[lastKey] = value
}

function toErrorKey(issuePath: (string | number)[]): string {
  return issuePath.map(p => String(p)).join('.')
}

export function useFormValidation(schema: ZodTypeAny) {
  const errors = ref<Record<string, string>>({})
  const touched = ref<Record<string, boolean>>({})

  function clearFieldError(name: string) {
    if (!errors.value[name]) return
    errors.value = Object.fromEntries(
      Object.entries(errors.value).filter(([key]) => key !== name),
    )
  }

  function validate(data: unknown) {
    const result = schema.safeParse(data)
    const nextErrors: Record<string, string> = {}

    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = toErrorKey(issue.path)
        if (!key || nextErrors[key]) continue
        nextErrors[key] = issue.message
        touched.value[key] = true
      }
    }

    errors.value = nextErrors
    return result.success
  }

  function validateField(name: string, value: unknown) {
    touched.value[name] = true

    if (!(schema instanceof ZodObject)) {
      const result = schema.safeParse(value)
      if (result.success) clearFieldError(name)
      else errors.value[name] = result.error.issues[0]?.message || 'Invalid value'
      return result.success
    }

    const parts = toPathParts(name)
    const root = parts[0]
    if (!root) return true

    const fieldSchema = schema.pick({ [root]: true })
    const partialData: Record<string, unknown> = {}

    if (parts.length === 1) {
      partialData[root] = value
    }
    else {
      setByPath(partialData, name, value)
    }

    const result = fieldSchema.safeParse(partialData)
    if (result.success) {
      clearFieldError(name)
      return true
    }

    const pathWithoutRoot = parts.slice(1)
    const issue = result.error.issues.find((item) => {
      const issueParts = item.path.map(p => String(p))
      if (issueParts[0] !== root) return false
      const trimmed = issueParts.slice(1)
      return trimmed.join('.') === pathWithoutRoot.join('.')
    })

    errors.value[name] = issue?.message || result.error.issues[0]?.message || 'Invalid value'
    return false
  }

  function setServerErrors(fieldErrors: Record<string, string> | null | undefined) {
    if (!fieldErrors) return

    const nextErrors = { ...errors.value }
    for (const [field, message] of Object.entries(fieldErrors)) {
      nextErrors[field] = message
      touched.value[field] = true
    }
    errors.value = nextErrors
  }

  function reset() {
    errors.value = {}
    touched.value = {}
  }

  return {
    errors,
    touched,
    validate,
    validateField,
    setServerErrors,
    reset,
  }
}
