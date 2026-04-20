<template>
  <div class="api-docs-page">
    <ScalarApiReference :configuration="scalarConfig" />
  </div>
</template>

<script setup lang="ts">
import { ApiReference as ScalarApiReference } from '@scalar/api-reference/vue'

const scalarConfig = {
  spec: {
    url: '/api/openapi.json',
  },
  authentication: {
    preferredSecurityScheme: 'bearerAuth',
  },
  theme: 'default',
  darkMode: false,
} as const
</script>

<style scoped>
.api-docs-page :deep(.scalar-app) {
  --scalar-background-1: var(--surface-1);
  --scalar-background-2: var(--surface-0);
  --scalar-background-3: var(--surface-2);
  --scalar-color-1: var(--text-primary);
  --scalar-color-2: var(--text-secondary);
  --scalar-color-3: var(--text-muted);
  --scalar-color-accent: var(--accent);
  --scalar-border-color: var(--border);
  --scalar-button-1: var(--accent);
  --scalar-button-1-color: #fff;
}

:global(html.dark) .api-docs-page :deep(.scalar-app) {
  --scalar-button-1-color: var(--surface-0);
}
</style>
