<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
      <UIcon :name="icon" class="size-8 text-gray-400" />
    </div>
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">
      {{ title }}
    </h3>
    <p v-if="description" class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
      {{ description }}
    </p>
    <slot name="action" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  description?: string
}>()
</script>
