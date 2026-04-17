import geoip from 'geoip-lite'

export interface GeoResult {
  country: string | null
  city: string | null
  region: string | null
  latitude: number | null
  longitude: number | null
}

export const geoService = {
  lookup(ip: string): GeoResult {
    try {
      const geo = geoip.lookup(ip)
      if (!geo) {
        return { country: null, city: null, region: null, latitude: null, longitude: null }
      }
      return {
        country: geo.country || null,
        city: geo.city || null,
        region: geo.region || null,
        latitude: geo.ll?.[0] ?? null,
        longitude: geo.ll?.[1] ?? null,
      }
    }
    catch {
      return { country: null, city: null, region: null, latitude: null, longitude: null }
    }
  },
}
