import { eq, and, lte, count, sql } from 'drizzle-orm'
import { db } from '../db'
import { qrCodes } from '../db/schema'
import type { User } from '~~/types/auth'
import type {
  AnalyticsOverview,
  ScanTimeSeriesPoint,
  TopQrCode,
} from '~~/types/analytics'

interface DateRange {
  from: Date
  to: Date
}

/** Вычислить % изменения, избегая деления на 0 */
function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0
  return Math.round(((curr - prev) / prev) * 100)
}

export const analyticsService = {
  /**
   * Сводная статистика с % изменением относительно предыдущего аналогичного периода.
   */
  async getOverview(user: User, range: DateRange): Promise<AnalyticsOverview> {
    const { from, to } = range
    const periodMs = to.getTime() - from.getTime()
    const prevFrom = new Date(from.getTime() - periodMs)
    const prevTo = new Date(from.getTime())

    // Сегодня / вчера
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const yesterdayStart = new Date(todayStart.getTime() - 86_400_000)

    const userFilter = user.role !== 'admin'
      ? sql`AND qr.created_by = ${user.id}::uuid`
      : sql``

    // Total QR codes (всего за всё время, не за период)
    const [totalQrRow] = await db
      .select({ n: count() })
      .from(qrCodes)
      .where(user.role !== 'admin' ? eq(qrCodes.createdBy, user.id) : undefined)

    const [prevQrRow] = await db
      .select({ n: count() })
      .from(qrCodes)
      .where(
        user.role !== 'admin'
          ? and(eq(qrCodes.createdBy, user.id), lte(qrCodes.createdAt, prevTo))
          : lte(qrCodes.createdAt, prevTo),
      )

    // Scans in current period
    const curRow = await db.execute<{ total: string, uniq: string }>(sql`
      SELECT
        COUNT(*)                                    AS total,
        COUNT(*) FILTER (WHERE se.is_unique = true) AS uniq
      FROM scan_events se
      INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
      WHERE se.scanned_at >= ${from} AND se.scanned_at <= ${to}
      ${userFilter}
    `)

    // Scans in previous period
    const prevRow = await db.execute<{ total: string, uniq: string }>(sql`
      SELECT
        COUNT(*)                                    AS total,
        COUNT(*) FILTER (WHERE se.is_unique = true) AS uniq
      FROM scan_events se
      INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
      WHERE se.scanned_at >= ${prevFrom} AND se.scanned_at <= ${prevTo}
      ${userFilter}
    `)

    // Scans today / yesterday
    const todayRow = await db.execute<{ n: string }>(sql`
      SELECT COUNT(*) AS n
      FROM scan_events se
      INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
      WHERE se.scanned_at >= ${todayStart}
      ${userFilter}
    `)

    const yesterdayRow = await db.execute<{ n: string }>(sql`
      SELECT COUNT(*) AS n
      FROM scan_events se
      INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
      WHERE se.scanned_at >= ${yesterdayStart} AND se.scanned_at < ${todayStart}
      ${userFilter}
    `)

    const totalQr = totalQrRow!.n
    const prevQr = prevQrRow!.n
    const cur = curRow.rows[0] ?? { total: '0', uniq: '0' }
    const prev = prevRow.rows[0] ?? { total: '0', uniq: '0' }
    const todayScans = Number((todayRow.rows[0] as { n: string } | undefined)?.n ?? 0)
    const yesterdayScans = Number((yesterdayRow.rows[0] as { n: string } | undefined)?.n ?? 0)

    return {
      totalQrCodes: totalQr,
      totalScans: Number((cur as { total: string }).total),
      uniqueScans: Number((cur as { uniq: string }).uniq),
      scansToday: todayScans,
      totalQrCodesChange: pctChange(totalQr, prevQr),
      totalScansChange: pctChange(
        Number((cur as { total: string }).total),
        Number((prev as { total: string }).total),
      ),
      uniqueScansChange: pctChange(
        Number((cur as { uniq: string }).uniq),
        Number((prev as { uniq: string }).uniq),
      ),
      scansTodayChange: pctChange(todayScans, yesterdayScans),
    }
  },

  /**
   * Временной ряд сканирований с автоматической гранулярностью.
   * ≤48 h → по часам | ≤90 d → по дням | ≤365 d → по неделям | >365 d → по месяцам
   */
  async getScansTimeSeries(
    user: User,
    range: DateRange,
    qrCodeId?: string,
  ): Promise<ScanTimeSeriesPoint[]> {
    const { from, to } = range
    const diffMs = to.getTime() - from.getTime()
    const diffHours = diffMs / 3_600_000

    let trunc: string
    if (diffHours <= 48) trunc = 'hour'
    else if (diffHours <= 90 * 24) trunc = 'day'
    else if (diffHours <= 365 * 24) trunc = 'week'
    else trunc = 'month'

    const qrFilter = qrCodeId ? sql`AND sds.qr_code_id = ${qrCodeId}::uuid` : sql``
    const qrFilterRaw = qrCodeId ? sql`AND se.qr_code_id = ${qrCodeId}::uuid` : sql``
    const userFilter = user.role !== 'admin'
      ? sql`AND qr.created_by = ${user.id}::uuid`
      : sql``

    // For week/month granularity use the pre-aggregated scan_daily_stats table
    if (trunc === 'week' || trunc === 'month') {
      const fromDate = from.toISOString().slice(0, 10)
      const toDate = to.toISOString().slice(0, 10)

      const result = await db.execute(sql`
        SELECT
          DATE_TRUNC(${trunc}, sds.date::timestamptz) AS date_group,
          SUM(sds.total_scans)                         AS total_scans,
          SUM(sds.unique_scans)                        AS unique_scans
        FROM scan_daily_stats sds
        INNER JOIN qr_codes qr ON sds.qr_code_id = qr.id
        WHERE sds.date >= ${fromDate}::date AND sds.date <= ${toDate}::date
          ${qrFilter}
          ${userFilter}
        GROUP BY date_group
        ORDER BY date_group ASC
      `)

      return (result.rows as Array<Record<string, unknown>>).map(row => ({
        date: (row.date_group as Date).toISOString(),
        totalScans: Number(row.total_scans),
        uniqueScans: Number(row.unique_scans),
      }))
    }

    // For hour/day granularity query scan_events directly
    const result = await db.execute(sql`
      SELECT
        DATE_TRUNC(${trunc}, se.scanned_at)         AS date_group,
        COUNT(*)                                    AS total_scans,
        COUNT(*) FILTER (WHERE se.is_unique = true) AS unique_scans
      FROM scan_events se
      INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
      WHERE se.scanned_at >= ${from} AND se.scanned_at <= ${to}
        ${qrFilterRaw}
        ${userFilter}
      GROUP BY date_group
      ORDER BY date_group ASC
    `)

    return (result.rows as Array<Record<string, unknown>>).map(row => ({
      date: (row.date_group as Date).toISOString(),
      totalScans: Number(row.total_scans),
      uniqueScans: Number(row.unique_scans),
    }))
  },

  /**
   * Топ-10 QR-кодов по сканированиям за период.
   */
  async getTopQrCodes(user: User, range: DateRange): Promise<TopQrCode[]> {
    const { from, to } = range
    const userFilter = user.role !== 'admin'
      ? sql`AND qr.created_by = ${user.id}::uuid`
      : sql``

    const result = await db.execute(sql`
      SELECT
        qr.id,
        qr.title,
        qr.short_code                               AS "shortCode",
        COUNT(se.id)                                AS total_scans,
        COUNT(se.id) FILTER (WHERE se.is_unique)    AS unique_scans
      FROM qr_codes qr
      LEFT JOIN scan_events se
        ON se.qr_code_id = qr.id
        AND se.scanned_at >= ${from}
        AND se.scanned_at <= ${to}
      WHERE 1 = 1
        ${userFilter}
      GROUP BY qr.id, qr.title, qr.short_code
      ORDER BY total_scans DESC
      LIMIT 10
    `)

    return (result.rows as Array<Record<string, unknown>>).map(row => ({
      id: row.id as string,
      title: row.title as string,
      shortCode: row.shortCode as string,
      totalScans: Number(row.total_scans),
      uniqueScans: Number(row.unique_scans),
    }))
  },

  /**
   * Аналитика конкретного QR-кода.
   */
  async getQrAnalytics(qrId: string, range: DateRange) {
    const [timeSeries, overview] = await Promise.all([
      this.getScansTimeSeries({ id: qrId, role: 'admin' } as User, range, qrId),
      db.execute(sql`
        SELECT
          COUNT(*)                                    AS total_scans,
          COUNT(*) FILTER (WHERE se.is_unique = true) AS unique_scans,
          COUNT(DISTINCT se.country)                  AS countries,
          MODE() WITHIN GROUP (ORDER BY se.device_type) AS top_device,
          MODE() WITHIN GROUP (ORDER BY se.browser)     AS top_browser
        FROM scan_events se
        WHERE se.qr_code_id = ${qrId}::uuid
          AND se.scanned_at >= ${range.from}
          AND se.scanned_at <= ${range.to}
      `),
    ])

    const ov = overview.rows[0] as Record<string, unknown> | undefined
    return {
      timeSeries,
      totalScans: Number(ov?.total_scans ?? 0),
      uniqueScans: Number(ov?.unique_scans ?? 0),
      countries: Number(ov?.countries ?? 0),
      topDevice: (ov?.top_device as string) ?? null,
      topBrowser: (ov?.top_browser as string) ?? null,
    }
  },
}
