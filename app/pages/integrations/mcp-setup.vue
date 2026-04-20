<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
          {{ $t('integrationsPage.mcpSetup.title') }}
        </h1>
        <p class="mt-1 text-sm text-[color:var(--text-secondary)] max-w-3xl">
          {{ $t('integrationsPage.mcpSetup.subtitle') }}
        </p>
      </div>
      <UButton
        variant="outline"
        color="neutral"
        icon="i-lucide-arrow-left"
        :to="'/integrations'"
        :label="$t('integrationsPage.backToIntegrations')"
      />
    </div>

    <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-link" class="size-4 text-[color:var(--text-muted)]" />
          <h2 class="font-medium text-[color:var(--text-primary)]">
            {{ $t('integrationsPage.mcpSetup.serverUrl.title') }}
          </h2>
        </div>
      </template>

      <div class="space-y-3 text-sm text-[color:var(--text-secondary)]">
        <p>{{ $t('integrationsPage.mcpSetup.serverUrl.description') }}</p>
        <div class="rounded-lg bg-[color:var(--surface-2)] px-4 py-3 font-mono text-[color:var(--text-primary)] break-all">
          {{ serverUrl }}
        </div>
      </div>
    </UCard>

    <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-key-round" class="size-4 text-[color:var(--text-muted)]" />
          <h2 class="font-medium text-[color:var(--text-primary)]">
            {{ $t('integrationsPage.mcpSetup.apiKey.title') }}
          </h2>
        </div>
      </template>

      <ol class="list-decimal space-y-2 pl-5 text-sm text-[color:var(--text-secondary)]">
        <li>{{ $t('integrationsPage.mcpSetup.apiKey.step1') }}</li>
        <li>{{ $t('integrationsPage.mcpSetup.apiKey.step2') }}</li>
        <li>{{ $t('integrationsPage.mcpSetup.apiKey.step3') }}</li>
      </ol>
    </UCard>

    <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-braces" class="size-4 text-[color:var(--text-muted)]" />
          <h2 class="font-medium text-[color:var(--text-primary)]">
            {{ $t('integrationsPage.mcpSetup.examples.title') }}
          </h2>
        </div>
      </template>

      <div class="space-y-6">
        <section v-for="example in configExamples" :key="example.id" class="space-y-2">
          <div class="flex items-center justify-between gap-3">
            <h3 class="font-medium text-[color:var(--text-primary)]">
              {{ example.title }}
            </h3>
            <UButton
              size="xs"
              variant="outline"
              color="neutral"
              icon="i-lucide-copy"
              :label="copiedExampleId === example.id ? $t('common.copied') : $t('common.copy')"
              @click="copyConfig(example.id, example.code)"
            />
          </div>

          <CodeBlock :code="example.code" language="json" />
        </section>
      </div>
    </UCard>

    <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-circle-help" class="size-4 text-[color:var(--text-muted)]" />
          <h2 class="font-medium text-[color:var(--text-primary)]">
            {{ $t('integrationsPage.mcpSetup.troubleshooting.title') }}
          </h2>
        </div>
      </template>

      <div class="space-y-3">
        <div
          v-for="issue in troubleshooting"
          :key="issue.code"
          class="rounded-lg border border-[color:var(--border)] p-4"
        >
          <p class="font-mono text-sm font-semibold text-[color:var(--text-primary)]">
            {{ issue.code }}
          </p>
          <p class="mt-1 text-sm text-[color:var(--text-secondary)]">
            {{ issue.title }}
          </p>
          <p class="mt-1 text-sm text-[color:var(--text-secondary)]">
            {{ issue.solution }}
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { copy: copyToClipboard } = useClipboard()
const runtimeConfig = useRuntimeConfig()

const copiedExampleId = ref<string | null>(null)
const serverUrl = computed(() => {
  const configuredUrl = runtimeConfig.public.mcpServerUrl?.trim()
  if (configuredUrl) {
    return configuredUrl
  }

  const appUrl = (runtimeConfig.public.appUrl || '').replace(/\/+$/, '')
  return `${appUrl}/mcp`
})

const configExamples = computed(() => [
  {
    id: 'claude-desktop',
    title: t('integrationsPage.mcpSetup.examples.claudeDesktop'),
    code: JSON.stringify({
      mcpServers: {
        splatQr: {
          url: serverUrl.value,
          headers: {
            Authorization: 'Bearer YOUR_API_KEY',
          },
        },
      },
    }, null, 2),
  },
  {
    id: 'cursor',
    title: t('integrationsPage.mcpSetup.examples.cursor'),
    code: JSON.stringify({
      mcpServers: {
        splatQr: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-fetch', serverUrl.value],
          env: {
            MCP_AUTH_TOKEN: 'YOUR_API_KEY',
          },
        },
      },
    }, null, 2),
  },
])

const troubleshooting = computed(() => [
  {
    code: '401',
    title: t('integrationsPage.mcpSetup.troubleshooting.status401.title'),
    solution: t('integrationsPage.mcpSetup.troubleshooting.status401.solution'),
  },
  {
    code: '403',
    title: t('integrationsPage.mcpSetup.troubleshooting.status403.title'),
    solution: t('integrationsPage.mcpSetup.troubleshooting.status403.solution'),
  },
  {
    code: '429',
    title: t('integrationsPage.mcpSetup.troubleshooting.status429.title'),
    solution: t('integrationsPage.mcpSetup.troubleshooting.status429.solution'),
  },
])

async function copyConfig(id: string, value: string) {
  await copyToClipboard(value)
  copiedExampleId.value = id
  setTimeout(() => {
    if (copiedExampleId.value === id) {
      copiedExampleId.value = null
    }
  }, 2000)
}
</script>
