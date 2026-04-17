import { z } from 'zod'
import { requireAdmin } from '../../utils/auth'
import { teamService } from '../../services/team.service'

const bodySchema = z.object({
  role: z.enum(['admin', 'editor', 'viewer']),
})

export default defineEventHandler(async (event) => {
  const currentUser = requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, bodySchema.parse)
  const updated = await teamService.updateRole(id, body.role, currentUser)
  return apiSuccess(updated)
})
