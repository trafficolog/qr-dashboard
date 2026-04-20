import { authenticateMcpRequest } from '../mcp/auth'
import { createMcpServer } from '../mcp/server'

export default defineEventHandler(async (event) => {
  const context = await authenticateMcpRequest(event)
  const request = await readBody(event)

  const server = createMcpServer(context)
  const response = await server.handleRpcRequest(request)

  setHeader(event, 'content-type', 'application/json; charset=utf-8')
  return response
})
