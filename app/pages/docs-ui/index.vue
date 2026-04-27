<template>
  <div class="max-w-6xl space-y-8">
    <div class="space-y-2">
      <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
        Docs UI: PrimeVue Showcase
      </h1>
      <p class="text-sm text-[color:var(--text-secondary)]">
        Витрина компонентной библиотеки для проверки вариантов, размеров и состояний.
      </p>
    </div>

    <div class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
        >
          <Button
            outlined
            severity="secondary"
            class="w-full justify-between"
          >
            {{ link.label }}
            <template #icon>
              <Icon name="i-lucide-arrow-right" />
            </template>
          </Button>
        </NuxtLink>
      </div>
    </div>
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
