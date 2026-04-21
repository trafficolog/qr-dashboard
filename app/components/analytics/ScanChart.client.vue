<template>
  <div class="relative">
    <!-- Skeleton -->
    <div
      v-if="loading"
      class="h-64 w-full bg-[color:var(--surface-0)] dark:bg-[color:var(--surface-2)] rounded-lg animate-pulse flex items-center justify-center"
    >
      <UIcon
        name="i-lucide-bar-chart-3"
        class="size-10 text-[color:var(--text-muted)] dark:text-[color:var(--text-secondary)]"
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
import type { CompareSeries, ScanTimeSeriesPoint } from '#shared/types/analytics'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{
  data: readonly ScanTimeSeriesPoint[]
  compareSeries?: CompareSeries<readonly ScanTimeSeriesPoint[]> | null
  previousData?: readonly ScanTimeSeriesPoint[] | null
  loading?: boolean
  reducedMotion?: boolean
}>()

const previousSeriesData = computed(() => props.compareSeries?.previous ?? props.previousData ?? [])
const hasPreviousData = computed(() => previousSeriesData.value.length > 0)

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
      const valuesBySeries = new Map(p.map(item => [item.seriesName, item]))
      const currentTotal = valuesBySeries.get('Все сканирования')?.value ?? 0
      const currentUnique = valuesBySeries.get('Уникальные')?.value ?? 0
      const previousTotal = valuesBySeries.get('Все сканирования (пред. период)')?.value ?? 0
      const previousUnique = valuesBySeries.get('Уникальные (пред. период)')?.value ?? 0

      const rows = [
        `<b>${date}</b>`,
        '<span style="color:#16a34a">●</span> Текущий период (все): <b>' + currentTotal.toLocaleString('ru-RU') + '</b>',
        '<span style="color:#86efac">●</span> Текущий период (уникальные): <b>' + currentUnique.toLocaleString('ru-RU') + '</b>',
      ]

      if (hasPreviousData.value) {
        rows.push(
          '<span style="color:#15803d">●</span> Предыдущий период (все): <b>' + previousTotal.toLocaleString('ru-RU') + '</b>',
          '<span style="color:#65a30d">●</span> Предыдущий период (уникальные): <b>' + previousUnique.toLocaleString('ru-RU') + '</b>',
        )
      }

      return rows.join('<br/>')
    },
  },
  legend: {
    data: [
      'Все сканирования',
      'Уникальные',
      ...(hasPreviousData.value
        ? ['Все сканирования (пред. период)', 'Уникальные (пред. период)']
        : []),
    ],
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
    ...(hasPreviousData.value
      ? [
          {
            name: 'Все сканирования (пред. период)',
            type: 'line',
            data: previousSeriesData.value.map(d => d.totalScans),
            animation: !props.reducedMotion,
            smooth: true,
            symbol: 'none',
            lineStyle: { color: '#15803d', width: 2, type: 'dashed' },
            itemStyle: { color: '#15803d' },
            connectNulls: true,
          },
          {
            name: 'Уникальные (пред. период)',
            type: 'line',
            data: previousSeriesData.value.map(d => d.uniqueScans),
            animation: !props.reducedMotion,
            smooth: true,
            symbol: 'none',
            lineStyle: { color: '#65a30d', width: 2, type: 'dashed' },
            itemStyle: { color: '#65a30d' },
            connectNulls: true,
          },
        ]
      : []),
  ],
}))
</script>
