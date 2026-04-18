<template>
  <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)] transition-shadow hover:shadow-md hover:shadow-black/5">
    <!-- QR Preview -->
    <NuxtLink
      :to="`/qr/${qr.id}`"
      class="block"
    >
      <div class="mb-3 aspect-square w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3">
        <QrPreviewMini
          :url="qr.destinationUrl"
          :style-config="qr.style as any"
        />
      </div>
    </NuxtLink>

    <!-- Info -->
    <div class="space-y-2">
      <div class="flex items-start justify-between gap-2">
        <NuxtLink
          :to="`/qr/${qr.id}`"
          class="truncate font-medium text-[color:var(--text-primary)] hover:text-[color:var(--accent)]"
        >
          {{ qr.title }}
        </NuxtLink>
        <UTooltip :text="makeDepartmentTooltip">
          <UDropdownMenu :items="actions">
            <UButton
              icon="i-lucide-more-horizontal"
              :aria-label="`Открыть действия для QR-кода ${qr.title}`"
              :title="`Открыть действия для QR-кода ${qr.title}`"
              variant="ghost"
              color="neutral"
              size="xs"
            />
          </UDropdownMenu>
        </UTooltip>
      </div>

      <div class="flex items-center gap-2">
        <UBadge
          :color="statusColor"
          variant="soft"
          size="xs"
        >
          {{ statusLabel }}
        </UBadge>
        <UBadge
          :icon="visibilityBadge.icon"
          variant="soft"
          color="neutral"
          size="xs"
        >
          {{ visibilityBadge.label }}
        </UBadge>
        <span class="text-xs text-[color:var(--text-secondary)]">
          {{ qr.totalScans.toLocaleString() }} сканов
        </span>
      </div>

      <div
        v-if="qr.tags?.length"
        class="flex gap-1 flex-wrap"
      >
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
  tags?: { id: string, name: string, color: string | null }[]
  visibility?: 'private' | 'department' | 'public'
  departmentName?: string | null
}

const props = defineProps<{
  qr: QrItem
  makeDepartmentDisabled?: boolean
  makeDepartmentTooltip?: string
}>()

const emit = defineEmits<{
  edit: [id: string]
  duplicate: [id: string]
  delete: [id: string]
  changeVisibility: [payload: { id: string, visibility: 'private' | 'department' | 'public' }]
}>()
const { t } = useI18n()

type StatusBadgeColor = 'primary' | 'warning' | 'error' | 'neutral'

const statusColor = computed<StatusBadgeColor>(() => {
  const map: Record<string, StatusBadgeColor> = { active: 'primary', paused: 'warning', expired: 'error', archived: 'neutral' }
  return map[props.qr.status] || 'neutral'
})

const statusLabel = computed(() => {
  const map: Record<string, string> = { active: 'Активен', paused: 'Пауза', expired: 'Истёк', archived: 'Архив' }
  return map[props.qr.status] || props.qr.status
})

const visibilityBadge = computed(() => {
  if (props.qr.visibility === 'department') {
    return {
      icon: 'i-lucide-building-2',
      label: props.qr.departmentName ? t('qr.visibility.departmentWithName', { name: props.qr.departmentName }) : t('qr.visibility.department'),
    }
  }

  if (props.qr.visibility === 'public') {
    return { icon: 'i-lucide-globe', label: t('qr.visibility.public') }
  }

  return { icon: 'i-lucide-lock', label: t('qr.visibility.private') }
})

const actions = [
  [
    { label: 'Открыть', icon: 'i-lucide-external-link', to: `/qr/${props.qr.id}` },
    { label: 'Редактировать', icon: 'i-lucide-pencil', onSelect: () => emit('edit', props.qr.id) },
    { label: 'Дублировать', icon: 'i-lucide-copy', onSelect: () => emit('duplicate', props.qr.id) },
  ],
  [
    { label: t('qr.actions.makePrivate'), icon: 'i-lucide-lock', onSelect: () => emit('changeVisibility', { id: props.qr.id, visibility: 'private' }) },
    {
      label: t('qr.actions.makeDepartment'),
      icon: 'i-lucide-building-2',
      disabled: props.makeDepartmentDisabled,
      onSelect: () => emit('changeVisibility', { id: props.qr.id, visibility: 'department' }),
    },
    { label: t('qr.actions.makePublic'), icon: 'i-lucide-globe', onSelect: () => emit('changeVisibility', { id: props.qr.id, visibility: 'public' }) },
  ],
  [
    { label: 'Удалить', icon: 'i-lucide-trash-2', onSelect: () => emit('delete', props.qr.id) },
  ],
]
</script>
