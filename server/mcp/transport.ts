import type { H3Event } from 'h3'
import type { createMcpServer } from './server'

type RpcServer = ReturnType<typeof createMcpServer>

type JsonRpcRequest = {
  jsonrpc?: string
  id?: string | number | null
  method?: string
  params?: Record<string, unknown>
}

function isRpcRequest(input: unknown): input is JsonRpcRequest {
  return typeof input === 'object' && input !== null && !Array.isArray(input)
}

export async function handleStreamableHttpRequest(event: H3Event, server: RpcServer) {
  const body = await readBody<unknown>(event)

  if (Array.isArray(body)) {
    const responses = await Promise.all(
      body.map((item) => {
        if (!isRpcRequest(item)) {
          return {
            jsonrpc: '2.0' as const,
            id: null,
            error: {
              code: -32600,
              message: 'Invalid Request',
            },
          }
        }

        return server.handleRpcRequest(item)
      }),
    )

    setHeader(event, 'content-type', 'application/json; charset=utf-8')
    return responses
  }

  if (!isRpcRequest(body)) {
    setResponseStatus(event, 400)
    setHeader(event, 'content-type', 'application/json; charset=utf-8')
    return {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32600,
        message: 'Invalid Request',
      },
    }
  }

  const response = await server.handleRpcRequest(body)
  setHeader(event, 'content-type', 'application/json; charset=utf-8')
  return response
}
