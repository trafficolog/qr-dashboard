export interface ApiMeta {
  total?: number
  page?: number
  limit?: number
  totalPages?: number
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
