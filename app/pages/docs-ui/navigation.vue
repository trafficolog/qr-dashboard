<template>
  <div class="max-w-6xl space-y-6">
    <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
      Docs UI / Navigation
    </h1>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Section navigation
        </h2>
      </template>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :variant="item.active ? 'solid' : 'outline'"
          :color="item.active ? 'primary' : 'neutral'"
          size="sm"
        >
          {{ item.label }}
        </UButton>
        <UButton
          label="Disabled"
          size="sm"
          variant="outline"
          disabled
        />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Search + quick links
        </h2>
      </template>
      <div class="space-y-3">
        <UInput
          icon="i-lucide-search"
          placeholder="Search components"
        />
        <div class="flex flex-wrap gap-2">
          <UButton
            label="Buttons"
            variant="ghost"
            color="neutral"
            to="/docs-ui/buttons"
          />
          <UButton
            label="Forms"
            variant="ghost"
            color="neutral"
            to="/docs-ui/forms"
          />
          <UButton
            label="Feedback"
            variant="ghost"
            color="neutral"
            to="/docs-ui/feedback"
          />
          <UButton
            label="Overlays"
            variant="ghost"
            color="neutral"
            to="/docs-ui/overlays"
          />
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Pagination controls (button-based)
        </h2>
      </template>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          variant="outline"
          color="neutral"
          size="xs"
          disabled
        />
        <UButton
          label="1"
          size="xs"
        />
        <UButton
          label="2"
          size="xs"
          variant="outline"
          color="neutral"
        />
        <UButton
          label="3"
          size="xs"
          variant="outline"
          color="neutral"
        />
        <UButton
          icon="i-lucide-chevron-right"
          variant="outline"
          color="neutral"
          size="xs"
        />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['docs-ui-enabled', 'admin-only'],
})

const route = useRoute()

const navItems = computed(() => [
  { to: '/docs-ui/buttons', label: 'Buttons', active: route.path === '/docs-ui/buttons' },
  { to: '/docs-ui/forms', label: 'Forms', active: route.path === '/docs-ui/forms' },
  { to: '/docs-ui/feedback', label: 'Feedback', active: route.path === '/docs-ui/feedback' },
  { to: '/docs-ui/overlays', label: 'Overlays', active: route.path === '/docs-ui/overlays' },
  { to: '/docs-ui/navigation', label: 'Navigation', active: route.path === '/docs-ui/navigation' },
])
</script>
