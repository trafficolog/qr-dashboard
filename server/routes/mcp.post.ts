import { authenticateMcpRequest } from '../mcp/auth'
import { createMcpServer } from '../mcp/server'
import { handleStreamableHttpRequest } from '../mcp/transport'

export default defineEventHandler(async (event) => {
  const context = await authenticateMcpRequest(event)
  const server = createMcpServer(context)

  return handleStreamableHttpRequest(event, server)
})
