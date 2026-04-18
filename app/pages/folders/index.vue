<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Папки
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Организуйте QR-коды по группам
        </p>
      </div>
      <UButton
        icon="i-lucide-folder-plus"
        label="Новая папка"
        @click="openCreate"
      />
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div
        v-for="i in 6"
        :key="i"
        class="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
      />
    </div>

    <!-- Empty -->
    <SharedEmptyState
      v-else-if="!folders.length"
      icon="i-lucide-folder-open"
      title="Нет папок"
      description="Создайте первую папку, чтобы организовать QR-коды."
    >
      <template #action>
        <UButton
          icon="i-lucide-folder-plus"
          label="Создать папку"
          @click="openCreate"
        />
      </template>
    </SharedEmptyState>

    <!-- Grid -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div
        v-for="folder in folders"
        :key="folder.id"
        class="group relative rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:border-green-200 dark:hover:border-green-800 hover:shadow-sm transition-all cursor-pointer"
        @click="navigateTo(`/folders/${folder.id}`)"
      >
        <!-- Color accent -->
        <div
          class="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
          :style="{ backgroundColor: folder.color || '#e5e7eb' }"
        />

        <!-- Icon + actions -->
        <div class="flex items-start justify-between mt-1">
          <div
            class="p-2.5 rounded-lg"
            :style="{ backgroundColor: folder.color ? `${folder.color}1a` : '#f3f4f6' }"
          >
            <UIcon
              name="i-lucide-folder"
              class="size-6"
              :style="{ color: folder.color || '#9ca3af' }"
            />
          </div>

          <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <UButton
              icon="i-lucide-pencil"
              variant="ghost"
              color="neutral"
              size="xs"
              :aria-label="`Редактировать папку ${folder.name}`"
              :title="`Редактировать папку ${folder.name}`"
              @click.stop="openEdit(folder)"
            />
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="xs"
              :aria-label="`Удалить папку ${folder.name}`"
              :title="`Удалить папку ${folder.name}`"
              @click.stop="confirmDeleteFolder(folder)"
            />
          </div>
        </div>

        <!-- Name + count -->
        <div class="mt-3">
          <p class="font-semibold text-gray-900 dark:text-white truncate">
            {{ folder.name }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {{ folder.qrCount }} {{ pluralQr(folder.qrCount) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Create/Edit dialog -->
    <FoldersFolderDialog
      v-model:open="dialogOpen"
      :folder="editTarget"
      :all-folders="folders as Folder[]"
      @created="onCreated"
      @updated="onUpdated"
    />

    <!-- Delete confirmation -->
    <SharedConfirmDialog
      v-model:open="deleteDialogOpen"
      title="Удалить папку"
      :message="`Папка «${deleteTarget?.name}» будет удалена. QR-коды из папки переместятся в корень. Отменить нельзя.`"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { Folder } from '~/composables/useFolders'

const toast = useA11yToast()
const { folders, loading, fetchFolders, deleteFolder } = useFolders()

onMounted(() => fetchFolders())

// Dialog
const dialogOpen = ref(false)
const editTarget = ref<Folder | null>(null)

function openCreate() {
  editTarget.value = null
  dialogOpen.value = true
}

function openEdit(folder: Folder) {
  editTarget.value = folder
  dialogOpen.value = true
}

function onCreated(folder: Folder) {
  toast.add({ title: `Папка «${folder.name}» создана`, color: 'success' })
  fetchFolders()
}

function onUpdated(folder: Folder) {
  toast.add({ title: `Папка «${folder.name}» обновлена`, color: 'success' })
  fetchFolders()
}

// Delete
const deleteDialogOpen = ref(false)
const deleteTarget = ref<Folder | null>(null)

function confirmDeleteFolder(folder: Folder) {
  deleteTarget.value = folder
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  try {
    await deleteFolder(deleteTarget.value.id)
    toast.add({ title: `Папка «${deleteTarget.value.name}» удалена`, color: 'success' })
  }
  catch {
    toast.add({ title: 'Ошибка удаления', color: 'error' })
  }
  finally {
    deleteDialogOpen.value = false
    deleteTarget.value = null
  }
}

function pluralQr(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'QR-код'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'QR-кода'
  return 'QR-кодов'
}
</script>
