export interface ApiMeta {
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

export type QrVisibility = 'private' | 'department' | 'public'
export type QrListScope = 'mine' | 'department' | 'public' | 'all'

export interface QrListQuery {
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'title' | 'totalScans'
  sortOrder?: 'asc' | 'desc'
  search?: string
  status?: 'active' | 'paused' | 'expired' | 'archived'
  visibility?: QrVisibility
  departmentId?: string
  scope?: QrListScope
  folderId?: string
  tags?: string
  dateFrom?: string
  dateTo?: string
}

export interface CreateQrRequest {
  title: string
  destinationUrl: string
  type?: 'dynamic' | 'static'
  visibility?: QrVisibility
  departmentId?: string | null
  description?: string
  style?: Record<string, unknown>
  utmParams?: Record<string, string>
  folderId?: string
  tagIds?: string[]
  expiresAt?: string
}

export interface UpdateQrRequest {
  title?: string
  destinationUrl?: string
  description?: string | null
  status?: 'active' | 'paused' | 'expired' | 'archived'
  visibility?: QrVisibility
  departmentId?: string | null
  style?: Record<string, unknown>
  utmParams?: Record<string, string>
  folderId?: string | null
  tagIds?: string[]
  expiresAt?: string | null
}

export interface ApiSuccessResponse<T> {
  data: T
  meta?: ApiMeta
}

export interface ApiErrorResponse {
  data: null
  error: {
    message: string
    statusCode: number
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
