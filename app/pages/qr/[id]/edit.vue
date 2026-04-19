<template>
  <div>
    <div v-if="qr">
      <div class="flex items-center justify-between mb-6">
        <div>
          <div class="flex items-center gap-3">
            <UButton
              icon="i-lucide-arrow-left"
              variant="ghost"
              color="neutral"
              size="sm"
              :aria-label="$t('pages.qrEdit.backToQr')"
              :title="$t('pages.qrEdit.backToQr')"
              :to="`/qr/${id}`"
            />
            <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
              {{ $t('pages.qrEdit.title') }}
            </h1>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left: Settings -->
        <div class="lg:col-span-2 space-y-6">
          <!-- URL Section -->
          <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-link"
                  class="size-5 text-[color:var(--accent)]"
                />
                <span class="font-medium">{{ $t('forms.sections.link') }}</span>
              </div>
            </template>

            <div class="space-y-4">
              <UFormField
                :label="$t('forms.labels.destinationUrl')"
                :error="urlError"
                :hint="isStatic ? $t('forms.hints.destinationUrlStaticLocked') : $t('forms.hints.destinationUrl')"
                required
              >
                <UInput
                  v-model="form.destinationUrl"
                  placeholder="https://splat.ru/product"
                  icon="i-lucide-globe"
                  size="lg"
                  :disabled="isStatic"
                  :aria-invalid="!!urlError"
                  :aria-describedby="urlError ? qrEditUrlErrorId : undefined"
                  :aria-required="true"
                  @blur="validateUrl"
                />
                <template #error="{ error }">
                  <p
                    v-if="error"
                    :id="qrEditUrlErrorId"
                    role="alert"
                    aria-live="polite"
                  >
                    {{ error }}
                  </p>
                </template>
              </UFormField>

              <UCollapsible>
                <UButton
                  variant="link"
                  color="neutral"
                  size="sm"
                  icon="i-lucide-tag"
                  :label="$t('forms.labels.utmParams')"
                  class="-ml-2"
                />
                <template #content>
                  <div class="grid grid-cols-2 gap-3 pt-3">
                    <UFormField :label="$t('forms.labels.utmSource')">
                      <UInput
                        v-model="form.utmParams.utm_source"
                        size="sm"
                      />
                    </UFormField>
                    <UFormField :label="$t('forms.labels.utmMedium')">
                      <UInput
                        v-model="form.utmParams.utm_medium"
                        size="sm"
                      />
                    </UFormField>
                    <UFormField :label="$t('forms.labels.utmCampaign')">
                      <UInput
                        v-model="form.utmParams.utm_campaign"
                        size="sm"
                      />
                    </UFormField>
                    <UFormField :label="$t('forms.labels.utmContent')">
                      <UInput
                        v-model="form.utmParams.utm_content"
                        size="sm"
                      />
                    </UFormField>
                  </div>
                </template>
              </UCollapsible>
            </div>
          </UCard>

          <!-- Info Section -->
          <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-info"
                  class="size-5 text-[color:var(--accent)]"
                />
                <span class="font-medium">{{ $t('forms.sections.info') }}</span>
              </div>
            </template>

            <div class="space-y-4">
              <UFormField
                :label="$t('forms.labels.title')"
                :hint="$t('forms.hints.qrTitle')"
                :error="titleError"
                required
              >
                <UInput
                  v-model="form.title"
                  :aria-invalid="!!titleError"
                  :aria-describedby="titleError ? qrEditTitleErrorId : undefined"
                  :aria-required="true"
                  @blur="validateTitle"
                />
                <template #error="{ error }">
                  <p
                    v-if="error"
                    :id="qrEditTitleErrorId"
                    role="alert"
                    aria-live="polite"
                  >
                    {{ error }}
                  </p>
                </template>
              </UFormField>

              <UFormField :label="$t('forms.labels.description')">
                <UTextarea
                  v-model="form.description"
                  :rows="2"
                />
              </UFormField>

              <UFormField :label="$t('forms.labels.folder')">
                <USelect
                  v-model="form.folderId"
                  :items="folderOptions"
                  :placeholder="$t('forms.options.noFolder')"
                />
              </UFormField>

              <UFormField :label="$t('forms.labels.tags')">
                <SharedTagInput
                  v-model="form.tagIds"
                  :available-tags="availableTags"
                  @create-tag="handleCreateTag"
                />
              </UFormField>

              <UFormField :label="$t('forms.labels.status')">
                <USelect
                  v-model="form.status"
                  :items="statusOptions"
                />
              </UFormField>

              <UFormField :label="$t('forms.labels.expiresAt')">
                <UInput
                  v-model="form.expiresAt"
                  type="datetime-local"
                />
              </UFormField>
            </div>
          </UCard>

          <!-- Style Section -->
          <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-palette"
                  class="size-5 text-[color:var(--accent)]"
                />
                <span class="font-medium">{{ $t('forms.sections.style') }}</span>
              </div>
            </template>

            <QrStyleEditor v-model="form.style" />
          </UCard>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            <UButton
              :label="$t('forms.actions.saveChanges')"
              icon="i-lucide-check"
              size="lg"
              :loading="saving"
              @click="handleSave"
            />
            <UButton
              :label="$t('forms.actions.cancel')"
              variant="outline"
              color="neutral"
              size="lg"
              :to="`/qr/${id}`"
            />
          </div>
        </div>

        <!-- Right: Live Preview -->
        <div class="lg:col-span-1">
          <div class="lg:sticky lg:top-24">
            <QrPreview
              :url="form.destinationUrl || 'https://splat.ru'"
              :style="form.style"
              :short-code="qr.shortCode"
              :title="form.title"
              :display-size="280"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div
      v-else
      class="space-y-6"
    >
      <!-- Header skeleton -->
      <div class="flex items-center gap-3">
        <USkeleton class="h-9 w-9 rounded-md" />
        <USkeleton class="h-8 w-64" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
          <!-- URL card skeleton -->
          <USkeleton class="h-52 w-full rounded-lg" />
          <!-- Info card skeleton -->
          <USkeleton class="h-72 w-full rounded-lg" />
          <!-- Style card skeleton -->
          <USkeleton class="h-64 w-full rounded-lg" />

          <div class="flex items-center gap-3">
            <USkeleton class="h-11 w-48 rounded-md" />
            <USkeleton class="h-11 w-24 rounded-md" />
          </div>
        </div>

        <div class="lg:col-span-1">
          <USkeleton class="aspect-square w-full rounded-lg" />
        </div>
      </div>
    </div>

    <SharedUnsavedChangesDialog
      v-model:open="unsaved.showDialog.value"
      @confirm="unsaved.confirm"
      @cancel="unsaved.cancel"
    />
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { QrCode, QrStyle, QrStatus } from '~/../types/qr'
import { useFormValidation } from '~/composables/useFormValidation'
import { useUnsavedChanges } from '~/composables/useUnsavedChanges'

