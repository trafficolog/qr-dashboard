import type { ZodType } from 'zod'
import {
  CallToolRequestSchema,
  ErrorCode,
  InitializeRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import type { McpContext } from './auth'
import { dispatchResourceList, dispatchResourceRead, dispatchToolCall, filterToolsByPermissions } from './dispatcher'

export type ApiPermission = 'qr:read' | 'qr:write' | 'qr:stats:read' | 'mcp:access'

export type McpToolDefinition = {
  name: string
  description: string
  requiredScopes: ApiPermission[]
  inputSchema: {
    required?: unknown
    [key: string]: unknown
  }
  parser: ZodType
  execute: (args: unknown, ctx: McpContext) => Promise<string>
}

export type McpResourceListItem = {
  uri: string
  name: string
  description: string
  mimeType: string
}

export type McpResourceDefinition = McpResourceListItem & {
  requiredScopes: ApiPermission[]
  read: (uri: string, ctx: McpContext) => Promise<string>
  list?: (ctx: McpContext) => Promise<McpResourceListItem[]>
}

function toMcpError(error: unknown): McpError {
  if (error instanceof McpError) {
    return error
  }

  const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
    ? (error as { statusCode?: unknown }).statusCode
    : undefined

  const message = error instanceof Error ? error.message : 'Internal server error'

  if (statusCode === 400) {
    return new McpError(ErrorCode.InvalidParams, message)
  }

  if (statusCode === 404) {
    return new McpError(ErrorCode.MethodNotFound, message)
  }

  if (statusCode === 403) {
    return new McpError(ErrorCode.InvalidRequest, message)
  }

  return new McpError(ErrorCode.InternalError, message)
}

export function createMcpServer(context: McpContext) {
  const server = new Server(
    {
      name: 'splat-qr',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {
          listChanged: false,
        },
        resources: {
          subscribe: false,
          listChanged: false,
        },
      },
    },
  )

  server.setRequestHandler(InitializeRequestSchema, async () => {
    return {
      protocolVersion: '2025-03-26',
      serverInfo: {
        name: 'splat-qr',
        version: '1.0.0',
      },
      capabilities: {
        tools: {
          listChanged: false,
        },
        resources: {
          subscribe: false,
          listChanged: false,
        },
      },
    }
  })

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const availableTools = filterToolsByPermissions(context.apiKey.permissions)
    return {
      tools: availableTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    }
  })

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      return await dispatchToolCall(request.params.name, request.params.arguments, context)
    }
    catch (error) {
      throw toMcpError(error)
    }
  })

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    try {
      const resources = await dispatchResourceList(context)
      return { resources }
    }
    catch (error) {
      throw toMcpError(error)
    }
  })

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    try {
      return await dispatchResourceRead(request.params.uri, context)
    }
    catch (error) {
      throw toMcpError(error)
    }
  })

  return server
}
