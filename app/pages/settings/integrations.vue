<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
        {{ $t('settings.tabs.integrations') }}
      </h1>
      <p class="mt-1 text-sm text-[color:var(--text-secondary)]">
        {{ $t('settings.integrations.subtitle') }}
      </p>
    </div>

    <!-- API Keys -->
    <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-key"
              class="size-4 text-[color:var(--text-muted)]"
            />
            <h2 class="font-medium text-[color:var(--text-primary)]">
              {{ $t('settings.integrations.apiKeys.label') }}
            </h2>
          </div>
          <UButton
            icon="i-lucide-plus"
            size="sm"
            variant="outline"
            :label="$t('settings.integrations.apiKeys.create')"
            @click="createKeyOpen = true"
          />
        </div>
      </template>

      <!-- Loading -->
      <div
        v-if="loading"
        class="space-y-3"
      >
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-14 w-full rounded-lg"
        />
      </div>

      <!-- Empty -->
      <div
        v-else-if="keys.length === 0"
        class="py-8 text-center text-[color:var(--text-secondary)]"
      >
        <UIcon
          name="i-lucide-key"
          class="mx-auto mb-2 size-10 text-[color:var(--text-muted)]/40"
        />
        <p class="text-sm">
          {{ $t('settings.integrations.apiKeys.empty') }}
        </p>
      </div>

      <!-- List -->
      <ul
        v-else
        class="divide-y divide-[color:var(--surface-2)]"
      >
        <li
          v-for="key in keys"
          :key="key.id"
          class="flex items-center justify-between py-3 gap-4"
        >
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
          <UButton
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            size="xs"
            :loading="deletingId === key.id"
            @click="handleDeleteKey(key.id)"
          />
        </li>
      </ul>
    </UCard>

    <!-- Webhooks placeholder -->
    <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-webhook"
            class="size-4 text-[color:var(--text-muted)]"
          />
          <h2 class="font-medium text-[color:var(--text-primary)]">
            Webhooks
          </h2>
        </div>
      </template>
      <p class="text-sm text-[color:var(--text-secondary)]">
        {{ $t('settings.integrations.webhooks.comingSoon') }}
      </p>
    </UCard>

    <!-- Create key modal -->
    <UModal
      v-model:open="createKeyOpen"
      :title="$t('settings.integrations.apiKeys.create')"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField
            :label="$t('settings.integrations.apiKeys.nameLabel')"
            :error="createError"
          >
            <UInput
              v-model="newKeyName"
              :placeholder="$t('settings.integrations.apiKeys.namePlaceholder')"
              autofocus
            />
          </UFormField>

          <div
            v-if="createdKey"
            class="rounded-lg bg-[color:var(--surface-2)] p-3"
          >
            <p class="mb-1 text-xs font-medium text-[color:var(--text-secondary)]">
              {{ $t('settings.integrations.apiKeys.copyHint') }}
            </p>
            <div class="flex items-center gap-2">
              <code class="flex-1 truncate text-xs font-mono text-[color:var(--text-primary)]">{{ createdKey }}</code>
              <UButton
                icon="i-lucide-copy"
                size="xs"
                variant="ghost"
                @click="copyKey"
              />
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            :label="$t('common.cancel')"
            variant="outline"
            color="neutral"
            @click="closeCreateModal"
          />
          <UButton
            v-if="!createdKey"
            :label="$t('settings.integrations.apiKeys.create')"
            :loading="creating"
            icon="i-lucide-plus"
            @click="handleCreateKey"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

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
  createdAt: string
}

const toast = useToast()
const { t } = useI18n()

const loading = ref(true)
const keys = ref<ApiKey[]>([])
const deletingId = ref<string | null>(null)
const createKeyOpen = ref(false)
const creating = ref(false)
const newKeyName = ref('')
const createError = ref('')
const createdKey = ref<string | null>(null)

async function fetchKeys() {
  loading.value = true
  try {
    const res = await $fetch<{ data: ApiKey[] }>('/api/integrations/api-keys')
    keys.value = res.data
  }
  catch {
    toast.add({ title: t('forms.errors.serverGeneric'), color: 'error' })
  }
  finally {
    loading.value = false
  }
}

async function handleCreateKey() {
  createError.value = ''
  if (!newKeyName.value.trim()) {
    createError.value = t('forms.errors.required')
    return
  }
  creating.value = true
  try {
    const res = await $fetch<{ data: { key: string } & ApiKey }>('/api/integrations/api-keys', {
      method: 'POST',
      body: { name: newKeyName.value.trim() },
    })
    createdKey.value = res.data.key
    keys.value.unshift({ id: res.data.id, name: res.data.name, prefix: res.data.prefix, createdAt: res.data.createdAt })
  }
  catch {
    createError.value = t('forms.errors.serverGeneric')
  }
  finally {
    creating.value = false
  }
}

async function handleDeleteKey(id: string) {
  deletingId.value = id
  try {
    await $fetch(`/api/integrations/api-keys/${id}`, { method: 'DELETE' })
    keys.value = keys.value.filter(k => k.id !== id)
    toast.add({ title: t('settings.integrations.apiKeys.deleted'), color: 'success' })
  }
  catch {
    toast.add({ title: t('forms.errors.serverGeneric'), color: 'error' })
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
  createError.value = ''
  createdKey.value = null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(fetchKeys)
</script>
