<template>
  <div class="rounded-xl border border-[color:var(--border-color)] p-4">
    <h3 class="mb-3 text-sm font-medium text-[color:var(--text-primary)]">
      {{ $t('analytics.time.hourly') }}
    </h3>

    <div
      v-if="loading"
      class="space-y-2"
    >
      <USkeleton
        v-for="i in 8"
        :key="i"
        class="h-6 rounded-lg"
      />
    </div>

    <div
      v-else-if="!items.length"
      class="py-10 text-center text-sm text-[color:var(--text-muted)]"
    >
      {{ $t('analytics.time.empty') }}
    </div>

    <div
      v-else
      class="space-y-2"
    >
      <div
        v-for="item in items"
        :key="item.hour"
        class="flex items-center gap-3"
      >
        <span class="w-12 text-xs text-[color:var(--text-muted)]">{{ item.hour }}:00</span>
        <div class="h-2 flex-1 rounded-full bg-[color:var(--surface-2)]">
          <div
            class="h-2 rounded-full bg-[color:var(--success)]"
            :style="{ width: `${Math.max(item.percentage, 2)}%` }"
          />
        </div>
        <span class="w-14 text-right text-xs text-[color:var(--text-muted)]">{{ formatPercent(item.percentage) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HourlyDistributionItem } from '~~/types/analytics'

withDefaults(defineProps<{
  items: readonly HourlyDistributionItem[]
  loading?: boolean
}>(), {
  loading: false,
})

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}
</script>
