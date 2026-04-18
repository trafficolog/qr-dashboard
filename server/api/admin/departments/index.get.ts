import { requireAdmin } from '../../../utils/auth'
import { departmentsService } from '../../../services/departments.service'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const items = await departmentsService.list()
  return apiSuccess(items)
})
