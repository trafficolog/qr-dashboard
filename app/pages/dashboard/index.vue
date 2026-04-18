<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h1 class="text-2xl font-bold text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)]">
        {{ $t('nav.dashboard') }}
      </h1>
      <div class="flex gap-3">
        <UButton
          icon="i-lucide-plus"
          label="Создать QR"
          to="/qr/create"
          size="sm"
        />
        <UButton
          icon="i-lucide-qr-code"
          label="Все QR-коды"
          to="/qr"
          variant="outline"
          size="sm"
        />
      </div>
    </div>
    <!-- Date range picker -->
    <AnalyticsDateRangePicker v-model="dateRange" />
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
    <!-- Chart skeleton -->
    <USkeleton
      v-if="loading"
      class="h-72 rounded-xl"
    />
    <!-- Chart -->
    <UCard v-else>
      <template #header>
        <h2 class="font-semibold text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)]">
          Динамика сканирований
        </h2>
      </template>
      <AnalyticsScanChart
        :data="timeSeries"
        :loading="loading"
      />
    </UCard>
    <!-- Top QR -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)]">
            Топ QR-кодов
          </h2>
          <UButton
            to="/analytics"
            variant="ghost"
            size="sm"
            label="Подробнее"
            trailing-icon="i-lucide-arrow-right"
          />
        </div>
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
