<template>
  <div class="max-w-6xl space-y-8">
    <div class="space-y-2">
      <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
        Docs UI: Nuxt UI Showcase
      </h1>
      <p class="text-sm text-[color:var(--text-secondary)]">
        Витрина компонентной библиотеки для проверки вариантов, размеров и состояний.
      </p>
    </div>

    <UCard>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <UButton
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          variant="outline"
          color="neutral"
          class="justify-between"
          trailing-icon="i-lucide-arrow-right"
        >
          {{ link.label }}
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['docs-ui-enabled', 'admin-only'],
})

const links = [
  { to: '/docs-ui/buttons', label: 'Buttons' },
  { to: '/docs-ui/forms', label: 'Forms' },
  { to: '/docs-ui/feedback', label: 'Feedback' },
  { to: '/docs-ui/overlays', label: 'Overlays' },
  { to: '/docs-ui/navigation', label: 'Navigation' },
]
</script>
