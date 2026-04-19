const DEVICE_PRIMARY_COLORS: Record<string, string> = {
  mobile: '#22c55e',
  desktop: '#16a34a',
  tablet: '#86efac',
}

const FALLBACK_COLORS = ['#15803d', '#65a30d', '#4d7c0f', '#84cc16', '#bef264']

export function resolveDeviceColor(name: string, index: number) {
  const normalized = name.trim().toLowerCase()
  return DEVICE_PRIMARY_COLORS[normalized] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}
