export interface Folder {
  id: string
  name: string
  parentId: string | null
  color: string | null
  createdBy: string
  createdAt: string
  qrCount: number
}

interface ApiData<T> { data: T }

export function useFolders() {
  const folders = ref<Folder[]>([])
  const loading = ref(false)

  async function fetchFolders() {
    loading.value = true
    try {
      const res = await $fetch<ApiData<Folder[]>>('/api/folders')
      folders.value = res.data
    }
    finally {
      loading.value = false
    }
  }

  async function createFolder(data: { name: string, parentId?: string | null, color?: string | null }) {
    const res = await $fetch<ApiData<Folder>>('/api/folders', {
      method: 'POST',
      body: data,
    })
    folders.value.push(res.data)
    return res.data
  }

  async function updateFolder(id: string, data: { name?: string, parentId?: string | null, color?: string | null }) {
    const res = await $fetch<ApiData<Folder>>(`/api/folders/${id}`, {
      method: 'PUT',
      body: data,
    })
    const idx = folders.value.findIndex(f => f.id === id)
    if (idx >= 0) folders.value[idx] = { ...folders.value[idx]!, ...res.data }
    return res.data
  }

  async function deleteFolder(id: string) {
    await $fetch(`/api/folders/${id}`, { method: 'DELETE' })
    folders.value = folders.value.filter(f => f.id !== id)
  }

  return {
    folders: readonly(folders),
    loading: readonly(loading),
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  }
}
