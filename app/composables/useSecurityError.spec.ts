import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('useSecurityError', () => {
  beforeEach(() => {
    vi.resetModules()

    vi.stubGlobal('useI18n', () => ({
      t: (key: string) => `translated:${key}`,
    }))
  })

  it('returns parsed message for unknown security code without calling t with undefined key', async () => {
    const tSpy = vi.fn((key: string) => `translated:${key}`)

    vi.stubGlobal('useI18n', () => ({ t: tSpy }))

    const { useSecurityError } = await import('./useSecurityError')
    const { getSecurityMessage } = useSecurityError()

    const message = getSecurityMessage({
      data: {
        error: {
          code: 'auth.unknown_error',
          message: 'Raw API error',
        },
      },
    }, 'Fallback message')

    expect(message).toBe('Raw API error')
    expect(tSpy).not.toHaveBeenCalledWith(undefined)
  })

  it('uses fallback when security code is unknown and message is missing', async () => {
    const { useSecurityError } = await import('./useSecurityError')
    const { getSecurityMessage } = useSecurityError()

    const message = getSecurityMessage({
      data: {
        error: {
          code: 'AUTH.UNKNOWN_ERROR',
        },
      },
    }, 'Fallback message')

    expect(message).toBe('Fallback message')
  })
})
