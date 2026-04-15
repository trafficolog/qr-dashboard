import { z } from 'zod'
import { requireAdmin } from '../../utils/auth'
import { teamService } from '../../services/team.service'
import { emailService } from '../../services/email.service'
import { validateBody } from '../../utils/zod-errors'

const bodySchema = z.object({
  email: z.string().email('forms.errors.email').toLowerCase(),
  role: z.enum(['admin', 'editor', 'viewer']).default('editor'),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await validateBody(event, bodySchema)
  const user = await teamService.invite(body.email, body.role)
  await emailService.sendInviteEmail(body.email)
  return apiSuccess(user)
})
