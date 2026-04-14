<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ $t('analytics.title') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
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

    <!-- Stat cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <AnalyticsStatCard
        icon="i-lucide-qr-code"
        label="Всего QR-кодов"
        :value="overview?.totalQrCodes"
        :change="overview?.totalQrCodesChange"
        :loading="loading"
      />
      <AnalyticsStatCard
        icon="i-lucide-scan-line"
        label="Всего сканирований"
        :value="overview?.totalScans"
        :change="overview?.totalScansChange"
        :loading="loading"
      />
      <AnalyticsStatCard
        icon="i-lucide-users"
        label="Уникальных"
        :value="overview?.uniqueScans"
        :change="overview?.uniqueScansChange"
        :loading="loading"
      />
      <AnalyticsStatCard
        icon="i-lucide-trending-up"
        label="Сегодня"
        :value="overview?.scansToday"
        :change="overview?.scansTodayChange"
        :loading="loading"
      />
    </div>

    <!-- Scan Chart -->
    <UCard>
      <template #header>
        <h2 class="font-semibold text-gray-900 dark:text-white">
          Динамика сканирований
        </h2>
      </template>
      <AnalyticsScanChart
        :data="timeSeries"
        :loading="loading"
      />
    </UCard>

    <!-- Top QR Table -->
    <UCard>
      <template #header>
        <h2 class="font-semibold text-gray-900 dark:text-white">
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

const dateRange = ref<DateRange>({
  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
  to: new Date().toISOString().split('T')[0]!,
})

watch(dateRange, range => fetchAll(range), { immediate: true })
</script>
