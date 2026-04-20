import type { H3Event } from 'h3'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type { createMcpServer } from './server'

type McpServer = ReturnType<typeof createMcpServer>

type TransportOptions = {
  parsedBody?: unknown
}

export async function handleStreamableHttpRequest(event: H3Event, server: McpServer, options: TransportOptions = {}) {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  await server.connect(transport)

  try {
    await transport.handleRequest(event.node.req, event.node.res, options.parsedBody)
  }
  finally {
    await transport.close()
    await server.close()
  }
}
