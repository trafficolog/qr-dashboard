import { readonly } from 'vue'

export type MenuMode = 'static'

interface LayoutConfig {
  preset: 'Aura'
  primary: 'red'
  surface: 'zinc'
  darkTheme: boolean
  menuMode: MenuMode
}

interface LayoutState {
  staticMenuDesktopInactive: boolean
  overlayMenuActive: boolean
  mobileMenuActive: boolean
}

const STORAGE_KEY = 'splat-layout-dark-theme'

export function useLayout() {
  const layoutConfig = useState<LayoutConfig>('layout-config', () => ({
    preset: 'Aura',
    primary: 'red',
    surface: 'zinc',
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
    if (!import.meta.client) {
      return
    }

    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved !== null) {
      layoutConfig.value.darkTheme = saved === 'true'
      applyDarkClass(layoutConfig.value.darkTheme)
      return
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    layoutConfig.value.darkTheme = prefersDark
    applyDarkClass(prefersDark)
  }

  function toggleMenu() {
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

    if (!import.meta.client) {
      return
    }

    localStorage.setItem(STORAGE_KEY, String(layoutConfig.value.darkTheme))
  }

  return {
    layoutConfig: readonly(layoutConfig),
    layoutState,
    initializeTheme,
    toggleMenu,
    closeMobileMenu,
    onMenuItemClick,
    toggleDarkMode,
  }
}
