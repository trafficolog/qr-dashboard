<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-[color:var(--border)]">
          <th class="py-3 px-2 w-8">
            <input
              type="checkbox"
              :checked="allSelected"
              class="rounded border-[color:var(--border)] bg-[color:var(--surface-0)]"
              @change="$emit('toggleAll')"
            >
          </th>
          <th class="py-3 px-2 w-12" />
          <th
            class="cursor-pointer px-3 py-3 text-left font-medium text-[color:var(--text-secondary)] hover:text-[color:var(--accent)]"
            @click="$emit('sort', 'title')"
          >
            Название
            <UIcon
              v-if="sortBy === 'title'"
              :name="sortOrder === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
              class="size-3 inline"
            />
          </th>
          <th class="hidden px-3 py-3 text-left font-medium text-[color:var(--text-secondary)] lg:table-cell">
            URL
          </th>
          <th class="px-3 py-3 text-left font-medium text-[color:var(--text-secondary)]">
            Статус
          </th>
          <th
            class="cursor-pointer px-3 py-3 text-right font-medium text-[color:var(--text-secondary)] hover:text-[color:var(--accent)]"
            @click="$emit('sort', 'totalScans')"
          >
            Сканы
            <UIcon
              v-if="sortBy === 'totalScans'"
              :name="sortOrder === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
              class="size-3 inline"
            />
          </th>
          <th
            class="hidden cursor-pointer px-3 py-3 text-left font-medium text-[color:var(--text-secondary)] hover:text-[color:var(--accent)] md:table-cell"
            @click="$emit('sort', 'createdAt')"
          >
            Создан
            <UIcon
              v-if="sortBy === 'createdAt'"
              :name="sortOrder === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
              class="size-3 inline"
            />
          </th>
          <th class="py-3 px-2 w-10" />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="qr in items"
          :key="qr.id"
          class="border-b border-[color:var(--surface-2)] transition-colors hover:bg-[color:var(--surface-2)]/60"
        >
          <td class="py-3 px-2">
            <input
              type="checkbox"
              :checked="selectedIds.includes(qr.id)"
              class="rounded border-[color:var(--border)] bg-[color:var(--surface-0)]"
              @change="$emit('toggleSelect', qr.id)"
            >
          </td>
          <td class="py-3 px-2">
            <div class="h-10 w-10 overflow-hidden rounded border border-[color:var(--border)] bg-[color:var(--surface-0)] p-0.5">
              <QrPreviewMini
                :url="qr.destinationUrl"
                :style-config="qr.style as any"
              />
            </div>
          </td>
          <td class="py-3 px-3">
            <NuxtLink
              :to="`/qr/${qr.id}`"
              class="font-medium text-[color:var(--text-primary)] hover:text-[color:var(--accent)]"
            >
              {{ qr.title }}
            </NuxtLink>
            <div
              v-if="qr.tags?.length"
              class="flex gap-1 mt-1 flex-wrap"
            >
              <UBadge
                v-for="tag in qr.tags?.slice(0, 3)"
                :key="tag.id"
                variant="subtle"
                size="xs"
                :style="tag.color ? { backgroundColor: tag.color + '30', color: tag.color } : {}"
              >
                {{ tag.name }}
              </UBadge>
            </div>
          </td>
          <td class="py-3 px-3 hidden lg:table-cell">
            <span class="block max-w-[200px] truncate text-[color:var(--text-secondary)]">
              {{ qr.destinationUrl }}
            </span>
          </td>
          <td class="py-3 px-3">
            <UBadge
              :color="statusColor(qr.status)"
              variant="soft"
              size="sm"
            >
              {{ statusLabel(qr.status) }}
            </UBadge>
          </td>
          <td class="px-3 py-3 text-right font-medium text-[color:var(--text-primary)]">
            {{ qr.totalScans.toLocaleString() }}
          </td>
          <td class="hidden whitespace-nowrap px-3 py-3 text-[color:var(--text-secondary)] md:table-cell">
            {{ formatDate(qr.createdAt) }}
          </td>
          <td class="py-3 px-2">
            <UDropdownMenu :items="getActions(qr)">
              <UButton
                icon="i-lucide-more-horizontal"
                variant="ghost"
                color="neutral"
                size="sm"
              />
            </UDropdownMenu>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface QrItem {
  id: string
  title: string
  destinationUrl: string
  status: string
  totalScans: number
  createdAt: string | Date
  style?: Record<string, unknown>
  tags?: { id: string, name: string, color: string | null }[]
}

defineProps<{
  items: QrItem[]
  selectedIds: string[]
  allSelected: boolean
  sortBy: string
  sortOrder: string
}>()

const emit = defineEmits<{
  toggleAll: []
  toggleSelect: [id: string]
  sort: [field: string]
  edit: [id: string]
  duplicate: [id: string]
  delete: [id: string]
}>()

type StatusBadgeColor = 'primary' | 'warning' | 'error' | 'neutral'

function statusColor(status: string): StatusBadgeColor {
  const map: Record<string, StatusBadgeColor> = {
    active: 'primary',
    paused: 'warning',
    expired: 'error',
    archived: 'neutral',
  }
  return map[status] || 'neutral'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    active: 'Активен',
    paused: 'Пауза',
    expired: 'Истёк',
    archived: 'Архив',
  }
  return map[status] || status
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

function getActions(qr: QrItem) {
  return [
    [
      { label: 'Открыть', icon: 'i-lucide-external-link', to: `/qr/${qr.id}` },
      { label: 'Редактировать', icon: 'i-lucide-pencil', onSelect: () => emit('edit', qr.id) },
      { label: 'Дублировать', icon: 'i-lucide-copy', onSelect: () => emit('duplicate', qr.id) },
    ],
    [
      { label: 'Удалить', icon: 'i-lucide-trash-2', onSelect: () => emit('delete', qr.id) },
    ],
  ]
}
</script>
