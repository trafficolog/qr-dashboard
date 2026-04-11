import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false)
  const isMobile = ref(false)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    sidebarCollapsed,
    isMobile,
    toggleSidebar,
  }
})
