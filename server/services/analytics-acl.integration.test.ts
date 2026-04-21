import { describe, expect, it } from 'vitest'
import { resolveVisibilityAccess } from './qr-visibility-access'

describe('analytics ACL', () => {
  it('analytics metrics are available for department member in department scope', () => {
    const access = resolveVisibilityAccess({
      scope: 'department',
      userRole: 'editor',
      userDepartmentIds: ['dep-member'],
    })

    expect(access.denyAll).toBe(false)
    expect(access.allowedDepartmentIds).toEqual(['dep-member'])
    expect(access.includeMine).toBe(false)
    expect(access.includePublic).toBe(false)
  })

  it('analytics metrics are available for department head in department scope', () => {
    const access = resolveVisibilityAccess({
      scope: 'department',
      userRole: 'editor',
      userDepartmentIds: ['dep-head'],
    })

    expect(access.denyAll).toBe(false)
    expect(access.allowedDepartmentIds).toEqual(['dep-head'])
    expect(access.includeMine).toBe(false)
    expect(access.includePublic).toBe(false)
  })

  it('analytics metrics are available for admin in company scope', () => {
    const access = resolveVisibilityAccess({
      scope: 'company',
      userRole: 'admin',
      userDepartmentIds: [],
    })

    expect(access.denyAll).toBe(false)
    expect(access.includeMine).toBe(true)
    expect(access.includePublic).toBe(true)
    expect(access.allowedDepartmentIds).toBeNull()
  })
})
