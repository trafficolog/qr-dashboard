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
</script>
