import { describe, expect, it } from 'vitest'
import { isActiveRoute } from './isActiveRoute'

describe('isActiveRoute', () => {
  it('returns true for /qr and nested /qr/abc/edit', () => {
    expect(isActiveRoute('/qr/abc/edit', '/qr')).toBe(true)
  })

  it('returns false for /qr and /qrscan', () => {
    expect(isActiveRoute('/qrscan', '/qr')).toBe(false)
  })

  it('returns true for /settings and /settings/profile', () => {
    expect(isActiveRoute('/settings/profile', '/settings')).toBe(true)
  })

  it('returns false for /settings and /settings-legacy', () => {
    expect(isActiveRoute('/settings-legacy', '/settings')).toBe(false)
  })
})
