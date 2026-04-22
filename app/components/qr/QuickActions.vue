<template>
  <div :class="containerClass">
    <Button
      :aria-label="compact ? 'Скачать QR-код' : undefined"
      :title="compact ? 'Скачать QR-код' : undefined"
      :size="compact ? 'small' : 'small'"
      outlined
      severity="secondary"
      @click="exportOpen = true"
    >
      <template #icon>
        <Icon name="i-lucide-download" />
      </template>
      <span v-if="!compact">Download</span>
    </Button>

    <Button
      :aria-label="compact ? 'Скопировать URL' : undefined"
      :title="compact ? 'Скопировать URL' : undefined"
      :size="compact ? 'small' : 'small'"
      outlined
      severity="secondary"
      @click="copyUrl"
    >
      <template #icon>
        <Icon name="i-lucide-copy" />
      </template>
      <span v-if="!compact">Copy URL</span>
    </Button>

    <Button
      :aria-label="`Открыть дополнительные действия для QR-кода ${title}`"
      :title="`Открыть дополнительные действия для QR-кода ${title}`"
      :size="compact ? 'small' : 'small'"
      text
      severity="secondary"
      @click="toggleMenu"
    >
      <template #icon>
        <Icon name="i-lucide-more-horizontal" />
      </template>
      <span v-if="!compact">More</span>
    </Button>

    <Menu
      ref="menuRef"
      :model="flatMenuItems"
      popup
      class="min-w-56"
    >
      <template #item="{ item }">
        <button
          class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
          :disabled="typeof item.disabled === 'function' ? item.disabled() : Boolean(item.disabled)"
          :title="item.key === 'department' ? makeDepartmentTooltip : undefined"
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

    <QrExportDialog
      v-model:open="exportOpen"
      :qr-id="qrId"
      :title="title"
    />
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import type Menu from 'primevue/menu'

const props = withDefaults(defineProps<{
  qrId: string
  title: string
  shortCode?: string
  destinationUrl: string
  status: string
  visibility?: 'private' | 'department' | 'public'
  departmentId?: string | null
  compact?: boolean
  makeDepartmentTooltip?: string
}>(), {
  shortCode: '',
  visibility: 'private',
  departmentId: null,
  compact: false,
  makeDepartmentTooltip: '',
})

const emit = defineEmits<{
  edit: [id: string]
  duplicate: [id: string]
  delete: [id: string]
  toggleStatus: [payload: { id: string, status: 'active' | 'paused' }]
  changeVisibility: [payload: { id: string, visibility: 'private' | 'department' | 'public', departmentId?: string | null }]
}>()

const toast = useA11yToast()
const { copy } = useClipboard()
const exportOpen = ref(false)
const menuRef = ref<InstanceType<typeof Menu> | null>(null)

const containerClass = computed(() => props.compact
  ? 'flex items-center justify-end gap-1'
  : 'flex flex-col gap-2 sm:flex-row sm:items-center')

const nextStatus = computed<'active' | 'paused'>(() => (props.status === 'active' ? 'paused' : 'active'))
const canShareWithDepartment = computed(() => !props.makeDepartmentTooltip)

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
    {
      key: 'public',
      label: 'Сделать публичным',
      icon: 'i-lucide-globe',
      disabled: props.visibility === 'public',
      onSelect: () => emit('changeVisibility', { id: props.qrId, visibility: 'public' }),
    },
    {
      key: 'private',
      label: 'Сделать приватным',
      icon: 'i-lucide-lock',
      disabled: props.visibility === 'private',
      onSelect: () => emit('changeVisibility', { id: props.qrId, visibility: 'private' }),
    },
    {
      key: 'department',
      label: 'Поделиться с отделом',
      icon: 'i-lucide-building-2',
      disabled: !canShareWithDepartment.value,
      onSelect: () => emit('changeVisibility', {
        id: props.qrId,
        visibility: 'department',
        departmentId: props.departmentId,
      }),
    },
  ],
  [
    { label: 'Удалить', icon: 'i-lucide-trash-2', onSelect: () => emit('delete', props.qrId) },
  ],
])

const flatMenuItems = computed(() => moreActions.value.flat())

function toggleMenu(event: Event) {
  menuRef.value?.toggle(event)
}

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
