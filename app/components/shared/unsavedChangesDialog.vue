<template>
  <UModal
    v-model:open="openModel"
    :title="$t('forms.unsaved.title')"
    :description="$t('forms.unsaved.description')"
    :dismissible="false"
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

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
}
</script>
