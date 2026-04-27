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
        v-if="showContextSearchDesktop"
        type="button"
        text
        severity="secondary"
        class="layout-topbar-action layout-topbar-search hidden sm:inline-flex"
        :aria-label="t('a11y.actions.openSearch')"
        @click="openGlobalSearch"
      >
        <template #icon>
          <Icon
            name="i-lucide-search"
            class="size-4"
          />
        </template>
        <span class="text-xs text-[color:var(--text-secondary)]">{{ $t('common.search') }}</span>
        <span class="rounded border border-[color:var(--surface-border)] px-1.5 py-0.5 text-[10px] text-[color:var(--text-secondary)]">{{ searchShortcutHint }}</span>
      </Button>

      <Button
        v-if="showContextSearchMobile"
        type="button"
        text
        severity="secondary"
        class="layout-topbar-action sm:hidden"
        :aria-label="t('a11y.actions.openSearch')"
        @click="openGlobalSearch"
      >
        <template #icon>
          <Icon
            name="i-lucide-search"
            class="size-4"
          />
        </template>
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

      <span
        class="layout-topbar-divider hidden sm:inline-block"
        aria-hidden="true"
      />

      <NuxtLink
        v-if="showBulkCreateAction"
        to="/qr/bulk"
        class="layout-topbar-action layout-topbar-link-action hidden lg:inline-flex"
      >
        <Icon
          name="i-lucide-files"
          class="size-4"
        />
        <span>{{ t('qr.list.bulkGenerate') }}</span>
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
import { useEventListener } from '@vueuse/core'
import { useGlobalSearch } from '~/composables/useGlobalSearch'

const { t } = useI18n()
const layout = useLayout()
const { pageTitle, pageSubtitle } = usePageMetadata()
const { unreadCount } = useNotifications()
const globalSearch = useGlobalSearch()
const route = useRoute()

const searchShortcutHint = computed(() => {
  if (!import.meta.client) {
    return 'Ctrl K'
  }

  return /mac|iphone|ipad|ipod/i.test(window.navigator.platform)
    ? '⌘K'
    : 'Ctrl K'
})

function openGlobalSearch() {
  globalSearch.open()
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

useEventListener(import.meta.client ? window : undefined, 'keydown', (event: KeyboardEvent) => {
  if (isTypingTarget(event.target)) {
    return
  }

  const isMetaOrCtrl = event.metaKey || event.ctrlKey
  const isShortcut = isMetaOrCtrl && event.key.toLowerCase() === 'k'

  if (!isShortcut) {
    return
  }

  event.preventDefault()
  openGlobalSearch()
})

const themeIcon = computed(() => layout.layoutConfig.value.darkTheme ? 'i-lucide-sun' : 'i-lucide-moon')
const themeLabel = computed(() => layout.layoutConfig.value.darkTheme ? t('common.lightTheme') : t('common.darkTheme'))
const isQrContext = computed(() => route.path.startsWith('/qr'))
const showContextSearchDesktop = computed(() => isQrContext.value)
const showContextSearchMobile = computed(() => isQrContext.value)
const showBulkCreateAction = computed(() => isQrContext.value && route.path !== '/qr/bulk')
</script>
