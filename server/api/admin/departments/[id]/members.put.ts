import { z } from 'zod'
import { requireAdmin } from '../../../../utils/auth'
import { departmentsService } from '../../../../services/departments.service'
import { validateBody } from '../../../../utils/zod-errors'

const putMembersSchema = z.object({
  members: z.array(z.object({
    userId: z.string().uuid(),
    role: z.enum(['member', 'head']).default('member'),
  })).default([]),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })
  const body = await validateBody(event, putMembersSchema)
  const departments = await departmentsService.setMembers(id, body.members)
  return apiSuccess(departments)
})
