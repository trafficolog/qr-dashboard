const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000'
const API_TOKEN = process.env.API_TOKEN
const API_KEY_PERMISSIONS = (process.env.API_KEY_PERMISSIONS ?? '')
  .split(',')
  .map(scope => scope.trim())
  .filter(Boolean)

if (!API_TOKEN) {
  throw new Error('API_TOKEN is required')
}

const TOOL_SCOPE_REQUIREMENTS: Record<string, string[]> = {
  list_qr_codes: ['qr:read'],
  get_qr_code: ['qr:read'],
  create_qr_code: ['qr:write'],
  update_qr_code: ['qr:write'],
  archive_qr_code: ['qr:write'],
  duplicate_qr_code: ['qr:write'],
  list_folders: ['qr:read'],
  create_folder: ['qr:write'],
  list_tags: ['qr:read'],
  create_tag: ['qr:write'],
  get_analytics_overview: ['qr:stats:read'],
  get_top_qr_codes: ['qr:stats:read'],
}

type JsonRpcSuccess<T = unknown> = {
  jsonrpc: '2.0'
  id: number
  result: T
}

type JsonRpcError = {
  jsonrpc: '2.0'
  id: number
  error: {
    code: number
    message: string
    data?: unknown
  }
}

type JsonRpcResponse<T = unknown> = JsonRpcSuccess<T> | JsonRpcError

type McpToolSummary = {
  name: string
}

function isJsonRpcError<T>(response: JsonRpcResponse<T>): response is JsonRpcError {
  return 'error' in response
}

async function postJsonRpc<T>(payload: { id: number, method: string, params?: unknown }, stage: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: payload.id,
      method: payload.method,
      params: payload.params,
    }),
  })

  const rawBody = await response.text()

  if (!response.ok) {
    console.error(`[${stage}] HTTP error`, {
      status: response.status,
      statusText: response.statusText,
      body: rawBody,
    })
    process.exit(1)
  }

  let parsed: JsonRpcResponse<T>
  try {
    parsed = JSON.parse(rawBody) as JsonRpcResponse<T>
  }
  catch (error) {
    console.error(`[${stage}] Invalid JSON response`, { rawBody, error })
    process.exit(1)
  }

  if (isJsonRpcError(parsed)) {
    console.error(`[${stage}] JSON-RPC error`, parsed.error)
    process.exit(1)
  }

  return parsed.result
}

async function testConnection() {
  const initializeResult = await postJsonRpc(
    {
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'mcp-health-check',
          version: '1.0.0',
        },
      },
    },
    'initialize',
  )

  console.log('initialize result:', initializeResult)

  const toolsListResult = await postJsonRpc<{ tools?: McpToolSummary[] }>(
    {
      id: 2,
      method: 'tools/list',
    },
    'tools/list',
  )

  const tools = Array.isArray(toolsListResult?.tools) ? toolsListResult.tools : []
  const toolNames = new Set(
    tools
      .filter((tool): tool is McpToolSummary => Boolean(tool && typeof tool.name === 'string'))
      .map(tool => tool.name),
  )

  if (toolNames.size === 0) {
    console.error('[tools/list] Empty tools list')
    process.exit(1)
  }

  console.log('[tools/list] tools count:', toolNames.size)

  if (API_KEY_PERMISSIONS.length > 0) {
    const expectedToolNames = Object.entries(TOOL_SCOPE_REQUIREMENTS)
      .filter(([, scopes]) => scopes.every(scope => API_KEY_PERMISSIONS.includes(scope)))
      .map(([name]) => name)
      .sort()

    const visibleKnownTools = Array.from(toolNames)
      .filter(name => name in TOOL_SCOPE_REQUIREMENTS)
      .sort()

    const missingTools = expectedToolNames.filter(name => !toolNames.has(name))
    const forbiddenTools = visibleKnownTools.filter(name => !expectedToolNames.includes(name))

    if (missingTools.length > 0 || forbiddenTools.length > 0) {
      console.error('[tools/list] Scope mismatch for provided API_KEY_PERMISSIONS', {
        apiKeyPermissions: API_KEY_PERMISSIONS,
        expectedToolNames,
        visibleKnownTools,
        missingTools,
        forbiddenTools,
      })
      process.exit(1)
    }
  }

  if (!toolNames.has('list_qr_codes')) {
    console.log('[tools/call] Skip list_qr_codes call: API key has no qr:read scope')
    return
  }

  const toolCallResult = await postJsonRpc(
    {
      id: 3,
      method: 'tools/call',
      params: {
        name: 'list_qr_codes',
        arguments: {
          limit: 1,
        },
      },
    },
    'tools/call',
  )

  console.log('[tools/call] structured result:', JSON.stringify(toolCallResult, null, 2))
}

testConnection().catch((error) => {
  console.error(error)
  process.exit(1)
})
