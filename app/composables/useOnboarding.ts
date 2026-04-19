const ONBOARDING_STORAGE_KEY = 'onboarding:completed'

export function useOnboarding() {
  const completed = useState<boolean>('onboarding-completed', () => false)

  if (import.meta.client) {
    const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (saved !== null) {
      completed.value = saved === 'true'
    }

    watch(completed, (value) => {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, String(value))
    })
  }

  const shouldShow = computed(() => !completed.value)

  function complete() {
    completed.value = true
  }

  function reset() {
    completed.value = false
  }

  return {
    completed,
    shouldShow,
    complete,
    reset,
  }
}
