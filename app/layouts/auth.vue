<template>
  <div class="relative min-h-screen flex items-center justify-center bg-[color:var(--surface-1)] px-4">
    <UButton
      class="absolute right-4 top-4"
      color="neutral"
      variant="outline"
      size="sm"
      :icon="themeIcon"
      @click="toggleTheme"
    >
      {{ themeLabel }}
    </UButton>

    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <img
          src="/splat-logo.svg"
          alt="SPLAT"
          class="mx-auto mb-4 h-10"
        >
        <h1 class="text-lg font-semibold text-[color:var(--text-primary)]">
          {{ $t('app.name') }}
        </h1>
      </div>
      <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)] shadow-lg shadow-black/5">
        <slot />
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const colorMode = useColorMode()
const { t } = useI18n()

const isDark = computed(() => colorMode.value === 'dark')
const themeIcon = computed(() => (
  isDark.value ? 'i-lucide-sun' : 'i-lucide-moon-star'
))
const themeLabel = computed(() => (
  isDark.value ? t('common.lightTheme') : t('common.darkTheme')
))

function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>
