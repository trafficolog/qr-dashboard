import type { Ref } from 'vue'
import { useMediaQuery } from '@vueuse/core'

export function useReducedMotion(): Ref<boolean> {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
