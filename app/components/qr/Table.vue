<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-gray-200 dark:border-gray-800">
          <th class="py-3 px-2 w-8">
            <input
              type="checkbox"
              :checked="allSelected"
              class="rounded border-gray-300"
              @change="$emit('toggleAll')"
            />
          </th>
          <th class="py-3 px-2 w-12" />
          <th
            class="py-3 px-3 text-left font-medium text-gray-500 cursor-pointer hover:text-gray-700"
            @click="$emit('sort', 'title')"
          >
            Название
            <UIcon v-if="sortBy === 'title'" :name="sortOrder === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'" class="size-3 inline" />
          </th>
          <th class="py-3 px-3 text-left font-medium text-gray-500 hidden lg:table-cell">URL</th>
          <th class="py-3 px-3 text-left font-medium text-gray-500">Статус</th>
          <th
            class="py-3 px-3 text-right font-medium text-gray-500 cursor-pointer hover:text-gray-700"
            @click="$emit('sort', 'totalScans')"
          >
            Сканы
            <UIcon v-if="sortBy === 'totalScans'" :name="sortOrder === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'" class="size-3 inline" />
          </th>
          <th
            class="py-3 px-3 text-left font-medium text-gray-500 hidden md:table-cell cursor-pointer hover:text-gray-700"
            @click="$emit('sort', 'createdAt')"
          >
            Создан
            <UIcon v-if="sortBy === 'createdAt'" :name="sortOrder === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'" class="size-3 inline" />
          </th>
          <th class="py-3 px-2 w-10" />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="qr in items"
          :key="qr.id"
          class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        >
          <td class="py-3 px-2">
            <input
              type="checkbox"
              :checked="selectedIds.includes(qr.id)"
              class="rounded border-gray-300"
              @change="$emit('toggleSelect', qr.id)"
            />
          </td>
          <td class="py-3 px-2">
            <div class="w-10 h-10 bg-white rounded border border-gray-200 p-0.5 overflow-hidden">
              <QrPreviewMini :url="qr.destinationUrl" :style-config="qr.style as any" />
            </div>
          </td>
          <td class="py-3 px-3">
            <NuxtLink
              :to="`/qr/${qr.id}`"
              class="font-medium text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400"
            >
              {{ qr.title }}
            </NuxtLink>
            <div v-if="qr.tags?.length" class="flex gap-1 mt-1 flex-wrap">
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
            <span class="text-gray-500 truncate max-w-[200px] block">
              {{ qr.destinationUrl }}
            </span>
          </td>
          <td class="py-3 px-3">
            <UBadge :color="statusColor(qr.status)" variant="subtle" size="sm">
              {{ statusLabel(qr.status) }}
            </UBadge>
          </td>
          <td class="py-3 px-3 text-right font-medium text-gray-900 dark:text-white">
            {{ qr.totalScans.toLocaleString() }}
          </td>
          <td class="py-3 px-3 text-gray-500 hidden md:table-cell whitespace-nowrap">
            {{ formatDate(qr.createdAt) }}
          </td>
          <td class="py-3 px-2">
            <UDropdownMenu :items="getActions(qr)">
              <UButton icon="i-lucide-more-horizontal" variant="ghost" color="neutral" size="sm" />
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
  tags?: { id: string; name: string; color: string | null }[]
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

function statusColor(status: string) {
  const map: Record<string, string> = {
    active: 'success',
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
      { label: 'Редактировать', icon: 'i-lucide-pencil', click: () => emit('edit', qr.id) },
      { label: 'Дублировать', icon: 'i-lucide-copy', click: () => emit('duplicate', qr.id) },
    ],
    [
      { label: 'Удалить', icon: 'i-lucide-trash-2', click: () => emit('delete', qr.id) },
    ],
  ]
}
</script>
