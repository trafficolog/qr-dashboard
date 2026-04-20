const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000'
const API_TOKEN = process.env.API_TOKEN

if (!API_TOKEN) {
  throw new Error('API_TOKEN is required')
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

  const toolsListResult = await postJsonRpc<{ tools?: unknown[] }>(
    {
      id: 2,
      method: 'tools/list',
    },
    'tools/list',
  )

  const tools = Array.isArray(toolsListResult?.tools) ? toolsListResult.tools : []

  if (tools.length === 0) {
    console.error('[tools/list] Empty tools list')
    process.exit(1)
  }

  console.log('[tools/list] tools count:', tools.length)

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
