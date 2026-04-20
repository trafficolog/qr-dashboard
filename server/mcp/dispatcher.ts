import { ZodError } from 'zod'
import type { McpContext } from './auth'
import type { McpResourceDefinition, McpResourceListItem, McpToolDefinition } from './server'
import { analyticsResources } from './resources/analytics'
import { qrResources } from './resources/qr'
import { analyticsTools } from './tools/analytics'
import { folderTools } from './tools/folders'
import { qrTools } from './tools/qr'
import { tagTools } from './tools/tags'

export const allMcpTools: McpToolDefinition[] = [
  ...qrTools,
  ...folderTools,
  ...tagTools,
  ...analyticsTools,
]

export const allMcpResources: McpResourceDefinition[] = [
  ...qrResources,
  ...analyticsResources,
]

const toolsByName = new Map(allMcpTools.map(tool => [tool.name, tool]))

function ensureScope(requiredScopes: string[], permissions: string[]) {
  const missingScope = requiredScopes.find(scope => !permissions.includes(scope))
  if (missingScope) {
    throw createError({
      statusCode: 403,
      message: `API key lacks required scope: ${missingScope}`,
    })
  }
}

function ensureObjectArgs(args: unknown): Record<string, unknown> {
  if (args === undefined || args === null) {
    return {}
  }

  if (typeof args !== 'object' || Array.isArray(args)) {
    throw createError({ statusCode: 400, message: 'Invalid tool arguments: expected an object' })
  }

  return args as Record<string, unknown>
}

function ensureRequiredToolArgs(tool: McpToolDefinition, args: Record<string, unknown>) {
  const required = Array.isArray(tool.inputSchema.required) ? tool.inputSchema.required : []
  if (required.length === 0) {
    return
  }

  const missing = required.filter((key): key is string => typeof key === 'string' && !(key in args))
  if (missing.length > 0) {
    throw createError({
      statusCode: 400,
      message: `Missing required tool arguments: ${missing.join(', ')}`,
    })
  }
}

function uriMatches(pattern: string, uri: string): boolean {
  if (pattern === uri) {
    return true
  }

  const regex = new RegExp(`^${pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\\{[^}]+\\\}/g, '[^/]+')}$`)

  return regex.test(uri)
}

function findResourceByUri(uri: string): McpResourceDefinition | undefined {
  return allMcpResources.find(resource => uriMatches(resource.uri, uri))
}

export async function dispatchToolCall(name: string, args: unknown, ctx: McpContext) {
  const tool = toolsByName.get(name)
  if (!tool) {
    throw createError({ statusCode: 404, message: `Unknown tool: ${name}` })
  }

  ensureScope(tool.requiredScopes, ctx.apiKey.permissions)

  const rawArgs = ensureObjectArgs(args)
  ensureRequiredToolArgs(tool, rawArgs)

  let parsedArgs: unknown
  try {
    parsedArgs = tool.parser.parse(rawArgs)
  }
  catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        message: `Invalid tool arguments: ${error.issues.map(issue => issue.message).join('; ')}`,
      })
    }
    throw error
  }

  const text = await tool.execute(parsedArgs, ctx)
  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
  }
}

export async function dispatchResourceList(ctx: McpContext): Promise<McpResourceListItem[]> {
  const listed = await Promise.all(allMcpResources.map(async (resource) => {
    if (!resource.list) {
      return []
    }

    try {
      ensureScope(resource.requiredScopes, ctx.apiKey.permissions)
      return await resource.list(ctx)
    }
    catch {
      return []
    }
  }))

  return listed.flat()
}

export async function dispatchResourceRead(uri: string, ctx: McpContext) {
  const resource = findResourceByUri(uri)
  if (!resource) {
    throw createError({ statusCode: 404, message: `Resource not found: ${uri}` })
  }

  ensureScope(resource.requiredScopes, ctx.apiKey.permissions)

  const text = await resource.read(uri, ctx)
  return {
    contents: [
      {
        uri,
        mimeType: resource.mimeType,
        text,
      },
    ],
  }
}
