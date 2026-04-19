import type { QrCode, QrStyle, UtmParams } from '~~/types/qr'
import type { ApiMeta } from '~~/types/api'

interface QrFilters {
  search: string
  status: string
  visibility: '' | 'private' | 'department' | 'public'
  departmentId: string
  scope: '' | 'mine' | 'department' | 'public' | 'all'
  folderId: string
  tags: string
  dateFrom: string
  dateTo: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

interface UpdateQrInput {
  title?: string
  destinationUrl?: string
  description?: string | null
  status?: 'active' | 'paused' | 'expired' | 'archived'
  visibility?: 'private' | 'department' | 'public'
  departmentId?: string | null
  style?: QrStyle | Record<string, unknown>
  utmParams?: UtmParams
  folderId?: string | null
  tagIds?: string[]
  expiresAt?: string | null
}

const defaultFilters: QrFilters = {
  search: '',
  status: '',
  visibility: '',
  departmentId: '',
  scope: '',
  folderId: '',
  tags: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
}

export function useQr() {
  const qrList = ref<QrCode[]>([])
  const loading = ref(false)
  const meta = ref<ApiMeta>({})
  const filters = ref<QrFilters>({ ...defaultFilters })

  // Debounced search
  const debouncedSearch = refDebounced(
    computed(() => filters.value.search),
    300,
  )

  function serializeFiltersToQuery(options?: { useDebouncedSearch?: boolean }) {
    const useDebouncedSearch = options?.useDebouncedSearch ?? false
    const searchValue = useDebouncedSearch ? debouncedSearch.value : filters.value.search

    const query: Record<string, string | number> = {
      page: filters.value.page,
      limit: filters.value.limit,
      sortBy: filters.value.sortBy,
      sortOrder: filters.value.sortOrder,
    }

    if (searchValue) query.search = searchValue
    if (filters.value.status) query.status = filters.value.status
    if (filters.value.folderId) query.folderId = filters.value.folderId
    if (filters.value.visibility) query.visibility = filters.value.visibility
    if (filters.value.departmentId) query.departmentId = filters.value.departmentId
    if (filters.value.scope) query.scope = filters.value.scope
    if (filters.value.tags) query.tags = filters.value.tags
    if (filters.value.dateFrom) query.dateFrom = filters.value.dateFrom
    if (filters.value.dateTo) query.dateTo = filters.value.dateTo

    return query
  }

  function applyFiltersFromQuery(query: Record<string, unknown>) {
    const getString = (value: unknown) => (typeof value === 'string' ? value : '')
    const getVisibility = (value: unknown): QrFilters['visibility'] => {
      const typedValue = getString(value)
      return typedValue === 'private' || typedValue === 'department' || typedValue === 'public' ? typedValue : ''
    }
    const getScope = (value: unknown): QrFilters['scope'] => {
      const typedValue = getString(value)
      return typedValue === 'mine' || typedValue === 'department' || typedValue === 'public' || typedValue === 'all' ? typedValue : ''
    }
    const getPositiveNumber = (value: unknown, fallback: number) => {
      if (typeof value !== 'string') return fallback
      const parsed = Number.parseInt(value, 10)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
    }

    filters.value = {
      ...filters.value,
      search: getString(query.search),
      status: getString(query.status),
      folderId: getString(query.folderId),
      visibility: getVisibility(query.visibility),
      departmentId: getString(query.departmentId),
      scope: getScope(query.scope),
      tags: getString(query.tags),
      dateFrom: getString(query.dateFrom),
      dateTo: getString(query.dateTo),
      sortBy: getString(query.sortBy) || defaultFilters.sortBy,
      sortOrder: getString(query.sortOrder) === 'asc' ? 'asc' : 'desc',
      page: getPositiveNumber(query.page, defaultFilters.page),
      limit: getPositiveNumber(query.limit, defaultFilters.limit),
    }
  }

  async function fetchQrList() {
    loading.value = true
    try {
      const response = await $fetch<{ data: QrCode[], meta: ApiMeta }>('/api/qr', {
        query: serializeFiltersToQuery({ useDebouncedSearch: true }),
      })

      qrList.value = response.data
      meta.value = response.meta || {}
    }
    catch (error) {
      console.error('Failed to fetch QR list:', error)
      qrList.value = []
    }
    finally {
      loading.value = false
    }
  }

  async function createQr(data: {
    title: string
    destinationUrl: string
    type?: 'dynamic' | 'static'
    visibility?: 'private' | 'department' | 'public'
    departmentId?: string | null
    description?: string
    style?: QrStyle
    utmParams?: UtmParams
    folderId?: string
    tagIds?: string[]
    expiresAt?: string
  }) {
    const response = await $fetch<{ data: QrCode }>('/api/qr', {
      method: 'POST',
      body: data,
    })
    return response.data
  }

  async function updateQr(id: string, data: UpdateQrInput) {
    const response = await $fetch<{ data: QrCode }>(`/api/qr/${id}`, {
      method: 'PUT',
      body: data,
    })
    return response.data
  }

  async function updateQrVisibility(id: string, data: { visibility: 'private' | 'department' | 'public', departmentId?: string }) {
    const response = await $fetch<{ data: QrCode }>(`/api/qr/${id}/visibility`, {
      method: 'PATCH',
      body: data,
    })
    return response.data
  }

  async function deleteQr(id: string) {
    await $fetch(`/api/qr/${id}`, { method: 'DELETE' })
  }

  async function bulkDeleteQr(ids: string[]) {
    await $fetch('/api/qr/bulk-delete', {
      method: 'POST',
      body: { ids },
    })
  }

  async function bulkUpdateQrVisibility(data: {
    ids: string[]
    visibility: 'private' | 'department' | 'public'
    departmentId?: string
  }) {
    await $fetch('/api/qr/bulk-visibility', {
      method: 'PATCH',
      body: data,
    })
  }

  async function duplicateQr(id: string) {
    const response = await $fetch<{ data: QrCode }>(`/api/qr/${id}/duplicate`, {
      method: 'POST',
    })
    return response.data
  }

  async function fetchQrById(id: string) {
    const response = await $fetch<{ data: QrCode }>(`/api/qr/${id}`)
    return response.data
  }

  function resetFilters() {
    filters.value = { ...defaultFilters }
  }

  // Auto-fetch when debounced search changes
  watch(debouncedSearch, () => {
    if (filters.value.page !== 1) {
      filters.value.page = 1
      fetchQrList()
    }
    else {
      fetchQrList()
    }
  })

  return {
    qrList: readonly(qrList),
    loading: readonly(loading),
    meta: readonly(meta),
    filters,
    fetchQrList,
    fetchQrById,
    createQr,
    updateQr,
    updateQrVisibility,
    bulkUpdateQrVisibility,
    deleteQr,
    bulkDeleteQr,
    duplicateQr,
    resetFilters,
    serializeFiltersToQuery,
    applyFiltersFromQuery,
  }
}
