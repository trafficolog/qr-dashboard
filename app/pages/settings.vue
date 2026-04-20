<template>
  <div class="flex gap-8">
    <!-- Sidebar navigation (md+) -->
    <aside
      class="hidden md:flex flex-col shrink-0 w-60"
      role="navigation"
      :aria-label="$t('settings.nav.label')"
    >
      <!-- Settings search -->
      <UInput
        ref="settingsInputRef"
        v-model="settingsQuery"
        :placeholder="$t('settings.nav.searchPlaceholder')"
        icon="i-lucide-search"
        size="sm"
        class="mb-4"
      />

      <nav class="space-y-0.5">
        <NuxtLink
          v-for="item in filteredNavItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-interactive',
            isSettingsActive(item.to)
              ? 'bg-[color:var(--accent-light)] text-[color:var(--accent)]'
              : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)] hover-accent',
          ]"
          :data-testid="`settings-nav-${item.key}`"
        >
          <UIcon
            :name="item.icon"
            class="size-4 shrink-0"
          />
          {{ item.label }}
        </NuxtLink>

        <div
          v-if="filteredNavItems.length === 0"
          class="px-3 py-2 text-sm text-[color:var(--text-muted)]"
        >
          {{ $t('settings.nav.noResults') }}
        </div>
      </nav>
    </aside>

    <!-- Mobile tabs -->
    <div class="md:hidden w-full">
      <div class="flex overflow-x-auto gap-1 border-b border-[color:var(--border)] pb-1 mb-4">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'shrink-0 flex items-center gap-2 px-3 py-2 text-sm font-medium transition-interactive',
            isSettingsActive(item.to)
              ? 'border-b-2 border-[color:var(--accent)] text-[color:var(--accent)]'
              : 'text-[color:var(--text-secondary)] hover-accent',
          ]"
        >
          <UIcon
            :name="item.icon"
            class="size-4"
          />
          <span class="hidden sm:block">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Page content -->
    <div class="flex-1 min-w-0">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const route = useRoute()
const { t } = useI18n()
const { user } = useAuth()
const isAdmin = computed(() => user.value?.role === 'admin')

const settingsQuery = ref('')
const settingsInputRef = ref<{ input?: HTMLInputElement } | null>(null)

interface NavItem {
  key: string
  label: string
  icon: string
  to: string
  adminOnly?: boolean
}

const navItems = computed<NavItem[]>(() => [
  { key: 'general', label: t('settings.tabs.general'), icon: 'i-lucide-sliders', to: '/settings/general' },
  { key: 'profile', label: t('settings.tabs.profile'), icon: 'i-lucide-user', to: '/settings/profile' },
  ...(isAdmin.value
    ? [
        { key: 'team', label: t('settings.tabs.team'), icon: 'i-lucide-users', to: '/settings/team', adminOnly: true },
        { key: 'domains', label: t('settings.tabs.domains'), icon: 'i-lucide-globe', to: '/settings/domains', adminOnly: true },
        { key: 'departments', label: t('settings.tabs.departments'), icon: 'i-lucide-building-2', to: '/settings/departments', adminOnly: true },
        { key: 'audit', label: t('settings.tabs.audit'), icon: 'i-lucide-scroll-text', to: '/settings/audit', adminOnly: true },
        { key: 'integrations', label: t('settings.tabs.integrations'), icon: 'i-lucide-plug', to: '/settings/integrations', adminOnly: true },
      ]
    : []),
])

const filteredNavItems = computed(() => {
  const q = settingsQuery.value.trim().toLowerCase()
  if (!q) return navItems.value
  return navItems.value.filter(item => item.label.toLowerCase().includes(q))
})

function isSettingsActive(to: string): boolean {
  if (route.path === to) return true
  return route.path.startsWith(to + '/')
}
</script>
