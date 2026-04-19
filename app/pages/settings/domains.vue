<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
        Допустимые домены
      </h1>
      <p class="text-sm text-[color:var(--text-secondary)] mt-0.5">
        Управление белым списком email-доменов для авторизации
      </p>
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
        <h2 class="font-medium text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)]">
          Добавить домен
        </h2>
      </template>

      <form
        class="flex gap-3"
        @submit.prevent="handleAdd"
      >
        <UFormField
          class="flex-1"
        >
          <UInput
            v-model="newDomain"
            placeholder="example.com"
            icon="i-lucide-globe"
            :disabled="adding"
            :aria-invalid="Boolean(domainError)"
            :aria-describedby="domainError ? domainErrorId : undefined"
            @blur="validateDomain"
          />
          <p
            v-if="domainError"
            :id="domainErrorId"
            class="mt-1 text-sm text-[color:var(--ui-error)]"
          >
            {{ domainError }}
          </p>
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
        <h2 class="font-medium text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)]">
          Список доменов
          <span class="ml-2 text-sm font-normal text-[color:var(--text-muted)]">({{ domains.length }})</span>
        </h2>
      </template>

      <div
        v-if="loading"
        class="py-8 flex justify-center"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="size-6 animate-spin text-[color:var(--text-muted)]"
        />
      </div>

      <div
        v-else-if="domains.length === 0"
        class="py-8 text-center text-[color:var(--text-muted)]"
      >
        <UIcon
          name="i-lucide-globe"
          class="size-10 mx-auto mb-2 text-[color:var(--text-secondary)]"
        />
        <p>Домены не добавлены</p>
        <p class="text-sm text-[color:var(--text-muted)] mt-1">
          Все email-домены разрешены для входа
        </p>
      </div>

      <ul
        v-else
        class="divide-y divide-[color:var(--border)] dark:divide-[color:var(--border)]"
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
            <span class="font-medium text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)]">{{ d.domain }}</span>
            <span class="text-xs text-[color:var(--text-muted)]">
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
              :aria-label="`Удалить домен ${d.domain}`"
              :title="`Удалить домен ${d.domain}`"
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
import { ref } from 'vue'
import { z } from 'zod'
import { useFormValidation } from '~/composables/useFormValidation'

definePageMeta({
  middleware: () => {
    const { user } = useAuth()
    if (user.value?.role !== 'admin') {
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

const toast = useA11yToast()
const { t } = useI18n()

const loading = ref(true)
const domains = ref<Domain[]>([])
const newDomain = ref('')
const adding = ref(false)
const confirmOpen = ref(false)
const deletingDomain = ref<Domain | null>(null)
const addDomainSchema = z.object({
  domain: z.string()
    .trim()
    .min(1, 'forms.errors.required')
    .regex(/^[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)+$/i, 'Некорректный формат домена (пример: company.com)'),
})
const { errors, touched, validate, validateField, setServerErrors, reset } = useFormValidation(addDomainSchema)
const addError = ref('')
const domainErrorId = 'add-domain-error'
const domainError = computed(() => addError.value || (touched.value.domain ? translateError(errors.value.domain) : ''))

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
  const domain = newDomain.value.trim().toLowerCase()
  addError.value = ''
  if (!validate({ domain })) return

  adding.value = true
  try {
    const res = await $fetch<{ data: Domain }>('/api/admin/domains', {
      method: 'POST',
      body: { domain, isActive: true },
    })
    domains.value.unshift(res.data)
    newDomain.value = ''
    reset()
    toast.add({ title: `Домен «${domain}» добавлен`, color: 'success' })
  }
  catch (error: unknown) {
    const err = error as {
      statusCode?: number
      data?: { message?: string, fieldErrors?: Record<string, string> }
    }
    const statusCode = err.statusCode
    const data = err.data
    const fieldErrors = data?.fieldErrors
    const domainFieldError = fieldErrors?.domain

    if (statusCode === 422 && fieldErrors) {
      setServerErrors(fieldErrors)
      if (domainFieldError) {
        addError.value = domainFieldError.startsWith('forms.')
          ? t(domainFieldError)
          : domainFieldError
      }
    }
    if (!addError.value) {
      addError.value = data?.message || 'Ошибка добавления домена'
      setServerErrors({ domain: addError.value })
    }
  }
  finally {
    adding.value = false
  }
}

function validateDomain() {
  addError.value = ''
  validateField('domain', newDomain.value.trim().toLowerCase())
}

function translateError(message?: string) {
  if (!message) return ''
  return message.startsWith('forms.') ? t(message) : message
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
