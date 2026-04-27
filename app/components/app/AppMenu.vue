<template>
  <aside class="layout-sidebar">
    <div class="layout-sidebar-logo">
      <img
        src="/splat-logo.svg"
        alt="SPLAT"
      >
      <span>{{ $t('app.name') }}</span>
    </div>

    <nav class="layout-menu-container">
      <div
        v-for="group in model"
        :key="group.label"
        class="layout-menu-group"
      >
        <p class="layout-menu-group-label">
          {{ group.label }}
        </p>
        <ul class="layout-menu-list">
          <AppMenuItem
            v-for="item in group.items"
            :key="item.to"
            :item="item"
            @item-click="layout.onMenuItemClick"
          />
        </ul>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
interface MenuItem {
  label: string
  icon: string
  to: string
  badge?: number
}

const { t } = useI18n()
const layout = useLayout()
const authStore = useAuthStore()
const { unreadCount } = useNotifications()

const qrCount = useState<number>('layout:qr-count', () => 0)
const foldersCount = useState<number>('layout:folders-count', () => 0)

const model = computed(() => {
  const sections: Array<{ key: string, label: string, items: MenuItem[] }> = [
    {
      key: 'workspace',
      label: t('nav.workspace'),
      items: [
        { label: t('nav.dashboard'), icon: 'i-lucide-layout-dashboard', to: '/dashboard' },
        { label: t('nav.qrCodes'), icon: 'i-lucide-qr-code', to: '/qr', badge: qrCount.value || undefined },
        { label: t('nav.folders'), icon: 'i-lucide-folder', to: '/folders', badge: foldersCount.value || undefined },
        { label: t('nav.sharedQr'), icon: 'i-lucide-globe', to: '/qr/shared' },
        { label: t('nav.analytics'), icon: 'i-lucide-chart-column', to: '/analytics' },
      ],
    },
    {
      key: 'integrations',
      label: t('nav.integrationsSection'),
      items: [
        { label: t('nav.integrations'), icon: 'i-lucide-plug', to: '/integrations' },
        { label: t('nav.apiDocs'), icon: 'i-lucide-book-open', to: '/api-docs' },
      ],
    },
    {
      key: 'admin',
      label: t('nav.admin'),
      items: [
        { label: t('nav.settings'), icon: 'i-lucide-settings', to: '/settings' },
        { label: t('nav.notifications'), icon: 'i-lucide-bell', to: '/notifications', badge: unreadCount.value || undefined },
      ],
    },
  ]

  if (authStore.user?.role === 'admin') {
    return sections
  }

  return sections.map((section) => {
    if (section.key !== 'admin') {
      return section
    }

    return {
      ...section,
      items: section.items.filter(item => item.to !== '/settings'),
    }
  })
})

async function loadCounters() {
  try {
    const [qrResponse, foldersResponse] = await Promise.all([
      $fetch<{ meta?: { total?: number }, data?: Array<unknown> }>('/api/qr', { query: { page: 1, limit: 1 } }),
      $fetch<{ data?: Array<unknown> }>('/api/folders'),
    ])

    qrCount.value = qrResponse.meta?.total ?? qrResponse.data?.length ?? 0
    foldersCount.value = foldersResponse.data?.length ?? 0
  }
  catch {
    qrCount.value = qrCount.value || 0
    foldersCount.value = foldersCount.value || 0
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    loadCounters()
  }
})

watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    loadCounters()
  }
})
</script>
