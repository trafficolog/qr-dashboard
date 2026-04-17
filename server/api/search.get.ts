import { z } from 'zod'
import { ilike, or, eq, and } from 'drizzle-orm'
import { db } from '../db'
import { qrCodes, folders } from '../db/schema'

const querySchema = z.object({
  q: z.string().min(1).max(200),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const { q } = await getValidatedQuery(event, querySchema.parse)

  const pattern = `%${q}%`

  // QR-коды: поиск по title или shortCode (только свои, если не admin)
  const qrWhere = user.role === 'admin'
    ? or(ilike(qrCodes.title, pattern), ilike(qrCodes.shortCode, pattern))
    : and(
        eq(qrCodes.createdBy, user.id),
        or(ilike(qrCodes.title, pattern), ilike(qrCodes.shortCode, pattern)),
      )

  const [qrRows, folderRows] = await Promise.all([
    db
      .select({ id: qrCodes.id, title: qrCodes.title, shortCode: qrCodes.shortCode })
      .from(qrCodes)
      .where(qrWhere)
      .limit(10),

    db
      .select({ id: folders.id, name: folders.name })
      .from(folders)
      .where(
        user.role === 'admin'
          ? ilike(folders.name, pattern)
          : and(eq(folders.createdBy, user.id), ilike(folders.name, pattern)),
      )
      .limit(10),
  ])

  return apiSuccess({ qrs: qrRows, folders: folderRows })
})
