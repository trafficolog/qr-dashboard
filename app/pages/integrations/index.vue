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
      <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-key" class="size-4 text-[color:var(--text-muted)]" />
            <h2 class="font-medium text-[color:var(--text-primary)]">
              {{ $t('integrationsPage.links.apiKeys.title') }}
            </h2>
          </div>
        </template>

        <p class="text-sm text-[color:var(--text-secondary)]">
          {{ $t('integrationsPage.links.apiKeys.description') }}
        </p>

        <template #footer>
          <UButton
            :to="'/settings/integrations'"
            color="neutral"
            variant="outline"
            :label="$t('integrationsPage.links.apiKeys.action')"
          />
        </template>
      </UCard>

      <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-plug-zap" class="size-4 text-[color:var(--text-muted)]" />
            <h2 class="font-medium text-[color:var(--text-primary)]">
              {{ $t('integrationsPage.links.mcp.title') }}
            </h2>
          </div>
        </template>

        <p class="text-sm text-[color:var(--text-secondary)]">
          {{ $t('integrationsPage.links.mcp.description') }}
        </p>

        <template #footer>
          <UButton
            :to="'/integrations/mcp-setup'"
            icon="i-lucide-arrow-right"
            :label="$t('integrationsPage.links.mcp.action')"
          />
        </template>
      </UCard>
    </div>
  </div>
</template>
