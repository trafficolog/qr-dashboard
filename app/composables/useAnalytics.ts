import type {
  AnalyticsOverview,
  ScanTimeSeriesPoint,
  TopQrCode,
  DateRange,
} from '~~/types/analytics'

interface ApiData<T> { data: T }

export function useAnalytics() {
  const overview = ref<AnalyticsOverview | null>(null)
  const timeSeries = ref<ScanTimeSeriesPoint[]>([])
  const topQr = ref<TopQrCode[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function buildParams(range: DateRange) {
    const from = new Date(range.from)
    from.setHours(0, 0, 0, 0)
    const to = new Date(range.to)
    to.setHours(23, 59, 59, 999)
    return {
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
    }
  }

  async function fetchAll(range: DateRange) {
    loading.value = true
    error.value = null

    try {
      const params = buildParams(range)

      const [ov, ts, top] = await Promise.all([
        $fetch<ApiData<AnalyticsOverview>>('/api/analytics/overview', { query: params }),
        $fetch<ApiData<ScanTimeSeriesPoint[]>>('/api/analytics/scans', { query: params }),
        $fetch<ApiData<TopQrCode[]>>('/api/analytics/top-qr', { query: params }),
      ])

      overview.value = ov.data
      timeSeries.value = ts.data
      topQr.value = top.data
    }
    catch (err: unknown) {
      const e = err as { data?: { message?: string } }
      error.value = e?.data?.message ?? 'Ошибка загрузки аналитики'
    }
    finally {
      loading.value = false
    }
  }

  return {
    overview: readonly(overview),
    timeSeries: readonly(timeSeries),
    topQr: readonly(topQr),
    loading: readonly(loading),
    error: readonly(error),
    fetchAll,
  }
}
