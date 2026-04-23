import { readonly } from 'vue'

export type MenuMode = 'static'
export type ThemePreference = 'light' | 'dark' | 'system'

interface LayoutConfig {
  darkTheme: boolean
  themePreference: ThemePreference
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
    themePreference: 'system',
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
    const themeCookie = useCookie<ThemePreference | null>(THEME_COOKIE_KEY, { default: () => null })

    const preference = themeCookie.value || 'system'
    setThemePreference(preference)
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
    setThemePreference(layoutConfig.value.darkTheme ? 'light' : 'dark')
  }

  function setThemePreference(preference: ThemePreference) {
    layoutConfig.value.themePreference = preference

    const darkThemeEnabled = preference === 'system'
      ? (import.meta.client ? window.matchMedia('(prefers-color-scheme: dark)').matches : false)
      : preference === 'dark'
    layoutConfig.value.darkTheme = darkThemeEnabled
    applyDarkClass(darkThemeEnabled)

    const themeCookie = useCookie<ThemePreference>(THEME_COOKIE_KEY, {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      path: '/',
    })
    themeCookie.value = preference
  }

  return {
    layoutConfig: readonly(layoutConfig),
    layoutState,
    isDarkTheme: computed(() => layoutConfig.value.darkTheme),
    themePreference: computed(() => layoutConfig.value.themePreference),
    initializeTheme,
    onMenuToggle,
    closeMobileMenu,
    onMenuItemClick,
    toggleDarkMode,
    setThemePreference,
  }
}
