<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
        {{ $t('pages.destinationDomains.title') }}
      </h1>
      <p class="text-sm text-[color:var(--text-secondary)] mt-0.5">
        {{ $t('pages.destinationDomains.subtitle') }}
      </p>
    </div>

    <Message
      class="mb-6"
      severity="warn"
      variant="simple"
    >
      <div class="flex items-start gap-2">
        <Icon
          name="i-lucide-shield-alert"
          class="mt-0.5 size-4"
        />
        <div>
          <p class="font-medium">
            {{ $t('pages.destinationDomains.accessMode.title') }}
          </p>
          <p class="text-sm">
            {{ domains.length === 0
              ? $t('pages.destinationDomains.accessMode.openDescription')
              : $t('pages.destinationDomains.accessMode.whitelistDescription', { total: domains.length }) }}
          </p>
        </div>
      </div>
    </Message>

    <section class="mb-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
      <h2 class="mb-3 font-medium text-[color:var(--text-primary)]">
        {{ $t('pages.destinationDomains.addTitle') }}
      </h2>

      <form class="flex gap-3" @submit.prevent="handleAdd">
        <div class="flex-1">
          <InputText
            v-model="newDomain"
            placeholder="example.com"
            class="w-full"
            :disabled="adding"
            :aria-invalid="Boolean(domainError)"
            :aria-describedby="domainError ? domainErrorId : undefined"
            @blur="validateDomain"
          />
          <p v-if="domainError" :id="domainErrorId" role="alert" aria-live="polite" class="mt-1 text-sm text-[color:var(--ui-error)]">
            {{ domainError }}
          </p>
        </div>
        <Button type="submit" :loading="adding" :disabled="!newDomain.trim()">
          <template #icon>
            <Icon name="i-lucide-plus" />
          </template>
          {{ $t('forms.actions.add') }}
        </Button>
      </form>
    </section>

    <section class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
      <h2 class="mb-3 font-medium text-[color:var(--text-primary)]">
        {{ $t('pages.destinationDomains.listTitle') }}
        <span class="ml-2 text-sm font-normal text-[color:var(--text-muted)]">({{ domains.length }})</span>
      </h2>

      <div v-if="loading" class="py-8 flex justify-center">
        <Icon name="i-lucide-loader-2" class="size-6 animate-spin text-[color:var(--text-muted)]" />
      </div>

      <div v-else-if="domains.length === 0" class="py-8 text-center text-[color:var(--text-muted)]">
        <Icon name="i-lucide-shield-alert" class="size-10 mx-auto mb-2 text-[color:var(--text-secondary)]" />
        <p>{{ $t('pages.destinationDomains.empty.title') }}</p>
        <p class="text-sm text-[color:var(--text-muted)] mt-1">
          {{ $t('pages.destinationDomains.empty.description') }}
        </p>
      </div>

      <ul v-else class="divide-y divide-[color:var(--border)]">
        <li v-for="d in domains" :key="d.id" class="flex items-center justify-between py-3">
          <div class="flex items-center gap-3">
            <span class="font-medium text-[color:var(--text-primary)]">{{ d.domain }}</span>
            <span class="text-xs text-[color:var(--text-muted)]">{{ formatDate(d.createdAt) }}</span>
          </div>
          <Button
            text
            severity="danger"
            size="small"
            :aria-label="$t('pages.destinationDomains.actions.deleteDomain', { domain: d.domain })"
            @click="handleDelete(d)"
          >
            <template #icon>
              <Icon name="i-lucide-trash-2" />
            </template>
          </Button>
        </li>
      </ul>
    </section>

    <SharedConfirmDialog
      v-model:open="confirmOpen"
      :title="$t('pages.destinationDomains.delete.title')"
      :description="t('pages.destinationDomains.delete.description', { domain: deletingDomain?.domain })"
      :confirm-label="$t('forms.actions.delete')"
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
  middleware: 'admin-only',
})

interface DestinationDomain {
  id: string
  domain: string
  createdAt: string
}

const toast = useA11yToast()
const { t, locale } = useI18n()
const loading = ref(true)
const domains = ref<DestinationDomain[]>([])
const newDomain = ref('')
const adding = ref(false)
const confirmOpen = ref(false)
const deletingDomain = ref<DestinationDomain | null>(null)

const schema = z.object({
  domain: z.string()
    .trim()
    .min(1, 'forms.errors.required')
    .regex(/^[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)+$/i, 'forms.errors.domain'),
})

const { errors, touched, validate, validateField, setServerErrors, reset } = useFormValidation(schema)
const addError = ref('')
const domainErrorId = 'destination-domain-error'
const domainError = computed(() => addError.value || (touched.value.domain ? translateError(errors.value.domain) : ''))

async function fetchDomains() {
  loading.value = true
  try {
    const res = await $fetch<{ data: DestinationDomain[] }>('/api/admin/destination-domains')
    domains.value = res.data
  }
  catch {
    toast.add({ title: t('pages.destinationDomains.toasts.loadError'), color: 'error' })
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
    const res = await $fetch<{ data: DestinationDomain }>('/api/admin/destination-domains', {
      method: 'POST',
      body: { domain },
    })
    domains.value.unshift(res.data)
    newDomain.value = ''
    reset()
    toast.add({ title: t('pages.destinationDomains.toasts.added', { domain }), color: 'success' })
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, data?: { message?: string, fieldErrors?: Record<string, string> } }
    const fieldErrors = err.data?.fieldErrors
    const domainFieldError = fieldErrors?.domain

    if (err.statusCode === 422 && fieldErrors) {
      setServerErrors(fieldErrors)
      if (domainFieldError) {
        addError.value = domainFieldError.startsWith('forms.') ? t(domainFieldError) : domainFieldError
      }
    }

    if (!addError.value) {
      addError.value = err.data?.message || t('pages.destinationDomains.toasts.addError')
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

function handleDelete(domain: DestinationDomain) {
  deletingDomain.value = domain
  confirmOpen.value = true
}

async function confirmDelete() {
  if (!deletingDomain.value) return
  try {
    await $fetch(`/api/admin/destination-domains/${deletingDomain.value.id}`, { method: 'DELETE' })
    domains.value = domains.value.filter(d => d.id !== deletingDomain.value!.id)
    toast.add({ title: t('pages.destinationDomains.toasts.deleted', { domain: deletingDomain.value.domain }), color: 'success' })
  }
  catch {
    toast.add({ title: t('pages.destinationDomains.toasts.deleteError'), color: 'error' })
  }
  finally {
    deletingDomain.value = null
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(locale.value === 'ru' ? 'ru-RU' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

void (async () => {
  await fetchDomains()
})()
</script>
