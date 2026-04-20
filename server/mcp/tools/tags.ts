import { z } from 'zod'
import { tagService } from '../../services/tag.service'
import type { McpToolDefinition } from '../server'
import type { McpContext } from '../auth'

const createTagSchema = z.object({
  name: z.string().trim().min(1).max(255),
  color: z.string().trim().max(20).optional(),
})

async function handleListTags(_args: unknown, _ctx: McpContext): Promise<string> {
  const tags = await tagService.list()

  if (tags.length === 0) {
    return 'Теги не найдены.'
  }

  return [
    `Тегов найдено: ${tags.length}.`,
    '',
    ...tags.map((tag, idx) => `${idx + 1}. ${tag.name} (ID: ${tag.id}, qrCount: ${tag.qrCount})`),
  ].join('\n')
}

async function handleCreateTag(args: unknown, _ctx: McpContext): Promise<string> {
  const parsed = createTagSchema.parse(args ?? {})
  const tag = await tagService.create(parsed)
  return `Тег создан: ${tag.name} (ID: ${tag.id}).`
}

export const tagTools: McpToolDefinition[] = [
  {
    name: 'list_tags',
    description: 'Получить список тегов с количеством QR-кодов в каждом.',
    requiredScopes: ['qr:read'],
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    parser: z.object({}).passthrough(),
    execute: handleListTags,
  },
  {
    name: 'create_tag',
    description: 'Создать тег.',
    requiredScopes: ['qr:write'],
    inputSchema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        color: { type: 'string' },
      },
      additionalProperties: false,
    },
    parser: createTagSchema,
    execute: handleCreateTag,
  },
]
