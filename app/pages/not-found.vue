<template>
  <div class="flex min-h-screen items-center justify-center bg-[color:var(--surface-0)] px-4">
    <div class="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-6 text-center shadow-sm">
      <img
        src="/splat-logo.svg"
        alt="SPLAT"
        class="mx-auto mb-6 h-10 opacity-80"
      >
      <SharedEmptyIllustration
        src="/illustrations/error-404.svg"
        :alt="t('errors.notFoundQr.illustrationAlt')"
      />
      <h1 class="mb-2 text-xl font-semibold text-[color:var(--text-primary)]">
        {{ t('errors.notFoundQr.title') }}
      </h1>
      <p class="text-sm text-[color:var(--text-muted)]">
        {{ t('errors.notFoundQr.description') }}
      </p>

      <div class="mt-6 flex justify-center gap-2">
        <Button @click="navigateTo('/dashboard')">
          {{ t('errors.goHome') }}
        </Button>
        <Button
          severity="secondary"
          outlined
          @click="navigateTo('/auth/login')"
        >
          {{ t('errors.goLogin') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

definePageMeta({ layout: false })
</script>
