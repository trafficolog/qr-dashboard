import { z } from 'zod'
import { qrService } from '../../services/qr.service'
import type { McpContext } from '../auth'
import type { McpResourceDefinition, McpResourceListItem } from '../server'

const qrResourceUriSchema = z.string().regex(/^qr:\/\/codes\/[0-9a-fA-F-]{36}$/)

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  return Number.isNaN(date.getTime()) ? '—' : date.toISOString()
}

export const qrResources: McpResourceDefinition[] = [
  {
    uri: 'qr://codes',
    name: 'QR Codes',
    description: 'Список последних QR-кодов с короткой сводкой по сканам.',
    mimeType: 'text/plain',
    requiredScopes: ['qr:read'],
    async read(_uri: string, ctx: McpContext) {
      const result = await qrService.getQrList({}, {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }, ctx.user)

      if (result.data.length === 0) {
        return 'QR-коды отсутствуют.'
      }

      const lines = [
        `Сводка: всего QR-кодов ${result.total}, показано ${result.data.length} последних.`,
        ...result.data.map((qr, index) => `${index + 1}. ${qr.title} — ${qr.shortCode} — ${qr.totalScans} сканов (${qr.uniqueScans} уникальных)`),
      ]

      return lines.join('\n')
    },
    async list(_ctx: McpContext): Promise<McpResourceListItem[]> {
      return [{
        uri: 'qr://codes',
        name: 'QR Codes',
        description: 'Последние QR-коды',
        mimeType: 'text/plain',
      }]
    },
  },
  {
    uri: 'qr://codes/{id}',
    name: 'QR Code by ID',
    description: 'Детальная карточка QR-кода по URI qr://codes/{uuid}.',
    mimeType: 'text/plain',
    requiredScopes: ['qr:read'],
    async read(uri: string, ctx: McpContext) {
      qrResourceUriSchema.parse(uri)
      const id = uri.split('/').at(-1) as string
      const qr = await qrService.getQrById(id, ctx.user)

      return [
        `Сводка: QR «${qr.title}» (${qr.shortCode}), статус ${qr.status}.`,
        `ID: ${qr.id}`,
        `Ссылка: ${qr.destinationUrl}`,
        `Видимость: ${qr.visibility}`,
        `Сканирования: ${qr.totalScans} всего / ${qr.uniqueScans} уникальных`,
        `Создан: ${formatDate(qr.createdAt)}; обновлён: ${formatDate(qr.updatedAt)}`,
      ].join('\n')
    },
    async list(_ctx: McpContext): Promise<McpResourceListItem[]> {
      return []
    },
  },
]
