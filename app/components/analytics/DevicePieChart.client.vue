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
      v-else-if="!hasData"
      class="py-8 text-center text-sm text-[color:var(--text-muted)]"
    >
      {{ $t('analytics.devices.empty') }}
    </div>

    <div
      v-else
      class="mb-4 flex items-center justify-center"
      data-testid="devices-donut-chart"
    >
      <VChart
        class="h-36 w-full max-w-[220px]"
        :option="chartOption"
        :autoresize="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { resolveDeviceColor } from './deviceColors'
import type { DeviceBreakdownItem } from '~/shared/types/analytics'

use([PieChart, TooltipComponent, CanvasRenderer])

const props = withDefaults(defineProps<{
  title: string
  items: readonly DeviceBreakdownItem[]
  loading?: boolean
}>(), {
  loading: false,
})

const total = computed(() => props.items.reduce((acc, item) => acc + item.count, 0))
const hasData = computed(() => total.value > 0)

const chartOption = computed(() => ({
  animation: true,
  tooltip: {
    trigger: 'item',
    formatter: (params: { name: string, value: number, percent: number }) => `${params.name}: <b>${params.value.toLocaleString('ru-RU')}</b> (${params.percent.toFixed(1)}%)`,
  },
  graphic: [
    {
      type: 'text',
      left: 'center',
      top: 'center',
      style: {
        text: total.value.toLocaleString('ru-RU'),
        textAlign: 'center',
        fill: '#6b7280',
        fontSize: 12,
        fontWeight: 600,
      },
    },
  ],
  series: [
    {
      type: 'pie',
      radius: ['58%', '76%'],
      avoidLabelOverlap: true,
      label: { show: false },
      labelLine: { show: false },
      data: props.items
        .filter(item => item.count > 0)
        .map((item, index) => ({
          value: item.count,
          name: item.name,
          itemStyle: { color: resolveDeviceColor(item.name, index) },
        })),
    },
  ],
}))
</script>
