import { z } from 'zod'
import { folderService } from '../../services/folder.service'
import type { McpToolDefinition } from '../server'
import { zodToJsonSchema } from '../zod-json-schema'
import type { McpContext } from '../auth'

const createFolderSchema = z.object({
  name: z.string().trim().min(1).max(255),
  parent_id: z.string().uuid().nullable().optional(),
  color: z.string().trim().max(20).nullable().optional(),
})

async function handleListFolders(_args: unknown, ctx: McpContext): Promise<string> {
  const folders = await folderService.list(ctx.user)

  if (folders.length === 0) {
    return 'Папки не найдены.'
  }

  const lines = [`Папок найдено: ${folders.length}.`, '']
  for (const [idx, folder] of folders.entries()) {
    lines.push(`${idx + 1}. ${folder.name}`)
    lines.push(`   ID: ${folder.id}`)
    lines.push(`   QR inside: ${folder.qrCount}`)
    if (folder.parentId) lines.push(`   Parent ID: ${folder.parentId}`)
    if (folder.color) lines.push(`   Color: ${folder.color}`)
  }

  return lines.join('\n')
}

async function handleCreateFolder(args: unknown, ctx: McpContext): Promise<string> {
  const parsed = createFolderSchema.parse(args ?? {})
  const folder = await folderService.create({
    name: parsed.name,
    parentId: parsed.parent_id,
    color: parsed.color,
  }, ctx.user)

  return `Папка создана: ${folder.name} (ID: ${folder.id}).`
}

export const folderTools: McpToolDefinition[] = [
  {
    name: 'list_folders',
    description: 'Получить список папок с количеством QR-кодов.',
    requiredScopes: ['qr:read'],
    inputSchema: zodToJsonSchema(z.object({})),
    parser: z.object({}),
    execute: handleListFolders,
  },
  {
    name: 'create_folder',
    description: 'Создать новую папку.',
    requiredScopes: ['qr:write'],
    inputSchema: zodToJsonSchema(createFolderSchema),
    parser: createFolderSchema,
    execute: handleCreateFolder,
  },
]
