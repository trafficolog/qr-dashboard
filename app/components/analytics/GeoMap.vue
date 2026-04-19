<template>
  <div class="rounded-xl border border-[color:var(--border-color)] p-4">
    <h3 class="mb-3 text-sm font-medium text-[color:var(--text-primary)]">
      {{ $t('analytics.geo.mapTitle') }}
    </h3>

    <div
      v-if="loading"
      class="space-y-2"
    >
      <USkeleton
        v-for="i in 6"
        :key="i"
        class="h-6 rounded-lg"
      />
    </div>

    <div
      v-else-if="!countries.length"
      class="py-10 text-center text-sm text-[color:var(--text-muted)]"
    >
      {{ $t('analytics.geo.empty') }}
    </div>

    <div
      v-else
      class="space-y-2"
    >
      <div
        v-for="country in countries"
        :key="country.country"
        class="flex items-center gap-3"
      >
        <span class="w-28 truncate text-sm text-[color:var(--text-muted)]">{{ country.country }}</span>
        <div class="h-2 flex-1 rounded-full bg-[color:var(--surface-2)]">
          <div
            class="h-2 rounded-full bg-[color:var(--success)]"
            :style="{ width: `${Math.max(country.percentage, 2)}%` }"
          />
        </div>
        <span class="w-16 text-right text-xs text-[color:var(--text-muted)]">{{ formatPercent(country.percentage) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GeoCountryBreakdownItem } from '~~/types/analytics'

withDefaults(defineProps<{
  countries: readonly GeoCountryBreakdownItem[]
  loading?: boolean
}>(), {
  loading: false,
})

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}
</script>
