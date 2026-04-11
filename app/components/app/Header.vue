<template>
  <header
    class="sticky top-0 z-20 h-16 flex items-center gap-4 px-4 md:px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800"
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
    <UBreadcrumb :items="breadcrumbs" class="hidden md:flex" />

    <div class="flex-1" />

    <!-- Search trigger -->
    <UButton
      icon="i-lucide-search"
      variant="ghost"
      color="neutral"
      class="hidden sm:flex text-gray-400"
      @click="searchOpen = true"
    >
      <span class="text-sm text-gray-400 mr-2">{{ $t('common.search') }}</span>
      <UKbd>⌘K</UKbd>
    </UButton>

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
          <p class="text-sm text-gray-400 mt-4 text-center">
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
const { t } = useI18n()
const searchOpen = ref(false)

// Cmd+K shortcut
const { meta, k } = useMagicKeys()
whenever(
  () => meta.value && k.value,
  () => {
    searchOpen.value = true
  },
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
</script>
