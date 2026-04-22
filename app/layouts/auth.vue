<template>
  <div class="auth-layout">
    <button
      type="button"
      class="auth-theme-toggle"
      :aria-label="themeLabel"
      @click="layout.toggleDarkMode"
    >
      <Icon
        :name="themeIcon"
        class="size-4"
      />
      <span>{{ themeLabel }}</span>
    </button>

    <div class="auth-layout-card">
      <div class="auth-layout-brand">
        <img
          src="/splat-logo.svg"
          alt="SPLAT"
          class="h-10"
        >
        <h1>{{ $t('app.name') }}</h1>
      </div>
      <div class="auth-layout-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const layout = useLayout()

onMounted(() => {
  layout.initializeTheme()
})

const themeIcon = computed(() => layout.layoutConfig.value.darkTheme ? 'i-lucide-sun' : 'i-lucide-moon-star')
const themeLabel = computed(() => layout.layoutConfig.value.darkTheme ? t('common.lightTheme') : t('common.darkTheme'))
</script>
