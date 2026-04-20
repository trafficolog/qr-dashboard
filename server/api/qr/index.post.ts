import { z } from 'zod'
import { qrService } from '../../services/qr.service'
import { qrStyleSchema, qrUtmSchema, QR_DESCRIPTION_MAX_LENGTH, QR_TITLE_MAX_LENGTH } from '../../utils/qr-payload-schemas'

const createSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(QR_TITLE_MAX_LENGTH),
  destinationUrl: z.string().url('Некорректный URL'),
  type: z.enum(['dynamic', 'static']).default('dynamic'),
  visibility: z.enum(['private', 'department', 'public']).default('private'),
  departmentId: z.string().uuid().optional().nullable(),
  description: z.string().max(QR_DESCRIPTION_MAX_LENGTH).optional(),
  style: qrStyleSchema.optional(),
  utmParams: qrUtmSchema.optional(),
  folderId: z.preprocess(
    value => value === '' || value === null ? undefined : value,
    z.string().uuid().optional(),
  ),
  tagIds: z.preprocess(
    value => (value === null || (Array.isArray(value) && value.length === 0)) ? undefined : value,
    z.array(z.string().uuid()).optional(),
  ),
  expiresAt: z.string().datetime().optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readValidatedBody(event, createSchema.parse)

  const qr = await qrService.createQr(body, user)

  setResponseStatus(event, 201)
  return apiSuccess(qr)
})
