import { z } from 'zod'
import { qrService } from '../../services/qr.service'

const bulkVisibilitySchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1, 'Выберите хотя бы один QR-код'),
    visibility: z.enum(['private', 'department', 'public']),
    departmentId: z.string().uuid().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.visibility === 'department' && !value.departmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['departmentId'],
        message: 'Для department visibility требуется departmentId',
      })
    }

    if (value.visibility !== 'department' && value.departmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['departmentId'],
        message: 'departmentId допустим только для department visibility',
      })
    }
  })

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readValidatedBody(event, bulkVisibilitySchema.parse)

  const result = await qrService.bulkUpdateVisibility(body.ids, {
    visibility: body.visibility,
    departmentId: body.departmentId,
  }, user)

  return apiSuccess(result)
})
