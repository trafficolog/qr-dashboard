<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
        QR-коды
      </h1>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-upload"
          label="Массовое создание"
          to="/qr/bulk"
          variant="outline"
        />
        <UButton
          icon="i-lucide-plus"
          label="Создать QR"
          to="/qr/create"
        />
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <UInput
        v-model="filters.search"
        placeholder="Поиск по названию..."
        icon="i-lucide-search"
        class="w-full sm:w-64"
        size="sm"
      />

      <USelect
        v-model="selectedStatus"
        :items="statusOptions"
        placeholder="Все статусы"
        size="sm"
        class="w-40"
      />

      <USelect
        v-model="selectedFolderId"
        :items="folderOptions"
        placeholder="Все папки"
        size="sm"
        class="w-40"
      />

      <div class="flex-1" />

      <!-- View toggle -->
      <div class="flex overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)]">
        <button
          :class="[
            'p-2 transition-colors',
            viewMode === 'table'
              ? 'bg-[color:var(--surface-2)] text-[color:var(--text-primary)]'
              : 'text-[color:var(--text-muted)] hover:text-[color:var(--accent)]',
          ]"
          @click="viewMode = 'table'"
        >
          <UIcon
            name="i-lucide-list"
            class="size-4"
          />
        </button>
        <button
          :class="[
            'p-2 transition-colors',
            viewMode === 'grid'
              ? 'bg-[color:var(--surface-2)] text-[color:var(--text-primary)]'
              : 'text-[color:var(--text-muted)] hover:text-[color:var(--accent)]',
          ]"
          @click="viewMode = 'grid'"
        >
          <UIcon
            name="i-lucide-grid-3x3"
            class="size-4"
          />
        </button>
      </div>
    </div>

    <!-- Bulk actions bar -->
    <Transition name="slide-down">
      <div
        v-if="selectedIds.length > 0"
        class="mb-4 flex items-center gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--accent-light)] p-3"
      >
        <span class="text-sm font-medium text-[color:var(--accent)]">
          Выбрано: {{ selectedIds.length }}
        </span>
        <UButton
          label="Снять выделение"
          variant="link"
          size="xs"
          @click="selectedIds = []"
        />
        <div class="flex-1" />
        <UButton
          icon="i-lucide-trash-2"
          label="Удалить"
          color="error"
          variant="outline"
          size="sm"
          @click="handleBulkDelete"
        />
      </div>
    </Transition>

    <!-- Loading skeleton -->
    <div
      v-if="loading"
      class="space-y-3"
    >
      <USkeleton
        v-for="i in 5"
        :key="i"
        class="h-16 w-full rounded-lg"
      />
    </div>

    <!-- Empty state -->
    <SharedEmptyState
      v-else-if="displayList.length === 0"
      icon="i-lucide-qr-code"
      title="Нет QR-кодов"
      :description="filters.search ? 'Ничего не найдено. Попробуйте изменить запрос.' : 'Создайте первый QR-код для начала работы.'"
    >
      <template #action>
        <UButton
          v-if="!filters.search"
          icon="i-lucide-plus"
          label="Создать QR"
          to="/qr/create"
        />
      </template>
    </SharedEmptyState>

    <!-- Table view -->
    <QrTable
      v-else-if="viewMode === 'table'"
      :items="displayList as any"
      :selected-ids="selectedIds"
      :all-selected="allSelected"
      :sort-by="filters.sortBy"
      :sort-order="filters.sortOrder"
      @toggle-all="toggleAll"
      @toggle-select="toggleSelect"
      @sort="handleSort"
      @edit="(id) => navigateTo(`/qr/${id}/edit`)"
      @duplicate="handleDuplicate"
      @delete="handleDelete"
    />

    <!-- Grid view -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <QrCard
        v-for="qr in displayList"
        :key="qr.id"
        :qr="qr as any"
        @edit="(id) => navigateTo(`/qr/${id}/edit`)"
        @duplicate="handleDuplicate"
        @delete="handleDelete"
      />
    </div>

    <!-- Pagination -->
    <SharedPagination
      v-if="displayList.length > 0"
      :page="filters.page"
      :limit="filters.limit"
      :total="meta.total || 0"
      :total-pages="meta.totalPages || 1"
      @update:page="handlePageChange"
    />

    <!-- Delete confirmation -->
    <SharedConfirmDialog
      v-model:open="bulkDeleteDialogOpen"
      title="Удалить выбранные QR-коды?"
      :message="`Будет удалено ${pendingBulkIds.length} QR-кодов. Их можно будет отменить в течение 10 секунд.`"
      @confirm="confirmBulkDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { QrCode } from '~~/types/qr'

const toast = useToast()
const { qrList, loading, meta, filters, fetchQrList, duplicateQr, deleteQr, bulkDeleteQr } = useQr()
const ALL_STATUSES = '__all_statuses__'
const ALL_FOLDERS = '__all_folders__'

// Local display list for optimistic UI (null = use qrList from composable)
// qrList is DeepReadonly<QrCode[]> — cast to QrCode[] when copying
const localList = ref<QrCode[] | null>(null)
const displayList = computed<QrCode[]>(() => localList.value ?? ([...qrList.value] as QrCode[]))

