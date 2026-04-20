import { eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import { qrCodes, qrDestinations, destinationDomains } from '../../db/schema'
import { qrCache } from '../../utils/qr-cache'
import { getClientIp } from '../../utils/ip'
import { redirectService } from '../../services/redirect.service'
import { abTestService } from '../../services/ab-test.service'

const SHORT_CODE_PATTERN = /^[2-9A-HJ-NP-Za-hjkmnp-z]{7,8}$/

function getHostname(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase()
  }
  catch {
    return null
  }
}

async function shouldShowWarning(url: string): Promise<boolean> {
  const hostname = getHostname(url)
  if (!hostname) return false

  const whitelist = await db.select({ domain: destinationDomains.domain }).from(destinationDomains)
  if (whitelist.length === 0) return false

  return !whitelist.some(item => item.domain.toLowerCase() === hostname)
}

function renderRedirectWarningPage(url: string) {
  const escapedUrl = url.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>External redirect warning</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .card { max-width: 640px; margin: 40px auto; background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 8px 24px rgba(15,23,42,.08); }
    h1 { margin-top: 0; font-size: 1.25rem; }
    p { line-height: 1.5; }
    code { display: block; margin: 12px 0; padding: 12px; background: #f1f5f9; border-radius: 8px; overflow-wrap: anywhere; }
    .actions { display: flex; gap: 12px; margin-top: 20px; }
    .btn { text-decoration: none; padding: 10px 14px; border-radius: 8px; font-weight: 600; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-secondary { background: #e2e8f0; color: #0f172a; }
  </style>
</head>
<body>
  <main class="card">
    <h1>Attention: external domain</h1>
    <p>This QR code redirects to a domain outside the trusted whitelist. Continue only if you trust this destination.</p>
    <code>${escapedUrl}</code>
    <div class="actions">
      <a class="btn btn-primary" href="${escapedUrl}" rel="noopener noreferrer">Continue</a>
      <a class="btn btn-secondary" href="/">Cancel</a>
    </div>
  </main>
</body>
</html>`
}

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')

  if (!code || !SHORT_CODE_PATTERN.test(code)) {
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

  // 8. Interstitial warning for destinations outside whitelist
  if (await shouldShowWarning(finalUrl)) {
    setHeader(event, 'content-type', 'text/html; charset=utf-8')
    return renderRedirectWarningPage(finalUrl)
  }

  // 9. 302 redirect
  return sendRedirect(event, finalUrl, 302)
})
