<template>
  <UModal
    v-model:open="openModel"
    :title="$t('forms.unsaved.title')"
    :description="$t('forms.unsaved.description')"
    :dismissible="false"
    :close-on-escape="true"
  >
    <template #footer>
      <div class="flex items-center justify-end gap-3 w-full">
        <UButton
          variant="outline"
          color="neutral"
          :label="$t('forms.unsaved.stay')"
          @click="handleCancel"
        />
        <UButton
          color="error"
          icon="i-lucide-log-out"
          :label="$t('forms.unsaved.leave')"
          @click="handleConfirm"
        />
      </div>
    </template>
  </UModal>
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
