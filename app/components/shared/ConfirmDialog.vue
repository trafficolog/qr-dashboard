<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <div class="p-6">
        <div class="flex items-start gap-4">
          <div class="p-2 rounded-full bg-red-50 dark:bg-red-950 shrink-0">
            <UIcon :name="icon" class="size-5 text-red-600 dark:text-red-400" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ title }}
            </h3>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {{ message }}
            </p>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <UButton
            variant="outline"
            color="neutral"
            :label="cancelLabel"
            @click="isOpen = false"
          />
          <UButton
            color="error"
            :label="confirmLabel"
            :loading="loading"
            @click="handleConfirm"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = withDefaults(
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

const emit = defineEmits<{
  confirm: []
}>()

function handleConfirm() {
  emit('confirm')
}
</script>
