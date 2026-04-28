<template>
  <div class="rounded-xl border border-[color:var(--border-color)] p-4">
    <h3 class="mb-3 text-sm font-medium text-[color:var(--text-primary)]">
      {{ $t('analytics.time.weekday') }}
    </h3>

    <div
      v-if="loading"
      class="space-y-2"
    >
      <Skeleton
        v-for="i in 7"
        :key="i"
        class="h-10 rounded-lg"
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
import type { WeeklyDistributionItem } from '#shared/types/analytics'

use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

const { t } = useI18n()

const props = withDefaults(defineProps<{
  items: readonly WeeklyDistributionItem[]
  loading?: boolean
}>(), {
  loading: false,
})

const mondayFirstWeekdays = computed(() => {
  const sequence = [1, 2, 3, 4, 5, 6, 0]
  return sequence.map((weekday) => {
    const found = props.items.find(item => item.weekday === weekday)
    return {
      weekday,
      scans: found?.scans ?? 0,
      label: weekdayLabel(weekday),
    }
  })
})

const peakValue = computed(() => Math.max(...mondayFirstWeekdays.value.map(item => item.scans), 0))

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (params: unknown[]) => {
      const current = (params[0] ?? { name: '', value: 0 }) as { name: string, value: number }
      return `${current.name} — <b>${Number(current.value).toLocaleString('ru-RU')}</b>`
    },
  },
  grid: { top: 8, left: 8, right: 8, bottom: 8, containLabel: true },
  xAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#f3f4f6' } },
    axisLabel: { fontSize: 11, color: '#6b7280' },
  },
  yAxis: {
    type: 'category',
    data: mondayFirstWeekdays.value.map(item => item.label),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { fontSize: 11, color: '#6b7280' },
  },
  series: [
    {
      type: 'bar',
      data: mondayFirstWeekdays.value.map(item => ({
        value: item.scans,
        itemStyle: {
          color: item.scans > 0 && item.scans === peakValue.value ? '#15803d' : '#86efac',
          borderRadius: [0, 6, 6, 0],
        },
      })),
      label: {
        show: true,
        position: 'right',
        fontSize: 10,
        color: '#6b7280',
        formatter: ({ value }: { value: number }) => (value > 0 ? value.toLocaleString('ru-RU') : ''),
      },
    },
  ],
}))

function weekdayLabel(weekday: number) {
  const map = [
    t('analytics.time.weekdays.sun'),
    t('analytics.time.weekdays.mon'),
    t('analytics.time.weekdays.tue'),
    t('analytics.time.weekdays.wed'),
    t('analytics.time.weekdays.thu'),
    t('analytics.time.weekdays.fri'),
    t('analytics.time.weekdays.sat'),
  ]
  return map[weekday] ?? weekday.toString()
}
</script>
