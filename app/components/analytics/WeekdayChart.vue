<template>
  <div class="rounded-xl border border-[color:var(--border-color)] p-4">
    <h3 class="mb-3 text-sm font-medium text-[color:var(--text-primary)]">
      {{ $t('analytics.time.weekday') }}
    </h3>

    <div
      v-if="loading"
      class="space-y-2"
    >
      <USkeleton
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

    <div
      v-else
      class="space-y-2"
    >
      <div
        v-for="item in items"
        :key="item.weekday"
        class="flex items-center justify-between rounded-lg bg-[color:var(--surface-1)] px-3 py-2"
      >
        <span class="text-sm text-[color:var(--text-muted)]">{{ weekdayLabel(item.weekday) }}</span>
        <span class="text-sm tabular-nums text-[color:var(--text-primary)]">{{ item.scans.toLocaleString() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WeeklyDistributionItem } from '~~/types/analytics'

const { t } = useI18n()

withDefaults(defineProps<{
  items: readonly WeeklyDistributionItem[]
  loading?: boolean
}>(), {
  loading: false,
})

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
