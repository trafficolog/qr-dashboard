<template>
  <header
    class="glass sticky top-0 z-20 h-16 flex items-center gap-4 px-4 md:px-6 border-b border-[color:var(--border)]"
  >
    <!-- Mobile burger -->
    <UButton
      icon="i-lucide-menu"
      :aria-label="t('a11y.actions.openMenu')"
      :title="t('a11y.actions.openMenu')"
      variant="ghost"
      color="neutral"
      class="md:hidden"
      @click="$emit('toggleMobileNav')"
    />

    <!-- Desktop sidebar toggle -->
    <UButton
      icon="i-lucide-panel-left"
      :aria-label="t('a11y.actions.toggleSidebar')"
      :title="t('a11y.actions.toggleSidebar')"
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
      :aria-label="t('a11y.actions.openSearch')"
      :title="t('a11y.actions.openSearch')"
      variant="ghost"
      class="hidden sm:flex text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
      data-testid="header-search-trigger"
      @click="globalSearch.open()"
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

    <!-- Global Search modal -->
    <AppGlobalSearch />
  </header>
</template>

<script setup lang="ts">
import { useMagicKeys, whenever } from '@vueuse/core'
import { useGlobalSearch } from '~/composables/useGlobalSearch'

defineEmits<{
  toggleSidebar: []
  toggleMobileNav: []
}>()

const route = useRoute()
const { t } = useI18n()
const colorMode = useColorMode()
const globalSearch = useGlobalSearch()

// Cmd+K / Ctrl+K shortcut
const magicKeys = useMagicKeys()
whenever(
  () => Boolean((magicKeys.meta?.value || magicKeys.ctrl?.value) && magicKeys.k?.value),
  () => {
    globalSearch.open()
  },
)

const themeIcon = computed(() =>
  colorMode.value === 'dark'
    ? 'i-lucide-sun'
    : 'i-lucide-moon',
)

const themeLabel = computed(() =>
  colorMode.value === 'dark'
    ? t('common.lightTheme')
    : t('common.darkTheme'),
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
  general: 'Общие',
  profile: 'Профиль',
  integrations: 'Интеграции',
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
