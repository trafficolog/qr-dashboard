import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type VerifyOtpResponse = {
  sessionToken: string
  csrfToken: string
  user: {
    id: string
    email: string
    name: string | null
    role: 'admin' | 'editor' | 'viewer'
    avatarUrl: string | null
  }
}

const verifyOtpMock = vi.fn<() => Promise<VerifyOtpResponse>>()
const verifySessionMock = vi.fn()
const logoutMock = vi.fn()

vi.mock('../../services/auth.service', () => ({
  authService: {
    verifyOtp: verifyOtpMock,
    verifySession: verifySessionMock,
    logout: logoutMock,
  },
}))

describe('auth cookie policy & same-origin API flow', () => {
  const setCookieMock = vi.fn()
  const deleteCookieMock = vi.fn()
  const getCookieMock = vi.fn()

  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    ;(globalThis as { defineEventHandler?: <T>(handler: T) => T }).defineEventHandler = (handler) => handler
    ;(globalThis as { readValidatedBody?: () => Promise<{ email: string, code: string }> }).readValidatedBody =
      vi.fn().mockResolvedValue({ email: 'user@example.com', code: '123456' })
    ;(globalThis as { setCookie?: typeof setCookieMock }).setCookie = setCookieMock
    ;(globalThis as { deleteCookie?: typeof deleteCookieMock }).deleteCookie = deleteCookieMock
    ;(globalThis as { getCookie?: typeof getCookieMock }).getCookie = getCookieMock
    ;(globalThis as { apiSuccess?: <T>(payload: T) => { ok: true, data: T } }).apiSuccess =
      (payload) => ({ ok: true, data: payload })
    ;(globalThis as { createError?: (input: { statusCode: number, message: string }) => Error & { statusCode: number } }).createError =
      ({ statusCode, message }) => Object.assign(new Error(message), { statusCode })
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  it('sets SameSite=strict and secure=true in production on OTP verify', async () => {
    process.env.NODE_ENV = 'production'

    verifyOtpMock.mockResolvedValue({
      sessionToken: 'prod-token',
      csrfToken: 'csrf',
      user: {
        id: 'u1',
        email: 'user@example.com',
        name: null,
        role: 'admin',
        avatarUrl: null,
      },
    })

    const handler = (await import('./verify.post')).default
    await handler({} as never)

    expect(setCookieMock).toHaveBeenCalledWith(
      expect.anything(),
      'session_token',
      'prod-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
        path: '/',
      }),
    )
  })

  it('keeps secure=false outside production while preserving SameSite=strict', async () => {
    process.env.NODE_ENV = 'development'

    verifyOtpMock.mockResolvedValue({
      sessionToken: 'dev-token',
      csrfToken: 'csrf',
      user: {
        id: 'u1',
        email: 'user@example.com',
        name: null,
        role: 'editor',
        avatarUrl: null,
      },
    })

    const handler = (await import('./verify.post')).default
    await handler({} as never)

    expect(setCookieMock).toHaveBeenCalledWith(
      expect.anything(),
      'session_token',
      'dev-token',
      expect.objectContaining({
        sameSite: 'strict',
        secure: false,
      }),
    )
  })

  it('supports same-origin authenticated me + logout flow via session cookie', async () => {
    getCookieMock.mockReturnValue('same-origin-token')
    verifySessionMock.mockResolvedValue({
      user: {
        id: 'u1',
        email: 'user@example.com',
        name: null,
        role: 'viewer',
        avatarUrl: null,
      },
      csrfToken: 'csrf-token',
    })

    const meHandler = (await import('./me.get')).default
    const meResponse = await meHandler({} as never)

    expect(verifySessionMock).toHaveBeenCalledWith('same-origin-token')
    expect(meResponse).toMatchObject({
      ok: true,
      data: {
        id: 'u1',
        email: 'user@example.com',
        csrfToken: 'csrf-token',
      },
    })

    const logoutHandler = (await import('./logout.post')).default
    const logoutResponse = await logoutHandler({} as never)

    expect(logoutMock).toHaveBeenCalledWith('same-origin-token')
    expect(deleteCookieMock).toHaveBeenCalledWith(
      expect.anything(),
      'session_token',
      { path: '/' },
    )
    expect(logoutResponse).toMatchObject({ ok: true, data: { success: true } })
  })
})
