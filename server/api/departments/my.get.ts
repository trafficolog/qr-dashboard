import { requireAuth } from '../../utils/auth'
import { departmentsService } from '../../services/departments.service'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const departments = await departmentsService.listForUser(user.id)
  return apiSuccess(departments)
})
