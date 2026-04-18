import type { Ref } from 'vue'

export function useReducedMotion(): Ref<boolean> {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
