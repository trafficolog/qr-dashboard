<template>
  <div>
    <Button
      text
      class="layout-user-menu-trigger"
      :aria-label="t('a11y.actions.openUserMenu')"
      :title="t('a11y.actions.openUserMenu')"
      @click="toggle"
    >
      <span class="layout-user-avatar">{{ initials }}</span>
      <span class="hidden text-sm font-medium text-[color:var(--text-primary)] lg:block">{{ displayName }}</span>
      <Icon
        name="i-lucide-chevron-down"
        class="hidden size-4 text-[color:var(--text-muted)] lg:block"
      />
    </Button>

    <Menu
      ref="menuRef"
      :model="menuItems"
      popup
      class="min-w-52"
    >
      <template #start>
        <div class="px-3 py-2 text-xs text-[color:var(--text-muted)]">
          {{ user?.email || '' }}
        </div>
      </template>
      <template #item="slotProps">
        <NuxtLink
          v-if="slotProps.item.to"
          :to="slotProps.item.to"
          class="flex items-center gap-2 px-3 py-2 text-sm"
        >
          <Icon
            :name="slotProps.item.icon"
            class="size-4"
          />
          <span>{{ slotProps.item.label }}</span>
        </NuxtLink>
        <button
          v-else
          class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
          @click="slotProps.item.command?.()"
        >
          <Icon
            :name="slotProps.item.icon"
            class="size-4"
          />
          <span>{{ slotProps.item.label }}</span>
        </button>
      </template>
    </Menu>
  </div>
</template>

<script setup lang="ts">
import type Menu from 'primevue/menu'

const { user, logout } = useAuth()
const { t } = useI18n()
const menuRef = ref<InstanceType<typeof Menu> | null>(null)

function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const displayName = computed(() => {
  if (user.value?.name) return user.value.name
  if (user.value?.email) return user.value.email.split('@')[0]
  return ''
})

const initials = computed(() => {
  if (user.value?.name) {
    return getInitials(user.value.name)
  }

  return user.value?.email?.slice(0, 2).toUpperCase() || '??'
})

const menuItems = computed(() => [
  {
    label: 'Настройки',
    icon: 'i-lucide-settings',
    to: '/settings/general',
  },
  {
    label: 'Выйти',
    icon: 'i-lucide-log-out',
    command: async () => await logout(),
  },
])

function toggle(event: Event) {
  menuRef.value?.toggle(event)
}
</script>

<style scoped>
.layout-user-menu-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.layout-user-avatar {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  background: color-mix(in oklab, var(--p-primary-500) 14%, transparent);
  color: var(--p-primary-700);
}
</style>
