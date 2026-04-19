<template>
  <div>
    <h3 class="mb-3 text-sm font-medium text-[color:var(--text-primary)]">
      {{ title }}
    </h3>

    <div
      v-if="loading"
      class="mb-4 flex items-center justify-center"
    >
      <USkeleton class="size-28 rounded-full" />
    </div>

    <div
      v-else-if="!items.length"
      class="py-8 text-center text-sm text-[color:var(--text-muted)]"
    >
      {{ $t('analytics.devices.empty') }}
    </div>

    <div
      v-else
      class="mb-4 flex items-center justify-center"
    >
      <div
        class="grid size-28 place-items-center rounded-full"
        :style="{ background: donutGradient(items) }"
      >
        <div class="grid size-16 place-items-center rounded-full bg-[color:var(--surface-0)] text-xs text-[color:var(--text-muted)]">
          {{ donutTotal(items).toLocaleString() }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeviceBreakdownItem } from '~~/types/analytics'

const donutColors = ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7']

withDefaults(defineProps<{
  title: string
  items: readonly DeviceBreakdownItem[]
  loading?: boolean
}>(), {
  loading: false,
})

function donutTotal(values: readonly DeviceBreakdownItem[]) {
  return values.reduce((acc, item) => acc + item.count, 0)
}

function donutGradient(values: readonly DeviceBreakdownItem[]) {
  if (!values.length) return 'conic-gradient(#e5e7eb 0 100%)'

  let cursor = 0
  const stops = values.slice(0, donutColors.length).map((item, index) => {
    const start = cursor
    const end = cursor + item.percentage
    cursor = end
    return `${donutColors[index]} ${start}% ${end}%`
  })

  if (cursor < 100)
    stops.push(`#e5e7eb ${cursor}% 100%`)

  return `conic-gradient(${stops.join(', ')})`
}
</script>