interface EditableQr extends QrCode {
  tags?: { id: string, name: string, color: string | null }[]
  tagIds?: string[]
  folder?: { id: string, name: string } | null
  folderId?: string | null
}

const route = useRoute()
const toast = useA11yToast()
const { t } = useI18n()
const qrEditUrlErrorId = 'qr-edit-url-error'
const qrEditTitleErrorId = 'qr-edit-title-error'
const { fetchQrById, updateQr } = useQr()

const id = computed(() => route.params.id as string)
const qr = ref<EditableQr | null>(null)
const saving = ref(false)
const schema = z.object({
  title: z.string().trim().min(1, 'forms.errors.required'),
  destinationUrl: z.string().trim().min(1, 'forms.errors.required').url('forms.errors.url'),
})
const { errors, touched, validate, validateField, setServerErrors } = useFormValidation(schema)
const urlError = ref('')
const titleError = computed(() =>
  touched.value.title ? translateError(errors.value.title) : '',
)

const isStatic = computed(() => qr.value?.type === 'static')

const form = reactive({
  title: '',
  destinationUrl: '',
  description: '',
  status: 'active' as QrStatus,
  expiresAt: '',
  folderId: '',
  tagIds: [] as string[],
  style: {} as Partial<QrStyle>,
  utmParams: {
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
  },
})

const statusOptions = [
  { label: t('qr.status.active'), value: 'active' },
  { label: t('qr.status.paused'), value: 'paused' },
  { label: t('qr.status.archived'), value: 'archived' },
]

const { folders, fetchFolders } = useFolders()
const folderOptions = computed(() => [
  { label: t('forms.options.noFolder'), value: '' },
  ...folders.value.map(f => ({ label: f.name, value: f.id })),
])

interface Tag { id: string, name: string, color: string | null }
const allTags = ref<Tag[]>([])
const availableTags = computed(() => allTags.value)

