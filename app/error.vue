<template>
  <div class="flex min-h-screen items-center justify-center bg-[color:var(--surface-1)] px-4">
    <UCard class="w-full max-w-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] shadow-lg shadow-black/5">
      <div class="space-y-5 text-center">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--accent-light)]">
          <UIcon
            :name="isNotFound ? 'i-lucide-search-x' : 'i-lucide-triangle-alert'"
            class="h-7 w-7 text-[color:var(--accent)]"
          />
        </div>

        <p class="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
          {{ t('errors.codeLabel') }}: {{ statusCode }}
        </p>

        <div class="space-y-2">
          <h1 class="text-2xl font-semibold text-[color:var(--text-primary)]">
            {{ title }}
          </h1>
          <p class="text-sm text-[color:var(--text-secondary)]">
            {{ description }}
          </p>
        </div>

        <p
          v-if="isNotFound"
          class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-xs text-[color:var(--text-muted)]"
        >
          {{ t('errors.requestedPath', { path: route.fullPath }) }}
        </p>

        <p
          v-else-if="detailsMessage"
          class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-xs text-[color:var(--text-muted)]"
        >
          {{ detailsMessage }}
        </p>

        <div class="flex flex-col justify-center gap-2 pt-1 sm:flex-row">
          <UButton
            icon="i-lucide-house"
            @click="handleGoHome"
          >
            {{ t('errors.goHome') }}
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-log-in"
            @click="handleGoLogin"
          >
            {{ t('errors.goLogin') }}
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const { t } = useI18n()
const route = useRoute()

const statusCode = computed(() => Number(props.error?.statusCode || 500))
const isNotFound = computed(() => statusCode.value === 404)

const title = computed(() => (
  isNotFound.value ? t('errors.notFoundTitle') : t('errors.genericTitle')
))

const description = computed(() => (
  isNotFound.value ? t('errors.notFoundDescription') : t('errors.genericDescription')
))

const detailsMessage = computed(() => {
  const details = props.error?.statusMessage || props.error?.message || ''
  return details.trim()
})

async function handleGoHome() {
  await clearError({ redirect: '/dashboard' })
}

async function handleGoLogin() {
  await clearError({ redirect: '/auth/login' })
}
</script>
