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
          <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
            {{ qr.title }}
          </h1>
          <UBadge
            :color="statusColor"
            variant="subtle"
          >
            {{ statusLabel }}
          </UBadge>
        </div>
        <p
          v-if="qr.description"
          class="ml-11 text-sm text-[color:var(--text-secondary)]"
        >
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
          <UButton
            icon="i-lucide-more-horizontal"
            variant="outline"
            color="neutral"
          />
        </UDropdownMenu>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left: Info + Stats -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Stats cards -->
        <div class="grid grid-cols-3 gap-4">
          <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
            <div class="text-center">
              <p class="text-2xl font-bold text-[color:var(--text-primary)]">
                {{ qr.totalScans.toLocaleString() }}
              </p>
              <p class="mt-1 text-xs text-[color:var(--text-secondary)]">
                Всего сканов
              </p>
            </div>
          </UCard>
          <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
            <div class="text-center">
              <p class="text-2xl font-bold text-[color:var(--text-primary)]">
                {{ qr.uniqueScans.toLocaleString() }}
              </p>
              <p class="mt-1 text-xs text-[color:var(--text-secondary)]">
                Уникальных
              </p>
            </div>
          </UCard>
          <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
            <div class="text-center">
              <p class="text-2xl font-bold text-[color:var(--text-primary)]">
                {{ qr.type === 'dynamic' ? 'Дин.' : 'Стат.' }}
              </p>
              <p class="mt-1 text-xs text-[color:var(--text-secondary)]">
                Тип QR
              </p>
            </div>
          </UCard>
        </div>

        <!-- Details -->
        <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
          <template #header>
            <span class="font-medium">Детали</span>
          </template>
          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-[color:var(--text-secondary)]">URL назначения</span>
              <a
                :href="qr.destinationUrl"
                target="_blank"
                class="max-w-sm truncate text-[color:var(--accent)] hover:underline"
              >
                {{ qr.destinationUrl }}
              </a>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[color:var(--text-secondary)]">Короткий код</span>
              <code class="rounded bg-[color:var(--surface-2)] px-2 py-1 text-xs text-[color:var(--text-primary)]">
                {{ qr.shortCode }}
              </code>
            </div>
            <div
              v-if="qr.folder"
              class="flex items-center justify-between"
            >
              <span class="text-[color:var(--text-secondary)]">Папка</span>
              <span>{{ qr.folder.name }}</span>
            </div>
            <div
              v-if="qr.tags?.length"
              class="flex items-center justify-between"
            >
              <span class="text-[color:var(--text-secondary)]">Теги</span>
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
              <span class="text-[color:var(--text-secondary)]">Создан</span>
              <span>{{ formatDateTime(qr.createdAt) }}</span>
            </div>
            <div
              v-if="qr.expiresAt"
              class="flex items-center justify-between"
            >
              <span class="text-[color:var(--text-secondary)]">Срок действия</span>
              <span>{{ formatDateTime(qr.expiresAt) }}</span>
            </div>
          </div>
        </UCard>

        <!-- Analytics placeholder -->
        <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
          <template #header>
            <span class="font-medium">Аналитика</span>
          </template>
          <div class="flex h-48 items-center justify-center text-[color:var(--text-muted)]">
            <div class="text-center">
              <UIcon
                name="i-lucide-bar-chart-3"
                class="size-10 mx-auto mb-2"
              />
              <p class="text-sm">
                График сканирований — Эпик 6
              </p>
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
  <div
    v-else-if="loadingQr"
    class="space-y-4"
  >
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
import type { QrCode, QrStatus } from '~/../types/qr'

interface QrDetails extends QrCode {
  tags?: { id: string, name: string, color: string | null }[]
  folder?: { id: string, name: string } | null
}

const route = useRoute()
const toast = useToast()
const { fetchQrById, deleteQr, duplicateQr } = useQr()

const qr = ref<QrDetails | null>(null)
const loadingQr = ref(true)
const exportOpen = ref(false)
const deleteOpen = ref(false)

const id = computed(() => route.params.id as string)

type StatusBadgeColor = 'primary' | 'warning' | 'error' | 'neutral'

const statusColor = computed<StatusBadgeColor>(() => {
  const map: Record<QrStatus, StatusBadgeColor> = {
    active: 'primary',
    paused: 'warning',
    expired: 'error',
    archived: 'neutral',
  }
  const status = qr.value?.status
  return status ? map[status] : 'neutral'
})

const statusLabel = computed(() => {
  const map: Record<QrStatus, string> = {
    active: 'Активен',
    paused: 'Пауза',
    expired: 'Истёк',
    archived: 'Архив',
  }
  const status = qr.value?.status
  return status ? map[status] : ''
})

const actions = computed(() => [
  [
    {
      label: 'Редактировать',
      icon: 'i-lucide-pencil',
      onSelect: () => navigateTo(`/qr/${id.value}/edit`),
    },
    {
      label: 'Дублировать',
      icon: 'i-lucide-copy',
      onSelect: handleDuplicate,
    },
  ],
  [
    {
      label: qr.value?.status === 'active' ? 'Приостановить' : 'Активировать',
      icon: qr.value?.status === 'active' ? 'i-lucide-pause' : 'i-lucide-play',
      onSelect: handleToggleStatus,
    },
  ],
  [
    {
      label: 'Удалить',
      icon: 'i-lucide-trash-2',
      onSelect: () => { deleteOpen.value = true },
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
    qr.value = await fetchQrById(id.value) as QrDetails
  }
  catch {
    toast.add({ title: 'QR-код не найден', color: 'error' })
    navigateTo('/qr')
  }
  finally {
    loadingQr.value = false
  }
}

async function handleDuplicate() {
  try {
    const copy = await duplicateQr(id.value)
    toast.add({ title: `Копия «${copy.title}» создана`, color: 'success' })
    navigateTo(`/qr/${copy.id}`)
  }
  catch {
    toast.add({ title: 'Ошибка дублирования', color: 'error' })
  }
}

async function handleToggleStatus() {
  if (!qr.value)
    return

  const newStatus: QrStatus = qr.value.status === 'active' ? 'paused' : 'active'
  try {
    await $fetch(`/api/qr/${id.value}`, {
      method: 'PUT',
      body: { status: newStatus },
    })
    qr.value.status = newStatus
    toast.add({ title: `Статус изменён на ${newStatus}`, color: 'success' })
  }
  catch {
    toast.add({ title: 'Ошибка', color: 'error' })
  }
}

async function handleDelete() {
  try {
    await deleteQr(id.value)
    toast.add({ title: 'QR-код удалён', color: 'success' })
    navigateTo('/qr')
  }
  catch {
    toast.add({ title: 'Ошибка удаления', color: 'error' })
  }
  finally {
    deleteOpen.value = false
  }
}

onMounted(loadQr)
</script>
