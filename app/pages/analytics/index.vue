<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

    <!-- Error -->
    <UAlert
      v-if="error"
      icon="i-lucide-alert-circle"
      color="error"
      :description="error"
    />

    <!-- Stat cards skeleton -->
    <div
      v-if="loading"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <USkeleton
        v-for="i in 4"
        :key="i"
        class="h-24 rounded-xl"
      />
    </div>

    <!-- Stat cards -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <AnalyticsStatCard
        icon="i-lucide-qr-code"
        label="Всего QR-кодов"
        :value="overview?.totalQrCodes"
        :change="overview?.totalQrCodesChange"
        :loading="loading"
        :reduced-motion="reducedMotion"
      />
      <AnalyticsStatCard
        icon="i-lucide-scan-line"
        label="Всего сканирований"
        :value="overview?.totalScans"
        :change="overview?.totalScansChange"
        :loading="loading"
        :reduced-motion="reducedMotion"
      />
      <AnalyticsStatCard
        icon="i-lucide-users"
        label="Уникальных"
        :value="overview?.uniqueScans"
        :change="overview?.uniqueScansChange"
        :loading="loading"
        :reduced-motion="reducedMotion"
      />
      <AnalyticsStatCard
        icon="i-lucide-trending-up"
        label="Сегодня"
        :value="overview?.scansToday"
        :change="overview?.scansTodayChange"
        :loading="loading"
        :reduced-motion="reducedMotion"
      />
    </div>

    <!-- Scan Chart skeleton -->
    <USkeleton
      v-if="loading"
      class="h-72 rounded-xl"
    />

    <!-- Scan Chart -->
    <UCard v-else>
      <template #header>
        <h2 class="font-semibold text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)]">
          Динамика сканирований
        </h2>
      </template>
      <AnalyticsScanChart
        :data="timeSeries"
        :loading="loading"
        :reduced-motion="reducedMotion"
      />
    </UCard>

    <!-- Top QR Table skeleton -->
    <div
      v-if="loading"
      class="space-y-3"
    >
      <USkeleton
        v-for="i in 5"
        :key="i"
        class="h-12 rounded-lg"
      />
    </div>

    <!-- Top QR Table -->
    <UCard v-else>
      <template #header>
        <h2 class="font-semibold text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)]">
          Топ QR-кодов по сканированиям
        </h2>
      </template>
      <AnalyticsTopQrTable
        :data="topQr"
        :loading="loading"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { DateRange } from '~~/types/analytics'

const { overview, timeSeries, topQr, loading, error, fetchAll } = useAnalytics()
const reducedMotion = useReducedMotion()

const dateRange = ref<DateRange>({
  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
  to: new Date().toISOString().split('T')[0]!,
})

watch(dateRange, range => fetchAll(range), { immediate: true })
</script>
