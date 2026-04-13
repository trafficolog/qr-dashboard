import type { User } from '~~/types/auth'

interface AuthLoginResponse {
  data: {
    success: boolean
    expiresIn: number
  }
}

interface AuthVerifyResponse {
  data: {
    user: User
  }
}

export function useAuth() {
  const user = useState<User | null>('auth-user', () => null)
  const authResolved = useState<boolean>('auth-resolved', () => false)
  const authStore = useAuthStore()
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function fetchUser() {
    try {
      const headers = typeof window === 'undefined'
        ? useRequestHeaders(['cookie'])
        : undefined

      const response = await $fetch<{ data: User }>('/api/auth/me', { headers })
      user.value = response.data
      authStore.setUser(response.data)
    }
    catch {
      user.value = null
      authStore.clear()
    }
    finally {
      authResolved.value = true
    }
  }

  async function login(email: string) {
    return await $fetch<AuthLoginResponse>(
      '/api/auth/login',
      {
        method: 'POST',
        body: { email },
      },
    )
  }

  async function verify(email: string, code: string) {
    const response = await $fetch<AuthVerifyResponse>(
      '/api/auth/verify',
      {
        method: 'POST',
        body: { email, code },
      },
    )
    user.value = response.data.user
    authStore.setUser(response.data.user)
    authResolved.value = true
    return response
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    }
    finally {
      user.value = null
      authStore.clear()
      authResolved.value = true
      await navigateTo('/auth/login')
    }
  }

  return {
    user: readonly(user),
    isAuthenticated,
    isAdmin,
    authResolved: readonly(authResolved),
    fetchUser,
    login,
    verify,
    logout,
  }
}
