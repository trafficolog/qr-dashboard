<template>
  <div class="space-y-6">
    <div
      v-if="loadingFolder"
      class="flex items-center gap-3"
    >
      <div class="size-8 animate-pulse rounded bg-[color:var(--surface-2)]" />
      <div class="h-7 w-48 animate-pulse rounded bg-[color:var(--surface-2)]" />
    </div>

    <div
      v-else
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div class="flex items-center gap-3">
        <Button
          as-child
          text
          severity="secondary"
          size="small"
        >
          <NuxtLink
            to="/folders"
            aria-label="Назад к папкам"
            title="Назад к папкам"
          >
            <Icon name="i-lucide-arrow-left" />
          </NuxtLink>
        </Button>
        <div
          class="p-2 rounded-lg"
          :style="{ backgroundColor: folder?.color ? `${folder.color}1a` : '#f3f4f6' }"
        >
          <Icon
            name="i-lucide-folder-open"
            class="size-5"
            :style="{ color: folder?.color || '#9ca3af' }"
          />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
            {{ folder?.name }}
          </h1>
          <p class="text-sm text-[color:var(--text-muted)]">
            {{ qrList.length }} {{ pluralQr(qrList.length) }}
          </p>
        </div>
      </div>

      <div class="flex gap-2">
        <Button
          as-child
          size="small"
        >
          <NuxtLink
            :to="`/qr/create?folderId=${id}`"
            class="inline-flex items-center gap-2"
          >
            <Icon name="i-lucide-plus" />
            <span>Создать QR</span>
          </NuxtLink>
        </Button>
        <Button
          outlined
          severity="secondary"
          size="small"
          @click="editDialogOpen = true"
        >
          <template #icon>
            <Icon name="i-lucide-pencil" />
          </template>
          Переименовать
        </Button>
      </div>
    </div>

    <div
      v-if="loadingQr"
      class="space-y-3"
    >
      <Skeleton
        v-for="i in 4"
        :key="i"
        class="h-16 w-full rounded-lg"
      />
    </div>

    <SharedEmptyState
      v-else-if="!qrList.length"
      icon="i-lucide-qr-code"
      title="В папке нет QR-кодов"
      description="Создайте QR-код или перенесите существующие в эту папку."
    >
      <template #action>
        <Button
          as-child
        >
          <NuxtLink
            :to="`/qr/create?folderId=${id}`"
            class="inline-flex items-center gap-2"
          >
            <Icon name="i-lucide-plus" />
            <span>Создать QR</span>
          </NuxtLink>
        </Button>
      </template>
    </SharedEmptyState>

    <QrTable
      v-else
      :items="qrList as any"
      :selected-ids="selectedIds"
      :all-selected="allSelected"
      sort-by="createdAt"
      sort-order="desc"
      @toggle-all="toggleAll"
      @toggle-select="toggleSelect"
      @sort="() => {}"
      @edit="(qrId) => navigateTo(`/qr/${qrId}/edit`)"
      @duplicate="handleDuplicate"
      @delete="handleDelete"
    />

    <SharedPagination
      v-if="(meta.totalPages ?? 0) > 1"
      :page="page"
      :limit="limit"
      :total="meta.total ?? 0"
      :total-pages="meta.totalPages ?? 1"
      @update:page="p => { page = p; fetchQr() }"
    />

    <FoldersFolderDialog
      v-model:open="editDialogOpen"
      :folder="folder"
      @updated="onFolderUpdated"
    />

    <SharedConfirmDialog
      v-model:open="deleteDialogOpen"
      title="Удалить QR-код"
      message="QR-код и вся связанная аналитика будут удалены. Это действие нельзя отменить."
      @confirm="confirmDeleteQr"
    />
  </div>
</template>

<script setup lang="ts">
import type { Folder } from '~/composables/useFolders'

const route = useRoute()
const toast = useA11yToast()
const id = route.params.id as string

// Folder meta
const folder = ref<Folder | null>(null)
const loadingFolder = ref(true)

async function fetchFolder() {
  try {
    const res = await $fetch<{ data: Folder }>(`/api/folders/${id}`)
    folder.value = res.data
  }
  catch {
    await navigateTo('/folders')
  }
  finally {
    loadingFolder.value = false
  }
}

// QR list in folder
const { qrList, loading: loadingQr, meta, filters, fetchQrList, duplicateQr, deleteQr } = useQr()

const page = ref(1)
const limit = 20

function fetchQr() {
  filters.value.folderId = id
  filters.value.page = page.value
  filters.value.limit = limit
  fetchQrList()
}

onMounted(() => {
  fetchFolder()
  fetchQr()
})

// Selection
const selectedIds = ref<string[]>([])
const allSelected = computed(
  () => qrList.value.length > 0 && selectedIds.value.length === qrList.value.length,
)

function toggleAll() {
  selectedIds.value = allSelected.value ? [] : qrList.value.map(q => q.id)
}

function toggleSelect(qrId: string) {
  const idx = selectedIds.value.indexOf(qrId)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(qrId)
}

// Actions
async function handleDuplicate(qrId: string) {
  try {
    const qr = await duplicateQr(qrId)
    toast.add({ title: `QR «${qr.title}» создан`, color: 'success' })
    fetchQr()
  }
  catch {
    toast.add({ title: 'Ошибка дублирования', color: 'error' })
  }
}

const deleteDialogOpen = ref(false)
const deleteTargetId = ref<string | null>(null)

function handleDelete(qrId: string) {
  deleteTargetId.value = qrId
  deleteDialogOpen.value = true
}

async function confirmDeleteQr() {
  if (!deleteTargetId.value) return
  try {
    await deleteQr(deleteTargetId.value)
    toast.add({ title: 'QR-код удалён', color: 'success' })
    fetchQr()
  }
  catch {
    toast.add({ title: 'Ошибка удаления', color: 'error' })
  }
  finally {
    deleteDialogOpen.value = false
    deleteTargetId.value = null
  }
}

// Edit folder
const editDialogOpen = ref(false)

function onFolderUpdated(updated: Folder) {
  folder.value = updated
  toast.add({ title: `Папка «${updated.name}» обновлена`, color: 'success' })
}

function pluralQr(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'QR-код'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'QR-кода'
  return 'QR-кодов'
}
</script>
