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
            aria-label="Назад к списку QR-кодов"
            title="Назад к списку QR-кодов"
            to="/qr"
          />
          <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
            {{ qr.title }}
          </h1>
          <QrStatusBadge :status="qr.status" />
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
            aria-label="Открыть действия для QR-кода"
            title="Открыть действия для QR-кода"
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

        <!-- A/B destinations results -->
        <UCard
          v-if="destinations.length > 0"
          class="border border-[color:var(--border)] bg-[color:var(--surface-0)]"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-medium">A/B-варианты</span>
              <UButton
                icon="i-lucide-settings-2"
                variant="ghost"
                size="xs"
                label="Управление"
                :to="`/qr/${id}/edit#ab`"
              />
            </div>
          </template>

          <!-- Traffic bar -->
          <div class="flex h-2.5 w-full overflow-hidden rounded-full mb-4">
            <div
              v-for="(dest, i) in destinations.filter(d => d.isActive)"
              :key="dest.id"
              :style="{ width: `${activeWeightBar(dest)}%`, backgroundColor: abColors[i % abColors.length] }"
              class="transition-[width] duration-200 ease-in-out"
            />
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100 dark:border-gray-800">
                  <th class="py-2 pr-3 text-left text-xs text-[color:var(--text-muted)]">
                    Вариант
                  </th>
                  <th class="py-2 pr-3 text-left text-xs text-[color:var(--text-muted)] hidden sm:table-cell">
                    URL
                  </th>
                  <th class="py-2 pr-3 text-right text-xs text-[color:var(--text-muted)]">
                    Вес
                  </th>
                  <th class="py-2 pr-3 text-right text-xs text-[color:var(--text-muted)]">
                    Клики
                  </th>
                  <th class="py-2 text-right text-xs text-[color:var(--text-muted)]">
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(dest, i) in destinations"
                  :key="dest.id"
                  class="border-b border-gray-50 dark:border-gray-800/50"
                  :class="!dest.isActive && 'opacity-50'"
                >
                  <td class="py-2.5 pr-3">
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-block size-2.5 rounded-full shrink-0"
                        :style="{ backgroundColor: abColors[i % abColors.length] }"
                      />
                      <span class="font-medium text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)]">
                        {{ dest.label || `Вариант ${i + 1}` }}
                      </span>
                    </div>
                  </td>
                  <td class="py-2.5 pr-3 hidden sm:table-cell">
                    <a
                      :href="dest.url"
                      target="_blank"
                      class="text-[color:var(--success)] dark:text-[color:var(--success)] hover:underline truncate max-w-[200px] block"
                    >
                      {{ dest.url }}
                    </a>
                  </td>
                  <td class="py-2.5 pr-3 text-right tabular-nums">
                    {{ dest.weight }}%
                  </td>
                  <td class="py-2.5 pr-3 text-right tabular-nums font-medium">
                    {{ dest.clicks.toLocaleString('ru-RU') }}
                  </td>
                  <td class="py-2.5 text-right tabular-nums text-[color:var(--text-muted)]">
                    {{ totalClicks > 0 ? Math.round((dest.clicks / totalClicks) * 100) : 0 }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <!-- Analytics (scan chart) -->
        <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
          <template #header>
            <span class="font-medium">Аналитика сканирований</span>
          </template>
          <AnalyticsScanChart
            :data="timeSeries"
            :loading="loadingStats"
          />
        </UCard>
      </div>

      <!-- Right: QR Preview -->
      <div class="lg:col-span-1">
        <div class="lg:sticky lg:top-24">
          <QrPreview
            :url="qr.destinationUrl"
            :style="qr.style as any"
            :short-code="qr.shortCode"
            :title="qr.title"
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
import type { ScanTimeSeriesPoint } from '~~/types/analytics'

interface Destination {
  id: string
  url: string
  label: string | null
  weight: number
  isActive: boolean
  clicks: number
}

interface QrDetails extends QrCode {
  tags?: { id: string, name: string, color: string | null }[]
  folder?: { id: string, name: string } | null
  destinations?: Destination[]
}

const route = useRoute()
const toast = useA11yToast()
const { fetchQrById, deleteQr, duplicateQr } = useQr()

const qr = ref<QrDetails | null>(null)
const loadingQr = ref(true)
const exportOpen = ref(false)
const deleteOpen = ref(false)

// A/B destinations
const destinations = ref<Destination[]>([])
const abColors = ['#16a34a', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#ef4444']
const totalClicks = computed(() => destinations.value.reduce((s, d) => s + d.clicks, 0))
const totalActiveWeight = computed(() => destinations.value.filter(d => d.isActive).reduce((s, d) => s + d.weight, 0))
function activeWeightBar(dest: Destination) {
  if (totalActiveWeight.value === 0) return 0
  return Math.round((dest.weight / totalActiveWeight.value) * 100)
}

// Scan chart
const timeSeries = ref<ScanTimeSeriesPoint[]>([])
const loadingStats = ref(false)

async function loadStats() {
  loadingStats.value = true
  try {
    const to = new Date()
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const res = await $fetch<{ data: ScanTimeSeriesPoint[] }>('/api/analytics/scans', {
      query: {
        qrCodeId: id.value,
        dateFrom: from.toISOString(),
        dateTo: to.toISOString(),
      },
    })
    timeSeries.value = res.data
  }
  catch { /* silent */ }
  finally {
    loadingStats.value = false
  }
}

const id = computed(() => route.params.id as string)

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
    destinations.value = qr.value?.destinations ?? []
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

onMounted(() => {
  loadQr()
  loadStats()
})
</script>
