import { LRUCache } from 'lru-cache'

export interface QrCacheEntry {
  id: string
  destinationUrl: string
  status: string
  expiresAt: Date | null
  utmParams: Record<string, string> | null
  destinations: { id: string, url: string, weight: number }[]
}

export const qrCache = new LRUCache<string, QrCacheEntry>({
  max: 10_000,
  ttl: 5 * 60 * 1000, // 5 минут
})

export function invalidateQrCache(shortCode: string) {
  qrCache.delete(shortCode)
}
