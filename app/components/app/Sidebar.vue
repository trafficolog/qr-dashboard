<template>
  <aside
    :class="[
      'fixed top-0 left-0 z-30 flex h-screen flex-col border-r border-[color:var(--border)] bg-[color:var(--surface-0)] transition-all duration-200',
      collapsed ? 'w-16' : 'w-60',
    ]"
  >
    <!-- Logo -->
    <div class="flex h-16 shrink-0 items-center border-b border-[color:var(--border)] px-4">
      <img
        src="/splat-logo.svg"
        alt="SPLAT"
        class="h-8 w-8 shrink-0"
      >
      <Transition name="fade">
        <span
          v-if="!collapsed"
          class="ml-3 truncate text-sm font-semibold text-[color:var(--text-primary)]"
        >
          {{ $t('app.name') }}
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
          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive(item.route)
            ? 'bg-[color:var(--accent-light)] text-[color:var(--accent)]'
            : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)]',
        ]"
      >
        <UIcon
          :name="item.icon"
          class="size-5 shrink-0"
        />
        <Transition name="fade">
          <span
            v-if="!collapsed"
            class="truncate"
          >
            {{ item.label }}
          </span>
        </Transition>

        <!-- Tooltip when collapsed -->
        <div
          v-if="collapsed"
          class="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded bg-[color:var(--text-primary)] px-2 py-1 text-xs text-[color:var(--text-primary)] opacity-0 transition-opacity group-hover:opacity-100"
        >
          {{ item.label }}
        </div>
      </NuxtLink>
    </nav>

    <!-- Bottom -->
    <div class="shrink-0 border-t border-[color:var(--border)] p-2">
      <button
        :aria-label="collapsed ? t('a11y.actions.expandSidebar') : t('a11y.actions.collapseSidebar')"
        :title="collapsed ? t('a11y.actions.expandSidebar') : t('a11y.actions.collapseSidebar')"
        class="flex w-full items-center justify-center rounded-lg p-2 text-[color:var(--text-muted)] transition-colors hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)]"
        @click="$emit('toggle')"
      >
        <UIcon
          :name="collapsed ? 'i-lucide-chevrons-right' : 'i-lucide-chevrons-left'"
          class="size-5"
        />
      </button>
      <Transition name="fade">
        <p
          v-if="!collapsed"
          class="mt-1 text-center text-[10px] text-[color:var(--text-muted)]"
        >
          {{ $t('app.version') }}
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
  { label: t('nav.integrations'), icon: 'i-lucide-plug', route: '/integrations' },
  { label: t('nav.settings'), icon: 'i-lucide-settings', route: '/settings' },
])

function isActive(path: string): boolean {
  if (route.path === path) return true
  // Match only if the next character is '/' (prevents /qr matching /qrscan)
  return route.path.startsWith(path + '/')
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
