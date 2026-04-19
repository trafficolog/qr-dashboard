<template>
  <img
    :src="src"
    :alt="alt || ''"
    class="mx-auto mb-6 w-full max-w-48"
    loading="lazy"
    decoding="async"
  >
</template>

<script setup lang="ts">
defineProps<{
  src: string
  alt?: string
}>()
</script>
