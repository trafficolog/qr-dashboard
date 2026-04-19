import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveVisibilityAccess } from './qr-visibility-access'

test('analytics metrics are available for department member in department scope', () => {
  const access = resolveVisibilityAccess({
    scope: 'department',
    userRole: 'editor',
    userDepartmentIds: ['dep-member'],
  })

  assert.equal(access.denyAll, false)
  assert.deepEqual(access.allowedDepartmentIds, ['dep-member'])
  assert.equal(access.includeMine, false)
  assert.equal(access.includePublic, false)
})

test('analytics metrics are available for department head in department scope', () => {
  const access = resolveVisibilityAccess({
    scope: 'department',
    userRole: 'editor',
    userDepartmentIds: ['dep-head'],
  })

  assert.equal(access.denyAll, false)
  assert.deepEqual(access.allowedDepartmentIds, ['dep-head'])
  assert.equal(access.includeMine, false)
  assert.equal(access.includePublic, false)
})

test('analytics metrics are available for admin in company scope', () => {
  const access = resolveVisibilityAccess({
    scope: 'company',
    userRole: 'admin',
    userDepartmentIds: [],
  })

  assert.equal(access.denyAll, false)
  assert.equal(access.includeMine, true)
  assert.equal(access.includePublic, true)
  assert.equal(access.allowedDepartmentIds, null)
})