// Sync localList when fresh data arrives from API
watch(qrList, () => {
  localList.value = null
})

// View mode (persisted; client-only — localStorage)
const viewMode = ref<'table' | 'grid'>('table')
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('qr-view-mode') as 'table' | 'grid' | null
  if (saved) viewMode.value = saved
  watch(viewMode, v => localStorage.setItem('qr-view-mode', v))
}

// Selection
const selectedIds = ref<string[]>([])
const allSelected = computed(
  () => displayList.value.length > 0 && selectedIds.value.length === displayList.value.length,
)

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value = []
  }
  else {
    selectedIds.value = qrList.value.map(q => q.id)
  }
}

function toggleSelect(id: string) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  }
  else {
    selectedIds.value.push(id)
  }
}

// Sorting
function handleSort(field: string) {
  if (filters.value.sortBy === field) {
    filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc'
  }
  else {
    filters.value.sortBy = field
    filters.value.sortOrder = 'desc'
  }
  fetchQrList()
}

// Pagination
function handlePageChange(page: number) {
  filters.value.page = page
  fetchQrList()
}

// Actions
async function handleDuplicate(id: string) {
  try {
    const qr = await duplicateQr(id)
    toast.add({ title: `QR «${qr.title}» создан`, color: 'success' })
    fetchQrList()
  }
  catch {
    toast.add({ title: 'Ошибка дублирования', color: 'error' })
  }
}

// Single delete with Undo (optimistic UI)
function handleDelete(id: string) {
  const current: QrCode[] = localList.value ?? ([...qrList.value] as QrCode[])
  const snapshot = current.find(q => q.id === id)
  if (!snapshot) return

  // Optimistic removal
  localList.value = current.filter(q => q.id !== id)
  selectedIds.value = selectedIds.value.filter(sid => sid !== id)

  let undone = false
  const timer = setTimeout(async () => {
    if (undone) return
    try {
      await deleteQr(id)
      fetchQrList()
    }
    catch {
      // Restore on failure
      localList.value = [snapshot, ...(localList.value ?? [])]
      toast.add({ title: 'Ошибка удаления', color: 'error' })
    }
  }, 10_000)

  toast.add({
    title: `QR «${snapshot.title}» удалён`,
    color: 'success',
    actions: [
      {
        label: 'Отменить',
        onClick: () => {
          undone = true
          clearTimeout(timer)
          localList.value = [snapshot, ...(localList.value ?? [])]
        },
      },
    ],
  })
}

// Bulk delete with confirmation + Undo
const bulkDeleteDialogOpen = ref(false)
const pendingBulkIds = ref<string[]>([])

function handleBulkDelete() {
  pendingBulkIds.value = [...selectedIds.value]
  bulkDeleteDialogOpen.value = true
}

async function confirmBulkDelete() {
  const ids = pendingBulkIds.value
  const current: QrCode[] = localList.value ?? ([...qrList.value] as QrCode[])
  const snapshots = current.filter(q => ids.includes(q.id))

  // Optimistic removal
  localList.value = current.filter(q => !ids.includes(q.id))
  selectedIds.value = []

  let undone = false
  const timer = setTimeout(async () => {
    if (undone) return
    try {
      await bulkDeleteQr(ids)
      fetchQrList()
    }
    catch {
      localList.value = [...snapshots, ...(localList.value ?? [])]
      toast.add({ title: 'Ошибка массового удаления', color: 'error' })
    }
  }, 10_000)

  toast.add({
    title: `Удалено QR-кодов: ${ids.length}`,
    color: 'success',
    actions: [
      {
        label: 'Отменить',
        onClick: () => {
          undone = true
          clearTimeout(timer)
          localList.value = [...snapshots, ...(localList.value ?? [])]
        },
      },
    ],
  })
}

// Folder options — fetch from API
const { folders, fetchFolders } = useFolders()
const folderOptions = computed(() => [
  { label: 'Все папки', value: ALL_FOLDERS },
  ...folders.value.map(f => ({ label: f.name, value: f.id })),
])

const statusOptions = [
  { label: 'Все статусы', value: ALL_STATUSES },
  { label: 'Активен', value: 'active' },
  { label: 'Пауза', value: 'paused' },
  { label: 'Истёк', value: 'expired' },
  { label: 'Архив', value: 'archived' },
]

const selectedStatus = computed({
  get: () => filters.value.status || ALL_STATUSES,
  set: (value: string) => {
    filters.value.status = value === ALL_STATUSES ? '' : value
  },
})

const selectedFolderId = computed({
  get: () => filters.value.folderId || ALL_FOLDERS,
  set: (value: string) => {
    filters.value.folderId = value === ALL_FOLDERS ? '' : value
  },
})

// Fetch on mount and when non-search filters change
onMounted(() => {
  fetchQrList()
  fetchFolders()
})

watch(
  () => [filters.value.status, filters.value.folderId, filters.value.sortBy, filters.value.sortOrder],
  () => {
    filters.value.page = 1
    fetchQrList()
  },
)
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
