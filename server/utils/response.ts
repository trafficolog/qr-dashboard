interface ApiMeta {
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

interface ApiSuccessResponse<T> {
  data: T
  meta?: ApiMeta
}

export function apiSuccess<T>(data: T, meta?: ApiMeta): ApiSuccessResponse<T> {
  return { data, ...(meta && { meta }) }
}

export function apiError(message: string, statusCode: number = 400): never {
  throw createError({
    statusCode,
    statusMessage: message,
    data: {
      data: null,
      error: { message, statusCode },
    },
  })
}
