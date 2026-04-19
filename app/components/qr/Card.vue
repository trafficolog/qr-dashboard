<template>
  <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)] transition-interactive hover-lift">
    <NuxtLink
      :to="`/qr/${qr.id}`"
      class="mb-3 block"
    >
      <div class="aspect-square w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3">
        <QrPreviewMini
          :url="qr.destinationUrl"
          :style-config="qr.style as any"
        />
      </div>
    </NuxtLink>

    <div class="space-y-3">
      <div class="flex items-start justify-between gap-2">
        <NuxtLink
          :to="`/qr/${qr.id}`"
          class="truncate font-medium text-[color:var(--text-primary)] hover:text-[color:var(--accent)]"
        >
          {{ qr.title }}
        </NuxtLink>
        <div class="flex flex-col items-end gap-1">
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
        </div>
      </div>

      <button
        type="button"
        class="flex w-full items-center gap-1 text-left text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--accent)]"
        :title="qr.destinationUrl"
        @click="copyDestination"
      >
        <UIcon
          name="i-lucide-link"
          class="size-3 shrink-0"
        />
        <span class="truncate">{{ qr.destinationUrl }}</span>
        <UIcon
          name="i-lucide-copy"
          class="size-3 shrink-0"
        />
      </button>

      <div class="flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
        <span class="inline-flex items-center gap-1">
          <UIcon
            name="i-lucide-calendar"
            class="size-3"
          />
          {{ formatEpicDate(qr.createdAt) }}
        </span>
        <span>·</span>
        <span class="inline-flex items-center gap-1">
          <UIcon
            name="i-lucide-bar-chart-3"
            class="size-3"
          />
          {{ qr.totalScans.toLocaleString('ru-RU') }}
        </span>
      </div>

      <div
        v-if="qr.tags?.length"
        class="flex flex-wrap gap-1"
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

      <QuickActions
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
    </div>
  </UCard>
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

const props = defineProps<{
  qr: QrItem
  makeDepartmentTooltip?: string
}>()

const emit = defineEmits<{
  edit: [id: string]
  duplicate: [id: string]
  delete: [id: string]
  toggleStatus: [payload: { id: string, status: 'active' | 'paused' }]
  changeVisibility: [payload: { id: string, visibility: 'private' | 'department' | 'public', departmentId?: string | null }]
}>()

const toast = useA11yToast()
const { copy } = useClipboard()
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

function formatEpicDate(date: string | Date) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

async function copyDestination() {
  try {
    await copy(props.qr.destinationUrl)
    toast.add({ title: 'Ссылка скопирована', color: 'success' })
  }
  catch {
    toast.add({ title: 'Не удалось скопировать ссылку', color: 'error' })
  }
}
</script>
