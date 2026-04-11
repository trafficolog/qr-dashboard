import type { User } from '~/types/auth'

export function useAuth() {
  const user = useState<User | null>('auth-user', () => null)
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function fetchUser() {
    try {
      const response = await $fetch<{ data: User }>('/api/auth/me')
      user.value = response.data
    } catch {
      user.value = null
    }
  }

  async function login(email: string) {
    return await $fetch<{ data: { success: boolean; expiresIn: number } }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: { email },
      },
    )
  }

  async function verify(email: string, code: string) {
    const response = await $fetch<{ data: { user: User } }>(
      '/api/auth/verify',
      {
        method: 'POST',
        body: { email, code },
      },
    )
    user.value = response.data.user
    return response
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      user.value = null
      await navigateTo('/auth/login')
    }
  }

  return {
    user: readonly(user),
    isAuthenticated,
    isAdmin,
    fetchUser,
    login,
    verify,
    logout,
  }
}
