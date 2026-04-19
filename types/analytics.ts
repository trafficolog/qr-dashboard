export interface AnalyticsOverview {
  totalQrCodes: number
  totalScans: number
  uniqueScans: number
  scansToday: number
  totalQrCodesChange: number
  totalScansChange: number
  uniqueScansChange: number
  scansTodayChange: number
}

export interface ScanTimeSeriesPoint {
  date: string
  totalScans: number
  uniqueScans: number
}

export interface GeoCoordinates {
  lat: number | null
  lng: number | null
}

export interface GeoCountryBreakdownItem {
  country: string
  scans: number
  percentage: number
  coordinates?: GeoCoordinates | null
}

export interface GeoCityBreakdownItem {
  country: string
  city: string
  scans: number
  percentage: number
  coordinates?: GeoCoordinates | null
}

export interface GeoBreakdown {
  countries: GeoCountryBreakdownItem[]
  cities: GeoCityBreakdownItem[]
  totalCountries: number
  totalCities: number
}

export interface DeviceBreakdownItem {
  name: string
  count: number
  percentage: number
}

export interface DeviceBreakdown {
  devices: DeviceBreakdownItem[]
  os: DeviceBreakdownItem[]
  browsers: DeviceBreakdownItem[]
}

export interface HourlyDistributionItem {
  hour: number
  scans: number
  percentage: number
}

export interface WeeklyDistributionItem {
  weekday: number
  scans: number
  percentage: number
}

export interface TimeDistribution {
  hourly: HourlyDistributionItem[]
  weekly: WeeklyDistributionItem[]
}

export interface CompareSeries<T> {
  current: T
  previous: T
}

export type ScanTimeSeriesCompare = CompareSeries<ScanTimeSeriesPoint[]>

export interface AnalyticsSectionLoading {
  overview: boolean
  timeSeries: boolean
  topQr: boolean
  geo: boolean
  devices: boolean
  timeDistribution: boolean
}

export interface TopQrCode {
  id: string
  title: string
  shortCode: string
  totalScans: number
  uniqueScans: number
}

export interface DateRange {
  from: string
  to: string
}
