import { authenticateMcpRequest } from '../mcp/auth'
import { createMcpServer } from '../mcp/server'
import { handleStreamableHttpRequest } from '../mcp/transport'

export default defineEventHandler(async (event) => {
  const context = await authenticateMcpRequest(event)
  const server = createMcpServer(context)
  const body = await readBody<unknown>(event)

  await handleStreamableHttpRequest(event, server, { parsedBody: body })
})
