import { z } from 'zod'
import { analyticsService } from '../../services/analytics.service'
import type { McpToolDefinition } from '../server'
import type { McpContext } from '../auth'

const dateRangeSchema = z.object({
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional(),
  scope: z.enum(['mine', 'department', 'public', 'company']).optional(),
  department_id: z.string().uuid().optional(),
})

const topQrSchema = dateRangeSchema.extend({
  limit: z.number().int().min(1).max(20).default(10),
})

function getRange(input: { date_from?: string, date_to?: string }) {
  const to = input.date_to ? new Date(input.date_to) : new Date()
  const from = input.date_from
    ? new Date(input.date_from)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)

  return { from, to }
}

function fmtDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

async function handleOverview(args: unknown, ctx: McpContext): Promise<string> {
  const parsed = dateRangeSchema.parse(args ?? {})
  const range = getRange(parsed)

  const data = await analyticsService.getOverview(ctx.user, range, {
    scope: parsed.scope,
    departmentId: parsed.department_id,
  })

  return [
    `Аналитика за период ${fmtDate(range.from)} — ${fmtDate(range.to)}:`,
    `• Всего QR-кодов: ${data.totalQrCodes} (${data.totalQrCodesChange >= 0 ? '+' : ''}${data.totalQrCodesChange}% к предыдущему периоду)`,
    `• Всего сканирований: ${data.totalScans} (${data.totalScansChange >= 0 ? '+' : ''}${data.totalScansChange}%)`,
    `• Уникальных сканирований: ${data.uniqueScans} (${data.uniqueScansChange >= 0 ? '+' : ''}${data.uniqueScansChange}%)`,
    `• Сканов сегодня: ${data.scansToday} (${data.scansTodayChange >= 0 ? '+' : ''}${data.scansTodayChange}%)`,
  ].join('\n')
}

async function handleTopQr(args: unknown, ctx: McpContext): Promise<string> {
  const parsed = topQrSchema.parse(args ?? {})
  const range = getRange(parsed)

  const top = await analyticsService.getTopQrCodes(ctx.user, range, {
    scope: parsed.scope,
    departmentId: parsed.department_id,
  })

  const rows = top.slice(0, parsed.limit)
  if (rows.length === 0) {
    return `За период ${fmtDate(range.from)} — ${fmtDate(range.to)} данных по сканированиям нет.`
  }

  return [
    `Топ QR за период ${fmtDate(range.from)} — ${fmtDate(range.to)}:`,
    ...rows.map((item, idx) => `${idx + 1}. ${item.title} — ${item.totalScans} сканирований (${item.uniqueScans} уникальных)`),
  ].join('\n')
}

export const analyticsTools: McpToolDefinition[] = [
  {
    name: 'get_analytics_overview',
    description: 'Получить сводные метрики (QR, scans, unique, today) за период.',
    requiredScopes: ['qr:stats:read'],
    inputSchema: {
      type: 'object',
      properties: {
        date_from: { type: 'string', format: 'date-time' },
        date_to: { type: 'string', format: 'date-time' },
        scope: { type: 'string', enum: ['mine', 'department', 'public', 'company'] },
        department_id: { type: 'string', format: 'uuid' },
      },
      additionalProperties: false,
    },
    parser: dateRangeSchema,
    execute: handleOverview,
  },
  {
    name: 'get_top_qr_codes',
    description: 'Получить список самых сканируемых QR-кодов за период.',
    requiredScopes: ['qr:stats:read'],
    inputSchema: {
      type: 'object',
      properties: {
        date_from: { type: 'string', format: 'date-time' },
        date_to: { type: 'string', format: 'date-time' },
        scope: { type: 'string', enum: ['mine', 'department', 'public', 'company'] },
        department_id: { type: 'string', format: 'uuid' },
        limit: { type: 'number', minimum: 1, maximum: 20 },
      },
      additionalProperties: false,
    },
    parser: topQrSchema,
    execute: handleTopQr,
  },
]
