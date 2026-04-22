<template>
  <header
    class="glass sticky top-0 z-20 h-16 flex items-center gap-4 px-4 md:px-6 border-b border-[color:var(--border)]"
  >
    <!-- Mobile burger -->
    <Button
      :aria-label="t('a11y.actions.openMenu')"
      :title="t('a11y.actions.openMenu')"
      text
      severity="secondary"
      class="md:hidden"
      @click="$emit('toggleMobileNav')"
    >
      <template #icon>
        <Icon name="i-lucide-menu" />
      </template>
    </Button>

    <!-- Desktop sidebar toggle -->
    <Button
      :aria-label="t('a11y.actions.toggleSidebar')"
      :title="t('a11y.actions.toggleSidebar')"
      text
      severity="secondary"
      class="hidden md:flex"
      @click="$emit('toggleSidebar')"
    >
      <template #icon>
        <Icon name="i-lucide-panel-left" />
      </template>
    </Button>

    <!-- Breadcrumbs -->
    <nav class="hidden items-center gap-2 text-sm text-[color:var(--text-muted)] md:flex">
      <template
        v-for="(crumb, idx) in breadcrumbs"
        :key="crumb.to"
      >
        <NuxtLink
          :to="crumb.to"
          class="hover:text-[color:var(--text-primary)]"
        >
          {{ crumb.label }}
        </NuxtLink>
        <span v-if="idx < breadcrumbs.length - 1">/</span>
      </template>
    </nav>

    <div class="flex-1" />

    <!-- Search trigger -->
    <Button
      :aria-label="t('a11y.actions.openSearch')"
      :title="t('a11y.actions.openSearch')"
      text
      severity="secondary"
      class="hidden sm:flex text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
      data-testid="header-search-trigger"
      @click="globalSearch.open()"
    >
      <template #icon>
        <Icon name="i-lucide-search" />
      </template>
      <span class="mr-2 text-sm text-[color:var(--text-muted)]">{{ $t('common.search') }}</span>
      <span class="rounded border border-[color:var(--border)] px-1.5 py-0.5 text-xs">⌘K</span>
    </Button>

    <Button
      :aria-label="themeLabel"
      :title="themeLabel"
      text
      severity="secondary"
      class="text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)]"
      @click="toggleTheme"
    >
      <template #icon>
        <Icon :name="themeIcon" />
      </template>
    </Button>

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
