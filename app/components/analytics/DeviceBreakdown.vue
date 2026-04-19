<template>
  <div>
    <div
      v-if="loading"
      class="space-y-1.5"
    >
      <USkeleton
        v-for="i in 4"
        :key="i"
        class="h-5 rounded-md"
      />
    </div>

    <div
      v-else-if="!items.length"
      class="text-center text-sm text-[color:var(--text-muted)]"
    >
      {{ $t('analytics.devices.empty') }}
    </div>

    <div
      v-else
      class="space-y-1.5"
    >
      <div
        v-for="item in items.slice(0, 4)"
        :key="item.name"
        class="flex items-center justify-between text-xs"
      >
        <span class="truncate text-[color:var(--text-muted)]">{{ item.name }}</span>
        <span class="tabular-nums text-[color:var(--text-primary)]">{{ formatPercent(item.percentage) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeviceBreakdownItem } from '~~/types/analytics'

withDefaults(defineProps<{
  items: readonly DeviceBreakdownItem[]
  loading?: boolean
}>(), {
  loading: false,
})

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}
</script>
