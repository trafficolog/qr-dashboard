import { ZodError } from 'zod'
import type { McpContext } from './auth'
import type { McpToolDefinition } from './server'
import { qrTools } from './tools/qr'
import { folderTools } from './tools/folders'
import { tagTools } from './tools/tags'
import { analyticsTools } from './tools/analytics'

export const allMcpTools: McpToolDefinition[] = [
  ...qrTools,
  ...folderTools,
  ...tagTools,
  ...analyticsTools,
]

const toolsByName = new Map(allMcpTools.map(tool => [tool.name, tool]))

export async function dispatchToolCall(name: string, args: unknown, ctx: McpContext) {
  const tool = toolsByName.get(name)
  if (!tool) {
    throw createError({ statusCode: 404, message: `Unknown tool: ${name}` })
  }

  const missingScope = tool.requiredScopes.find(scope => !ctx.apiKey.permissions.includes(scope))
  if (missingScope) {
    throw createError({
      statusCode: 403,
      message: `API key lacks required scope: ${missingScope}`,
    })
  }

  let parsedArgs: unknown
  try {
    parsedArgs = tool.parser.parse(args ?? {})
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
