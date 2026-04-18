<template>
  <div class="min-h-screen bg-[color:var(--surface-1)] text-[color:var(--text-primary)]">
    <!-- Sidebar (desktop/tablet) -->
    <AppSidebar
      :collapsed="sidebarCollapsed"
      class="hidden md:flex"
      @toggle="toggleSidebar"
    />

    <!-- Main content area -->
    <div
      :class="[
        'transition-[margin] duration-200 ease-in-out min-h-screen flex flex-col',
        sidebarCollapsed ? 'md:ml-16' : 'md:ml-60',
      ]"
    >
      <!-- Header -->
      <AppHeader
        @toggle-sidebar="toggleSidebar"
        @toggle-mobile-nav="mobileNavOpen = true"
      />

      <!-- Page content -->
      <main class="flex-1 p-4 pb-20 md:p-6 md:pb-8 lg:p-8">
        <slot />
      </main>
    </div>

    <!-- Mobile navigation -->
    <AppMobileNav v-model:open="mobileNavOpen" />
  </div>
</template>

<script setup lang="ts">
const sidebarCollapsed = useState('sidebar-collapsed', () => false)
const mobileNavOpen = ref(false)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// Persist sidebar state in localStorage
if (import.meta.client) {
  const saved = localStorage.getItem('sidebar-collapsed')
  if (saved !== null) {
    sidebarCollapsed.value = saved === 'true'
  }

  watch(sidebarCollapsed, (val) => {
    localStorage.setItem('sidebar-collapsed', String(val))
  })
}
</script>
