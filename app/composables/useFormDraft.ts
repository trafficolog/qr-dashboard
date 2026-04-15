/**
 * useFormDraft — автосохранение черновика формы в localStorage с debounce.
 *
 * Использование:
 * ```ts
 * const form = reactive({ title: '', destinationUrl: '' })
 * const { hasDraft, draftSavedAt, restore, discard, clear } = useFormDraft(
 *   'qr-create:' + userId,
 *   form,
 *   { debounceMs: 1000, exclude: ['style'] }
 * )
 * ```
 *
 * Поведение:
 *  - При монтировании проверяет наличие черновика в localStorage.
 *  - Если черновик есть и не пустой — hasDraft = true (пользователь решает restore/discard).
 *  - При изменении state запускает debounced save().
 *  - clear() вызывается после успешной отправки формы.
 */
import { ref, watch, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'

interface DraftEnvelope<T> {
  savedAt: string
  data: Partial<T>
}

interface UseFormDraftOptions<T> {
  debounceMs?: number
  /**
   * Ключи, которые не сохранять в черновик (например, большие объекты style).
   */
  exclude?: (keyof T)[]
}

export function useFormDraft<T extends Record<string, unknown>>(
  key: string,
  state: T,
  opts: UseFormDraftOptions<T> = {},
) {
  const debounceMs = opts.debounceMs ?? 1000
  const exclude = new Set(opts.exclude ?? [])
  const storageKey = `draft:${key}`

  const hasDraft = ref(false)
  const draftSavedAt = ref<string | null>(null)

  function pickSerializable(): Partial<T> {
    const out: Partial<T> = {}
    for (const k of Object.keys(state) as (keyof T)[]) {
      if (exclude.has(k)) continue
      out[k] = state[k]
    }
    return out
  }

  function isEmpty(data: Partial<T>): boolean {
    for (const v of Object.values(data)) {
      if (v === null || v === undefined) continue
      if (typeof v === 'string' && v.trim() === '') continue
      if (Array.isArray(v) && v.length === 0) continue
      if (typeof v === 'object' && Object.keys(v as object).length === 0) continue
      return false
    }
    return true
  }

  const save = useDebounceFn(() => {
    if (typeof window === 'undefined') return
    const data = pickSerializable()
    if (isEmpty(data)) {
      // Не сохраняем совсем пустые формы
      return
    }
    const envelope: DraftEnvelope<T> = {
      savedAt: new Date().toISOString(),
      data,
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(envelope))
      draftSavedAt.value = envelope.savedAt
    }
    catch {
      // QuotaExceeded или приватный режим — игнорируем
    }
  }, debounceMs)

  function load(): DraftEnvelope<T> | null {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return null
      return JSON.parse(raw) as DraftEnvelope<T>
    }
    catch {
      return null
    }
  }

  function restore() {
    const envelope = load()
    if (!envelope) return
    for (const k of Object.keys(envelope.data) as (keyof T)[]) {
      const value = envelope.data[k]
      if (value === undefined) continue
      ;(state as Record<string, unknown>)[k as string] = value
    }
    hasDraft.value = false
  }

  function discard() {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(storageKey)
    }
    catch {
      // ignore
    }
    hasDraft.value = false
    draftSavedAt.value = null
  }

  /**
   * Очистить черновик без установки hasDraft — после успешного save формы.
   */
  function clear() {
    discard()
  }

  // Отслеживаем изменения формы
  watch(state, () => save(), { deep: true })

  onMounted(() => {
    const envelope = load()
    if (envelope && !isEmpty(envelope.data)) {
      hasDraft.value = true
      draftSavedAt.value = envelope.savedAt
    }
  })

  return {
    hasDraft,
    draftSavedAt,
    restore,
    discard,
    clear,
  }
}