function validateUrl() {
  validateField('destinationUrl', form.destinationUrl)

  if (!form.destinationUrl.trim()) {
    urlError.value = translateError(errors.value.destinationUrl)
    return
  }

  try {
    new URL(form.destinationUrl)
    urlError.value = ''
  }
  catch {
    urlError.value = t('forms.errors.url')
  }
}

function validateTitle() {
  validateField('title', form.title)
}

function translateError(message?: string) {
  if (!message) return ''
  return message.startsWith('forms.') ? t(message) : message
}

// Снимок исходной формы для определения dirty-состояния
const initialSnapshot = ref<string>('')

function serializeForm(): string {
  return JSON.stringify({
    title: form.title,
    destinationUrl: form.destinationUrl,
    description: form.description,
    status: form.status,
    expiresAt: form.expiresAt,
    folderId: form.folderId,
    tagIds: form.tagIds,
    style: form.style,
    utmParams: form.utmParams,
  })
}

const isDirty = computed(() => {
  if (!qr.value) return false
  return serializeForm() !== initialSnapshot.value
})

const unsaved = useUnsavedChanges(isDirty)

async function loadQr() {
  try {
    qr.value = await fetchQrById(id.value) as EditableQr

    // Populate form
    form.title = qr.value.title
    form.destinationUrl = qr.value.destinationUrl
    form.description = qr.value.description || ''
    form.status = qr.value.status
    form.folderId = qr.value.folder?.id || qr.value.folderId || ''
    form.tagIds = qr.value.tags?.map(tag => tag.id) || qr.value.tagIds || []
    form.style = { ...(qr.value.style || {}) }

    if (qr.value.expiresAt) {
      form.expiresAt = new Date(qr.value.expiresAt).toISOString().slice(0, 16)
    }
    else {
      form.expiresAt = ''
    }

    const utm = qr.value.utmParams as Record<string, string> | null
    if (utm) {
      form.utmParams.utm_source = utm.utm_source || ''
      form.utmParams.utm_medium = utm.utm_medium || ''
      form.utmParams.utm_campaign = utm.utm_campaign || ''
      form.utmParams.utm_content = utm.utm_content || ''
    }
    else {
      form.utmParams.utm_source = ''
      form.utmParams.utm_medium = ''
      form.utmParams.utm_campaign = ''
      form.utmParams.utm_content = ''
    }

    // Фиксируем исходное состояние после загрузки — используется для isDirty
    await nextTick()
    initialSnapshot.value = serializeForm()
  }
  catch {
    toast.add({ title: t('forms.errors.qrNotFound'), color: 'error' })
    navigateTo('/qr')
  }
}

async function loadTagsAndFolders() {
  const [_, res] = await Promise.all([
    fetchFolders(),
    $fetch<{ data: Tag[] }>('/api/tags'),
  ])
  allTags.value = res.data
}

async function handleCreateTag(name: string) {
  const res = await $fetch<{ data: Tag }>('/api/tags', { method: 'POST', body: { name } })
  allTags.value.push(res.data)
  form.tagIds.push(res.data.id)
}

async function handleSave() {
  if (!validate(form)) {
    urlError.value = translateError(errors.value.destinationUrl)
    return
  }

  urlError.value = ''

  saving.value = true
  try {
    const utmParams = Object.fromEntries(
      Object.entries(form.utmParams).filter(([, v]) => v),
    )

    await updateQr(id.value, {
      title: form.title,
      destinationUrl: isStatic.value ? undefined : form.destinationUrl,
      description: form.description || null,
      status: form.status,
      folderId: form.folderId || null,
      tagIds: form.tagIds,
      style: form.style,
      utmParams: Object.keys(utmParams).length > 0 ? utmParams : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    })

    toast.add({ title: t('forms.toasts.changesSaved'), color: 'success' })
    // Снимаем unsaved-guard и синхронизируем snapshot
    initialSnapshot.value = serializeForm()
    unsaved.markClean()
    navigateTo(`/qr/${id.value}`)
  }
  catch (error: unknown) {
    const err = error as {
      statusCode?: number
      data?: { message?: string, fieldErrors?: Record<string, string> }
      statusMessage?: string
    }
    if (err.statusCode === 422 && err.data?.fieldErrors) {
      setServerErrors(err.data.fieldErrors)
      return
    }
    toast.add({
      title: err?.data?.message || t('forms.errors.serverGeneric'),
      color: 'error',
    })
  }
  finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    loadQr(),
    loadTagsAndFolders(),
  ])
})
</script>
