import type { ZodType } from 'zod'
import type { McpContext } from './auth'
import { allMcpTools, dispatchToolCall } from './dispatcher'

export type ApiPermission = 'qr:read' | 'qr:write' | 'qr:stats:read' | 'mcp:access'

export type McpToolDefinition = {
  name: string
  description: string
  requiredScopes: ApiPermission[]
  inputSchema: Record<string, unknown>
  parser: ZodType
  execute: (args: unknown, ctx: McpContext) => Promise<string>
}

type JsonRpcRequest = {
  jsonrpc?: string
  id?: string | number | null
  method?: string
  params?: Record<string, unknown>
}

function makeError(id: JsonRpcRequest['id'], code: number, message: string, data?: unknown) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: {
      code,
      message,
      ...(data !== undefined ? { data } : {}),
    },
  }
}

function getResourcesList() {
  return []
}

export function createMcpServer(context: McpContext) {
  async function handleRpcRequest(request: JsonRpcRequest) {
    const id = request?.id ?? null

    if (!request || request.jsonrpc !== '2.0' || typeof request.method !== 'string') {
      return makeError(id, -32600, 'Invalid Request')
    }

    try {
      if (request.method === 'initialize') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
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
          },
        }
      }

      if (request.method === 'tools/list') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: allMcpTools.map(tool => ({
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema,
            })),
          },
        }
      }

      if (request.method === 'tools/call') {
        const name = request.params?.name
        const args = request.params?.arguments

        if (typeof name !== 'string') {
          return makeError(id, -32602, 'Invalid params: "name" is required')
        }

        const result = await dispatchToolCall(name, args, context)
        return {
          jsonrpc: '2.0',
          id,
          result,
        }
      }

      if (request.method === 'resources/list') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            resources: getResourcesList(),
          },
        }
      }

      if (request.method === 'resources/read') {
        const uri = request.params?.uri
        if (typeof uri !== 'string') {
          return makeError(id, -32602, 'Invalid params: "uri" is required')
        }

        return makeError(id, -32004, `Resource not found: ${uri}`)
      }

      return makeError(id, -32601, `Method not found: ${request.method}`)
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return makeError(id, -32000, message)
    }
  }

  return {
    handleRpcRequest,
  }
}
