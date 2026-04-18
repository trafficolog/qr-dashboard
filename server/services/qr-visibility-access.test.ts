import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveVisibilityAccess } from './qr-visibility-access'

test('private/default scope for non-admin keeps mine + public + membership departments', () => {
  const access = resolveVisibilityAccess({
    scope: undefined,
    userRole: 'editor',
    userDepartmentIds: ['dep-1', 'dep-2'],
  })

  assert.equal(access.includeMine, true)
  assert.equal(access.includePublic, true)
  assert.deepEqual(access.allowedDepartmentIds, ['dep-1', 'dep-2'])
  assert.equal(access.denyAll, false)
})

test('public scope returns only public records', () => {
  const access = resolveVisibilityAccess({
    scope: 'public',
    userRole: 'editor',
    userDepartmentIds: ['dep-1'],
  })

  assert.equal(access.includeMine, false)
  assert.equal(access.includePublic, true)
  assert.deepEqual(access.allowedDepartmentIds, [])
  assert.equal(access.denyAll, false)
})

test('department scope without departmentId returns all member departments for non-admin', () => {
  const access = resolveVisibilityAccess({
    scope: 'department',
    userRole: 'viewer',
    userDepartmentIds: ['dep-10', 'dep-11'],
  })

  assert.equal(access.includeMine, false)
  assert.equal(access.includePublic, false)
  assert.deepEqual(access.allowedDepartmentIds, ['dep-10', 'dep-11'])
  assert.equal(access.denyAll, false)
})

test('department scope without departmentId for admin returns all department QR', () => {
  const access = resolveVisibilityAccess({
    scope: 'department',
    userRole: 'admin',
    userDepartmentIds: [],
  })

  assert.equal(access.includeMine, false)
  assert.equal(access.includePublic, false)
  assert.equal(access.allowedDepartmentIds, null)
  assert.equal(access.denyAll, false)
})
