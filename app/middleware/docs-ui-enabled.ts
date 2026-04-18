export default defineNuxtRouteMiddleware(() => {
  const config = useRuntimeConfig()

  if (!config.public.docsUiEnabled) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }
})
