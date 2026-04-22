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
              :name="icon"
              class="size-5 text-[color:var(--color-error)]"
            />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-[color:var(--text-primary)]">
              {{ title }}
            </h3>
            <p class="mt-2 text-sm text-[color:var(--text-secondary)]">
              {{ message }}
            </p>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <Button
            severity="secondary"
            outlined
            @click="isOpen = false"
          >
            {{ cancelLabel }}
          </Button>
          <Button
            severity="danger"
            :loading="loading"
            @click="handleConfirm"
          >
            {{ confirmLabel }}
          </Button>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { createDialogFocusReturn } from '~/utils/dialog-focus-return'

withDefaults(
  defineProps<{
    title?: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    icon?: string
    loading?: boolean
  }>(),
  {
    title: 'Подтверждение',
    message: 'Вы уверены? Это действие нельзя отменить.',
    confirmLabel: 'Удалить',
    cancelLabel: 'Отмена',
    icon: 'i-lucide-alert-triangle',
    loading: false,
  },
)

const isOpen = defineModel<boolean>('open', { default: false })
const focusReturn = createDialogFocusReturn()

const emit = defineEmits<{
  confirm: []
}>()

watch(isOpen, (open) => {
  if (open) focusReturn.save()
  else focusReturn.restore()
})

function handleConfirm() {
  emit('confirm')
}
</script>
