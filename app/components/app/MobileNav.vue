<template>
  <USlideover v-model:open="isOpen" side="left" class="md:hidden">
    <template #header>
      <div class="flex items-center gap-3">
        <img src="/splat-logo.svg" alt="SPLAT" class="h-8" />
        <span class="font-semibold text-gray-900 dark:text-white">QR Service</span>
      </div>
    </template>

    <template #body>
      <nav class="space-y-1 p-2">
        <NuxtLink
          v-for="item in navItems"
          :key="item.route"
          :to="item.route"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors',
            isActive(item.route)
              ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
          ]"
          @click="isOpen = false"
        >
          <UIcon :name="item.icon" class="size-5" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- User info at bottom -->
      <div class="mt-auto border-t border-gray-200 dark:border-gray-800 p-4">
        <div class="flex items-center gap-3 mb-3">
          <UAvatar :text="initials" size="sm" />
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ user?.name || user?.email }}
            </p>
            <p class="text-xs text-gray-500 truncate">{{ user?.email }}</p>
          </div>
        </div>
        <UButton
          icon="i-lucide-log-out"
          label="Выйти"
          variant="outline"
          color="neutral"
          block
          @click="handleLogout"
        />
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>('open', { default: false })

const route = useRoute()
const { user, logout } = useAuth()
const { t } = useI18n()

const navItems = computed(() => [
  { label: t('nav.dashboard'), icon: 'i-lucide-layout-dashboard', route: '/dashboard' },
  { label: t('nav.qrCodes'), icon: 'i-lucide-qr-code', route: '/qr' },
  { label: t('nav.folders'), icon: 'i-lucide-folder', route: '/folders' },
  { label: t('nav.analytics'), icon: 'i-lucide-bar-chart-3', route: '/analytics' },
  { label: t('nav.settings'), icon: 'i-lucide-settings', route: '/settings' },
])

const initials = computed(() => {
  if (user.value?.name) {
    return user.value.name
      .split(' ')
      .map((s) => s[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return user.value?.email?.slice(0, 2).toUpperCase() || '??'
})

function isActive(path: string): boolean {
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(path)
}

async function handleLogout() {
  isOpen.value = false
  await logout()
}
</script>
