import { sql } from 'drizzle-orm'
import { db } from '../db'

/**
 * Aggregates scan_events for a given UTC date into scan_daily_stats.
 * Uses UPSERT to be safe to re-run.
 */
export const aggregationService = {
  async aggregateDay(date: Date): Promise<void> {
    // Normalise to yyyy-mm-dd in UTC
    const dateStr = date.toISOString().slice(0, 10)
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`)
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`)

    await db.execute(sql`
      INSERT INTO scan_daily_stats (date, qr_code_id, total_scans, unique_scans, country_breakdown, device_breakdown)
      SELECT
        ${dateStr}::date                                        AS date,
        se.qr_code_id,
        COUNT(*)                                               AS total_scans,
        COUNT(*) FILTER (WHERE se.is_unique = true)            AS unique_scans,
        COALESCE(
          jsonb_object_agg(
            COALESCE(se.country, 'unknown'),
            se.country_count
          ) FILTER (WHERE se.country IS NOT NULL OR true),
          '{}'::jsonb
        ),
        COALESCE(
          jsonb_object_agg(
            COALESCE(se.device_type, 'unknown'),
            se.device_count
          ) FILTER (WHERE se.device_type IS NOT NULL OR true),
          '{}'::jsonb
        )
      FROM (
        SELECT
          qr_code_id,
          is_unique,
          country,
          device_type,
          COUNT(*) OVER (PARTITION BY qr_code_id, country)      AS country_count,
          COUNT(*) OVER (PARTITION BY qr_code_id, device_type)  AS device_count
        FROM scan_events
        WHERE scanned_at >= ${dayStart} AND scanned_at <= ${dayEnd}
      ) se
      GROUP BY se.qr_code_id
      ON CONFLICT (date, qr_code_id) DO UPDATE SET
        total_scans       = EXCLUDED.total_scans,
        unique_scans      = EXCLUDED.unique_scans,
        country_breakdown = EXCLUDED.country_breakdown,
        device_breakdown  = EXCLUDED.device_breakdown
    `)
  },

  /**
   * Backfill historical data: aggregate every day from startDate to yesterday.
   */
  async backfill(startDate: Date): Promise<void> {
    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    yesterday.setUTCHours(0, 0, 0, 0)

    const cursor = new Date(startDate)
    cursor.setUTCHours(0, 0, 0, 0)

    while (cursor <= yesterday) {
      await this.aggregateDay(new Date(cursor))
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  },
}
