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
    csrfToken: string
  }
}

interface AuthMeResponse {
  data: User & {
    csrfToken: string
  }
}

export function useAuth() {
  const user = useState<User | null>('auth-user', () => null)
  const csrfToken = useState<string | null>('auth-csrf-token', () => null)
  const authResolved = useState<boolean>('auth-resolved', () => false)
  const authStore = useAuthStore()
  const runtimeConfig = useRuntimeConfig()
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const csrfHeaderName = runtimeConfig.public.csrfHeaderName

  function withCsrfHeaders(initHeaders?: HeadersInit): HeadersInit {
    const headers = new Headers(initHeaders)
    if (csrfToken.value) {
      headers.set(csrfHeaderName, csrfToken.value)
    }
    return headers
  }

  async function fetchUser() {
    try {
      const headers = typeof window === 'undefined'
        ? useRequestHeaders(['cookie'])
        : undefined

      const response = await $fetch<AuthMeResponse>('/api/auth/me', { headers })
      const { csrfToken: nextCsrfToken, ...nextUser } = response.data
      user.value = nextUser
      csrfToken.value = nextCsrfToken
      authStore.setUser(nextUser)
    }
    catch {
      user.value = null
      csrfToken.value = null
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
        headers: withCsrfHeaders(),
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
    csrfToken.value = response.data.csrfToken
    authStore.setUser(response.data.user)
    authResolved.value = true
    return response
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST', headers: withCsrfHeaders() })
    }
    finally {
      user.value = null
      csrfToken.value = null
      authStore.clear()
      authResolved.value = true
      await navigateTo('/auth/login')
    }
  }

  return {
    user: readonly(user),
    csrfToken: readonly(csrfToken),
    isAuthenticated,
    isAdmin,
    authResolved: readonly(authResolved),
    fetchUser,
    login,
    verify,
    logout,
  }
}
