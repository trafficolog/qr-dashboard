<template>
  <Dialog
    v-model:visible="openModel"
    modal
    :dismissable-mask="false"
    :close-on-escape="true"
    :closable="false"
    :style="{ width: '30rem', maxWidth: '95vw' }"
  >
    <div class="space-y-6">
      <div>
        <h3 class="text-lg font-semibold text-[color:var(--text-primary)]">
          {{ $t('forms.unsaved.title') }}
        </h3>
        <p class="mt-2 text-sm text-[color:var(--text-secondary)]">
          {{ $t('forms.unsaved.description') }}
        </p>
      </div>

      <div class="flex items-center justify-end gap-3 w-full">
        <Button
          outlined
          severity="secondary"
          @click="handleCancel"
        >
          {{ $t('forms.unsaved.stay') }}
        </Button>
        <Button
          severity="danger"
          @click="handleConfirm"
        >
          <template #icon>
            <Icon
              name="i-lucide-log-out"
              class="size-4"
            />
          </template>
          {{ $t('forms.unsaved.leave') }}
        </Button>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { createDialogFocusReturn } from '~/utils/dialog-focus-return'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
  'cancel': []
}>()

const openModel = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v),
})
const focusReturn = createDialogFocusReturn()

watch(() => props.open, (open) => {
  if (open) focusReturn.save()
  else focusReturn.restore()
})

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
}
</script>
