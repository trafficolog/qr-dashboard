<template>
  <NuxtLoadingIndicator
    color="var(--p-primary-500)"
    :height="2"
  />
  <div
    role="status"
    :aria-live="priority"
    aria-atomic="true"
    class="sr-only"
  >
    {{ message }}
  </div>

  <Toast
    position="bottom-right"
    group="app"
  />
  <ConfirmDialog group="app" />

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { message, priority } = useA11yAnnouncer()
const { appName, fullTitle, pageDescription, locale } = usePageMetadata()

useHead(() => ({
  htmlAttrs: {
    lang: locale.value,
  },
  title: fullTitle.value,
  meta: [
    { name: 'application-name', content: appName.value },
    { name: 'description', content: pageDescription.value },
    { name: 'robots', content: 'noindex,nofollow,noarchive' },
    { name: 'theme-color', content: '#ba0c2f' },
    { property: 'og:site_name', content: appName.value },
    { property: 'og:title', content: fullTitle.value },
    { property: 'og:description', content: pageDescription.value },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: fullTitle.value },
    { name: 'twitter:description', content: pageDescription.value },
  ],
}))
</script>
