import type { H3Event } from 'h3'
import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { bulkService } from '../../services/bulk.service'
import { QR_DESCRIPTION_MAX_LENGTH, QR_TITLE_MAX_LENGTH, QR_UTM_MAX_LENGTH } from '../../utils/qr-payload-schemas'

const MAX_ROWS = 500
const BULK_BODY_LIMIT_BYTES = 5 * 1024 * 1024

const rowSchema = z.object({
  title: z.string().trim().min(1).max(QR_TITLE_MAX_LENGTH),
  destination_url: z.string().url(),
  description: z.string().max(QR_DESCRIPTION_MAX_LENGTH).optional(),
  utm_source: z.string().max(QR_UTM_MAX_LENGTH).optional(),
  utm_medium: z.string().max(QR_UTM_MAX_LENGTH).optional(),
  utm_campaign: z.string().max(QR_UTM_MAX_LENGTH).optional(),
  utm_content: z.string().max(QR_UTM_MAX_LENGTH).optional(),
  expires_at: z.string().datetime().optional(),
  folder: z.string().max(100).optional(),
  tags: z.string().max(500).optional(),
}).strict()

const bodySchema = z.object({
  rows: z.array(rowSchema).min(1).max(MAX_ROWS),
}).strict()

function ensureBulkPayloadSize(event: H3Event, limitBytes: number) {
  const contentLengthHeader = getHeader(event, 'content-length')
  const contentLength = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : Number.NaN

  if (Number.isFinite(contentLength) && contentLength > limitBytes) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Payload Too Large',
      message: 'Payload Too Large',
    })
  }
}

function throwIfPayloadTooLarge(error: unknown): never {
  const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
    ? Number((error as { statusCode?: unknown }).statusCode)
    : Number.NaN
  const statusMessage = typeof error === 'object' && error !== null && 'statusMessage' in error
    ? String((error as { statusMessage?: unknown }).statusMessage ?? '')
    : ''
  const message = typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message?: unknown }).message ?? '')
    : ''

  if (
    statusCode === 413
    || /payload too large|entity too large|request body too large/i.test(statusMessage)
    || /payload too large|entity too large|request body too large/i.test(message)
  ) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Payload Too Large',
      message: 'Payload Too Large',
    })
  }

  throw error
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  ensureBulkPayloadSize(event, BULK_BODY_LIMIT_BYTES)

  let body: z.infer<typeof bodySchema>
  try {
    body = await readValidatedBody(event, bodySchema.parse)
  }
  catch (error) {
    throwIfPayloadTooLarge(error)
  }

  // Server-side validation
  const { valid, errors: validationErrors } = bulkService.validateRows(body.rows)

  if (valid.length === 0) {
    throw createError({
      statusCode: 422,
      message: 'Нет корректных строк для создания',
      data: { errors: validationErrors },
    })
  }

  try {
    const result = await bulkService.bulkCreate(valid, user)

    return apiSuccess({
      created: result.created,
      failed: result.failed + validationErrors.length,
      errors: [...validationErrors, ...result.errors],
    })
  }
  catch (error) {
    if (validationErrors.length === 0) {
      throw error
    }

    const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
      ? Number((error as { statusCode?: unknown }).statusCode)
      : 422

    const createErrors = typeof error === 'object' && error !== null && 'data' in error
      ? ((error as { data?: { errors?: unknown } }).data?.errors ?? [])
      : []

    throw createError({
      statusCode,
      message: 'Не удалось создать ни одного QR-кода',
      data: {
        created: 0,
        failed: valid.length + validationErrors.length,
        errors: [...validationErrors, ...(Array.isArray(createErrors) ? createErrors : [])],
      },
    })
  }
})
