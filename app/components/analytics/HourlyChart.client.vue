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

    <VChart
      v-else
      class="h-72 w-full"
      :option="chartOption"
      :autoresize="true"
    />
  </div>
</template>

<script setup lang="ts">
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import type { HourlyDistributionItem } from '~~/types/analytics'

use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = withDefaults(defineProps<{
  items: readonly HourlyDistributionItem[]
  loading?: boolean
}>(), {
  loading: false,
})

const hourly = computed(() => {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, scans: 0 }))
  for (const item of props.items) {
    if (item.hour >= 0 && item.hour <= 23)
      buckets[item.hour] = { hour: item.hour, scans: item.scans }
  }
  return buckets
})

const peakValue = computed(() => Math.max(...hourly.value.map(item => item.scans), 0))

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    formatter: (params: unknown[]) => {
      const current = (params[0] ?? { axisValue: '', value: 0 }) as { axisValue: string, value: number }
      return `${current.axisValue}:00 — <b>${Number(current.value).toLocaleString('ru-RU')}</b>`
    },
  },
  grid: { top: 8, left: 8, right: 8, bottom: 8, containLabel: true },
  xAxis: {
    type: 'category',
    data: hourly.value.map(item => item.hour.toString().padStart(2, '0')),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { fontSize: 11, color: '#6b7280' },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#f3f4f6' } },
    axisLabel: { fontSize: 11, color: '#6b7280' },
  },
  series: [
    {
      type: 'bar',
      barWidth: '65%',
      data: hourly.value.map(item => ({
        value: item.scans,
        itemStyle: {
          color: item.scans > 0 && item.scans === peakValue.value ? '#15803d' : '#86efac',
          borderRadius: [6, 6, 0, 0],
        },
      })),
      label: {
        show: true,
        position: 'top',
        fontSize: 10,
        color: '#6b7280',
        formatter: ({ value }: { value: number }) => (value > 0 ? value.toLocaleString('ru-RU') : ''),
      },
    },
  ],
}))
</script>
