import { describe, expect, it } from 'vitest'
import { permissionLabel } from './permission-label'

describe('permissionLabel', () => {
  const t = (key: string) => `translated:${key}`

  it('maps known permissions including mcp:access', () => {
    expect(permissionLabel('qr:read', t)).toBe('translated:settings.integrations.apiKeys.permissions.qrRead')
    expect(permissionLabel('qr:write', t)).toBe('translated:settings.integrations.apiKeys.permissions.qrWrite')
    expect(permissionLabel('qr:stats:read', t)).toBe('translated:settings.integrations.apiKeys.permissions.qrStatsRead')
    expect(permissionLabel('mcp:access', t)).toBe('translated:settings.integrations.apiKeys.permissions.mcpAccess')
  })

  it('keeps unknown permission as raw value for safe fallback badge', () => {
    expect(permissionLabel('permission', t)).toBe('permission')
  })
})
