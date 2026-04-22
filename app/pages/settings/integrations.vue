<template>
  <div class="space-y-6">
    <div>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
            {{ $t('settings.tabs.integrations') }}
          </h1>
          <p class="mt-1 text-sm text-[color:var(--text-secondary)]">
            {{ $t('settings.integrations.subtitle') }}
          </p>
        </div>

        <Button
          outlined
          severity="secondary"
          @click="navigateTo('/integrations/mcp-setup')"
        >
          <template #icon>
            <Icon name="i-lucide-bot" />
          </template>
          {{ $t('settings.integrations.openMcpSetup') }}
        </Button>
      </div>
    </div>

    <section class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon name="i-lucide-key" class="size-4 text-[color:var(--text-muted)]" />
          <h2 class="font-medium text-[color:var(--text-primary)]">
            {{ $t('settings.integrations.apiKeys.label') }}
          </h2>
        </div>
        <Button outlined size="small" @click="createKeyOpen = true">
          <template #icon>
            <Icon name="i-lucide-plus" />
          </template>
          {{ $t('settings.integrations.apiKeys.create') }}
        </Button>
      </div>

      <div v-if="loading" class="space-y-3">
        <Skeleton v-for="i in 3" :key="i" class="h-14 w-full rounded-lg" />
      </div>

      <div v-else-if="keys.length === 0" class="py-8 text-center text-[color:var(--text-secondary)]">
        <Icon name="i-lucide-key" class="mx-auto mb-2 size-10 text-[color:var(--text-muted)]/40" />
        <p class="text-sm">
          {{ $t('settings.integrations.apiKeys.empty') }}
        </p>
      </div>

      <ul v-else class="divide-y divide-[color:var(--surface-2)]">
        <li v-for="key in keys" :key="key.id" class="py-3 space-y-2">
          <div class="flex items-center justify-between gap-4">
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm text-[color:var(--text-primary)] truncate">
                {{ key.name }}
              </p>
              <p class="text-xs text-[color:var(--text-muted)] truncate font-mono">
                {{ key.prefix }}••••••••
              </p>
            </div>
            <span class="hidden sm:block text-xs text-[color:var(--text-muted)] whitespace-nowrap">
              {{ formatDate(key.createdAt) }}
            </span>
            <Button
              text
              severity="danger"
              size="small"
              :aria-label="`Удалить ключ ${key.name}`"
              :title="`Удалить ключ ${key.name}`"
              :loading="deletingId === key.id"
              @click="handleDeleteKey(key.id)"
            >
              <template #icon>
                <Icon name="i-lucide-trash-2" />
              </template>
            </Button>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-secondary)]">
            <Tag v-for="permission in key.permissions" :key="permission" severity="secondary">
              {{ permissionLabel(permission) }}
            </Tag>
            <Tag v-if="key.allowedIps.length" severity="contrast">
              {{ $t('settings.integrations.apiKeys.allowedIpsList', { count: key.allowedIps.length }) }}
            </Tag>
            <Tag v-else severity="contrast">
              {{ $t('settings.integrations.apiKeys.allowedIpsAny') }}
            </Tag>
            <Tag severity="contrast">
              {{ $t('settings.integrations.apiKeys.expiresAtLabel') }}: {{ formatDateTime(key.expiresAt) }}
            </Tag>
            <Tag v-if="isExpiringSoon(key.expiresAt)" severity="warn">
              {{ $t('settings.integrations.apiKeys.expiringSoon') }}
            </Tag>
          </div>
        </li>
      </ul>
    </section>

    <section class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
      <div class="mb-3 flex items-center gap-2">
        <Icon name="i-lucide-webhook" class="size-4 text-[color:var(--text-muted)]" />
        <h2 class="font-medium text-[color:var(--text-primary)]">
          Webhooks
        </h2>
      </div>
      <p class="text-sm text-[color:var(--text-secondary)]">
        {{ $t('settings.integrations.webhooks.comingSoon') }}
      </p>
    </section>

    <Dialog v-model:visible="createKeyOpen" modal :header="$t('settings.integrations.apiKeys.create')">
      <template #default>
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-[color:var(--text-primary)]">
              {{ $t('settings.integrations.apiKeys.nameLabel') }}
            </label>
            <InputText v-model="newKeyName" class="w-full" :placeholder="$t('settings.integrations.apiKeys.namePlaceholder')" autofocus />
            <p v-if="createError" class="text-sm text-[color:var(--color-error)]">
              {{ createError }}
            </p>
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-[color:var(--text-primary)]">
              {{ $t('settings.integrations.apiKeys.permissionsLabel') }}
            </label>
            <div class="space-y-3">
              <Button size="small" outlined severity="secondary" @click="applyMcpPreset">
                <template #icon>
                  <Icon name="i-lucide-sparkles" />
                </template>
                {{ $t('settings.integrations.apiKeys.mcpPreset') }}
              </Button>

              <div class="grid gap-2">
                <div
                  v-for="option in permissionOptions"
                  :key="option.value"
                  class="flex items-center gap-2"
                >
                  <Checkbox
                    :model-value="newKeyPermissions.includes(option.value)"
                    binary
                    @update:model-value="(checked) => togglePermission(option.value, checked === true)"
                  />
                  <span class="text-sm text-[color:var(--text-primary)]">{{ option.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-[color:var(--text-primary)]">
              {{ $t('settings.integrations.apiKeys.allowedIpsLabel') }}
            </label>
            <Textarea
              v-model="allowedIpsInput"
              :rows="3"
              class="w-full"
              :placeholder="$t('settings.integrations.apiKeys.allowedIpsPlaceholder')"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-[color:var(--text-primary)]">
              {{ $t('settings.integrations.apiKeys.expiresAtLabel') }}
            </label>
            <InputText v-model="expiresAtInput" type="datetime-local" class="w-full" />
          </div>

          <div v-if="createdKey" class="rounded-lg bg-[color:var(--surface-2)] p-3">
            <p class="mb-1 text-xs font-medium text-[color:var(--text-secondary)]">
              {{ $t('settings.integrations.apiKeys.copyHint') }}
            </p>
            <div class="flex items-center gap-2">
              <code class="flex-1 truncate text-xs font-mono text-[color:var(--text-primary)]">{{ createdKey }}</code>
              <Button text size="small" :aria-label="$t('common.copy')" :title="$t('common.copy')" @click="copyKey">
                <template #icon>
                  <Icon name="i-lucide-copy" />
                </template>
              </Button>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <Button outlined severity="secondary" @click="closeCreateModal">
            {{ $t('common.cancel') }}
          </Button>
          <Button
            v-if="!createdKey"
            :loading="creating"
            @click="handleCreateKey"
          >
            <template #icon>
              <Icon name="i-lucide-plus" />
            </template>
            {{ $t('settings.integrations.apiKeys.create') }}
          </Button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { createDialogFocusReturn } from '~/utils/dialog-focus-return'
import { permissionLabel as mapPermissionLabel, type KnownApiPermission } from '~/utils/integrations/permission-label'

definePageMeta({
  middleware: () => {
    const { user } = useAuth()
    if (user.value?.role !== 'admin') {
      return navigateTo('/dashboard')
    }
  },
})

interface ApiKey {
  id: string
  name: string
  prefix: string
  permissions: string[]
  allowedIps: string[]
  createdAt: string
  expiresAt: string
}

const toast = useA11yToast()
const { t } = useI18n()
const { getSecurityMessage } = useSecurityError()

const loading = ref(true)
const keys = ref<ApiKey[]>([])
const deletingId = ref<string | null>(null)
const createKeyOpen = ref(false)
const focusReturn = createDialogFocusReturn()
const creating = ref(false)
const newKeyName = ref('')
const createError = ref('')
const createdKey = ref<string | null>(null)
const newKeyPermissions = ref<KnownApiPermission[]>(['qr:read'])
const allowedIpsInput = ref('')
const expiresAtInput = ref('')

const permissionOptions = computed(() => [
  { value: 'qr:read' as const, label: t('settings.integrations.apiKeys.permissions.qrRead') },
  { value: 'qr:write' as const, label: t('settings.integrations.apiKeys.permissions.qrWrite') },
  { value: 'qr:stats:read' as const, label: t('settings.integrations.apiKeys.permissions.qrStatsRead') },
  { value: 'mcp:access' as const, label: t('settings.integrations.apiKeys.permissions.mcpAccess') },
])

watch(createKeyOpen, (open) => {
  if (open) {
    focusReturn.save()
    if (!expiresAtInput.value) {
      const date = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      expiresAtInput.value = toDateTimeLocal(date)
    }
  }
  else focusReturn.restore()
})

async function fetchKeys() {
  loading.value = true
  try {
    const res = await $fetch<{ data: ApiKey[] }>('/api/integrations/api-keys')
    keys.value = res.data
  }
  catch (error: unknown) {
    toast.add({ title: getSecurityMessage(error, t('forms.errors.serverGeneric')), color: 'error' })
  }
  finally {
    loading.value = false
  }
}

function normalizeAllowedIps(rawInput: string) {
  return rawInput
    .split(/[,\n]/g)
    .map(v => v.trim())
    .filter(Boolean)
}

async function handleCreateKey() {
  createError.value = ''

  if (!newKeyName.value.trim()) {
    createError.value = t('forms.errors.required')
    return
  }

  if (newKeyPermissions.value.length === 0) {
    createError.value = t('settings.integrations.apiKeys.errors.permissionsRequired')
    return
  }

  if (!expiresAtInput.value) {
    createError.value = t('settings.integrations.apiKeys.errors.expiresAtRequired')
    return
  }

  const expiresAt = new Date(expiresAtInput.value)
  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
    createError.value = t('settings.integrations.apiKeys.errors.expiresAtFuture')
    return
  }

  creating.value = true
  try {
    const res = await $fetch<{ data: { key: string } & ApiKey }>('/api/integrations/api-keys', {
      method: 'POST',
      body: {
        name: newKeyName.value.trim(),
        permissions: newKeyPermissions.value,
        allowedIps: normalizeAllowedIps(allowedIpsInput.value),
        expiresAt: expiresAt.toISOString(),
      },
    })
    createdKey.value = res.data.key
    keys.value.unshift(res.data)
  }
  catch (error: unknown) {
    createError.value = getSecurityMessage(error, t('forms.errors.serverGeneric'))
  }
  finally {
    creating.value = false
  }
}

function togglePermission(permission: KnownApiPermission, enabled: boolean) {
  if (enabled && !newKeyPermissions.value.includes(permission)) {
    newKeyPermissions.value = [...newKeyPermissions.value, permission]
  }
  if (!enabled) {
    newKeyPermissions.value = newKeyPermissions.value.filter(item => item !== permission)
  }
}

function applyMcpPreset() {
  newKeyPermissions.value = ['mcp:access', 'qr:read']
}

function permissionLabel(permission: string) {
  return mapPermissionLabel(permission, t)
}

async function handleDeleteKey(id: string) {
  deletingId.value = id
  try {
    await $fetch(`/api/integrations/api-keys/${id}`, { method: 'DELETE' })
    keys.value = keys.value.filter(k => k.id !== id)
    toast.add({ title: t('settings.integrations.apiKeys.deleted'), color: 'success' })
  }
  catch (error: unknown) {
    toast.add({ title: getSecurityMessage(error, t('forms.errors.serverGeneric')), color: 'error' })
  }
  finally {
    deletingId.value = null
  }
}

async function copyKey() {
  if (!createdKey.value) return
  await navigator.clipboard.writeText(createdKey.value)
  toast.add({ title: t('common.copied'), color: 'success' })
}

function closeCreateModal() {
  createKeyOpen.value = false
  newKeyName.value = ''
  // Keep the default scope minimal after reset: only `qr:read` is preselected.
  // `mcp:access` must be enabled manually unless product requirements change.
  newKeyPermissions.value = ['qr:read']
  allowedIpsInput.value = ''
  expiresAtInput.value = ''
  createError.value = ''
  createdKey.value = null
}

function isExpiringSoon(expiresAt: string) {
  const expiration = new Date(expiresAt).getTime()
  return expiration - Date.now() <= 7 * 24 * 60 * 60 * 1000
}

function toDateTimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(fetchKeys)
</script>
