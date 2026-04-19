<template>
  <div class="relative">
    <!-- Skeleton -->
    <div
      v-if="loading"
      class="h-64 w-full bg-[color:var(--surface-0)] dark:bg-gray-900 rounded-lg animate-pulse flex items-center justify-center"
    >
      <UIcon
        name="i-lucide-bar-chart-3"
        class="size-10 text-gray-200 dark:text-[color:var(--text-secondary)]"
      />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!data.length"
      class="h-64 flex items-center justify-center text-[color:var(--text-muted)] dark:text-[color:var(--text-secondary)]"
    >
      <div class="text-center">
        <UIcon
          name="i-lucide-bar-chart-3"
          class="size-10 mx-auto mb-2"
        />
        <p class="text-sm">
          Нет данных за выбранный период
        </p>
      </div>
    </div>

    <!-- Chart -->
    <VChart
      v-else
      class="h-64 w-full"
      :option="chartOption"
      :autoresize="true"
    />
  </div>
</template>

<script setup lang="ts">
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import type { ScanTimeSeriesPoint } from '~~/types/analytics'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{
  data: ScanTimeSeriesPoint[]
  loading?: boolean
  reducedMotion?: boolean
}>()

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

const chartOption = computed(() => ({
  animation: !props.reducedMotion,
  animationDuration: props.reducedMotion ? 0 : 300,
  animationDurationUpdate: props.reducedMotion ? 0 : 300,
  tooltip: {
    trigger: 'axis',
    formatter: (params: unknown[]) => {
      const p = params as Array<{ name: string, seriesName: string, value: number, color: string }>
      const date = p[0]?.name ?? ''
      return `<b>${date}</b><br/>` + p.map(s =>
        `<span style="color:${s.color}">●</span> ${s.seriesName}: <b>${s.value.toLocaleString('ru-RU')}</b>`,
      ).join('<br/>')
    },
  },
  legend: {
    data: ['Все сканирования', 'Уникальные'],
    bottom: 0,
    textStyle: { fontSize: 12 },
  },
  grid: { top: 10, left: 10, right: 10, bottom: 36, containLabel: true },
  xAxis: {
    type: 'category',
    data: props.data.map(d => formatDate(d.date)),
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
      name: 'Все сканирования',
      type: 'line',
      data: props.data.map(d => d.totalScans),
      animation: !props.reducedMotion,
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: '#16a34a', width: 2 },
      itemStyle: { color: '#16a34a' },
      areaStyle: { color: 'rgba(22,163,74,0.08)' },
    },
    {
      name: 'Уникальные',
      type: 'line',
      data: props.data.map(d => d.uniqueScans),
      animation: !props.reducedMotion,
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: '#86efac', width: 2, type: 'dashed' },
      itemStyle: { color: '#86efac' },
    },
  ],
}))
</script>
