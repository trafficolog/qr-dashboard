import { z } from 'zod'
import { requireAdmin } from '../../../utils/auth'
import { departmentsService } from '../../../services/departments.service'
import { validateBody } from '../../../utils/zod-errors'

const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, 'forms.errors.required').max(100, 'forms.errors.maxLength'),
  slug: z.string().trim().min(1, 'forms.errors.required').max(100, 'forms.errors.maxLength').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500, 'forms.errors.maxLength').optional().nullable(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).optional().nullable(),
  headUserId: z.string().uuid().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await validateBody(event, createDepartmentSchema)
  const created = await departmentsService.create(body)
  return apiSuccess(created)
})
