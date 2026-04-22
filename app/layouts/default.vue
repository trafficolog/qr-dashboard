<template>
  <div
    class="layout-wrapper"
    :class="{ 'layout-static-inactive': layout.layoutState.value.staticMenuDesktopInactive }"
  >
    <AppTopbar />

    <div class="layout-sidebar-wrapper">
      <AppMenu />
    </div>

    <main class="layout-main-container">
      <div class="layout-main">
        <slot />
      </div>
      <AppFooter />
    </main>

    <div
      v-if="layout.layoutState.value.mobileMenuActive"
      class="layout-mask"
      @click="layout.closeMobileMenu"
    />
  </div>
</template>

<script setup lang="ts">
const layout = useLayout()

onMounted(() => {
  layout.initializeTheme()
})
</script>
