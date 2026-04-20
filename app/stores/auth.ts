import { defineStore } from 'pinia'
import type { User } from '~/shared/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!user.value)

  function setUser(newUser: User | null) {
    user.value = newUser
  }

  function clear() {
    user.value = null
  }

  return {
    user: readonly(user),
    isAuthenticated,
    setUser,
    clear,
  }
})
