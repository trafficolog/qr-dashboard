export type KnownApiPermission = 'qr:read' | 'qr:write' | 'qr:stats:read' | 'mcp:access'

type Translate = (key: string) => string

export function permissionLabel(permission: string, t: Translate): string {
  if (permission === 'qr:read') return t('settings.integrations.apiKeys.permissions.qrRead')
  if (permission === 'qr:write') return t('settings.integrations.apiKeys.permissions.qrWrite')
  if (permission === 'qr:stats:read') return t('settings.integrations.apiKeys.permissions.qrStatsRead')
  if (permission === 'mcp:access') return t('settings.integrations.apiKeys.permissions.mcpAccess')

  return permission
}
