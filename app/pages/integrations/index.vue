<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
        {{ $t('integrationsPage.title') }}
      </h1>
      <p class="mt-1 text-sm text-[color:var(--text-secondary)]">
        {{ $t('integrationsPage.subtitle') }}
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <section class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
        <div class="mb-3 flex items-center gap-2">
          <Icon
            name="i-lucide-key"
            class="size-4 text-[color:var(--text-muted)]"
          />
          <h2 class="font-medium text-[color:var(--text-primary)]">
            {{ $t('integrationsPage.links.apiKeys.title') }}
          </h2>
        </div>
        <p class="text-sm text-[color:var(--text-secondary)]">
          {{ $t('integrationsPage.links.apiKeys.description') }}
        </p>

        <Button
          outlined
          severity="secondary"
          class="mt-4"
          @click="goTo('/settings/integrations')"
        >
          {{ $t('integrationsPage.links.apiKeys.action') }}
        </Button>
      </section>

      <section class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
        <div class="mb-3 flex items-center gap-2">
          <Icon
            name="i-lucide-plug-zap"
            class="size-4 text-[color:var(--text-muted)]"
          />
          <h2 class="font-medium text-[color:var(--text-primary)]">
            {{ $t('integrationsPage.links.mcp.title') }}
          </h2>
        </div>

        <p class="text-sm text-[color:var(--text-secondary)]">
          {{ $t('integrationsPage.links.mcp.description') }}
        </p>

        <Button
          class="mt-4"
          @click="goTo('/integrations/mcp-setup')"
        >
          <template #icon>
            <Icon name="i-lucide-arrow-right" />
          </template>
          {{ $t('integrationsPage.links.mcp.action') }}
        </Button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
function goTo(path: string) {
  navigateTo(path)
}
</script>
