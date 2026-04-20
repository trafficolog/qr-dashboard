import { authenticateMcpRequest } from '../mcp/auth'
import { createMcpServer } from '../mcp/server'

export default defineEventHandler(async (event) => {
  const context = await authenticateMcpRequest(event)
  const method = getQuery(event).method

  const server = createMcpServer(context)

  if (method === 'tools/list') {
    const response = await server.handleRpcRequest({
      jsonrpc: '2.0',
      id: 'legacy-tools-list',
      method: 'tools/list',
    })
    setHeader(event, 'content-type', 'application/json; charset=utf-8')
    return response
  }

  setHeader(event, 'content-type', 'application/json; charset=utf-8')
  return {
    jsonrpc: '2.0',
    id: 'legacy-info',
    result: {
      message: 'MCP endpoint is available. Use POST /mcp for JSON-RPC calls.',
    },
  }
})
