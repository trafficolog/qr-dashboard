import { eq, and, gte, sql } from 'drizzle-orm'
import UAParser from 'ua-parser-js'
import { db } from '../db'
import { scanEvents, qrCodes, qrDestinations } from '../db/schema'
import { geoService } from './geo.service'

interface RecordScanParams {
  qrCodeId: string
  destinationId?: string
  ip: string
  userAgent: string
  referer: string
}

export const redirectService = {
  async recordScanEvent(params: RecordScanParams): Promise<void> {
    const { qrCodeId, destinationId, ip, userAgent, referer } = params

    // 1. Парсинг User-Agent
    const ua = new UAParser(userAgent)
    const deviceType = ua.getDevice().type || 'desktop'
    const os = ua.getOS().name || 'Unknown'
    const browser = ua.getBrowser().name || 'Unknown'

    // 2. GeoIP-поиск (graceful: null при localhost/private IP)
    const geo = geoService.lookup(ip)

    // 3. Проверка уникальности: первое сканирование с данного IP за сегодня
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const existingScan = await db.query.scanEvents.findFirst({
      where: and(
        eq(scanEvents.qrCodeId, qrCodeId),
        eq(scanEvents.ipAddress, ip),
        gte(scanEvents.scannedAt, todayStart),
      ),
      columns: { id: true },
    })

    const isUnique = !existingScan

    // 4. Запись scan event
    await db.insert(scanEvents).values({
      qrCodeId,
      destinationId: destinationId ?? null,
      ipAddress: ip || null,
      userAgent: userAgent || null,
      referer: referer || null,
      country: geo.country,
      city: geo.city,
      region: geo.region,
      latitude: geo.latitude,
      longitude: geo.longitude,
      deviceType,
      os,
      browser,
      isUnique,
    })

    // 5. Инкремент uniqueScans если уникальное сканирование
    if (isUnique) {
      await db
        .update(qrCodes)
        .set({ uniqueScans: sql`unique_scans + 1` })
        .where(eq(qrCodes.id, qrCodeId))
    }

    // 6. Инкремент кликов по destination (для A/B)
    if (destinationId) {
      await db
        .update(qrDestinations)
        .set({ clicks: sql`clicks + 1` })
        .where(eq(qrDestinations.id, destinationId))
    }
  },
}
