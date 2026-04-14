import { requireAdmin } from '../../utils/auth'
import { teamService } from '../../services/team.service'

export default defineEventHandler(async (event) => {
  const currentUser = requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  await teamService.remove(id, currentUser)
  return apiSuccess({ id })
})
