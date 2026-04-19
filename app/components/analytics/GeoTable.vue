<template>
  <div class="rounded-xl border border-[color:var(--border-color)] p-4">
    <h3 class="mb-3 text-sm font-medium text-[color:var(--text-primary)]">
      {{ $t('analytics.geo.tableTitle') }}
    </h3>

    <div
      v-if="loading"
      class="space-y-2"
    >
      <USkeleton
        v-for="i in 6"
        :key="i"
        class="h-12 rounded-lg"
      />
    </div>

    <div
      v-else-if="!cities.length"
      class="py-10 text-center text-sm text-[color:var(--text-muted)]"
    >
      {{ $t('analytics.geo.empty') }}
    </div>

    <div
      v-else
      class="space-y-2"
    >
      <div
        v-for="city in cities"
        :key="`${city.country}-${city.city}`"
        class="flex items-center justify-between rounded-lg bg-[color:var(--surface-1)] px-3 py-2"
      >
        <div>
          <p class="text-sm font-medium text-[color:var(--text-primary)]">
            {{ city.city }}
          </p>
          <p class="text-xs text-[color:var(--text-muted)]">
            {{ city.country }}
          </p>
        </div>
        <p class="text-sm tabular-nums text-[color:var(--text-primary)]">
          {{ city.scans.toLocaleString() }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GeoCityBreakdownItem } from '~~/types/analytics'

withDefaults(defineProps<{
  cities: readonly GeoCityBreakdownItem[]
  loading?: boolean
}>(), {
  loading: false,
})
</script>
