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
const { t } = useI18n()
const layout = useLayout()

const model = computed(() => [
  {
    label: 'Workspace',
    items: [
      { label: t('nav.dashboard'), icon: 'i-lucide-layout-dashboard', to: '/dashboard' },
      { label: t('nav.qrCodes'), icon: 'i-lucide-qr-code', to: '/qr' },
      { label: t('nav.folders'), icon: 'i-lucide-folder', to: '/folders' },
      { label: t('nav.sharedQr'), icon: 'i-lucide-globe', to: '/qr/shared' },
      { label: t('nav.analytics'), icon: 'i-lucide-chart-column', to: '/analytics' },
    ],
  },
  {
    label: t('nav.integrations'),
    items: [
      { label: t('nav.integrations'), icon: 'i-lucide-plug', to: '/integrations' },
      { label: 'API Docs', icon: 'i-lucide-book-open', to: '/api-docs' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { label: t('nav.settings'), icon: 'i-lucide-settings', to: '/settings/general' },
    ],
  },
])
</script>
