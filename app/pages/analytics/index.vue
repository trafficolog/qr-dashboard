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

    <SharedEmptyState
      v-else-if="showEmptyAnalytics"
      illustration="/illustrations/empty-analytics.svg"
      :illustration-alt="$t('analytics.empty.illustrationAlt')"
      :title="$t('analytics.empty.title')"
      :description="$t('analytics.empty.description')"
    />

    <template v-else>
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

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <AnalyticsGeoMap
            class="lg:col-span-2"
            :countries="geoTopCountries"
            :cities="geoTopCities"
            :loading="loadingSections.geo"
          />
          <AnalyticsGeoTable
            :cities="geoTopCities"
            :loading="loadingSections.geo"
          />
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)]">
            {{ $t('analytics.devices.title') }}
          </h2>
        </template>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="donut in deviceDonuts"
            :key="donut.key"
            class="rounded-xl border border-[color:var(--border-color)] p-4"
            :data-testid="`device-block-${donut.key}`"
          >
            <template v-if="loadingSections.devices || hasDeviceData(donut.items)">
              <AnalyticsDevicePieChart
                :title="donut.title"
                :items="donut.items"
                :loading="loadingSections.devices"
              />
              <AnalyticsDeviceBreakdown
                :items="donut.items"
                :loading="loadingSections.devices"
              />
            </template>
            <div
              v-else
              class="py-8 text-center text-sm text-[color:var(--text-muted)]"
              data-testid="devices-empty-state"
            >
              {{ $t('analytics.devices.empty') }}
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

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AnalyticsHourlyChart
            :items="topHourly"
            :loading="loadingSections.timeDistribution"
          />
          <AnalyticsWeekdayChart
            :items="sortedWeekly"
            :loading="loadingSections.timeDistribution"
          />
        </div>
      </UCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { DateRange } from '#shared/types/analytics'

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

const deviceDonuts = computed(() => ([
  { key: 'devices', title: t('analytics.devices.categories.devices'), items: devices.value?.devices ?? [] },
  { key: 'os', title: t('analytics.devices.categories.os'), items: devices.value?.os ?? [] },
  { key: 'browsers', title: t('analytics.devices.categories.browsers'), items: devices.value?.browsers ?? [] },
]))

function hasDeviceData(items: readonly { count: number }[]) {
  return items.some(item => item.count > 0)
}

const topHourly = computed(() => (timeDistribution.value?.hourly ?? []).slice().sort((a, b) => a.hour - b.hour))
const sortedWeekly = computed(() => (timeDistribution.value?.weekly ?? []).slice().sort((a, b) => a.weekday - b.weekday))
const showEmptyAnalytics = computed(() => (
  !loadingSections.value.overview
  && !overview.value
  && !timeSeries.value.length
  && !topQr.value.length
  && !error.value
))

async function toggleCompare() {
  const nextValue = !comparePrevious.value
  comparePrevious.value = nextValue

  if (nextValue)
    await fetchTimeSeries(dateRange.value)
}
</script>
