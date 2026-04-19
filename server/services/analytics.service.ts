import { eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { userDepartments } from '../db/schema'
import { resolveVisibilityAccess } from './qr-visibility-access'
import type { User } from '~~/types/auth'
import type {
  AnalyticsOverview,
  DeviceBreakdown,
  DeviceBreakdownItem,
  GeoBreakdown,
  ScanTimeSeriesPoint,
  TimeDistribution,
  TopQrCode,
} from '~~/types/analytics'

interface DateRange {
  from: Date
  to: Date
}

type AnalyticsScope = 'mine' | 'department' | 'public' | 'company' | undefined

interface AnalyticsAccessOptions {
  scope?: AnalyticsScope
  departmentId?: string
}

async function getUserDepartmentIds(userId: string): Promise<string[]> {
  const memberships = await db
    .select({ departmentId: userDepartments.departmentId })
    .from(userDepartments)
    .where(eq(userDepartments.userId, userId))

  return memberships.map(row => row.departmentId)
}

async function getAnalyticsAclFilter(user: User, options: AnalyticsAccessOptions = {}) {
  const userDepartmentIds = user.role === 'admin' ? [] : await getUserDepartmentIds(user.id)

  const access = resolveVisibilityAccess({
    scope: options.scope,
    userRole: user.role,
    userDepartmentIds,
    requestedDepartmentId: options.departmentId,
  })

  if (access.denyAll) {
    return { sql: sql`AND 1 = 0`, denyAll: true }
  }

  if (user.role === 'admin' && (options.scope === undefined || options.scope === 'company')) {
    return { sql: sql``, denyAll: false }
  }

  const parts = []

  if (access.includeMine) {
    parts.push(sql`qr.created_by = ${user.id}::uuid`)
  }
  if (access.includePublic) {
    parts.push(sql`qr.visibility = 'public'`)
  }
  if (access.allowedDepartmentIds === null) {
    parts.push(sql`qr.visibility = 'department'`)
  }
  else if (access.allowedDepartmentIds.length > 0) {
    parts.push(sql`(qr.visibility = 'department' AND qr.department_id = ANY(${access.allowedDepartmentIds}::uuid[]))`)
  }

  if (parts.length === 0) {
    return { sql: sql`AND 1 = 0`, denyAll: true }
  }

  if (parts.length === 1) {
    return { sql: sql`AND (${parts[0]})`, denyAll: false }
  }

  return { sql: sql`AND (${sql.join(parts, sql` OR `)})`, denyAll: false }
}

/** Вычислить % изменения, избегая деления на 0 */
function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0
  return Math.round(((curr - prev) / prev) * 100)
}

