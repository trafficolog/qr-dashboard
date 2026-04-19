<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <SharedEmptyIllustration
      v-if="illustration"
      :src="illustration"
      :alt="illustrationAlt || title"
    />
    <div
      v-else
      class="mb-4 rounded-full bg-[color:var(--surface-2)] p-4"
    >
      <UIcon
        :name="icon || 'i-lucide-package-open'"
        class="size-8 text-[color:var(--text-muted)]"
      />
    </div>
    <h3 class="mb-1 text-lg font-medium text-[color:var(--text-primary)]">
      {{ title }}
    </h3>
    <p
      v-if="description"
      class="mb-6 max-w-sm text-sm text-[color:var(--text-secondary)]"
    >
      {{ description }}
    </p>
    <slot name="action" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string
  illustration?: string
  illustrationAlt?: string
  title: string
  description?: string
}>()
</script>
