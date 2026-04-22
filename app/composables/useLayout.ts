import { readonly } from 'vue'

export type MenuMode = 'static'

interface LayoutConfig {
  darkTheme: boolean
  menuMode: MenuMode
}

interface LayoutState {
  staticMenuDesktopInactive: boolean
  overlayMenuActive: boolean
  mobileMenuActive: boolean
}

const THEME_COOKIE_KEY = 'splat-theme'

export function useLayout() {
  const layoutConfig = useState<LayoutConfig>('layout-config', () => ({
    darkTheme: false,
    menuMode: 'static',
  }))

  const layoutState = useState<LayoutState>('layout-state', () => ({
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    mobileMenuActive: false,
  }))

  function isDesktop() {
    if (!import.meta.client) {
      return true
    }

    return window.innerWidth > 991
  }

  function applyDarkClass(value: boolean) {
    if (!import.meta.client) {
      return
    }

    document.documentElement.classList.toggle('app-dark', value)
  }

  function initializeTheme() {
    const themeCookie = useCookie<string | null>(THEME_COOKIE_KEY, { default: () => null })

    if (themeCookie.value === 'dark') {
      layoutConfig.value.darkTheme = true
      applyDarkClass(true)
      return
    }

    if (themeCookie.value === 'light') {
      layoutConfig.value.darkTheme = false
      applyDarkClass(false)
      return
    }

    if (import.meta.client) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      layoutConfig.value.darkTheme = prefersDark
      applyDarkClass(prefersDark)
    }
  }

  function onMenuToggle() {
    if (isDesktop()) {
      layoutState.value.staticMenuDesktopInactive = !layoutState.value.staticMenuDesktopInactive
      return
    }

    layoutState.value.mobileMenuActive = !layoutState.value.mobileMenuActive
  }

  function closeMobileMenu() {
    layoutState.value.mobileMenuActive = false
  }

  function onMenuItemClick() {
    if (!isDesktop()) {
      closeMobileMenu()
    }
  }

  function toggleDarkMode() {
    layoutConfig.value.darkTheme = !layoutConfig.value.darkTheme
    applyDarkClass(layoutConfig.value.darkTheme)

    const themeCookie = useCookie<string>(THEME_COOKIE_KEY, {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      path: '/',
    })
    themeCookie.value = layoutConfig.value.darkTheme ? 'dark' : 'light'
  }

  return {
    layoutConfig: readonly(layoutConfig),
    layoutState,
    isDarkTheme: computed(() => layoutConfig.value.darkTheme),
    initializeTheme,
    onMenuToggle,
    closeMobileMenu,
    onMenuItemClick,
    toggleDarkMode,
  }
}
