<template>
  <div class="overflow-x-auto">
    <table
      class="w-full text-sm"
      role="table"
    >
      <thead>
        <tr class="border-b border-[color:var(--surface-border)]">
          <th
            scope="col"
            class="py-3 px-2 w-8"
          >
            <input
              type="checkbox"
              :checked="allSelected"
              :aria-label="t('a11y.actions.selectAllQrs')"
              class="rounded border-[color:var(--surface-border)] bg-[color:var(--surface-card)]"
              @change="$emit('toggleAll')"
            >
          </th>
          <th
            scope="col"
            class="py-3 px-2 w-12"
          />
          <th
            scope="col"
            class="cursor-pointer px-3 py-3 text-left font-medium text-[color:var(--text-secondary)] hover:text-[color:var(--accent)]"
            @click="$emit('sort', 'title')"
          >
            Название
            <Icon
              v-if="sortBy === 'title'"
              :name="sortOrder === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
              class="size-3 inline"
            />
          </th>
          <th
            scope="col"
            class="hidden px-3 py-3 text-left font-medium text-[color:var(--text-secondary)] lg:table-cell"
          >
            URL
          </th>
          <th
            scope="col"
            class="px-3 py-3 text-left font-medium text-[color:var(--text-secondary)]"
          >
            Статус
          </th>
          <th
            scope="col"
            class="cursor-pointer px-3 py-3 text-right font-medium text-[color:var(--text-secondary)] hover:text-[color:var(--accent)]"
            @click="$emit('sort', 'totalScans')"
          >
            Сканы
            <Icon
              v-if="sortBy === 'totalScans'"
              :name="sortOrder === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
              class="size-3 inline"
            />
          </th>
          <th
            scope="col"
            class="hidden cursor-pointer px-3 py-3 text-left font-medium text-[color:var(--text-secondary)] hover:text-[color:var(--accent)] md:table-cell"
            @click="$emit('sort', 'createdAt')"
          >
            Создан
            <Icon
              v-if="sortBy === 'createdAt'"
              :name="sortOrder === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
              class="size-3 inline"
            />
          </th>
          <th
            scope="col"
            class="py-3 px-2 w-[140px]"
          >
            Действия
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="qr in items"
          :key="qr.id"
          class="border-b border-[color:var(--surface-2)] transition-interactive hover:bg-[color:var(--surface-2)]/60"
          @dblclick="$emit('openDetail', qr.id)"
        >
          <td class="py-3 px-2">
            <input
              type="checkbox"
              :checked="selectedIds.includes(qr.id)"
              :aria-label="t('a11y.actions.selectQr', { title: qr.title })"
              class="rounded border-[color:var(--surface-border)] bg-[color:var(--surface-card)]"
              @change="$emit('toggleSelect', qr.id)"
            >
          </td>
          <td class="py-3 px-2">
            <QrHoverPreview
              :title="qr.title"
              :destination-url="qr.destinationUrl"
              :status="qr.status"
              :scans="qr.totalScans"
              :style-config="qr.style as any"
            >
              <div class="h-10 w-10 overflow-hidden rounded border border-[color:var(--surface-border)] bg-[color:var(--surface-card)] p-0.5">
                <QrPreviewMini
                  :url="qr.destinationUrl"
                  :style-config="qr.style as any"
                />
              </div>
            </QrHoverPreview>
          </td>
          <td class="py-3 px-3">
            <NuxtLink
              :to="`/qr/${qr.id}`"
              class="font-medium text-[color:var(--text-color)] hover:text-[color:var(--accent)]"
            >
              {{ qr.title }}
            </NuxtLink>
            <div
              v-if="qr.tags?.length"
              class="flex gap-1 mt-1 flex-wrap"
            >
              <Tag
                v-for="tag in qr.tags?.slice(0, 3)"
                :key="tag.id"
                :style="tag.color ? { backgroundColor: tag.color + '30', color: tag.color } : {}"
                class="px-2 py-0.5 text-xs"
              >
                {{ tag.name }}
              </Tag>
            </div>
          </td>
          <td class="py-3 px-3 hidden lg:table-cell">
            <span class="block max-w-[200px] truncate text-[color:var(--text-secondary)]">
              {{ qr.destinationUrl }}
            </span>
          </td>
          <td class="py-3 px-3">
            <QrStatusBadge :status="qr.status" />
            <Tag class="mt-1 px-2 py-0.5 text-xs">
              <Icon
                :name="getVisibilityBadge(qr).icon"
                class="mr-1 size-3"
              />
              {{ getVisibilityBadge(qr).label }}
            </Tag>
          </td>
          <td class="px-3 py-3 text-right font-medium text-[color:var(--text-color)]">
            {{ qr.totalScans.toLocaleString('ru-RU') }}
          </td>
          <td class="hidden whitespace-nowrap px-3 py-3 text-[color:var(--text-secondary)] md:table-cell">
            {{ formatDate(qr.createdAt) }}
          </td>
          <td class="py-3 px-2">
            <QuickActions
              compact
              :qr-id="qr.id"
              :title="qr.title"
              :short-code="qr.shortCode"
              :destination-url="qr.destinationUrl"
              :status="qr.status"
              :visibility="qr.visibility"
              :department-id="qr.departmentId"
              :make-department-tooltip="makeDepartmentTooltip"
              @edit="emit('edit', $event)"
              @duplicate="emit('duplicate', $event)"
              @delete="emit('delete', $event)"
              @toggle-status="emit('toggleStatus', $event)"
              @change-visibility="emit('changeVisibility', $event)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface QrItem {
  id: string
  shortCode?: string
  title: string
  destinationUrl: string
  status: string
  totalScans: number
  createdAt: string | Date
  style?: Record<string, unknown>
  tags?: { id: string, name: string, color: string | null }[]
  visibility?: 'private' | 'department' | 'public'
  departmentId?: string | null
  departmentName?: string | null
}

defineProps<{
  items: QrItem[]
  selectedIds: string[]
  allSelected: boolean
  sortBy: string
  sortOrder: string
  makeDepartmentTooltip?: string
}>()

const emit = defineEmits<{
  toggleAll: []
  toggleSelect: [id: string]
  sort: [field: string]
  edit: [id: string]
  duplicate: [id: string]
  delete: [id: string]
  toggleStatus: [payload: { id: string, status: 'active' | 'paused' }]
  changeVisibility: [payload: { id: string, visibility: 'private' | 'department' | 'public', departmentId?: string | null }]
  openDetail: [id: string]
}>()

const { t } = useI18n()

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function getVisibilityBadge(qr: QrItem) {
  if (qr.visibility === 'department') {
    return {
      icon: 'i-lucide-building-2',
      label: qr.departmentName ? t('qr.visibility.departmentWithName', { name: qr.departmentName }) : t('qr.visibility.department'),
    }
  }

  if (qr.visibility === 'public') {
    return { icon: 'i-lucide-globe', label: t('qr.visibility.public') }
  }

  return { icon: 'i-lucide-lock', label: t('qr.visibility.private') }
}
</script>
