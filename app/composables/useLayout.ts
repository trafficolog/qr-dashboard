import { readonly } from 'vue'

export type MenuMode = 'static'
export type ThemePreference = 'light' | 'dark'

interface LayoutConfig {
  darkTheme: boolean
  themePreference: ThemePreference
  menuMode: MenuMode
  preset: 'Aura'
  primary: 'red'
  surface: 'zinc'
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
    themePreference: 'light',
    menuMode: 'static',
    preset: 'Aura',
    primary: 'red',
    surface: 'zinc',
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

    if (themeCookie.value === 'light' || themeCookie.value === 'dark') {
      applyTheme(themeCookie.value)
      return
    }

    const preferredTheme: ThemePreference = import.meta.client && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'

    applyTheme(preferredTheme)
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
    applyTheme(layoutConfig.value.darkTheme ? 'light' : 'dark')
  }

  function applyTheme(preference: ThemePreference) {
    layoutConfig.value.themePreference = preference

    const darkThemeEnabled = preference === 'dark'
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
  }
}
