export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, authResolved, fetchUser } = useAuth()
  const isAuthPage = to.path.startsWith('/auth')

  // Для неизвестных маршрутов отдаём управление Nuxt error.vue,
  // чтобы показывать универсальную 404-страницу вместо redirect на login.
  if (to.matched.length === 0) {
    return
  }

  // На SSR и при первом клиентском заходе синхронизируем auth-state,
  // чтобы избежать мигания auth-страниц и рассинхрона после logout/login.
  if (typeof window === 'undefined' || !authResolved.value) {
    await fetchUser()
  }

  // Неавторизованный → перенаправляем на login
  if (!isAuthenticated.value && !isAuthPage) {
    return navigateTo('/auth/login')
  }

  // Авторизованный → не пускаем на auth-страницы
  if (isAuthenticated.value && isAuthPage) {
    return navigateTo('/dashboard')
  }
})
