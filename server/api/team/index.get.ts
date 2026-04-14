import { requireAdmin } from '../../utils/auth'
import { teamService } from '../../services/team.service'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const members = await teamService.list()
  return apiSuccess(members)
})
