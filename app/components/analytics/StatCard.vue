<template>
  <div class="rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-card)] p-4">
    <div
      v-if="loading"
      class="flex items-center gap-3"
    >
      <div class="size-10 shrink-0 animate-pulse rounded-lg bg-[color:var(--surface-2)]" />
      <div class="flex-1 space-y-2">
        <div class="h-7 w-20 animate-pulse rounded bg-[color:var(--surface-2)]" />
        <div class="h-4 w-28 animate-pulse rounded bg-[color:var(--surface-2)]" />
      </div>
    </div>

    <div
      v-else
      class="flex items-start gap-3"
      :data-motion-enabled="!props.reducedMotion"
    >
      <div class="shrink-0 rounded-lg p-2 bg-[color:color-mix(in_srgb,var(--color-success)_20%,transparent)]">
        <Icon
          :name="icon"
          class="size-5 text-[color:var(--color-success)]"
        />
      </div>
      <div class="min-w-0">
        <p class="tabular-nums text-2xl font-bold text-[color:var(--text-color)]">
          {{ formattedValue }}
        </p>
        <p class="mt-0.5 text-sm text-[color:var(--text-muted)]">
          {{ label }}
        </p>
        <div
          v-if="change !== undefined"
          class="mt-1 flex items-center gap-1"
        >
          <Icon
            :name="change >= 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
            class="size-3.5"
            :class="change >= 0 ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-error)]'"
          />
          <span
            class="text-xs font-medium"
            :class="change >= 0 ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-error)]'"
          >
            {{ change >= 0 ? '+' : '' }}{{ change }}% vs прошлый период
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  icon: string
  label: string
  value?: number | string
  change?: number
  loading?: boolean
  reducedMotion?: boolean
}>()

const formattedValue = computed(() => {
  if (props.value === undefined || props.value === null) return '—'
  if (typeof props.value === 'string') return props.value
  return props.value.toLocaleString('ru-RU')
})
</script>
