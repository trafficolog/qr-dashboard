<template>
  <aside
    :class="[
      'fixed top-0 left-0 h-screen flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-200 z-30',
      collapsed ? 'w-16' : 'w-60',
    ]"
  >
    <!-- Logo -->
    <div class="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
      <img src="/splat-logo.svg" alt="SPLAT" class="h-8 w-8 shrink-0" />
      <Transition name="fade">
        <span
          v-if="!collapsed"
          class="ml-3 font-semibold text-gray-900 dark:text-white truncate text-sm"
        >
          QR Service
        </span>
      </Transition>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
      <NuxtLink
        v-for="item in navItems"
        :key="item.route"
        :to="item.route"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative',
          isActive(item.route)
            ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
        ]"
      >
        <UIcon :name="item.icon" class="size-5 shrink-0" />
        <Transition name="fade">
          <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
        </Transition>

        <!-- Tooltip when collapsed -->
        <div
          v-if="collapsed"
          class="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50"
        >
          {{ item.label }}
        </div>
      </NuxtLink>
    </nav>

    <!-- Bottom -->
    <div class="border-t border-gray-200 dark:border-gray-800 p-2 shrink-0">
      <button
        class="flex items-center justify-center w-full p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        @click="$emit('toggle')"
      >
        <UIcon
          :name="collapsed ? 'i-lucide-chevrons-right' : 'i-lucide-chevrons-left'"
          class="size-5"
        />
      </button>
      <Transition name="fade">
        <p v-if="!collapsed" class="text-[10px] text-gray-400 text-center mt-1">
          v0.1.0
        </p>
      </Transition>
    </div>
  </aside>
</template>

<script setup lang="ts">
defineProps<{
  collapsed: boolean
}>()

defineEmits<{
  toggle: []
}>()

const route = useRoute()
const { t } = useI18n()

const navItems = computed(() => [
  { label: t('nav.dashboard'), icon: 'i-lucide-layout-dashboard', route: '/dashboard' },
  { label: t('nav.qrCodes'), icon: 'i-lucide-qr-code', route: '/qr' },
  { label: t('nav.folders'), icon: 'i-lucide-folder', route: '/folders' },
  { label: t('nav.analytics'), icon: 'i-lucide-bar-chart-3', route: '/analytics' },
  { label: t('nav.settings'), icon: 'i-lucide-settings', route: '/settings' },
])

function isActive(path: string): boolean {
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(path)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
