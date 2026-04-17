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

export interface GeoBreakdownItem {
  country: string
  city?: string
  scans: number
  percentage: number
}

export interface DeviceBreakdown {
  devices: { name: string, count: number, percentage: number }[]
  os: { name: string, count: number, percentage: number }[]
  browsers: { name: string, count: number, percentage: number }[]
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