export const analyticsService = {
  async getGeoBreakdown(
    user: User,
    range: DateRange,
    options: AnalyticsAccessOptions = {},
  ): Promise<GeoBreakdown> {
    const { from, to } = range
    const aclFilter = await getAnalyticsAclFilter(user, options)

    const totalResult = await db.execute<{ n: string }>(sql`
      SELECT COUNT(*) AS n
      FROM scan_events se
      INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
      WHERE se.scanned_at >= ${from} AND se.scanned_at <= ${to}
      ${aclFilter.sql}
    `)
    const totalScans = Number((totalResult.rows[0] as { n: string } | undefined)?.n ?? 0)

    const countryResult = await db.execute(sql`
      SELECT
        se.country,
        COUNT(*) AS scans,
        COUNT(*) FILTER (WHERE se.is_unique = true) AS unique_scans
      FROM scan_events se
      INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
      WHERE se.scanned_at >= ${from} AND se.scanned_at <= ${to}
        AND se.country IS NOT NULL
        AND se.country <> ''
        ${aclFilter.sql}
      GROUP BY se.country
      ORDER BY scans DESC
    `)

    const cityResult = await db.execute(sql`
      SELECT
        se.country,
        se.city,
        COUNT(*) AS scans,
        COUNT(*) FILTER (WHERE se.is_unique = true) AS unique_scans,
        AVG(se.latitude) AS lat,
        AVG(se.longitude) AS lng
      FROM scan_events se
      INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
      WHERE se.scanned_at >= ${from} AND se.scanned_at <= ${to}
        AND se.country IS NOT NULL
        AND se.country <> ''
        AND se.city IS NOT NULL
        AND se.city <> ''
        ${aclFilter.sql}
      GROUP BY se.country, se.city
      ORDER BY scans DESC
    `)

    const countries = (countryResult.rows as Array<Record<string, unknown>>).map((row) => {
      const scans = Number(row.scans)
      return {
        country: row.country as string,
        scans,
        uniqueScans: Number(row.unique_scans ?? 0),
        percentage: totalScans > 0 ? Math.round((scans / totalScans) * 10000) / 100 : 0,
      }
    })

    const cities = (cityResult.rows as Array<Record<string, unknown>>).map((row) => {
      const scans = Number(row.scans)
      return {
        country: row.country as string,
        city: row.city as string,
        scans,
        uniqueScans: Number(row.unique_scans ?? 0),
        percentage: totalScans > 0 ? Math.round((scans / totalScans) * 10000) / 100 : 0,
        coordinates: {
          lat: row.lat === null ? null : Number(row.lat),
          lng: row.lng === null ? null : Number(row.lng),
        },
      }
    })

    return {
      countries,
      cities,
      totalCountries: countries.length,
      totalCities: cities.length,
    }
  },

  async getDeviceBreakdown(
    user: User,
    range: DateRange,
    options: AnalyticsAccessOptions = {},
  ): Promise<DeviceBreakdown> {
    const { from, to } = range
    const aclFilter = await getAnalyticsAclFilter(user, options)

    const totalResult = await db.execute<{ n: string }>(sql`
      SELECT COUNT(*) AS n
      FROM scan_events se
      INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
      WHERE se.scanned_at >= ${from} AND se.scanned_at <= ${to}
      ${aclFilter.sql}
    `)
    const totalScans = Number((totalResult.rows[0] as { n: string } | undefined)?.n ?? 0)

    const mapBreakdown = (rows: Array<Record<string, unknown>>): DeviceBreakdownItem[] => rows.map((row) => {
      const count = Number(row.count)
      return {
        name: row.name as string,
        count,
        percentage: totalScans > 0 ? Math.round((count / totalScans) * 10000) / 100 : 0,
      }
    })

    const [devicesResult, osResult, browsersResult] = await Promise.all([
      db.execute(sql`
        SELECT se.device_type AS name, COUNT(*) AS count
        FROM scan_events se
        INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
        WHERE se.scanned_at >= ${from} AND se.scanned_at <= ${to}
          AND se.device_type IS NOT NULL
          AND se.device_type <> ''
          ${aclFilter.sql}
        GROUP BY se.device_type
        ORDER BY count DESC
      `),
      db.execute(sql`
        SELECT se.os AS name, COUNT(*) AS count
        FROM scan_events se
        INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
        WHERE se.scanned_at >= ${from} AND se.scanned_at <= ${to}
          AND se.os IS NOT NULL
          AND se.os <> ''
          ${aclFilter.sql}
        GROUP BY se.os
        ORDER BY count DESC
      `),
      db.execute(sql`
        SELECT se.browser AS name, COUNT(*) AS count
        FROM scan_events se
        INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
        WHERE se.scanned_at >= ${from} AND se.scanned_at <= ${to}
          AND se.browser IS NOT NULL
          AND se.browser <> ''
          ${aclFilter.sql}
        GROUP BY se.browser
        ORDER BY count DESC
      `),
    ])

    return {
      devices: mapBreakdown(devicesResult.rows as Array<Record<string, unknown>>),
      os: mapBreakdown(osResult.rows as Array<Record<string, unknown>>),
      browsers: mapBreakdown(browsersResult.rows as Array<Record<string, unknown>>),
    }
  },

  async getTimeDistribution(
    user: User,
    range: DateRange,
    options: AnalyticsAccessOptions = {},
  ): Promise<TimeDistribution> {
    const { from, to } = range
    const aclFilter = await getAnalyticsAclFilter(user, options)

    const totalResult = await db.execute<{ n: string }>(sql`
      SELECT COUNT(*) AS n
      FROM scan_events se
      INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
      WHERE se.scanned_at >= ${from} AND se.scanned_at <= ${to}
      ${aclFilter.sql}
    `)
    const totalScans = Number((totalResult.rows[0] as { n: string } | undefined)?.n ?? 0)

    const [hourlyResult, weeklyResult] = await Promise.all([
      db.execute(sql`
        SELECT EXTRACT(HOUR FROM se.scanned_at)::int AS bucket, COUNT(*) AS scans
        FROM scan_events se
        INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
        WHERE se.scanned_at >= ${from} AND se.scanned_at <= ${to}
          ${aclFilter.sql}
        GROUP BY bucket
        ORDER BY bucket ASC
      `),
      db.execute(sql`
        SELECT EXTRACT(DOW FROM se.scanned_at)::int AS bucket, COUNT(*) AS scans
        FROM scan_events se
        INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
        WHERE se.scanned_at >= ${from} AND se.scanned_at <= ${to}
          ${aclFilter.sql}
        GROUP BY bucket
        ORDER BY bucket ASC
      `),
    ])

    return {
      hourly: (hourlyResult.rows as Array<Record<string, unknown>>).map(row => ({
        hour: Number(row.bucket),
        scans: Number(row.scans),
        percentage: totalScans > 0 ? Math.round((Number(row.scans) / totalScans) * 10000) / 100 : 0,
      })),
      weekly: (weeklyResult.rows as Array<Record<string, unknown>>).map(row => ({
        weekday: Number(row.bucket),
        scans: Number(row.scans),
        percentage: totalScans > 0 ? Math.round((Number(row.scans) / totalScans) * 10000) / 100 : 0,
      })),
    }
  },

  /**
   * Сводная статистика с % изменением относительно предыдущего аналогичного периода.
   */
  async getOverview(user: User, range: DateRange, options: AnalyticsAccessOptions = {}): Promise<AnalyticsOverview> {
    const { from, to } = range
    const periodMs = to.getTime() - from.getTime()
    const prevFrom = new Date(from.getTime() - periodMs)
    const prevTo = new Date(from.getTime())

    // Сегодня / вчера
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const yesterdayStart = new Date(todayStart.getTime() - 86_400_000)

    const aclFilter = await getAnalyticsAclFilter(user, options)

    // Total QR codes (всего за всё время, не за период)
    const totalQrResult = await db.execute<{ n: string }>(sql`
      SELECT COUNT(*) AS n
      FROM qr_codes qr
      WHERE 1 = 1
      ${aclFilter.sql}
    `)

    const prevQrResult = await db.execute<{ n: string }>(sql`
      SELECT COUNT(*) AS n
      FROM qr_codes qr
      WHERE qr.created_at <= ${prevTo}
      ${aclFilter.sql}
    `)

    // Scans in current period
    const curRow = await db.execute<{ total: string, uniq: string }>(sql`
      SELECT
        COUNT(*)                                    AS total,
        COUNT(*) FILTER (WHERE se.is_unique = true) AS uniq
      FROM scan_events se
      INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
      WHERE se.scanned_at >= ${from} AND se.scanned_at <= ${to}
      ${aclFilter.sql}
    `)

    // Scans in previous period
    const prevRow = await db.execute<{ total: string, uniq: string }>(sql`
      SELECT
        COUNT(*)                                    AS total,
        COUNT(*) FILTER (WHERE se.is_unique = true) AS uniq
      FROM scan_events se
      INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
      WHERE se.scanned_at >= ${prevFrom} AND se.scanned_at <= ${prevTo}
      ${aclFilter.sql}
    `)

    // Scans today / yesterday
    const todayRow = await db.execute<{ n: string }>(sql`
      SELECT COUNT(*) AS n
      FROM scan_events se
      INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
      WHERE se.scanned_at >= ${todayStart}
      ${aclFilter.sql}
    `)

    const yesterdayRow = await db.execute<{ n: string }>(sql`
      SELECT COUNT(*) AS n
      FROM scan_events se
      INNER JOIN qr_codes qr ON se.qr_code_id = qr.id
      WHERE se.scanned_at >= ${yesterdayStart} AND se.scanned_at < ${todayStart}
      ${aclFilter.sql}
    `)

    const totalQr = Number((totalQrResult.rows[0] as { n: string } | undefined)?.n ?? 0)
    const prevQr = Number((prevQrResult.rows[0] as { n: string } | undefined)?.n ?? 0)
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
    options: AnalyticsAccessOptions = {},
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
    const aclFilter = await getAnalyticsAclFilter(user, options)

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
          ${aclFilter.sql}
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
        ${aclFilter.sql}
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
  async getTopQrCodes(user: User, range: DateRange, options: AnalyticsAccessOptions = {}): Promise<TopQrCode[]> {
    const { from, to } = range
    const aclFilter = await getAnalyticsAclFilter(user, options)

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
        ${aclFilter.sql}
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
