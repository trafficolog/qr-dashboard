import { requireAdmin } from '../../../../utils/auth'
import { departmentsService } from '../../../../services/departments.service'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID не указан' })
  await departmentsService.remove(id)
  return apiSuccess({ success: true })
})
