<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <UButton
        icon="i-lucide-arrow-left"
        variant="ghost"
        color="neutral"
        to="/settings"
      />
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Допустимые домены
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Управление белым списком email-доменов для авторизации
        </p>
      </div>
    </div>

    <!-- Info banner -->
    <UAlert
      class="mb-6"
      icon="i-lucide-info"
      color="primary"
      variant="soft"
      title="Режим доступа"
      :description="domains.length === 0
        ? 'Список пуст — разрешены все домены (открытый режим). Добавьте домен для включения режима белого списка.'
        : `Режим белого списка активен. Только ${activeDomains} из ${domains.length} доменов разрешены.`"
    />

    <!-- Add domain form -->
    <UCard class="mb-6">
      <template #header>
        <h2 class="font-medium text-gray-900 dark:text-white">
          Добавить домен
        </h2>
      </template>

      <form
        class="flex gap-3"
        @submit.prevent="handleAdd"
      >
        <UFormField
          class="flex-1"
          :error="addError"
        >
          <UInput
            v-model="newDomain"
            placeholder="example.com"
            icon="i-lucide-globe"
            :disabled="adding"
          />
        </UFormField>
        <UButton
          type="submit"
          icon="i-lucide-plus"
          :loading="adding"
          :disabled="!newDomain.trim()"
        >
          Добавить
        </UButton>
      </form>
    </UCard>

    <!-- Domains list -->
    <UCard>
      <template #header>
        <h2 class="font-medium text-gray-900 dark:text-white">
          Список доменов
          <span class="ml-2 text-sm font-normal text-gray-500">({{ domains.length }})</span>
        </h2>
      </template>

      <div
        v-if="loading"
        class="py-8 flex justify-center"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="size-6 animate-spin text-gray-400"
        />
      </div>

      <div
        v-else-if="domains.length === 0"
        class="py-8 text-center text-gray-500"
      >
        <UIcon
          name="i-lucide-globe"
          class="size-10 mx-auto mb-2 text-gray-300"
        />
        <p>Домены не добавлены</p>
        <p class="text-sm text-gray-400 mt-1">
          Все email-домены разрешены для входа
        </p>
      </div>

      <ul
        v-else
        class="divide-y divide-gray-100 dark:divide-gray-800"
      >
        <li
          v-for="d in domains"
          :key="d.id"
          class="flex items-center justify-between py-3"
        >
          <div class="flex items-center gap-3">
            <UBadge
              :color="d.isActive ? 'success' : 'neutral'"
              variant="soft"
              size="sm"
            >
              {{ d.isActive ? 'Активен' : 'Отключён' }}
            </UBadge>
            <span class="font-medium text-gray-900 dark:text-white">{{ d.domain }}</span>
            <span class="text-xs text-gray-400">
              {{ formatDate(d.createdAt) }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <UToggle
              :model-value="d.isActive"
              size="sm"
              @update:model-value="handleToggle(d.id, $event)"
            />
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="sm"
              @click="handleDelete(d)"
            />
          </div>
        </li>
      </ul>
    </UCard>

    <!-- Confirm delete dialog -->
    <SharedConfirmDialog
      v-model:open="confirmOpen"
      title="Удалить домен?"
      :description="`Домен «${deletingDomain?.domain}» будет удалён из белого списка.`"
      confirm-label="Удалить"
      confirm-color="error"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: () => {
    const authStore = useAuthStore()
    if (authStore.user?.role !== 'admin') {
      return navigateTo('/dashboard')
    }
  },
})

interface Domain {
  id: string
  domain: string
  isActive: boolean
  createdAt: string
}

const toast = useToast()

const loading = ref(true)
const domains = ref<Domain[]>([])
const newDomain = ref('')
const addError = ref('')
const adding = ref(false)
const confirmOpen = ref(false)
const deletingDomain = ref<Domain | null>(null)

const activeDomains = computed(() => domains.value.filter(d => d.isActive).length)

async function fetchDomains() {
  loading.value = true
  try {
    const res = await $fetch<{ data: Domain[] }>('/api/admin/domains')
    domains.value = res.data
  }
  catch {
    toast.add({ title: 'Ошибка загрузки доменов', color: 'error' })
  }
  finally {
    loading.value = false
  }
}

async function handleAdd() {
  addError.value = ''
  const domain = newDomain.value.trim().toLowerCase()

  if (!domain) return

  // Basic validation
  if (!/^[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)+$/i.test(domain)) {
    addError.value = 'Некорректный формат домена (пример: company.com)'
    return
  }

  adding.value = true
  try {
    const res = await $fetch<{ data: Domain }>('/api/admin/domains', {
      method: 'POST',
      body: { domain, isActive: true },
    })
    domains.value.unshift(res.data)
    newDomain.value = ''
    toast.add({ title: `Домен «${domain}» добавлен`, color: 'success' })
  }
  catch (error: unknown) {
    const err = error as { data?: { message?: string } }
    addError.value = err?.data?.message || 'Ошибка добавления домена'
  }
  finally {
    adding.value = false
  }
}

async function handleToggle(id: string, isActive: boolean) {
  try {
    const res = await $fetch<{ data: Domain }>(`/api/admin/domains/${id}`, {
      method: 'PATCH',
      body: { isActive },
    })
    const idx = domains.value.findIndex(d => d.id === id)
    if (idx !== -1) domains.value[idx] = res.data
    toast.add({
      title: isActive ? 'Домен включён' : 'Домен отключён',
      color: 'success',
    })
  }
  catch {
    toast.add({ title: 'Ошибка обновления домена', color: 'error' })
  }
}

function handleDelete(domain: Domain) {
  deletingDomain.value = domain
  confirmOpen.value = true
}

async function confirmDelete() {
  if (!deletingDomain.value) return
  try {
    await $fetch(`/api/admin/domains/${deletingDomain.value.id}`, { method: 'DELETE' })
    domains.value = domains.value.filter(d => d.id !== deletingDomain.value!.id)
    toast.add({ title: `Домен «${deletingDomain.value.domain}» удалён`, color: 'success' })
  }
  catch {
    toast.add({ title: 'Ошибка удаления домена', color: 'error' })
  }
  finally {
    deletingDomain.value = null
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Initial load (no top-level await — TS + module "preserve")
void (async () => {
  await fetchDomains()
})()
</script>
