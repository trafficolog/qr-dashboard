<template>
  <header class="layout-topbar">
    <button
      class="layout-topbar-menu-button"
      type="button"
      :aria-label="t('a11y.actions.openMenu')"
      @click="layout.onMenuToggle"
    >
      <Icon
        name="i-lucide-menu"
        class="size-5"
      />
    </button>

    <div class="layout-topbar-title">
      <h1>{{ pageTitle }}</h1>
      <p>{{ pageSubtitle }}</p>
    </div>

    <div class="layout-topbar-actions">
      <button
        type="button"
        class="layout-topbar-action"
        :aria-label="themeLabel"
        @click="layout.toggleDarkMode"
      >
        <Icon
          :name="themeIcon"
          class="size-4"
        />
      </button>

      <NuxtLink
        to="/notifications"
        class="layout-topbar-action relative"
        :aria-label="t('nav.notifications')"
      >
        <Icon
          name="i-lucide-bell"
          class="size-4"
        />
        <span
          v-if="unreadCount > 0"
          class="absolute -right-1 -top-1 min-w-4 rounded-full bg-[color:var(--primary-color)] px-1 text-center text-[10px] leading-4 text-white"
        >
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </span>
      </NuxtLink>

      <NuxtLink
        to="/qr/create"
        class="layout-topbar-primary"
      >
        <Icon
          name="i-lucide-plus"
          class="size-4"
        />
        <span>{{ t('common.create') }}</span>
      </NuxtLink>

      <AppUserMenu />
    </div>
  </header>
</template>

<script setup lang="ts">
const { t } = useI18n()
const layout = useLayout()
const { pageTitle, pageSubtitle } = usePageMetadata()
const { unreadCount } = useNotifications()

const themeIcon = computed(() => layout.layoutConfig.value.darkTheme ? 'i-lucide-sun' : 'i-lucide-moon')
const themeLabel = computed(() => layout.layoutConfig.value.darkTheme ? t('common.lightTheme') : t('common.darkTheme'))
</script>
