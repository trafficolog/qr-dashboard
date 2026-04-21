import type {
  AnalyticsOverview,
  AnalyticsSectionLoading,
  CompareSeries,
  DeviceBreakdown,
  GeoBreakdown,
  ScanTimeSeriesPoint,
  TimeDistribution,
  TopQrCode,
  DateRange,
} from '#shared/types/analytics'

interface ApiData<T> { data: T }
type ScanSeriesResponse = ScanTimeSeriesPoint[] | CompareSeries<ScanTimeSeriesPoint[]>

export function useAnalytics() {
  const { t } = useI18n()

  const overview = ref<AnalyticsOverview | null>(null)
  const timeSeries = ref<ScanTimeSeriesPoint[]>([])
  const geo = ref<GeoBreakdown | null>(null)
  const devices = ref<DeviceBreakdown | null>(null)
  const timeDistribution = ref<TimeDistribution | null>(null)
  const comparePrevious = ref(false)
  const compareSeries = ref<CompareSeries<ScanTimeSeriesPoint[]> | null>(null)
  const topQr = ref<TopQrCode[]>([])
  const loadingSections = ref<AnalyticsSectionLoading>({
    overview: false,
    timeSeries: false,
    topQr: false,
    geo: false,
    devices: false,
    timeDistribution: false,
  })
  const loading = computed(() => Object.values(loadingSections.value).some(Boolean))
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

  function resolveErrorMessage(err: unknown) {
    const e = err as { data?: { message?: string } }
    return e?.data?.message ?? t('analytics.errors.loadFailed')
  }

  async function fetchOverview(range: DateRange) {
    loadingSections.value.overview = true
    try {
      const params = buildParams(range)
      const ov = await $fetch<ApiData<AnalyticsOverview>>('/api/analytics/overview', { query: params })
      overview.value = ov.data
    }
    finally {
      loadingSections.value.overview = false
    }
  }

  async function fetchTimeSeries(range: DateRange) {
    loadingSections.value.timeSeries = true
    try {
      const params = buildParams(range)
      const ts = await $fetch<ApiData<ScanSeriesResponse>>('/api/analytics/scans', {
        query: {
          ...params,
          comparePrevious: comparePrevious.value,
        },
      })

      if (comparePrevious.value && !Array.isArray(ts.data)) {
        compareSeries.value = ts.data
        timeSeries.value = ts.data.current
      }
      else {
        const currentSeries = Array.isArray(ts.data) ? ts.data : ts.data.current
        compareSeries.value = null
        timeSeries.value = currentSeries
      }
    }
    finally {
      loadingSections.value.timeSeries = false
    }
  }

  async function fetchTopQr(range: DateRange) {
    loadingSections.value.topQr = true
    try {
      const params = buildParams(range)
      const top = await $fetch<ApiData<TopQrCode[]>>('/api/analytics/top-qr', { query: params })
      topQr.value = top.data
    }
    finally {
      loadingSections.value.topQr = false
    }
  }

  async function fetchGeo(range: DateRange) {
    loadingSections.value.geo = true
    try {
      const params = buildParams(range)
      const res = await $fetch<ApiData<GeoBreakdown>>('/api/analytics/geo', { query: params })
      geo.value = res.data
    }
    finally {
      loadingSections.value.geo = false
    }
  }

  async function fetchDevices(range: DateRange) {
    loadingSections.value.devices = true
    try {
      const params = buildParams(range)
      const res = await $fetch<ApiData<DeviceBreakdown>>('/api/analytics/devices', { query: params })
      devices.value = res.data
    }
    finally {
      loadingSections.value.devices = false
    }
  }

  async function fetchTimeDistribution(range: DateRange) {
    loadingSections.value.timeDistribution = true
    try {
      const params = buildParams(range)
      const res = await $fetch<ApiData<TimeDistribution>>('/api/analytics/time-distribution', { query: params })
      timeDistribution.value = res.data
    }
    finally {
      loadingSections.value.timeDistribution = false
    }
  }

  async function fetchAll(range: DateRange) {
    error.value = null

    try {
      await Promise.all([
        fetchOverview(range),
        fetchTimeSeries(range),
        fetchTopQr(range),
        fetchGeo(range),
        fetchDevices(range),
        fetchTimeDistribution(range),
      ])
    }
    catch (err: unknown) {
      error.value = resolveErrorMessage(err)
    }
  }

  return {
    overview: readonly(overview),
    timeSeries: readonly(timeSeries),
    geo: readonly(geo),
    devices: readonly(devices),
    timeDistribution: readonly(timeDistribution),
    compareSeries: readonly(compareSeries),
    comparePrevious,
    topQr: readonly(topQr),
    loading: readonly(loading),
    loadingSections: readonly(loadingSections),
    error: readonly(error),
    fetchGeo,
    fetchDevices,
    fetchTimeDistribution,
    fetchTimeSeries,
    fetchAll,
  }
}
