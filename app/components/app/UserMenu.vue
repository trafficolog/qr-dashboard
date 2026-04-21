<template>
  <UDropdownMenu :items="menuItems">
    <UButton
      :aria-label="t('a11y.actions.openUserMenu')"
      :title="t('a11y.actions.openUserMenu')"
      variant="ghost"
      color="neutral"
      class="gap-2 text-[color:var(--text-secondary)] transition-interactive hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)]"
    >
      <UAvatar
        :alt="user?.name || user?.email || t('a11y.labels.userAvatar')"
        :text="initials"
        size="sm"
      />
      <span class="hidden text-sm font-medium text-[color:var(--text-primary)] lg:block">
        {{ displayName }}
      </span>
      <UIcon
        name="i-lucide-chevron-down"
        class="hidden size-4 text-[color:var(--text-muted)] lg:block"
      />
    </UButton>
  </UDropdownMenu>
</template>

<script setup lang="ts">
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
  [
    {
      label: user.value?.email || '',
      type: 'label' as const,
      disabled: true,
    },
  ],
  [
    {
      label: 'Настройки',
      icon: 'i-lucide-settings',
      to: '/settings/general',
    },
  ],
  [
    {
      label: 'Выйти',
      icon: 'i-lucide-log-out',
      onSelect: async () => await logout(),
    },
  ],
])
</script>
