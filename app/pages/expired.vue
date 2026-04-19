<template>
  <div class="min-h-screen flex items-center justify-center bg-[color:var(--surface-0)] dark:bg-[color:var(--surface-2)] px-4">
    <div class="text-center max-w-sm">
      <img
        src="/splat-logo.svg"
        alt="SPLAT"
        class="h-10 mx-auto mb-8 opacity-80"
      >
      <SharedEmptyIllustration
        src="/illustrations/error-expired.svg"
        :alt="t('errors.expiredQr.illustrationAlt')"
      />
      <h1 class="text-xl font-semibold text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)] mb-2">
        {{ t('errors.expiredQr.title') }}
      </h1>
      <p class="text-sm text-[color:var(--text-muted)] dark:text-[color:var(--text-muted)]">
        {{ t('errors.expiredQr.description') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

definePageMeta({ layout: false })
</script>
