<template>
  <div class="rounded-xl border border-[color:var(--border-color)] p-4">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h3 class="text-sm font-medium text-[color:var(--text-color)]">
        {{ $t('analytics.geo.mapTitle') }}
      </h3>

      <div class="inline-flex rounded-lg bg-[color:var(--surface-1)] p-1">
        <Button
          v-for="mode in mapModes"
          :key="mode"
          :label="$t(mode === 'russia' ? 'analytics.geo.toggle.russia' : 'analytics.geo.toggle.world')"
          size="small"
          text
          :severity="activeMode === mode ? 'success' : 'secondary'"
          class="!px-3 !py-1 !text-xs"
          @click="activeMode = mode"
        />
      </div>
    </div>

    <div
      v-if="loading"
      class="space-y-2"
    >
      <Skeleton
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
      v-else-if="activeMode === 'russia'"
      class="space-y-3"
    >
      <div
        v-if="!hasRussiaData"
        class="rounded-lg bg-[color:var(--surface-1)] p-3 text-xs text-[color:var(--text-muted)]"
      >
        {{ $t('analytics.geo.russiaFallback') }}
      </div>

      <svg
        viewBox="0 0 680 280"
        class="w-full rounded-lg bg-[color:var(--surface-1)] p-2"
        role="img"
        :aria-label="$t('analytics.geo.russiaMapAria')"
      >
        <g
          v-for="region in russiaRegions"
          :key="region.id"
        >
          <path
            :d="region.path"
            :fill="regionColor(region.id)"
            stroke="var(--border-color)"
            stroke-width="2"
          >
            <title>{{ regionTooltip(region.id) }}</title>
          </path>
        </g>
      </svg>

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <p
          v-for="region in russiaRegions"
          :key="`${region.id}-legend`"
          class="flex items-center justify-between rounded-lg bg-[color:var(--surface-1)] px-3 py-2 text-xs"
        >
          <span class="text-[color:var(--text-muted)]">{{ region.name }}</span>
          <span class="tabular-nums text-[color:var(--text-color)]">{{ (russiaDistribution.get(region.id) ?? 0).toLocaleString() }}</span>
        </p>
      </div>
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
            class="h-2 rounded-full bg-[color:var(--color-success)]"
            :style="{ width: `${Math.max(country.percentage, 2)}%` }"
          />
        </div>
        <span class="w-16 text-right text-xs text-[color:var(--text-muted)]">{{ formatPercent(country.percentage) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GeoCityBreakdownItem, GeoCountryBreakdownItem } from '#shared/types/analytics'

type MapMode = 'russia' | 'world'
type RussiaRegionId = 'northwest' | 'central' | 'south' | 'volga' | 'ural' | 'siberia' | 'farEast'

const props = withDefaults(defineProps<{
  countries: readonly GeoCountryBreakdownItem[]
  cities?: readonly GeoCityBreakdownItem[]
  loading?: boolean
}>(), {
  loading: false,
  cities: () => [],
})

const mapModes: MapMode[] = ['russia', 'world']
const activeMode = ref<MapMode>('russia')

const russiaRegions: Array<{ id: RussiaRegionId, name: string, path: string }> = [
  { id: 'northwest', name: 'Северо-Запад', path: 'M35 65 L120 45 L180 70 L120 115 L45 102 Z' },
  { id: 'central', name: 'Центр', path: 'M125 102 L235 82 L305 112 L252 165 L142 152 Z' },
  { id: 'south', name: 'Юг', path: 'M112 170 L265 172 L252 232 L95 216 Z' },
  { id: 'volga', name: 'Поволжье', path: 'M258 90 L355 72 L438 108 L378 165 L282 155 Z' },
  { id: 'ural', name: 'Урал', path: 'M392 80 L482 66 L550 102 L500 158 L408 145 Z' },
  { id: 'siberia', name: 'Сибирь', path: 'M505 95 L598 86 L650 128 L620 182 L530 172 L490 130 Z' },
  { id: 'farEast', name: 'Дальний Восток', path: 'M600 144 L655 132 L670 185 L648 236 L592 214 Z' },
]

const russianCountryVariants = new Set(['россия', 'russia', 'russian federation', 'рф'])

const russiaDistribution = computed(() => {
  const map = new Map<RussiaRegionId, number>()
  for (const region of russiaRegions)
    map.set(region.id, 0)

  for (const city of props.cities) {
    const country = city.country.trim().toLowerCase()
    if (!russianCountryVariants.has(country)) continue

    const lng = city.coordinates?.lng
    if (lng === null || lng === undefined || Number.isNaN(lng)) continue

    const target: RussiaRegionId = lng < 35
      ? 'northwest'
      : lng < 42
        ? 'central'
        : lng < 47
          ? 'south'
          : lng < 56
            ? 'volga'
            : lng < 67
              ? 'ural'
              : lng < 118
                ? 'siberia'
                : 'farEast'

    map.set(target, (map.get(target) ?? 0) + city.scans)
  }

  return map
})

const maxRegionScans = computed(() => Math.max(...Array.from(russiaDistribution.value.values()), 0))
const hasRussiaData = computed(() => maxRegionScans.value > 0)

function regionColor(regionId: RussiaRegionId) {
  const value = russiaDistribution.value.get(regionId) ?? 0
  if (!maxRegionScans.value || !value)
    return '#E5E7EB'

  const ratio = value / maxRegionScans.value
  if (ratio > 0.85) return '#15803D'
  if (ratio > 0.65) return '#16A34A'
  if (ratio > 0.45) return '#22C55E'
  if (ratio > 0.25) return '#86EFAC'
  return '#BBF7D0'
}

function regionTooltip(regionId: RussiaRegionId) {
  const region = russiaRegions.find(item => item.id === regionId)
  const scans = russiaDistribution.value.get(regionId) ?? 0
  const total = Array.from(russiaDistribution.value.values()).reduce((acc, current) => acc + current, 0)
  const pct = total > 0 ? (scans / total) * 100 : 0
  return `${region?.name ?? regionId}: ${scans.toLocaleString('ru-RU')} (${pct.toFixed(1)}%)`
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}
</script>
