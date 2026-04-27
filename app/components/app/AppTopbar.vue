<template>
  <header class="layout-topbar">
    <Button
      class="layout-topbar-menu-button"
      text
      severity="secondary"
      :aria-label="t('a11y.actions.openMenu')"
      @click="layout.onMenuToggle"
    >
      <template #icon>
        <Icon
          name="i-lucide-menu"
          class="size-5"
        />
      </template>
    </Button>

    <div class="layout-topbar-title">
      <h1>{{ pageTitle }}</h1>
      <p>{{ pageSubtitle }}</p>
    </div>

    <div class="layout-topbar-actions">
      <Button
        type="button"
        text
        severity="secondary"
        class="layout-topbar-action layout-topbar-search hidden sm:inline-flex"
        :aria-label="t('a11y.actions.openSearch')"
        @click="globalSearch.open()"
      >
        <template #icon>
          <Icon
            name="i-lucide-search"
            class="size-4"
          />
        </template>
        <span class="text-xs text-[color:var(--text-secondary)]">{{ $t('common.search') }}</span>
        <span class="rounded border border-[color:var(--surface-border)] px-1.5 py-0.5 text-[10px] text-[color:var(--text-secondary)]">⌘K</span>
      </Button>

      <Button
        type="button"
        text
        severity="secondary"
        class="layout-topbar-action"
        :aria-label="themeLabel"
        @click="layout.toggleDarkMode"
      >
        <template #icon>
          <Icon
            :name="themeIcon"
            class="size-4"
          />
        </template>
      </Button>

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

    <AppGlobalSearch />
  </header>
</template>

<script setup lang="ts">
import { useMagicKeys, whenever } from '@vueuse/core'
import { useGlobalSearch } from '~/composables/useGlobalSearch'

const { t } = useI18n()
const layout = useLayout()
const { pageTitle, pageSubtitle } = usePageMetadata()
const { unreadCount } = useNotifications()
const globalSearch = useGlobalSearch()

const magicKeys = useMagicKeys()
whenever(
  () => Boolean((magicKeys.meta?.value || magicKeys.ctrl?.value) && magicKeys.k?.value),
  () => {
    globalSearch.open()
  },
)

const themeIcon = computed(() => layout.layoutConfig.value.darkTheme ? 'i-lucide-sun' : 'i-lucide-moon')
const themeLabel = computed(() => layout.layoutConfig.value.darkTheme ? t('common.lightTheme') : t('common.darkTheme'))
</script>
