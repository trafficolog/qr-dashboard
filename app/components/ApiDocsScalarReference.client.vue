<template>
  <ScalarApiReference :configuration="configuration" />
</template>

<script setup lang="ts">
import { ApiReference as ScalarApiReference } from '@scalar/api-reference/vue'

defineProps<{
  configuration: Record<string, unknown>
}>()
</script>
