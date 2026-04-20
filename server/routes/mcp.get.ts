import { authenticateMcpRequest } from '../mcp/auth'
import { dispatchResourceList, filterToolsByPermissions } from '../mcp/dispatcher'
import { createMcpServer } from '../mcp/server'
import { handleStreamableHttpRequest } from '../mcp/transport'

export default defineEventHandler(async (event) => {
  const context = await authenticateMcpRequest(event)
  const queryMethod = getQuery(event).method

  // Legacy compatibility: keep GET ?method=tools/list and GET ?method=resources/list support.
  if (queryMethod === 'tools/list') {
    const availableTools = filterToolsByPermissions(context.apiKey.permissions)
    setHeader(event, 'content-type', 'application/json; charset=utf-8')
    return {
      jsonrpc: '2.0',
      id: 'legacy-tools/list',
      result: {
        tools: availableTools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      },
    }
  }

  if (queryMethod === 'resources/list') {
    const resources = await dispatchResourceList(context)
    setHeader(event, 'content-type', 'application/json; charset=utf-8')
    return {
      jsonrpc: '2.0',
      id: 'legacy-resources/list',
      result: { resources },
    }
  }

  const server = createMcpServer(context)
  await handleStreamableHttpRequest(event, server)
})
