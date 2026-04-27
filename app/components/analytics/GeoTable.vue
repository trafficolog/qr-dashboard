<template>
  <div class="rounded-xl border border-[color:var(--border-color)] p-4">
    <h3 class="mb-3 text-sm font-medium text-[color:var(--text-color)]">
      {{ $t('analytics.geo.tableTitle') }}
    </h3>

    <div
      v-if="loading"
      class="space-y-2"
    >
      <Skeleton
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
      class="overflow-x-auto"
    >
      <table class="min-w-full text-left text-sm">
        <thead>
          <tr class="border-b border-[color:var(--border-color)] text-xs uppercase tracking-wide text-[color:var(--text-muted)]">
            <th class="px-2 py-2">
              <button
                type="button"
                class="inline-flex items-center gap-1"
                @click="setSort('country')"
              >
                {{ $t('analytics.geo.columns.country') }}
                <Icon
                  :name="sortIcon('country')"
                  class="size-3"
                />
              </button>
            </th>
            <th class="px-2 py-2">
              <button
                type="button"
                class="inline-flex items-center gap-1"
                @click="setSort('city')"
              >
                {{ $t('analytics.geo.columns.city') }}
                <Icon
                  :name="sortIcon('city')"
                  class="size-3"
                />
              </button>
            </th>
            <th class="px-2 py-2 text-right">
              <button
                type="button"
                class="ml-auto inline-flex items-center gap-1"
                @click="setSort('scans')"
              >
                {{ $t('analytics.geo.columns.scans') }}
                <Icon
                  :name="sortIcon('scans')"
                  class="size-3"
                />
              </button>
            </th>
            <th class="px-2 py-2 text-right">
              <button
                type="button"
                class="ml-auto inline-flex items-center gap-1"
                @click="setSort('uniqueScans')"
              >
                {{ $t('analytics.geo.columns.uniqueScans') }}
                <Icon
                  :name="sortIcon('uniqueScans')"
                  class="size-3"
                />
              </button>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="city in sortedCities"
            :key="`${city.country}-${city.city}`"
            class="border-b border-[color:var(--border-color)]/60"
          >
            <td class="px-2 py-2 text-[color:var(--text-muted)]">
              {{ city.country }}
            </td>
            <td class="px-2 py-2 font-medium text-[color:var(--text-color)]">
              {{ city.city }}
            </td>
            <td class="px-2 py-2 text-right tabular-nums text-[color:var(--text-color)]">
              {{ city.scans.toLocaleString() }}
            </td>
            <td class="px-2 py-2 text-right tabular-nums text-[color:var(--text-color)]">
              {{ city.uniqueScans.toLocaleString() }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GeoCityBreakdownItem } from '#shared/types/analytics'

type SortKey = 'country' | 'city' | 'scans' | 'uniqueScans'
type SortDirection = 'asc' | 'desc'

const props = withDefaults(defineProps<{
  cities: readonly GeoCityBreakdownItem[]
  loading?: boolean
}>(), {
  loading: false,
})

const sortBy = ref<SortKey>('scans')
const sortDirection = ref<SortDirection>('desc')

const sortedCities = computed(() => {
  const multiplier = sortDirection.value === 'asc' ? 1 : -1
  return [...props.cities].sort((left, right) => {
    if (sortBy.value === 'country' || sortBy.value === 'city')
      return left[sortBy.value].localeCompare(right[sortBy.value]) * multiplier

    return (left[sortBy.value] - right[sortBy.value]) * multiplier
  })
})

function setSort(key: SortKey) {
  if (sortBy.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortBy.value = key
  sortDirection.value = key === 'country' || key === 'city' ? 'asc' : 'desc'
}

function sortIcon(key: SortKey) {
  if (sortBy.value !== key)
    return 'i-lucide-arrow-up-down'

  return sortDirection.value === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'
}
</script>
