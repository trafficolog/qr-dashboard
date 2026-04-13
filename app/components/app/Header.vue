<template>
  <header
    class="glass sticky top-0 z-20 h-16 flex items-center gap-4 px-4 md:px-6 border-b border-[color:var(--border)]"
  >
    <!-- Mobile burger -->
    <UButton
      icon="i-lucide-menu"
      variant="ghost"
      color="neutral"
      class="md:hidden"
      @click="$emit('toggleMobileNav')"
    />

    <!-- Desktop sidebar toggle -->
    <UButton
      icon="i-lucide-panel-left"
      variant="ghost"
      color="neutral"
      class="hidden md:flex"
      @click="$emit('toggleSidebar')"
    />

    <!-- Breadcrumbs -->
    <UBreadcrumb
      :items="breadcrumbs"
      class="hidden md:flex"
    />

    <div class="flex-1" />

    <!-- Search trigger -->
    <UButton
      icon="i-lucide-search"
      variant="ghost"
      color="neutral"
      class="hidden sm:flex text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
      @click="searchOpen = true"
    >
      <span class="mr-2 text-sm text-[color:var(--text-muted)]">{{ $t('common.search') }}</span>
      <UKbd>⌘K</UKbd>
    </UButton>

    <UButton
      :icon="themeIcon"
      :aria-label="themeLabel"
      :title="themeLabel"
      variant="ghost"
      color="neutral"
      class="text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)]"
      @click="toggleTheme"
    />

    <!-- User menu -->
    <AppUserMenu />

    <!-- Search modal (placeholder) -->
    <UModal v-model:open="searchOpen">
      <template #content>
        <div class="p-4">
          <UInput
            :placeholder="$t('common.search')"
            icon="i-lucide-search"
            size="lg"
            autofocus
          />
          <p class="mt-4 text-center text-sm text-[color:var(--text-muted)]">
            Начните вводить для поиска QR-кодов...
          </p>
        </div>
      </template>
    </UModal>
  </header>
</template>

<script setup lang="ts">
defineEmits<{
  toggleSidebar: []
  toggleMobileNav: []
}>()

const route = useRoute()
const searchOpen = ref(false)
const colorMode = useColorMode()

// Cmd+K shortcut
const magicKeys = useMagicKeys()
whenever(
  () => Boolean(magicKeys.meta?.value && magicKeys.k?.value),
  () => {
    searchOpen.value = true
  },
)

const themeIcon = computed(() =>
  colorMode.value === 'dark'
    ? 'i-lucide-sun'
    : 'i-lucide-moon',
)

const themeLabel = computed(() =>
  colorMode.value === 'dark'
    ? 'Включить светлую тему'
    : 'Включить тёмную тему',
)

const breadcrumbLabels: Record<string, string> = {
  dashboard: 'Дашборд',
  qr: 'QR-коды',
  create: 'Создание',
  edit: 'Редактирование',
  folders: 'Папки',
  analytics: 'Аналитика',
  settings: 'Настройки',
  team: 'Команда',
  domains: 'Домены',
}

const breadcrumbs = computed(() => {
  const segments = route.path.split('/').filter(Boolean)

  return segments.map((segment, idx) => ({
    label: breadcrumbLabels[segment] || segment,
    to: '/' + segments.slice(0, idx + 1).join('/'),
  }))
})

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>
