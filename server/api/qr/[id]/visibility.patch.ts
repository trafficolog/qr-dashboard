import { z } from 'zod'
import { qrService } from '../../../services/qr.service'

const visibilitySchema = z
  .object({
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
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID обязателен' })
  }

  const body = await readValidatedBody(event, visibilitySchema.parse)
  const qr = await qrService.updateVisibility(id, body, user)
  return apiSuccess(qr)
})
