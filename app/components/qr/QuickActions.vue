<template>
  <div :class="containerClass">
    <UButton
      icon="i-lucide-download"
      :label="compact ? undefined : 'Download'"
      :aria-label="compact ? 'Скачать QR-код' : undefined"
      :title="compact ? 'Скачать QR-код' : undefined"
      :size="compact ? 'xs' : 'sm'"
      variant="outline"
      color="neutral"
      @click="exportOpen = true"
    />

    <UButton
      icon="i-lucide-copy"
      :label="compact ? undefined : 'Copy URL'"
      :aria-label="compact ? 'Скопировать URL' : undefined"
      :title="compact ? 'Скопировать URL' : undefined"
      :size="compact ? 'xs' : 'sm'"
      variant="outline"
      color="neutral"
      @click="copyUrl"
    />

    <UTooltip :text="makeDepartmentTooltip">
      <UDropdownMenu :items="moreActions">
        <UButton
          icon="i-lucide-more-horizontal"
          :label="compact ? undefined : 'More'"
          :aria-label="`Открыть дополнительные действия для QR-кода ${title}`"
          :title="`Открыть дополнительные действия для QR-кода ${title}`"
          :size="compact ? 'xs' : 'sm'"
          variant="ghost"
          color="neutral"
        />
      </UDropdownMenu>
    </UTooltip>

    <QrExportDialog
      v-model:open="exportOpen"
      :qr-id="qrId"
      :title="title"
    />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  qrId: string
  title: string
  shortCode?: string
  destinationUrl: string
  status: string
  compact?: boolean
  makeDepartmentTooltip?: string
}>(), {
  shortCode: '',
  compact: false,
  makeDepartmentTooltip: '',
})

const emit = defineEmits<{
  edit: [id: string]
  duplicate: [id: string]
  delete: [id: string]
  toggleStatus: [payload: { id: string, status: 'active' | 'paused' }]
}>()

const toast = useA11yToast()
const { copy } = useClipboard()
const exportOpen = ref(false)

const containerClass = computed(() => props.compact
  ? 'flex items-center justify-end gap-1'
  : 'flex flex-col gap-2 sm:flex-row sm:items-center')

const nextStatus = computed<'active' | 'paused'>(() => (props.status === 'active' ? 'paused' : 'active'))

const moreActions = computed(() => [
  [
    { label: 'Редактировать', icon: 'i-lucide-pencil', onSelect: () => emit('edit', props.qrId) },
    { label: 'Дублировать', icon: 'i-lucide-copy', onSelect: () => emit('duplicate', props.qrId) },
  ],
  [
    {
      label: props.status === 'active' ? 'Приостановить' : 'Активировать',
      icon: props.status === 'active' ? 'i-lucide-pause' : 'i-lucide-play',
      onSelect: () => emit('toggleStatus', { id: props.qrId, status: nextStatus.value }),
    },
  ],
  [
    { label: 'Удалить', icon: 'i-lucide-trash-2', onSelect: () => emit('delete', props.qrId) },
  ],
])

async function copyUrl() {
  try {
    await copy(props.destinationUrl)
    toast.add({ title: 'Ссылка скопирована', color: 'success' })
  }
  catch {
    toast.add({ title: 'Не удалось скопировать ссылку', color: 'error' })
  }
}
</script>
