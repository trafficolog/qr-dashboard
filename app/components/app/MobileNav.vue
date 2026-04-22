<template>
  <Drawer
    v-model:visible="isOpen"
    position="left"
    class="md:hidden"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <img
          src="/splat-logo.svg"
          alt="SPLAT"
          class="h-8"
        >
        <span class="font-semibold text-[color:var(--text-primary)]">QR Service</span>
      </div>
    </template>

    <div class="flex h-full flex-col">
      <nav class="space-y-1 p-2">
        <NuxtLink
          v-for="item in navItems"
          :key="item.route"
          :to="item.route"
          :class="[
            'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-interactive',
            isActive(item.route)
              ? 'bg-[color:var(--accent-light)] text-[color:var(--accent)]'
              : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)]',
          ]"
          @click="isOpen = false"
        >
          <Icon
            :name="item.icon"
            class="size-5"
          />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="mt-auto border-t border-[color:var(--border)] p-4">
        <div class="mb-3 flex items-center gap-3">
          <Avatar
            :label="initials"
            shape="circle"
          />
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-[color:var(--text-primary)]">
              {{ user?.name || user?.email }}
            </p>
            <p class="truncate text-xs text-[color:var(--text-muted)]">
              {{ user?.email }}
            </p>
          </div>
        </div>
        <Button
          outlined
          severity="secondary"
          class="w-full"
          @click="handleLogout"
        >
          <template #icon>
            <Icon name="i-lucide-log-out" />
          </template>
          Выйти
        </Button>
      </div>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { isActiveRoute } from '~/utils/navigation/isActiveRoute'

const isOpen = defineModel<boolean>('open', { default: false })

const route = useRoute()
const { user, logout } = useAuth()
const { t } = useI18n()

function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const navItems = computed(() => [
  { label: t('nav.dashboard'), icon: 'i-lucide-layout-dashboard', route: '/dashboard' },
  { label: t('nav.qrCodes'), icon: 'i-lucide-qr-code', route: '/qr' },
  { label: t('nav.sharedQr'), icon: 'i-lucide-globe', route: '/qr/shared' },
  { label: t('nav.folders'), icon: 'i-lucide-folder', route: '/folders' },
  { label: t('nav.analytics'), icon: 'i-lucide-bar-chart-3', route: '/analytics' },
  { label: t('nav.settings'), icon: 'i-lucide-settings', route: '/settings/general' },
])

const initials = computed(() => {
  if (user.value?.name) {
    return getInitials(user.value.name)
  }

  return user.value?.email?.slice(0, 2).toUpperCase() || '??'
})

function isActive(path: string): boolean {
  return isActiveRoute(route.path, path)
}

async function handleLogout() {
  isOpen.value = false
  await logout()
}
</script>
