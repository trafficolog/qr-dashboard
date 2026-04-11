<template>
  <div v-if="qr">
    <!-- Header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            size="sm"
            to="/qr"
          />
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ qr.title }}
          </h1>
          <UBadge :color="statusColor" variant="subtle">
            {{ statusLabel }}
          </UBadge>
        </div>
        <p v-if="qr.description" class="text-sm text-gray-500 ml-11">
          {{ qr.description }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-download"
          label="Экспорт"
          variant="outline"
          @click="exportOpen = true"
        />
        <UDropdownMenu :items="actions">
          <UButton icon="i-lucide-more-horizontal" variant="outline" color="neutral" />
        </UDropdownMenu>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left: Info + Stats -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Stats cards -->
        <div class="grid grid-cols-3 gap-4">
          <UCard>
            <div class="text-center">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ qr.totalScans.toLocaleString() }}
              </p>
              <p class="text-xs text-gray-500 mt-1">Всего сканов</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ qr.uniqueScans.toLocaleString() }}
              </p>
              <p class="text-xs text-gray-500 mt-1">Уникальных</p>
            </div>
          </UCard>
          <UCard>
            <div class="text-center">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ qr.type === 'dynamic' ? 'Дин.' : 'Стат.' }}
              </p>
              <p class="text-xs text-gray-500 mt-1">Тип QR</p>
            </div>
          </UCard>
        </div>

        <!-- Details -->
        <UCard>
          <template #header>
            <span class="font-medium">Детали</span>
          </template>
          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-gray-500">URL назначения</span>
              <a
                :href="qr.destinationUrl"
                target="_blank"
                class="text-green-600 hover:underline truncate max-w-sm"
              >
                {{ qr.destinationUrl }}
              </a>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">Короткий код</span>
              <code class="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {{ qr.shortCode }}
              </code>
            </div>
            <div v-if="qr.folder" class="flex items-center justify-between">
              <span class="text-gray-500">Папка</span>
              <span>{{ qr.folder.name }}</span>
            </div>
            <div v-if="qr.tags?.length" class="flex items-center justify-between">
              <span class="text-gray-500">Теги</span>
              <div class="flex gap-1">
                <UBadge
                  v-for="tag in qr.tags"
                  :key="tag.id"
                  variant="subtle"
                  size="xs"
                >
                  {{ tag.name }}
                </UBadge>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">Создан</span>
              <span>{{ formatDateTime(qr.createdAt) }}</span>
            </div>
            <div v-if="qr.expiresAt" class="flex items-center justify-between">
              <span class="text-gray-500">Срок действия</span>
              <span>{{ formatDateTime(qr.expiresAt) }}</span>
            </div>
          </div>
        </UCard>

        <!-- Analytics placeholder -->
        <UCard>
          <template #header>
            <span class="font-medium">Аналитика</span>
          </template>
          <div class="h-48 flex items-center justify-center text-gray-400">
            <div class="text-center">
              <UIcon name="i-lucide-bar-chart-3" class="size-10 mx-auto mb-2" />
              <p class="text-sm">График сканирований — Эпик 6</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Right: QR Preview -->
      <div class="lg:col-span-1">
        <div class="lg:sticky lg:top-24">
          <QrPreview
            :url="qr.destinationUrl"
            :style="qr.style as any"
            :short-code="qr.shortCode"
            :display-size="280"
          />
        </div>
      </div>
    </div>

    <!-- Export dialog -->
    <QrExportDialog
      v-model:open="exportOpen"
      :qr-id="qr.id"
      :title="qr.title"
    />

    <!-- Delete confirmation -->
    <SharedConfirmDialog
      v-model:open="deleteOpen"
      title="Удалить QR-код"
      message="QR-код и вся связанная аналитика будут удалены безвозвратно."
      @confirm="handleDelete"
    />
  </div>

  <!-- Loading -->
  <div v-else-if="loadingQr" class="space-y-4">
    <USkeleton class="h-8 w-64" />
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-4">
        <USkeleton class="h-24 w-full rounded-lg" />
        <USkeleton class="h-48 w-full rounded-lg" />
      </div>
      <USkeleton class="h-80 w-full rounded-lg" />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const toast = useToast()
const { fetchQrById, deleteQr, duplicateQr } = useQr()

const qr = ref<any>(null)
const loadingQr = ref(true)
const exportOpen = ref(false)
const deleteOpen = ref(false)

const id = computed(() => route.params.id as string)

const statusColor = computed(() => {
  const map: Record<string, string> = { active: 'success', paused: 'warning', expired: 'error', archived: 'neutral' }
  return map[qr.value?.status] || 'neutral'
})

const statusLabel = computed(() => {
  const map: Record<string, string> = { active: 'Активен', paused: 'Пауза', expired: 'Истёк', archived: 'Архив' }
  return map[qr.value?.status] || ''
})

const actions = computed(() => [
  [
    {
      label: 'Редактировать',
      icon: 'i-lucide-pencil',
      click: () => navigateTo(`/qr/${id.value}/edit`),
    },
    {
      label: 'Дублировать',
      icon: 'i-lucide-copy',
      click: handleDuplicate,
    },
  ],
  [
    {
      label: qr.value?.status === 'active' ? 'Приостановить' : 'Активировать',
      icon: qr.value?.status === 'active' ? 'i-lucide-pause' : 'i-lucide-play',
      click: handleToggleStatus,
    },
  ],
  [
    {
      label: 'Удалить',
      icon: 'i-lucide-trash-2',
      click: () => { deleteOpen.value = true },
    },
  ],
])

function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadQr() {
  loadingQr.value = true
  try {
    qr.value = await fetchQrById(id.value)
  } catch {
    toast.add({ title: 'QR-код не найден', color: 'error' })
    navigateTo('/qr')
  } finally {
    loadingQr.value = false
  }
}

async function handleDuplicate() {
  try {
    const copy = await duplicateQr(id.value)
    toast.add({ title: `Копия «${copy.title}» создана`, color: 'success' })
    navigateTo(`/qr/${copy.id}`)
  } catch {
    toast.add({ title: 'Ошибка дублирования', color: 'error' })
  }
}

async function handleToggleStatus() {
  const newStatus = qr.value?.status === 'active' ? 'paused' : 'active'
  try {
    await $fetch(`/api/qr/${id.value}`, {
      method: 'PUT',
      body: { status: newStatus },
    })
    qr.value.status = newStatus
    toast.add({ title: `Статус изменён на ${newStatus}`, color: 'success' })
  } catch {
    toast.add({ title: 'Ошибка', color: 'error' })
  }
}

async function handleDelete() {
  try {
    await deleteQr(id.value)
    toast.add({ title: 'QR-код удалён', color: 'success' })
    navigateTo('/qr')
  } catch {
    toast.add({ title: 'Ошибка удаления', color: 'error' })
  } finally {
    deleteOpen.value = false
  }
}

onMounted(loadQr)
</script>
