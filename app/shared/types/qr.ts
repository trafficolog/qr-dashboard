export type QrStatus = 'active' | 'paused' | 'expired' | 'archived'
export type QrType = 'dynamic' | 'static'
export type QrVisibility = 'private' | 'department' | 'public'

export interface QrStyle {
  foregroundColor?: string
  backgroundColor?: string
  gradientType?: 'linear' | 'radial'
  gradientColors?: [string, string]
  moduleStyle?: 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded'
  cornerStyle?: 'square' | 'rounded' | 'dot' | 'extra-rounded'
  cornerColor?: string
  logo?: {
    url: string
    size: number
    padding: number
    borderRadius: number
  }
  frame?: {
    style: 'none' | 'banner-bottom' | 'banner-top' | 'rounded-box' | 'tooltip'
    text: string
    textColor: string
    backgroundColor: string
    fontSize: number
  }
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

export interface UtmParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
}

export interface QrCode {
  id: string
  shortCode: string
  title: string
  description: string | null
  type: QrType
  status: QrStatus
  visibility?: QrVisibility
  departmentId?: string | null
  destinationUrl: string
  style: QrStyle
  utmParams: UtmParams | null
  folderId: string | null
  createdBy: string
  expiresAt: Date | null
  totalScans: number
  uniqueScans: number
  createdAt: Date
  updatedAt: Date
  departmentName?: string | null
}

export interface QrDestination {
  id: string
  qrCodeId: string
  url: string
  weight: number
  label: string | null
  clicks: number
  isActive: boolean
  createdAt: Date
}
