<template>
  <Dialog
    v-model:visible="isOpen"
    modal
    :closable="true"
    :dismissable-mask="true"
    :close-on-escape="true"
    :style="{ width: '30rem', maxWidth: '95vw' }"
  >
    <template #container>
      <div class="rounded-xl bg-[color:var(--surface-0)] p-6">
        <div class="flex items-start gap-4">
          <div class="shrink-0 rounded-full bg-[color:var(--accent-light)] p-2">
            <Icon
              :name="props.icon"
              class="size-5 text-[color:var(--color-error)]"
            />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-[color:var(--text-primary)]">
              {{ props.title }}
            </h3>
            <p class="mt-2 text-sm text-[color:var(--text-secondary)]">
              {{ resolvedMessage }}
            </p>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <Button
            severity="secondary"
            outlined
            @click="isOpen = false"
          >
            {{ props.cancelLabel }}
          </Button>
          <Button
            :severity="resolvedSeverity"
            :loading="props.loading"
            @click="handleConfirm"
          >
            {{ props.confirmLabel }}
          </Button>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { createDialogFocusReturn } from '~/utils/dialog-focus-return'

const props = withDefaults(
  defineProps<{
    title?: string
    message?: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    icon?: string
    loading?: boolean
    confirmColor?: 'error' | 'danger' | 'warn' | 'primary' | 'secondary'
  }>(),
  {
    title: 'Подтверждение',
    message: 'Вы уверены? Это действие нельзя отменить.',
    description: '',
    confirmLabel: 'Удалить',
    cancelLabel: 'Отмена',
    icon: 'i-lucide-alert-triangle',
    loading: false,
    confirmColor: 'danger',
  },
)

const isOpen = defineModel<boolean>('open', { default: false })
const focusReturn = createDialogFocusReturn()

const emit = defineEmits<{
  confirm: []
}>()

const resolvedMessage = computed(() => props.description || props.message)
const resolvedSeverity = computed(() => (props.confirmColor === 'error' ? 'danger' : props.confirmColor))

watch(isOpen, (open) => {
  if (open) focusReturn.save()
  else focusReturn.restore()
})

function handleConfirm() {
  emit('confirm')
}
</script>
