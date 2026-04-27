<template>
  <div class="api-docs-page">
    <ClientOnly>
      <ApiDocsScalarReference :configuration="scalarConfig" />
      <template #fallback>
        <div class="api-docs-loading">
          Загрузка API-документации...
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const scalarConfig = {
  spec: {
    url: '/api/openapi.json',
  },
  authentication: {
    preferredSecurityScheme: 'ApiKeyAuth',
  },
  hideModels: true,
  operationTitleSource: 'summary',
  showDeveloperTools: 'localhost',
  showToolbar: 'localhost',
  telemetry: false,
  layout: 'classic',
  theme: 'none',
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
  --scalar-background-accent: color-mix(in srgb, var(--accent) 10%, transparent);
  --scalar-sidebar-background-1: var(--surface-0);
  --scalar-sidebar-item-active-background: color-mix(in srgb, var(--accent) 9%, transparent);
  --scalar-sidebar-item-hover-background: var(--surface-2);
  --scalar-sidebar-color-active: var(--accent);
  --scalar-sidebar-indent-border-active: color-mix(in srgb, var(--accent) 45%, transparent);
  --scalar-sidebar-search-background: var(--surface-0);
  --scalar-sidebar-search-border-color: var(--border);
}

:global(html.dark) .api-docs-page :deep(.scalar-app),
:global(html.app-dark) .api-docs-page :deep(.scalar-app) {
  --scalar-button-1-color: var(--surface-0);
}

.api-docs-loading {
  min-height: 20rem;
  display: grid;
  place-items: center;
  color: var(--text-muted);
}
</style>
