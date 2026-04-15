/**
 * useUnsavedChanges — защита от потери несохранённых изменений формы.
 *
 * Перехватывает:
 *  - Переход по vue-router (через onBeforeRouteLeave) — показывает UnsavedChangesDialog.
 *  - Закрытие вкладки / перезагрузку (beforeunload) — нативный browser prompt.
 *
 * Использование:
 * ```ts
 * const isDirty = computed(() => form.title !== '' || form.destinationUrl !== '')
 * const { showDialog, confirm, cancel } = useUnsavedChanges(isDirty)
 * ```
 */
import { ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import type { RouteLocationNormalized } from 'vue-router'
import { useEventListener } from '@vueuse/core'
import type { Ref, ComputedRef } from 'vue'

export function useUnsavedChanges(isDirty: Ref<boolean> | ComputedRef<boolean>) {
  const router = useRouter()
  const showDialog = ref(false)
  const pendingTo = ref<RouteLocationNormalized | null>(null)
  const bypass = ref(false)

  onBeforeRouteLeave((to) => {
    if (!isDirty.value || bypass.value) {
      return true
    }
    // Блокируем текущий переход и сохраняем целевой маршрут
    showDialog.value = true
    pendingTo.value = to
    return false
  })

  // Perform navigation — пользователь согласился уйти
  function confirm() {
    showDialog.value = false
    const to = pendingTo.value
    pendingTo.value = null
    bypass.value = true
    if (to) {
      router.push(to.fullPath)
    }
  }

  function cancel() {
    showDialog.value = false
    pendingTo.value = null
  }

  /**
   * Отмечаем форму как "сохранённую" — снимаем защиту на следующий переход.
   * Вызывать после успешного save(), до navigateTo().
   */
  function markClean() {
    bypass.value = true
  }

  // beforeunload: нативный prompt браузера при закрытии вкладки/перезагрузке
  if (typeof window !== 'undefined') {
    useEventListener('beforeunload', (event: BeforeUnloadEvent) => {
      if (isDirty.value && !bypass.value) {
        event.preventDefault()
        // Chrome требует returnValue, хоть он и игнорируется в тексте
        event.returnValue = ''
      }
    })
  }

  return {
    showDialog,
    pendingTo,
    confirm,
    cancel,
    markClean,
  }
}
