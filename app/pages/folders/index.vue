<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
          Папки
        </h1>
        <p class="mt-1 text-sm text-[color:var(--text-muted)]">
          Организуйте QR-коды по группам
        </p>
      </div>
      <Button @click="openCreate">
        <template #icon>
          <Icon name="i-lucide-folder-plus" />
        </template>
        Новая папка
      </Button>
    </div>

    <div
      v-if="loading"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div
        v-for="i in 6"
        :key="i"
        class="h-28 animate-pulse rounded-xl bg-[color:var(--surface-2)]"
      />
    </div>

    <SharedEmptyState
      v-else-if="!folders.length"
      illustration="/illustrations/empty-folders.svg"
      :illustration-alt="t('folders.empty.illustrationAlt')"
      :title="t('folders.empty.title')"
      :description="t('folders.empty.description')"
    >
      <template #action>
        <Button @click="openCreate">
          <template #icon>
            <Icon name="i-lucide-folder-plus" />
          </template>
          {{ t('folders.empty.createAction') }}
        </Button>
      </template>
    </SharedEmptyState>

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div
        v-for="folder in folders"
        :key="folder.id"
        class="group relative cursor-pointer rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5 transition-interactive hover-lift hover:border-[color:color-mix(in_srgb,var(--color-success)_45%,var(--border))]"
        @click="navigateTo(`/folders/${folder.id}`)"
      >
        <div
          class="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
          :style="{ backgroundColor: folder.color || '#e5e7eb' }"
        />

        <div class="flex items-start justify-between mt-1">
          <div
            class="p-2.5 rounded-lg"
            :style="{ backgroundColor: folder.color ? `${folder.color}1a` : '#f3f4f6' }"
          >
            <Icon
              name="i-lucide-folder"
              class="size-6"
              :style="{ color: folder.color || '#9ca3af' }"
            />
          </div>

          <div
            class="flex gap-1 opacity-100 transition-opacity lg:opacity-0 lg:pointer-events-none lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto lg:group-focus-within:opacity-100 lg:group-focus-within:pointer-events-auto"
          >
            <Button
              text
              severity="secondary"
              size="small"
              class="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-success)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface-0)]"
              :aria-label="`Редактировать папку ${folder.name}`"
              :title="`Редактировать папку ${folder.name}`"
              @click.stop="openEdit(folder)"
            >
              <template #icon>
                <Icon name="i-lucide-pencil" />
              </template>
            </Button>
            <Button
              text
              severity="danger"
              size="small"
              class="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-error)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface-0)]"
              :aria-label="`Удалить папку ${folder.name}`"
              :title="`Удалить папку ${folder.name}`"
              @click.stop="confirmDeleteFolder(folder)"
            >
              <template #icon>
                <Icon name="i-lucide-trash-2" />
              </template>
            </Button>
          </div>
        </div>

        <div class="mt-3">
          <p class="truncate font-semibold text-[color:var(--text-primary)]">
            {{ folder.name }}
          </p>
          <p class="mt-0.5 text-sm text-[color:var(--text-muted)]">
            {{ folder.qrCount }} {{ pluralQr(folder.qrCount) }}
          </p>
        </div>
      </div>
    </div>

    <FoldersFolderDialog
      v-model:open="dialogOpen"
      :folder="editTarget"
      :all-folders="folders as Folder[]"
      @created="onCreated"
      @updated="onUpdated"
    />

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
const { t } = useI18n()
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
