import { describe, expect, it } from 'vitest'
import { resolveVisibilityAccess } from './qr-visibility-access'

describe('qr visibility access', () => {
  it('private/default scope for non-admin keeps mine + public + membership departments', () => {
    const access = resolveVisibilityAccess({
      scope: undefined,
      userRole: 'editor',
      userDepartmentIds: ['dep-1', 'dep-2'],
    })

    expect(access.includeMine).toBe(true)
    expect(access.includePublic).toBe(true)
    expect(access.allowedDepartmentIds).toEqual(['dep-1', 'dep-2'])
    expect(access.denyAll).toBe(false)
  })

  it('public scope returns only public records', () => {
    const access = resolveVisibilityAccess({
      scope: 'public',
      userRole: 'editor',
      userDepartmentIds: ['dep-1'],
    })

    expect(access.includeMine).toBe(false)
    expect(access.includePublic).toBe(true)
    expect(access.allowedDepartmentIds).toEqual([])
    expect(access.denyAll).toBe(false)
  })

  it('department scope without departmentId returns all member departments for non-admin', () => {
    const access = resolveVisibilityAccess({
      scope: 'department',
      userRole: 'viewer',
      userDepartmentIds: ['dep-10', 'dep-11'],
    })

    expect(access.includeMine).toBe(false)
    expect(access.includePublic).toBe(false)
    expect(access.allowedDepartmentIds).toEqual(['dep-10', 'dep-11'])
    expect(access.denyAll).toBe(false)
  })

  it('department scope without departmentId for admin returns all department QR', () => {
    const access = resolveVisibilityAccess({
      scope: 'department',
      userRole: 'admin',
      userDepartmentIds: [],
    })

    expect(access.includeMine).toBe(false)
    expect(access.includePublic).toBe(false)
    expect(access.allowedDepartmentIds).toBeNull()
    expect(access.denyAll).toBe(false)
  })

  it('company/all scope is denied for non-admin users', () => {
    const access = resolveVisibilityAccess({
      scope: 'company',
      userRole: 'editor',
      userDepartmentIds: ['dep-1'],
    })

    expect(access.denyAll).toBe(true)
    expect(access.includeMine).toBe(false)
    expect(access.includePublic).toBe(false)
    expect(access.allowedDepartmentIds).toEqual([])
  })
})
