export type AuditAction =
  | 'auth.verify'
  | 'auth.logout'
  | 'qr.create'
  | 'qr.update'
  | 'qr.update_visibility'
  | 'qr.delete'
  | 'team.invite'
  | 'team.update_role'
  | 'team.delete_user'
  | 'folder.create'
  | 'folder.update'
  | 'folder.delete'
  | 'api_key.create'
  | 'api_key.delete'

export interface AuditLogItem {
  id: string
  userId: string | null
  action: AuditAction
  entityType: string
  entityId: string | null
  details: Record<string, unknown>
  createdAt: string
  user: {
    id: string
    email: string
    name: string | null
    role: 'admin' | 'editor' | 'viewer'
  } | null
}

interface AuditMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AuditFilters {
  userId?: string
  action?: AuditAction
  entityType?: string
  dateFrom?: string
  dateTo?: string
}

export function useAuditLog() {
  const loading = ref(false)
  const items = ref<AuditLogItem[]>([])
  const meta = ref<AuditMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 })

  async function fetchAuditLogs(page = 1, limit = 20, filters: AuditFilters = {}) {
    loading.value = true
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (filters.userId?.trim()) params.set('userId', filters.userId.trim())
      if (filters.action) params.set('action', filters.action)
      if (filters.entityType?.trim()) params.set('entityType', filters.entityType.trim())
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)

      const res = await $fetch<{ data: AuditLogItem[], meta: AuditMeta }>(`/api/admin/audit?${params.toString()}`)
      items.value = res.data
      meta.value = res.meta
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    items: readonly(items),
    meta: readonly(meta),
    fetchAuditLogs,
  }
}
