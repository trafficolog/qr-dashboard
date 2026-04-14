import { eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import { qrCodes, qrDestinations } from '../../db/schema'
import { qrCache } from '../../utils/qr-cache'
import { getClientIp } from '../../utils/ip'
import { redirectService } from '../../services/redirect.service'
import { abTestService } from '../../services/ab-test.service'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')

  if (!code) {
    return sendRedirect(event, '/not-found', 302)
  }

  // 1. LRU-cache lookup
  let entry = qrCache.get(code)

  // 2. Cache miss → DB query
  if (!entry) {
    const qr = await db.query.qrCodes.findFirst({
      where: eq(qrCodes.shortCode, code),
      with: {
        destinations: {
          where: eq(qrDestinations.isActive, true),
        },
      },
    })

    if (!qr) {
      return sendRedirect(event, '/not-found', 302)
    }

    entry = {
      id: qr.id,
      destinationUrl: qr.destinationUrl,
      status: qr.status,
      expiresAt: qr.expiresAt ?? null,
      utmParams: (qr.utmParams as Record<string, string>) ?? null,
      destinations: qr.destinations.map(d => ({
        id: d.id,
        url: d.url,
        weight: d.weight,
      })),
    }

    qrCache.set(code, entry)
  }

  // 3. Статус: только active разрешён
  if (entry.status !== 'active') {
    return sendRedirect(event, '/not-found', 302)
  }

  // 4. Срок действия
  if (entry.expiresAt && entry.expiresAt < new Date()) {
    return sendRedirect(event, '/expired', 302)
  }

  // 5. Определить целевой URL
  let finalUrl = entry.destinationUrl
  let destinationId: string | undefined

  if (entry.destinations.length > 1) {
    // A/B-тест: взвешенный случайный выбор
    const chosen = abTestService.weightedRandom(entry.destinations)
    finalUrl = chosen.url
    destinationId = chosen.id
  }
  else if (entry.destinations.length === 1) {
    finalUrl = entry.destinations[0]!.url
    destinationId = entry.destinations[0]!.id
  }

  // 6. Добавить UTM-параметры
  if (entry.utmParams && Object.keys(entry.utmParams).length > 0) {
    try {
      const url = new URL(finalUrl)
      for (const [key, value] of Object.entries(entry.utmParams)) {
        if (value) url.searchParams.set(key, value)
      }
      finalUrl = url.toString()
    }
    catch {
      // Если URL некорректный — оставляем как есть
    }
  }

  // 7. Запись scan event и инкремент счётчика — fire-and-forget
  const ip = getClientIp(event)
  const userAgent = getHeader(event, 'user-agent') ?? ''
  const referer = getHeader(event, 'referer') ?? ''
  const qrId = entry.id

  redirectService
    .recordScanEvent({ qrCodeId: qrId, destinationId, ip, userAgent, referer })
    .catch(err => console.error('[redirect] recordScanEvent failed:', err))

  db.update(qrCodes)
    .set({ totalScans: sql`total_scans + 1` })
    .where(eq(qrCodes.id, qrId))
    .catch(err => console.error('[redirect] totalScans update failed:', err))

  // 8. 302 redirect
  return sendRedirect(event, finalUrl, 302)
})
