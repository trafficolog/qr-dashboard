import type { QrCode, QrStyle, UtmParams } from '~~/types/qr'
import type { ApiMeta } from '~~/types/api'

interface QrFilters {
  search: string
  status: string
  folderId: string
  tags: string
  dateFrom: string
  dateTo: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

const defaultFilters: QrFilters = {
  search: '',
  status: '',
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

  async function fetchQrList() {
    loading.value = true
    try {
      const query: Record<string, string | number> = {
        page: filters.value.page,
        limit: filters.value.limit,
        sortBy: filters.value.sortBy,
        sortOrder: filters.value.sortOrder,
      }

      if (debouncedSearch.value) query.search = debouncedSearch.value
      if (filters.value.status) query.status = filters.value.status
      if (filters.value.folderId) query.folderId = filters.value.folderId
      if (filters.value.tags) query.tags = filters.value.tags
      if (filters.value.dateFrom) query.dateFrom = filters.value.dateFrom
      if (filters.value.dateTo) query.dateTo = filters.value.dateTo

      const response = await $fetch<{ data: QrCode[], meta: ApiMeta }>('/api/qr', {
        query,
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

  async function updateQr(id: string, data: Record<string, unknown>) {
    const response = await $fetch<{ data: QrCode }>(`/api/qr/${id}`, {
      method: 'PUT',
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
    deleteQr,
    bulkDeleteQr,
    duplicateQr,
    resetFilters,
  }
}
