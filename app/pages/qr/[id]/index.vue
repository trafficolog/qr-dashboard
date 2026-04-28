<template>
  <div v-if="qr">
    <div class="mb-6 flex items-start justify-between">
      <div>
        <div class="mb-1 flex items-center gap-3">
          <Button
            as-child
            text
            severity="secondary"
            size="small"
          >
            <NuxtLink
              to="/qr"
              aria-label="Назад к списку QR-кодов"
              title="Назад к списку QR-кодов"
            >
              <Icon name="i-lucide-arrow-left" />
            </NuxtLink>
          </Button>
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
        <Button
          outlined
          severity="secondary"
          @click="exportOpen = true"
        >
          <template #icon>
            <Icon name="i-lucide-download" />
          </template>
          Экспорт
        </Button>
        <Button
          outlined
          severity="secondary"
          aria-label="Открыть действия для QR-кода"
          title="Открыть действия для QR-кода"
          @click="toggleActionsMenu"
        >
          <template #icon>
            <Icon name="i-lucide-more-horizontal" />
          </template>
        </Button>
        <Menu
          ref="actionsMenuRef"
          :model="flatActions"
          popup
          class="min-w-56"
        >
          <template #item="{ item }">
            <button
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
              @click="item.command?.({ originalEvent: $event, item })"
            >
              <Icon
                :name="item.icon || 'i-lucide-circle'"
                class="size-4"
              />
              <span>{{ item.label }}</span>
            </button>
          </template>
        </Menu>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div class="space-y-6 lg:col-span-2">
        <div class="grid grid-cols-3 gap-4">
          <div class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4">
            <div class="text-center">
              <p class="text-2xl font-bold text-[color:var(--text-primary)]">
                {{ qr.totalScans.toLocaleString() }}
              </p>
              <p class="mt-1 text-xs text-[color:var(--text-secondary)]">
                Всего сканов
              </p>
            </div>
          </div>
          <div class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4">
            <div class="text-center">
              <p class="text-2xl font-bold text-[color:var(--text-primary)]">
                {{ qr.uniqueScans.toLocaleString() }}
              </p>
              <p class="mt-1 text-xs text-[color:var(--text-secondary)]">
                Уникальных
              </p>
            </div>
          </div>
          <div class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4">
            <div class="text-center">
              <p class="text-2xl font-bold text-[color:var(--text-primary)]">
                {{ qr.type === 'dynamic' ? 'Дин.' : 'Стат.' }}
              </p>
              <p class="mt-1 text-xs text-[color:var(--text-secondary)]">
                Тип QR
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
          <span class="mb-4 block font-medium">Детали</span>
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
                <Tag
                  v-for="tag in qr.tags"
                  :key="tag.id"
                  class="px-2 py-0.5 text-xs"
                >
                  {{ tag.name }}
                </Tag>
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
        </div>

        <div
          v-if="destinations.length > 0"
          class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5"
        >
          <div class="mb-4 flex items-center justify-between">
            <span class="font-medium">A/B-варианты</span>
            <Button
              as-child
              text
              size="small"
            >
              <NuxtLink :to="`/qr/${id}/edit#ab`">
                <Icon
                  name="i-lucide-settings-2"
                  class="mr-1"
                />
                Управление
              </NuxtLink>
            </Button>
          </div>

          <!-- Traffic bar -->
          <div class="mb-4 flex h-2.5 w-full overflow-hidden rounded-full">
            <div
              v-for="(dest, i) in destinations.filter(d => d.isActive)"
              :key="dest.id"
              :style="{ width: `${activeWeightBar(dest)}%`, backgroundColor: abColors[i % abColors.length] }"
              class="transition-[width] duration-200 ease-in-out"
            />
          </div>

          <DataTable
            :value="destinations"
            :row-class="getDestinationRowClass"
            table-style="min-width: 40rem"
            class="text-sm"
          >
            <Column header="Вариант">
              <template #body="{ data, index }">
                <div class="flex items-center gap-2 py-1">
                  <span
                    class="inline-block size-2.5 shrink-0 rounded-full"
                    :style="{ backgroundColor: abColors[index % abColors.length] }"
                  />
                  <span class="font-medium text-[color:var(--text-primary)]">
                    {{ data.label || `Вариант ${index + 1}` }}
                  </span>
                </div>
              </template>
            </Column>
            <Column header="URL">
              <template #body="{ data }">
                <a
                  :href="data.url"
                  target="_blank"
                  class="block max-w-[240px] truncate text-[color:var(--color-success)] hover:underline"
                >
                  {{ data.url }}
                </a>
              </template>
            </Column>
            <Column header="Вес">
              <template #body="{ data }">
                <span class="tabular-nums">{{ data.weight }}%</span>
              </template>
            </Column>
            <Column header="Клики">
              <template #body="{ data }">
                <span class="tabular-nums font-medium">{{ data.clicks.toLocaleString('ru-RU') }}</span>
              </template>
            </Column>
            <Column header="%">
              <template #body="{ data }">
                <span class="tabular-nums text-[color:var(--text-muted)]">
                  {{ totalClicks > 0 ? Math.round((data.clicks / totalClicks) * 100) : 0 }}%
                </span>
              </template>
            </Column>
          </DataTable>
        </div>

        <div class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
          <span class="mb-4 block font-medium">Аналитика сканирований</span>
          <AnalyticsScanChart
            :data="timeSeries"
            :loading="loadingStats"
          />
        </div>
      </div>

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

  <div
    v-else-if="loadingQr"
    class="space-y-4"
  >
    <Skeleton class="h-8 w-64" />
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div class="lg:col-span-2 space-y-4">
        <Skeleton class="h-24 w-full rounded-lg" />
        <Skeleton class="h-48 w-full rounded-lg" />
      </div>
      <Skeleton class="h-80 w-full rounded-lg" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QrCode, QrStatus } from '#shared/types/qr'
import type { ScanTimeSeriesPoint } from '#shared/types/analytics'
import type Menu from 'primevue/menu'

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
const actionsMenuRef = ref<InstanceType<typeof Menu> | null>(null)

// A/B destinations
const destinations = ref<Destination[]>([])
const abColors = ['#16a34a', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#ef4444']
const totalClicks = computed(() => destinations.value.reduce((s, d) => s + d.clicks, 0))
const totalActiveWeight = computed(() => destinations.value.filter(d => d.isActive).reduce((s, d) => s + d.weight, 0))
function activeWeightBar(dest: Destination) {
  if (totalActiveWeight.value === 0) return 0
  return Math.round((dest.weight / totalActiveWeight.value) * 100)
}

function getDestinationRowClass(dest: Destination) {
  return dest.isActive ? '' : 'opacity-50'
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
const flatActions = computed(() => actions.value.flat().map(action => ({
  label: action.label,
  icon: action.icon,
  command: action.onSelect,
})))

function toggleActionsMenu(event: Event) {
  actionsMenuRef.value?.toggle(event)
}

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
