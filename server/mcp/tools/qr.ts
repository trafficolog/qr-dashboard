import { z } from 'zod'
import { qrService } from '../../services/qr.service'
import type { McpToolDefinition } from '../server'
import type { McpContext } from '../auth'

const listQrSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'paused', 'expired', 'archived']).optional(),
  limit: z.number().int().min(1).max(100).default(20),
})

const getQrSchema = z.object({
  id: z.string().uuid(),
})

const createQrSchema = z.object({
  title: z.string().trim().min(1).max(255),
  destination_url: z.string().url(),
  description: z.string().max(1000).optional(),
  type: z.enum(['dynamic', 'static']).default('dynamic'),
  folder_id: z.string().uuid().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
})

const updateQrSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(255).optional(),
  destination_url: z.string().url().optional(),
  description: z.string().max(1000).nullable().optional(),
  folder_id: z.string().uuid().nullable().optional(),
  status: z.enum(['active', 'paused', 'expired', 'archived']).optional(),
})

const duplicateQrSchema = z.object({
  id: z.string().uuid(),
})

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  return Number.isNaN(date.getTime()) ? '—' : date.toISOString()
}

function formatQrLine(index: number, qr: {
  id: string
  title: string
  shortCode: string
  status: string
  destinationUrl: string
  totalScans: number
  uniqueScans: number
  createdAt: Date
}) {
  return [
    `${index + 1}. ${qr.title}`,
    `   ID: ${qr.id}`,
    `   Short code: ${qr.shortCode}`,
    `   URL: ${qr.destinationUrl}`,
    `   Status: ${qr.status}`,
    `   Scans: ${qr.totalScans} total / ${qr.uniqueScans} unique`,
    `   Created at: ${formatDate(qr.createdAt)}`,
  ].join('\n')
}

async function handleListQr(args: unknown, ctx: McpContext): Promise<string> {
  const parsed = listQrSchema.parse(args ?? {})
  const result = await qrService.getQrList(
    {
      search: parsed.search,
      status: parsed.status,
    },
    {
      page: 1,
      limit: parsed.limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    ctx.user,
  )

  if (result.data.length === 0) {
    return 'QR-коды по заданным фильтрам не найдены.'
  }

  const lines = [
    `Найдено QR-кодов: ${result.total} (показано ${result.data.length}).`,
    '',
    ...result.data.map((qr, idx) => formatQrLine(idx, qr)),
  ]
  return lines.join('\n')
}

async function handleGetQr(args: unknown, ctx: McpContext): Promise<string> {
  const parsed = getQrSchema.parse(args ?? {})
  const qr = await qrService.getQrById(parsed.id, ctx.user)

  return [
    `QR: ${qr.title}`,
    `ID: ${qr.id}`,
    `Short code: ${qr.shortCode}`,
    `URL: ${qr.destinationUrl}`,
    `Status: ${qr.status}`,
    `Visibility: ${qr.visibility}`,
    `Scans: ${qr.totalScans} total / ${qr.uniqueScans} unique`,
    `Created at: ${formatDate(qr.createdAt)}`,
    `Updated at: ${formatDate(qr.updatedAt)}`,
  ].join('\n')
}

async function handleCreateQr(args: unknown, ctx: McpContext): Promise<string> {
  const parsed = createQrSchema.parse(args ?? {})
  const created = await qrService.createQr({
    title: parsed.title,
    destinationUrl: parsed.destination_url,
    description: parsed.description,
    type: parsed.type,
    folderId: parsed.folder_id,
    tagIds: parsed.tag_ids,
  }, ctx.user)

  return `QR-код создан: ${created.title} (ID: ${created.id}, short code: ${created.shortCode}). URL: ${created.destinationUrl}`
}

async function handleUpdateQr(args: unknown, ctx: McpContext): Promise<string> {
  const parsed = updateQrSchema.parse(args ?? {})
  const updated = await qrService.updateQr(parsed.id, {
    title: parsed.title,
    destinationUrl: parsed.destination_url,
    description: parsed.description,
    folderId: parsed.folder_id,
    status: parsed.status,
  }, ctx.user)

  return `QR-код обновлён: ${updated.title} (ID: ${updated.id}). Текущий статус: ${updated.status}.`
}

async function handleArchiveQr(args: unknown, ctx: McpContext): Promise<string> {
  const parsed = getQrSchema.parse(args ?? {})
  const updated = await qrService.updateQr(parsed.id, { status: 'archived' }, ctx.user)
  return `QR-код архивирован: ${updated.title} (ID: ${updated.id}).`
}

async function handleDuplicateQr(args: unknown, ctx: McpContext): Promise<string> {
  const parsed = duplicateQrSchema.parse(args ?? {})
  const duplicated = await qrService.duplicateQr(parsed.id, ctx.user)
  return `QR-код продублирован: ${duplicated.title} (новый ID: ${duplicated.id}, short code: ${duplicated.shortCode}).`
}

export const qrTools: McpToolDefinition[] = [
  {
    name: 'list_qr_codes',
    description: 'Получить список QR-кодов с фильтрами (LLM-friendly summary).',
    requiredScopes: ['qr:read'],
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string' },
        status: { type: 'string', enum: ['active', 'paused', 'expired', 'archived'] },
        limit: { type: 'number', minimum: 1, maximum: 100 },
      },
      additionalProperties: false,
    },
    parser: listQrSchema,
    execute: handleListQr,
  },
  {
    name: 'get_qr_code',
    description: 'Получить детальную карточку QR-кода по id.',
    requiredScopes: ['qr:read'],
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string', format: 'uuid' } },
      additionalProperties: false,
    },
    parser: getQrSchema,
    execute: handleGetQr,
  },
  {
    name: 'create_qr_code',
    description: 'Создать QR-код. Используйте только с явными параметрами title и destination_url.',
    requiredScopes: ['qr:write'],
    inputSchema: {
      type: 'object',
      required: ['title', 'destination_url'],
      properties: {
        title: { type: 'string' },
        destination_url: { type: 'string', format: 'uri' },
        description: { type: 'string' },
        type: { type: 'string', enum: ['dynamic', 'static'] },
        folder_id: { type: 'string', format: 'uuid' },
        tag_ids: { type: 'array', items: { type: 'string', format: 'uuid' } },
      },
      additionalProperties: false,
    },
    parser: createQrSchema,
    execute: handleCreateQr,
  },
  {
    name: 'update_qr_code',
    description: 'Обновить QR-код по id (title/url/status/folder).',
    requiredScopes: ['qr:write'],
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        destination_url: { type: 'string', format: 'uri' },
        description: { type: ['string', 'null'] },
        folder_id: { type: ['string', 'null'], format: 'uuid' },
        status: { type: 'string', enum: ['active', 'paused', 'expired', 'archived'] },
      },
      additionalProperties: false,
    },
    parser: updateQrSchema,
    execute: handleUpdateQr,
  },
  {
    name: 'archive_qr_code',
    description: 'Перевести QR-код в archived статус.',
    requiredScopes: ['qr:write'],
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string', format: 'uuid' } },
      additionalProperties: false,
    },
    parser: getQrSchema,
    execute: handleArchiveQr,
  },
  {
    name: 'duplicate_qr_code',
    description: 'Создать копию существующего QR-кода.',
    requiredScopes: ['qr:write'],
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string', format: 'uuid' } },
      additionalProperties: false,
    },
    parser: duplicateQrSchema,
    execute: handleDuplicateQr,
  },
]
