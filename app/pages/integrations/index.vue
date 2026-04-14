<template>
  <div class="max-w-3xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
          Интеграции
        </h1>
        <p class="mt-0.5 text-sm text-[color:var(--text-secondary)]">
          API-ключи для доступа к SPLAT QR API v1
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        label="Создать ключ"
        @click="createOpen = true"
      />
    </div>

    <!-- Info card -->
    <UAlert
      icon="i-lucide-info"
      color="info"
      variant="soft"
      class="mb-6"
    >
      <template #description>
        Используйте API-ключи для интеграции с внешними системами. Ключ показывается
        <strong>один раз</strong> при создании. Для документации API перейдите на
        <NuxtLink
          to="/api-docs"
          class="underline font-medium"
        >
          страницу документации
        </NuxtLink>.
      </template>
    </UAlert>

    <!-- Keys list -->
    <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-medium text-[color:var(--text-primary)]">
            API-ключи
          </h2>
          <UBadge
            color="neutral"
            variant="subtle"
          >
            {{ keys.length }}
          </UBadge>
        </div>
      </template>

      <div
        v-if="loading"
        class="space-y-3 py-2"
      >
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-14 w-full rounded-lg"
        />
      </div>

      <div
        v-else-if="keys.length === 0"
        class="py-10 text-center text-[color:var(--text-secondary)]"
      >
        <UIcon
          name="i-lucide-key"
          class="mx-auto mb-2 size-10 text-[color:var(--text-muted)]/50"
        />
        <p>Нет API-ключей</p>
        <p class="mt-1 text-sm text-[color:var(--text-muted)]">
          Создайте ключ для подключения внешних приложений
        </p>
      </div>

      <ul
        v-else
        class="divide-y divide-[color:var(--surface-2)]"
      >
        <li
          v-for="key in keys"
          :key="key.id"
          class="flex items-center gap-4 py-3"
        >
          <div class="flex items-center justify-center size-9 rounded-lg bg-[color:var(--surface-2)]">
            <UIcon
              name="i-lucide-key"
              class="size-4 text-[color:var(--text-muted)]"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm text-[color:var(--text-primary)]">
              {{ key.name }}
            </p>
            <p class="text-xs text-[color:var(--text-muted)] font-mono">
              {{ key.keyPrefix }}••••••••••••••••
              <span
                v-if="key.lastUsedAt"
                class="ml-2 not-italic font-sans"
              >
                · использован {{ formatDate(key.lastUsedAt) }}
              </span>
              <span
                v-else
                class="ml-2 not-italic font-sans"
              >
                · не использован
              </span>
            </p>
          </div>
          <UBadge
            v-if="key.expiresAt"
            :color="isExpired(key.expiresAt) ? 'error' : 'warning'"
            variant="soft"
            size="xs"
          >
            {{ isExpired(key.expiresAt) ? 'Истёк' : `до ${formatDate(key.expiresAt)}` }}
          </UBadge>
          <span class="hidden sm:block text-xs text-[color:var(--text-muted)] whitespace-nowrap">
            {{ formatDate(key.createdAt) }}
          </span>
          <UButton
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            size="xs"
            :loading="deletingId === key.id"
            @click="handleDelete(key)"
          />
        </li>
      </ul>
    </UCard>

    <!-- Create modal -->
    <UModal
      v-model:open="createOpen"
      title="Создать API-ключ"
    >
      <template #body>
        <form
          class="space-y-4"
          @submit.prevent="handleCreate"
        >
          <UFormField
            label="Название"
            :error="createError"
            required
          >
            <UInput
              v-model="createForm.name"
              placeholder="Мобильное приложение"
              icon="i-lucide-tag"
              autofocus
            />
          </UFormField>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            label="Отмена"
            variant="outline"
            color="neutral"
            @click="createOpen = false"
          />
          <UButton
            label="Создать"
            icon="i-lucide-plus"
            :loading="creating"
            @click="handleCreate"
          />
        </div>
      </template>
    </UModal>

    <!-- New key reveal modal -->
    <UModal
      v-model:open="revealOpen"
      title="API-ключ создан"
      :dismissable="false"
    >
      <template #body>
        <div class="space-y-4">
          <UAlert
            icon="i-lucide-alert-triangle"
            color="warning"
            variant="soft"
            description="Сохраните ключ прямо сейчас. Он больше не будет показан."
          />
          <div class="flex items-center gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-3">
            <code class="flex-1 text-sm font-mono break-all text-[color:var(--text-primary)]">
              {{ newKey }}
            </code>
            <UButton
              :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
              variant="ghost"
              size="xs"
              @click="copyKey"
            />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end">
          <UButton
            label="Я сохранил ключ"
            icon="i-lucide-check"
            @click="revealOpen = false; newKey = ''"
          />
        </div>
      </template>
    </UModal>

    <!-- Confirm delete -->
    <SharedConfirmDialog
      v-model:open="deleteOpen"
      title="Удалить API-ключ?"
      :message="deletingKey
        ? `Ключ «${deletingKey.name}» будет отозван. Все приложения, использующие его, потеряют доступ.`
        : ''"
      confirm-label="Удалить"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

const toast = useToast()

const loading = ref(true)
const keys = ref<ApiKey[]>([])

const createOpen = ref(false)
const creating = ref(false)
const createForm = ref({ name: '' })
const createError = ref('')

const revealOpen = ref(false)
const newKey = ref('')
const copied = ref(false)

const deleteOpen = ref(false)
const deletingKey = ref<ApiKey | null>(null)
const deletingId = ref<string | null>(null)

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function isExpired(iso: string) {
  return new Date(iso) < new Date()
}

async function fetchKeys() {
  loading.value = true
  try {
    const res = await $fetch<{ data: ApiKey[] }>('/api/integrations/api-keys')
    keys.value = res.data
  }
  catch {
    toast.add({ title: 'Ошибка загрузки ключей', color: 'error' })
  }
  finally {
    loading.value = false
  }
}

async function handleCreate() {
  createError.value = ''
  if (!createForm.value.name.trim()) {
    createError.value = 'Название обязательно'
    return
  }

  creating.value = true
  try {
    const res = await $fetch<{ data: ApiKey & { key: string } }>('/api/integrations/api-keys', {
      method: 'POST',
      body: { name: createForm.value.name },
    })
    const { key, ...record } = res.data
    keys.value.unshift(record)
    newKey.value = key
    createOpen.value = false
    createForm.value.name = ''
    revealOpen.value = true
    toast.add({ title: 'API-ключ создан', color: 'success' })
  }
  catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    createError.value = e?.data?.message ?? 'Ошибка создания ключа'
  }
  finally {
    creating.value = false
  }
}

async function copyKey() {
  await navigator.clipboard.writeText(newKey.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function handleDelete(key: ApiKey) {
  deletingKey.value = key
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deletingKey.value) return
  deletingId.value = deletingKey.value.id
  try {
    await $fetch(`/api/integrations/api-keys/${deletingKey.value.id}`, { method: 'DELETE' })
    keys.value = keys.value.filter(k => k.id !== deletingKey.value!.id)
    toast.add({ title: 'API-ключ удалён', color: 'success' })
  }
  catch {
    toast.add({ title: 'Ошибка удаления ключа', color: 'error' })
  }
  finally {
    deletingId.value = null
    deletingKey.value = null
  }
}

onMounted(fetchKeys)
</script>
