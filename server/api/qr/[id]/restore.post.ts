import { z } from 'zod'
import { qrService } from '../../../services/qr.service'

/**
 * POST /api/qr/:id/restore
 * Recreates a previously deleted QR code from a client-side snapshot.
 * The :id parameter is the original ID (for reference/idempotency checks).
 * The actual QR data comes from the request body.
 */
const bodySchema = z.object({
  title: z.string().min(1).max(255),
  destinationUrl: z.string().url(),
  type: z.enum(['dynamic', 'static']).optional(),
  description: z.string().nullable().optional(),
  style: z.record(z.unknown()).optional(),
  utmParams: z.record(z.string()).optional(),
  folderId: z.string().uuid().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)

  const restored = await qrService.createQr(
    {
      title: body.title,
      destinationUrl: body.destinationUrl,
      type: body.type,
      description: body.description ?? undefined,
      style: body.style,
      utmParams: body.utmParams,
      folderId: body.folderId ?? undefined,
      expiresAt: body.expiresAt ?? undefined,
    },
    user,
  )

  return apiSuccess(restored)
})
