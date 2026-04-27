<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-bold text-[color:var(--text-color)]">
        {{ $t('nav.dashboard') }}
      </h1>
      <div
        class="flex gap-3"
        data-onboarding="dashboard-actions"
      >
        <Button
          as-child
          size="small"
        >
          <NuxtLink
            to="/qr/create"
            class="inline-flex items-center gap-2"
          >
            <Icon
              name="i-lucide-plus"
              class="size-4"
            />
            <span>Создать QR</span>
          </NuxtLink>
        </Button>
        <Button
          as-child
          size="small"
          severity="secondary"
          outlined
        >
          <NuxtLink
            to="/qr"
            class="inline-flex items-center gap-2"
          >
            <Icon
              name="i-lucide-qr-code"
              class="size-4"
            />
            <span>Все QR-коды</span>
          </NuxtLink>
        </Button>
      </div>
    </div>

    <div data-onboarding="dashboard-date-range">
      <AnalyticsDateRangePicker v-model="dateRange" />
    </div>

    <Message
      v-if="error"
      severity="error"
    >
      {{ error }}
    </Message>

    <div
      v-if="loading"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <Skeleton
        v-for="i in 4"
        :key="i"
        class="h-24 rounded-xl"
      />
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      data-onboarding="dashboard-stats"
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

    <Skeleton
      v-if="loading"
      class="h-72 rounded-xl"
    />

    <section
      v-else
      class="rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-card)] p-5"
    >
      <h2 class="font-semibold text-[color:var(--text-color)]">
        Динамика сканирований
      </h2>
      <AnalyticsScanChart
        :data="timeSeries"
        :loading="loading"
      />
    </section>

    <section
      class="rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-card)] p-5"
      data-onboarding="dashboard-top-qr"
    >
      <div class="mb-3 flex items-center justify-between">
        <h2 class="font-semibold text-[color:var(--text-color)]">
          Топ QR-кодов
        </h2>
        <Button
          as-child
          variant="text"
          size="small"
        >
          <NuxtLink
            to="/analytics"
            class="inline-flex items-center gap-2"
          >
            <span>Подробнее</span>
            <Icon
              name="i-lucide-arrow-right"
              class="size-4"
            />
          </NuxtLink>
        </Button>
      </div>
      <AnalyticsTopQrTable
        :data="topQr"
        :loading="loading"
      />
    </section>

    <SharedOnboardingOverlay
      v-if="shouldShow"
      @close="complete"
    />
  </div>
</template>

<script setup lang="ts">
import type { DateRange } from '#shared/types/analytics'

const { overview, timeSeries, topQr, loading, error, fetchAll } = useAnalytics()
const { shouldShow, complete } = useOnboarding()

const dateRange = ref<DateRange>({
  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
  to: new Date().toISOString().split('T')[0]!,
})

watch(dateRange, range => fetchAll(range), { immediate: true })
</script>
