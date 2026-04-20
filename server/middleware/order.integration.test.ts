import { beforeEach, describe, expect, it, vi } from 'vitest'

const verifySessionMock = vi.fn()
const verifyApiKeyMock = vi.fn()
const touchLastUsedMock = vi.fn()
const dbSessionFindFirstMock = vi.fn()
const dbExecuteMock = vi.fn()

vi.mock('../services/auth.service', () => ({
  authService: {
    verifySession: verifySessionMock,
  },
}))

vi.mock('../services/api-key.service', () => ({
  apiKeyService: {
    verify: verifyApiKeyMock,
    touchLastUsed: touchLastUsedMock,
  },
}))

vi.mock('../utils/ip', () => ({
  getClientIp: () => '127.0.0.1',
}))

vi.mock('../db', () => ({
  db: {
    query: {
      sessions: {
        findFirst: dbSessionFindFirstMock,
      },
    },
    execute: dbExecuteMock,
  },
}))

type MockEvent = {
  method: string
  path: string
  headers: Record<string, string>
  cookies: Record<string, string>
  context: Record<string, unknown>
  responseHeaders: Record<string, string>
}

function createMockEvent(input: Partial<MockEvent>): MockEvent {
  return {
    method: input.method ?? 'GET',
    path: input.path ?? '/',
    headers: input.headers ?? {},
    cookies: input.cookies ?? {},
    context: input.context ?? {},
    responseHeaders: {},
  }
}

describe('server middleware order smoke checks', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    ;(globalThis as { defineEventHandler?: <T>(handler: T) => T }).defineEventHandler = (handler) => handler
    ;(globalThis as { getRequestURL?: (event: MockEvent) => { pathname: string } }).getRequestURL = (event) => ({ pathname: event.path })
    ;(globalThis as { getMethod?: (event: MockEvent) => string }).getMethod = (event) => event.method
    ;(globalThis as { getHeader?: (event: MockEvent, name: string) => string | undefined }).getHeader = (event, name) => {
      const key = Object.keys(event.headers).find((headerName) => headerName.toLowerCase() === name.toLowerCase())
      return key ? event.headers[key] : undefined
    }
    ;(globalThis as { getCookie?: (event: MockEvent, name: string) => string | undefined }).getCookie = (event, name) => event.cookies[name]
    ;(globalThis as { setHeaders?: (event: MockEvent, headers: Record<string, string>) => void }).setHeaders = (event, headers) => {
      for (const [key, value] of Object.entries(headers)) {
        event.responseHeaders[key] = value
      }
    }
    ;(globalThis as { setHeader?: (event: MockEvent, name: string, value: string) => void }).setHeader = (event, name, value) => {
      event.responseHeaders[name] = value
    }
    ;(globalThis as { setResponseHeader?: (event: MockEvent, name: string, value: string | number) => void }).setResponseHeader = (event, name, value) => {
      event.responseHeaders[name] = String(value)
    }
    ;(globalThis as { useRuntimeConfig?: () => { public: { appUrl: string, csrfHeaderName: string } } }).useRuntimeConfig = () => ({
      public: {
        appUrl: 'https://dashboard.example.com',
        csrfHeaderName: 'x-csrf-token',
      },
    })
    ;(globalThis as { createError?: (input: { statusCode: number, statusMessage?: string, message?: string, data?: unknown }) => Error & { statusCode: number, data?: unknown } }).createError =
      ({ statusCode, statusMessage, message, data }) => Object.assign(new Error(message ?? statusMessage ?? 'error'), { statusCode, data })
  })

  async function importMiddleware() {
    const [securityHeaders, auth, csrf, rateLimit] = await Promise.all([
      import('./00-security-headers'),
      import('./01-auth'),
      import('./02-csrf'),
      import('./03-rate-limit'),
    ])

    return [securityHeaders.default, auth.default, csrf.default, rateLimit.default]
  }

  async function runPipeline(event: MockEvent) {
    const handlers = await importMiddleware()
    for (const handler of handlers) {
      await handler(event as never)
    }
  }

  it('uses expected filename prefixes for deterministic middleware order', async () => {
    const fs = await import('node:fs/promises')
    const names = await fs.readdir(new URL('.', import.meta.url))
    const middlewareNames = names.filter(name => name.endsWith('.ts') && !name.endsWith('.test.ts')).sort()

    expect(middlewareNames).toEqual([
      '00-security-headers.ts',
      '01-auth.ts',
      '02-csrf.ts',
      '03-rate-limit.ts',
      '04-body-size-limit.ts',
    ])
  })

  it('runs auth first for API v1 Bearer and then applies apiKey-based rate-limit', async () => {
    verifyApiKeyMock.mockResolvedValue({
      id: 'key_1',
      permissions: ['qr:read'],
      allowedIps: ['127.0.0.1'],
      user: { id: 'u1' },
    })
    touchLastUsedMock.mockResolvedValue(undefined)
    dbExecuteMock.mockResolvedValue({ rows: [{ count: 1, resetAt: new Date(Date.now() + 60_000) }] })

    const event = createMockEvent({
      method: 'GET',
      path: '/api/v1/qr',
      headers: {
        authorization: 'Bearer sqr_live_test_key',
      },
    })

    await runPipeline(event)

    expect(verifyApiKeyMock).toHaveBeenCalledTimes(1)
    expect(event.context.apiKeyId).toBe('key_1')
    expect(event.responseHeaders['X-RateLimit-Limit']).toBe('100')
  })

  it('applies csrf only for cookie-auth mutating requests and bypasses /api/v1/**', async () => {
    verifyApiKeyMock.mockResolvedValue({
      id: 'key_2',
      permissions: ['qr:write'],
      allowedIps: ['127.0.0.1'],
      user: { id: 'u2' },
    })
    touchLastUsedMock.mockResolvedValue(undefined)
    dbExecuteMock.mockResolvedValue({ rows: [{ count: 1, resetAt: new Date(Date.now() + 60_000) }] })

    const v1Event = createMockEvent({
      method: 'POST',
      path: '/api/v1/qr',
      headers: {
        authorization: 'Bearer sqr_live_test_key',
      },
    })

    await expect(runPipeline(v1Event)).resolves.toBeUndefined()
    expect(dbSessionFindFirstMock).not.toHaveBeenCalled()

    verifySessionMock.mockResolvedValue({ user: { id: 'cookie-user' } })
    dbSessionFindFirstMock.mockResolvedValue({ csrfToken: 'csrf-1' })

    const cookieEvent = createMockEvent({
      method: 'POST',
      path: '/api/qr',
      cookies: { session_token: 'session_1' },
      headers: {
        origin: 'https://dashboard.example.com',
        'x-csrf-token': 'csrf-1',
      },
    })

    await expect(runPipeline(cookieEvent)).resolves.toBeUndefined()
    expect(dbSessionFindFirstMock).toHaveBeenCalledTimes(1)
  })

  it('sets security headers on error responses because headers middleware runs first', async () => {
    const event = createMockEvent({
      method: 'POST',
      path: '/api/qr',
    })

    await expect(runPipeline(event)).rejects.toMatchObject({ statusCode: 401 })
    expect(event.responseHeaders['X-Frame-Options']).toBe('DENY')
    expect(event.responseHeaders['X-Content-Type-Options']).toBe('nosniff')
  })
})
