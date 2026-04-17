import { sql } from 'drizzle-orm'
import { requireAuth } from '../../../../utils/auth'
import { qrService } from '../../../../services/qr.service'
import { db } from '../../../../db'
import { scanEvents } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')!

  // Verify access (throws 403/404 if not accessible)
  const qr = await qrService.getQrById(id, user)

  // Last 30 days time series (daily)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const timeSeries = await db.execute<{ date: string, scans: string, unique_scans: string }>(sql`
    SELECT
      DATE(scanned_at)                                AS date,
      COUNT(*)                                        AS scans,
      COUNT(*) FILTER (WHERE is_unique = true)        AS unique_scans
    FROM ${scanEvents}
    WHERE qr_code_id = ${id}::uuid
      AND scanned_at >= ${thirtyDaysAgo}
    GROUP BY DATE(scanned_at)
    ORDER BY date ASC
  `)

  return apiSuccess({
    id: qr.id,
    title: qr.title,
    shortCode: qr.shortCode,
    status: qr.status,
    destinationUrl: qr.destinationUrl,
    totalScans: qr.totalScans,
    uniqueScans: qr.uniqueScans,
    createdAt: qr.createdAt,
    recentScans: timeSeries.rows.map(r => ({
      date: r.date,
      scans: Number(r.scans),
      uniqueScans: Number(r.unique_scans),
    })),
  })
})
