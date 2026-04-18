<template>
  <div class="overflow-x-auto">
    <table
      class="w-full text-sm"
      role="table"
    >
      <thead>
        <tr class="border-b border-[color:var(--border)]">
          <th
            scope="col"
            class="py-3 px-2 w-8"
          >
            <input
              type="checkbox"
              :checked="allSelected"
              :aria-label="t('a11y.actions.selectAllQrs')"
              class="rounded border-[color:var(--border)] bg-[color:var(--surface-0)]"
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
            <UIcon
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
            <UIcon
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
            <UIcon
              v-if="sortBy === 'createdAt'"
              :name="sortOrder === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
              class="size-3 inline"
            />
          </th>
          <th
            scope="col"
            class="py-3 px-2 w-10"
          />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="qr in items"
          :key="qr.id"
          class="border-b border-[color:var(--surface-2)] transition-interactive hover:bg-[color:var(--surface-2)]/60"
        >
          <td class="py-3 px-2">
            <input
              type="checkbox"
              :checked="selectedIds.includes(qr.id)"
              :aria-label="t('a11y.actions.selectQr', { title: qr.title })"
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
            <QrStatusBadge :status="qr.status" />
            <UBadge
              :icon="getVisibilityBadge(qr).icon"
              variant="soft"
              color="neutral"
              size="xs"
              class="mt-1"
            >
              {{ getVisibilityBadge(qr).label }}
            </UBadge>
          </td>
          <td class="px-3 py-3 text-right font-medium text-[color:var(--text-primary)]">
            {{ qr.totalScans.toLocaleString() }}
          </td>
          <td class="hidden whitespace-nowrap px-3 py-3 text-[color:var(--text-secondary)] md:table-cell">
            {{ formatDate(qr.createdAt) }}
          </td>
          <td class="py-3 px-2">
            <UTooltip :text="makeDepartmentTooltip">
              <UDropdownMenu :items="getActions(qr)">
                <UButton
                  icon="i-lucide-more-horizontal"
                  :aria-label="t('a11y.actions.openQrActions', { title: qr.title })"
                  :title="t('a11y.actions.openQrActions', { title: qr.title })"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                />
              </UDropdownMenu>
            </UTooltip>
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
  visibility?: 'private' | 'department' | 'public'
  departmentName?: string | null
}

const props = defineProps<{
  items: QrItem[]
  selectedIds: string[]
  allSelected: boolean
  sortBy: string
  sortOrder: string
  makeDepartmentDisabled?: boolean
  makeDepartmentTooltip?: string
}>()

const emit = defineEmits<{
  toggleAll: []
  toggleSelect: [id: string]
  sort: [field: string]
  edit: [id: string]
  duplicate: [id: string]
  delete: [id: string]
  changeVisibility: [payload: { id: string, visibility: 'private' | 'department' | 'public' }]
}>()

const { t } = useI18n()

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
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

function getActions(qr: QrItem) {
  return [
    [
      { label: 'Открыть', icon: 'i-lucide-external-link', to: `/qr/${qr.id}` },
      { label: 'Редактировать', icon: 'i-lucide-pencil', onSelect: () => emit('edit', qr.id) },
      { label: 'Дублировать', icon: 'i-lucide-copy', onSelect: () => emit('duplicate', qr.id) },
    ],
    [
      { label: t('qr.actions.makePrivate'), icon: 'i-lucide-lock', onSelect: () => emit('changeVisibility', { id: qr.id, visibility: 'private' }) },
      {
        label: t('qr.actions.makeDepartment'),
        icon: 'i-lucide-building-2',
        disabled: props.makeDepartmentDisabled,
        onSelect: () => emit('changeVisibility', { id: qr.id, visibility: 'department' }),
      },
      { label: t('qr.actions.makePublic'), icon: 'i-lucide-globe', onSelect: () => emit('changeVisibility', { id: qr.id, visibility: 'public' }) },
    ],
    [
      { label: 'Удалить', icon: 'i-lucide-trash-2', onSelect: () => emit('delete', qr.id) },
    ],
  ]
}
</script>
