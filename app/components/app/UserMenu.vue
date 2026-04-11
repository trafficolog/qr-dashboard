<template>
  <UDropdownMenu :items="menuItems">
    <UButton variant="ghost" color="neutral" class="gap-2">
      <UAvatar :text="initials" size="sm" />
      <span class="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ displayName }}
      </span>
      <UIcon name="i-lucide-chevron-down" class="size-4 text-gray-400 hidden lg:block" />
    </UButton>
  </UDropdownMenu>
</template>

<script setup lang="ts">
const { user, logout } = useAuth()

const displayName = computed(() => {
  if (user.value?.name) return user.value.name
  if (user.value?.email) return user.value.email.split('@')[0]
  return ''
})

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

const roleBadge = computed(() => {
  const roles: Record<string, string> = {
    admin: 'Администратор',
    editor: 'Редактор',
    viewer: 'Наблюдатель',
  }
  return roles[user.value?.role || ''] || ''
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
      to: '/settings',
    },
  ],
  [
    {
      label: 'Выйти',
      icon: 'i-lucide-log-out',
      click: () => logout(),
    },
  ],
])
</script>
