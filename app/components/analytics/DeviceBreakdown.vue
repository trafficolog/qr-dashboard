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
      v-else-if="!hasData"
      class="text-center text-sm text-[color:var(--text-muted)]"
      data-testid="devices-empty-state"
    >
      {{ $t('analytics.devices.empty') }}
    </div>

    <div
      v-else
      class="space-y-1.5"
      data-testid="devices-legend"
    >
      <div
        v-for="(item, index) in visibleItems"
        :key="item.name"
        class="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 text-xs"
      >
        <span
          class="size-2 rounded-full"
          :style="{ backgroundColor: resolveDeviceColor(item.name, index) }"
        />
        <span class="truncate text-[color:var(--text-muted)]">{{ item.name }}</span>
        <span class="tabular-nums text-[color:var(--text-primary)]">{{ item.count.toLocaleString('ru-RU') }}</span>
        <span class="tabular-nums text-[color:var(--text-primary)]">{{ formatPercent(item.percentage) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { resolveDeviceColor } from './deviceColors'
import type { DeviceBreakdownItem } from '#shared/types/analytics'

const props = withDefaults(defineProps<{
  items: readonly DeviceBreakdownItem[]
  loading?: boolean
}>(), {
  loading: false,
})

const visibleItems = computed(() => props.items.slice(0, 4))
const hasData = computed(() => visibleItems.value.some(item => item.count > 0))

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}
</script>
