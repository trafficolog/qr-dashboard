<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)]">
          {{ $t('analytics.title') }}
        </h1>
        <p class="mt-1 text-sm text-[color:var(--text-muted)] dark:text-[color:var(--text-muted)]">
          {{ $t('analytics.subtitle') }}
        </p>
      </div>
      <AnalyticsDateRangePicker v-model="dateRange" />
    </div>

    <UAlert
      v-if="error"
      icon="i-lucide-alert-circle"
      color="error"
      :description="error"
    />

    <UCard>
      <template #header>
        <h2 class="font-semibold text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)]">
          {{ $t('analytics.kpi.title') }}
        </h2>
      </template>

      <div
        v-if="loadingSections.overview"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <USkeleton
          v-for="i in 4"
          :key="i"
          class="h-24 rounded-xl"
        />
      </div>

      <div
        v-else-if="!overview"
        class="py-10 text-center text-[color:var(--text-muted)]"
      >
        {{ $t('analytics.kpi.empty') }}
      </div>

      <div
        v-else
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <AnalyticsStatCard
          icon="i-lucide-qr-code"
          :label="$t('analytics.kpi.totalQr')"
          :value="overview.totalQrCodes"
          :change="overview.totalQrCodesChange"
          :loading="loadingSections.overview"
          :reduced-motion="reducedMotion"
        />
        <AnalyticsStatCard
          icon="i-lucide-scan-line"
          :label="$t('analytics.kpi.totalScans')"
          :value="overview.totalScans"
          :change="overview.totalScansChange"
          :loading="loadingSections.overview"
          :reduced-motion="reducedMotion"
        />
        <AnalyticsStatCard
          icon="i-lucide-users"
          :label="$t('analytics.kpi.uniqueScans')"
          :value="overview.uniqueScans"
          :change="overview.uniqueScansChange"
          :loading="loadingSections.overview"
          :reduced-motion="reducedMotion"
        />
        <AnalyticsStatCard
          icon="i-lucide-trending-up"
          :label="$t('analytics.kpi.today')"
          :value="overview.scansToday"
          :change="overview.scansTodayChange"
          :loading="loadingSections.overview"
          :reduced-motion="reducedMotion"
        />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-semibold text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)]">
            {{ $t('analytics.compare.scanChartTitle') }}
          </h2>
          <UButton
            size="xs"
            variant="outline"
            :icon="comparePrevious ? 'i-lucide-check' : 'i-lucide-git-compare'"
            :label="$t('analytics.compare.toggle')"
            @click="toggleCompare"
          />
        </div>
      </template>

      <div
        v-if="loadingSections.timeSeries"
        class="h-72"
      >
        <USkeleton class="h-full rounded-xl" />
      </div>

      <div
        v-else-if="!timeSeries.length"
        class="py-10 text-center text-[color:var(--text-muted)]"
      >
        {{ $t('analytics.compare.empty') }}
      </div>

      <AnalyticsScanChart
        v-else
        :data="timeSeries"
        :compare-series="comparePrevious ? compareSeries : null"
        :loading="loadingSections.timeSeries"
        :reduced-motion="reducedMotion"
      />

      <p
        v-if="comparePrevious && compareSeries"
        class="mt-3 text-xs text-[color:var(--text-muted)]"
      >
        {{ $t('analytics.compare.enabledHint') }}
      </p>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)]">
          {{ $t('analytics.topQr.title') }}
        </h2>
      </template>

      <div
        v-if="loadingSections.topQr"
        class="space-y-3"
      >
        <USkeleton
          v-for="i in 5"
          :key="i"
          class="h-12 rounded-lg"
        />
      </div>

      <div
        v-else-if="!topQr.length"
        class="py-10 text-center text-[color:var(--text-muted)]"
      >
        {{ $t('analytics.topQr.empty') }}
      </div>

      <AnalyticsTopQrTable
        v-else
        :data="topQr"
      />
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)]">
          {{ $t('analytics.geo.title') }}
        </h2>
      </template>

      <div
        v-if="loadingSections.geo"
        class="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <USkeleton class="h-64 rounded-xl lg:col-span-2" />
        <USkeleton class="h-64 rounded-xl" />
      </div>

      <div
        v-else-if="!hasGeoData"
        class="py-10 text-center text-[color:var(--text-muted)]"
      >
        {{ $t('analytics.geo.empty') }}
      </div>

      <div
        v-else
        class="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <div class="rounded-xl border border-[color:var(--border-color)] p-4 lg:col-span-2">
          <h3 class="mb-3 text-sm font-medium text-[color:var(--text-primary)]">
            {{ $t('analytics.geo.mapTitle') }}
          </h3>
          <div class="space-y-2">
            <div
              v-for="country in geoTopCountries"
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

        <div class="rounded-xl border border-[color:var(--border-color)] p-4">
          <h3 class="mb-3 text-sm font-medium text-[color:var(--text-primary)]">
            {{ $t('analytics.geo.tableTitle') }}
          </h3>
          <div class="space-y-2">
            <div
              v-for="city in geoTopCities"
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
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)]">
          {{ $t('analytics.devices.title') }}
        </h2>
      </template>

      <div
        v-if="loadingSections.devices"
        class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-52 rounded-xl"
        />
      </div>

      <div
        v-else-if="!hasDeviceData"
        class="py-10 text-center text-[color:var(--text-muted)]"
      >
        {{ $t('analytics.devices.empty') }}
      </div>

      <div
        v-else
        class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <div
          v-for="donut in deviceDonuts"
          :key="donut.key"
          class="rounded-xl border border-[color:var(--border-color)] p-4"
        >
          <h3 class="mb-3 text-sm font-medium text-[color:var(--text-primary)]">
            {{ donut.title }}
          </h3>
          <div class="mb-4 flex items-center justify-center">
            <div
              class="grid size-28 place-items-center rounded-full"
              :style="{ background: donutGradient(donut.items) }"
            >
              <div class="grid size-16 place-items-center rounded-full bg-[color:var(--surface-0)] text-xs text-[color:var(--text-muted)]">
                {{ donutTotal(donut.items).toLocaleString() }}
              </div>
            </div>
          </div>
          <div class="space-y-1.5">
            <div
              v-for="item in donut.items.slice(0, 4)"
              :key="item.name"
              class="flex items-center justify-between text-xs"
            >
              <span class="truncate text-[color:var(--text-muted)]">{{ item.name }}</span>
              <span class="tabular-nums text-[color:var(--text-primary)]">{{ formatPercent(item.percentage) }}</span>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)]">
          {{ $t('analytics.time.title') }}
        </h2>
      </template>

      <div
        v-if="loadingSections.timeDistribution"
        class="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <USkeleton class="h-64 rounded-xl" />
        <USkeleton class="h-64 rounded-xl" />
      </div>

      <div
        v-else-if="!hasTimeDistributionData"
        class="py-10 text-center text-[color:var(--text-muted)]"
      >
        {{ $t('analytics.time.empty') }}
      </div>

      <div
        v-else
        class="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <div class="rounded-xl border border-[color:var(--border-color)] p-4">
          <h3 class="mb-3 text-sm font-medium text-[color:var(--text-primary)]">
            {{ $t('analytics.time.hourly') }}
          </h3>
          <div class="space-y-2">
            <div
              v-for="item in topHourly"
              :key="item.hour"
              class="flex items-center gap-3"
            >
              <span class="w-12 text-xs text-[color:var(--text-muted)]">{{ item.hour }}:00</span>
              <div class="h-2 flex-1 rounded-full bg-[color:var(--surface-2)]">
                <div
                  class="h-2 rounded-full bg-[color:var(--success)]"
                  :style="{ width: `${Math.max(item.percentage, 2)}%` }"
                />
              </div>
              <span class="w-14 text-right text-xs text-[color:var(--text-muted)]">{{ formatPercent(item.percentage) }}</span>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-[color:var(--border-color)] p-4">
          <h3 class="mb-3 text-sm font-medium text-[color:var(--text-primary)]">
            {{ $t('analytics.time.weekday') }}
          </h3>
          <div class="space-y-2">
            <div
              v-for="item in sortedWeekly"
              :key="item.weekday"
              class="flex items-center justify-between rounded-lg bg-[color:var(--surface-1)] px-3 py-2"
            >
              <span class="text-sm text-[color:var(--text-muted)]">{{ weekdayLabel(item.weekday) }}</span>
              <span class="text-sm tabular-nums text-[color:var(--text-primary)]">{{ item.scans.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { DateRange, DeviceBreakdownItem } from '~~/types/analytics'

const { t } = useI18n()
const {
  overview,
  timeSeries,
  topQr,
  geo,
  devices,
  timeDistribution,
  compareSeries,
  comparePrevious,
  loadingSections,
  error,
  fetchAll,
  fetchTimeSeries,
} = useAnalytics()

const reducedMotion = useReducedMotion()

const dateRange = ref<DateRange>({
  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
  to: new Date().toISOString().split('T')[0]!,
})

watch(dateRange, range => fetchAll(range), { immediate: true })

const geoTopCountries = computed(() => geo.value?.countries?.slice(0, 8) ?? [])
const geoTopCities = computed(() => geo.value?.cities?.slice(0, 8) ?? [])
const hasGeoData = computed(() => geoTopCountries.value.length > 0 || geoTopCities.value.length > 0)

const deviceDonuts = computed(() => ([
  { key: 'devices', title: t('analytics.devices.categories.devices'), items: devices.value?.devices ?? [] },
  { key: 'os', title: t('analytics.devices.categories.os'), items: devices.value?.os ?? [] },
  { key: 'browsers', title: t('analytics.devices.categories.browsers'), items: devices.value?.browsers ?? [] },
]))
const hasDeviceData = computed(() => deviceDonuts.value.some(group => group.items.length > 0))

const topHourly = computed(() => (timeDistribution.value?.hourly ?? []).slice().sort((a, b) => b.scans - a.scans).slice(0, 8))
const sortedWeekly = computed(() => (timeDistribution.value?.weekly ?? []).slice().sort((a, b) => a.weekday - b.weekday))
const hasTimeDistributionData = computed(() => topHourly.value.length > 0 || sortedWeekly.value.length > 0)

const donutColors = ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7']

function donutTotal(items: readonly DeviceBreakdownItem[]) {
  return items.reduce((acc, item) => acc + item.count, 0)
}

function donutGradient(items: readonly DeviceBreakdownItem[]) {
  if (!items.length) return 'conic-gradient(#e5e7eb 0 100%)'

  let cursor = 0
  const stops = items.slice(0, donutColors.length).map((item, index) => {
    const start = cursor
    const end = cursor + item.percentage
    cursor = end
    return `${donutColors[index]} ${start}% ${end}%`
  })

  if (cursor < 100)
    stops.push(`#e5e7eb ${cursor}% 100%`)

  return `conic-gradient(${stops.join(', ')})`
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

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

async function toggleCompare() {
  const nextValue = !comparePrevious.value
  comparePrevious.value = nextValue

  if (nextValue)
    await fetchTimeSeries(dateRange.value)
}
</script>
