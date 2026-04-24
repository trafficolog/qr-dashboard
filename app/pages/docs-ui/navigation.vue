<template>
  <div class="max-w-6xl space-y-6">
    <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
      Docs UI / Navigation
    </h1>

    <section class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
      <h2 class="mb-3 font-semibold">
        Section navigation
      </h2>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
        >
          <Button
            :severity="item.active ? 'primary' : 'secondary'"
            :outlined="!item.active"
            size="small"
          >
            {{ item.label }}
          </Button>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['docs-ui-enabled', 'admin-only'] })
const route = useRoute()
const navItems = computed(() => [
  { to: '/docs-ui/buttons', label: 'Buttons', active: route.path === '/docs-ui/buttons' },
  { to: '/docs-ui/forms', label: 'Forms', active: route.path === '/docs-ui/forms' },
  { to: '/docs-ui/feedback', label: 'Feedback', active: route.path === '/docs-ui/feedback' },
  { to: '/docs-ui/overlays', label: 'Overlays', active: route.path === '/docs-ui/overlays' },
  { to: '/docs-ui/navigation', label: 'Navigation', active: route.path === '/docs-ui/navigation' },
])
</script>
