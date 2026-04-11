export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, fetchUser } = useAuth()

  // Загружаем user если ещё не загружен (первый визит / SSR hydration)
  if (!isAuthenticated.value) {
    await fetchUser()
  }

  const isAuthPage = to.path.startsWith('/auth')

  // Неавторизованный → перенаправляем на login
  if (!isAuthenticated.value && !isAuthPage) {
    return navigateTo('/auth/login')
  }

  // Авторизованный → не пускаем на auth-страницы
  if (isAuthenticated.value && isAuthPage) {
    return navigateTo('/dashboard')
  }
})
