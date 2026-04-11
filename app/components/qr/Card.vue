<template>
  <UCard class="hover:shadow-md transition-shadow">
    <!-- QR Preview -->
    <NuxtLink :to="`/qr/${qr.id}`" class="block">
      <div class="w-full aspect-square bg-white rounded-lg p-3 mb-3 border border-gray-100 dark:border-gray-800">
        <QrPreviewMini :url="qr.destinationUrl" :style-config="qr.style as any" />
      </div>
    </NuxtLink>

    <!-- Info -->
    <div class="space-y-2">
      <div class="flex items-start justify-between gap-2">
        <NuxtLink
          :to="`/qr/${qr.id}`"
          class="font-medium text-gray-900 dark:text-white hover:text-green-600 truncate"
        >
          {{ qr.title }}
        </NuxtLink>
        <UDropdownMenu :items="actions">
          <UButton icon="i-lucide-more-horizontal" variant="ghost" color="neutral" size="xs" />
        </UDropdownMenu>
      </div>

      <div class="flex items-center gap-2">
        <UBadge :color="statusColor" variant="subtle" size="xs">
          {{ statusLabel }}
        </UBadge>
        <span class="text-xs text-gray-500">
          {{ qr.totalScans.toLocaleString() }} сканов
        </span>
      </div>

      <div v-if="qr.tags?.length" class="flex gap-1 flex-wrap">
        <UBadge
          v-for="tag in qr.tags.slice(0, 3)"
          :key="tag.id"
          variant="subtle"
          size="xs"
          :style="tag.color ? { backgroundColor: tag.color + '30', color: tag.color } : {}"
        >
          {{ tag.name }}
        </UBadge>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface QrItem {
  id: string
  title: string
  destinationUrl: string
  status: string
  totalScans: number
  style?: Record<string, unknown>
  tags?: { id: string; name: string; color: string | null }[]
}

const props = defineProps<{ qr: QrItem }>()

const emit = defineEmits<{
  edit: [id: string]
  duplicate: [id: string]
  delete: [id: string]
}>()

const statusColor = computed(() => {
  const map: Record<string, string> = { active: 'success', paused: 'warning', expired: 'error', archived: 'neutral' }
  return map[props.qr.status] || 'neutral'
})

const statusLabel = computed(() => {
  const map: Record<string, string> = { active: 'Активен', paused: 'Пауза', expired: 'Истёк', archived: 'Архив' }
  return map[props.qr.status] || props.qr.status
})

const actions = [
  [
    { label: 'Открыть', icon: 'i-lucide-external-link', to: `/qr/${props.qr.id}` },
    { label: 'Редактировать', icon: 'i-lucide-pencil', click: () => emit('edit', props.qr.id) },
    { label: 'Дублировать', icon: 'i-lucide-copy', click: () => emit('duplicate', props.qr.id) },
  ],
  [
    { label: 'Удалить', icon: 'i-lucide-trash-2', click: () => emit('delete', props.qr.id) },
  ],
]
</script>
