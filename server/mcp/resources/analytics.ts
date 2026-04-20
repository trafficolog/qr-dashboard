import { analyticsService } from '../../services/analytics.service'
import type { McpContext } from '../auth'
import type { McpResourceDefinition, McpResourceListItem } from '../server'

function toIsoDay(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function defaultRange() {
  const to = new Date()
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)
  return { from, to }
}

export const analyticsResources: McpResourceDefinition[] = [
  {
    uri: 'analytics://overview',
    name: 'Analytics Overview',
    description: 'Сводные показатели QR и сканирований за последние 30 дней.',
    mimeType: 'text/plain',
    requiredScopes: ['qr:stats:read'],
    async read(_uri: string, ctx: McpContext) {
      const range = defaultRange()
      const overview = await analyticsService.getOverview(ctx.user, range)

      return [
        `Сводка за ${toIsoDay(range.from)} — ${toIsoDay(range.to)}:`,
        `• QR-кодов: ${overview.totalQrCodes} (${overview.totalQrCodesChange >= 0 ? '+' : ''}${overview.totalQrCodesChange}%)`,
        `• Сканирований: ${overview.totalScans} (${overview.totalScansChange >= 0 ? '+' : ''}${overview.totalScansChange}%)`,
        `• Уникальных: ${overview.uniqueScans} (${overview.uniqueScansChange >= 0 ? '+' : ''}${overview.uniqueScansChange}%)`,
        `• Сегодня: ${overview.scansToday} (${overview.scansTodayChange >= 0 ? '+' : ''}${overview.scansTodayChange}%)`,
      ].join('\n')
    },
    async list(_ctx: McpContext): Promise<McpResourceListItem[]> {
      return [{
        uri: 'analytics://overview',
        name: 'Analytics Overview',
        description: 'Сводка за 30 дней',
        mimeType: 'text/plain',
      }]
    },
  },
]
