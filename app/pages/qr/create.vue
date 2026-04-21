<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
          {{ $t('pages.qrCreate.title') }}
        </h1>
        <p class="mt-1 text-sm text-[color:var(--text-secondary)]">
          {{ $t('pages.qrCreate.subtitle') }}
        </p>
      </div>
    </div>

    <SharedDraftRestoredBanner
      v-if="draft.hasDraft.value"
      :has-draft="draft.hasDraft.value"
      :saved-at="draft.draftSavedAt.value"
      class="mb-4"
      @restore="draft.restore"
      @discard="draft.discard"
    />

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div class="space-y-6 lg:col-span-2">
        <div class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
          <div class="mb-4 flex items-center gap-2">
            <Icon
              name="i-lucide-link"
              class="size-5 text-[color:var(--accent)]"
            />
            <span class="font-medium">{{ $t('forms.sections.link') }}</span>
          </div>

          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-[color:var(--text-primary)]">
                {{ $t('forms.labels.destinationUrl') }} *
              </label>
              <IconField>
                <InputIcon>
                  <Icon name="i-lucide-globe" />
                </InputIcon>
                <InputText
                  v-model="form.destinationUrl"
                  placeholder="https://splat.ru/product"
                  class="w-full"
                  :invalid="!!urlError"
                  :aria-invalid="!!urlError"
                  :aria-describedby="urlError ? qrCreateUrlErrorId : undefined"
                  :aria-required="true"
                  @blur="validateUrl"
                />
              </IconField>
              <p class="mt-1 text-xs text-[color:var(--text-muted)]">
                {{ $t('forms.hints.destinationUrl') }}
              </p>
              <p
                v-if="urlError"
                :id="qrCreateUrlErrorId"
                role="alert"
                aria-live="polite"
                class="mt-1 text-xs text-[color:var(--color-error)]"
              >
                {{ urlError }}
              </p>
            </div>

            <div class="flex items-center gap-4">
              <label class="text-sm text-[color:var(--text-secondary)]">{{ $t('forms.labels.qrType') }}</label>
              <div class="flex gap-2">
                <Button
                  :outlined="form.type !== 'dynamic'"
                  :severity="form.type === 'dynamic' ? 'primary' : 'secondary'"
                  size="small"
                  @click="form.type = 'dynamic'"
                >
                  {{ $t('forms.options.qrType.dynamic') }}
                </Button>
                <Button
                  :outlined="form.type !== 'static'"
                  :severity="form.type === 'static' ? 'primary' : 'secondary'"
                  size="small"
                  @click="form.type = 'static'"
                >
                  {{ $t('forms.options.qrType.static') }}
                </Button>
              </div>
            </div>

            <p class="text-xs text-[color:var(--text-muted)]">
              {{ form.type === 'dynamic'
                ? $t('forms.hints.qrTypeDynamic')
                : $t('forms.hints.qrTypeStatic')
              }}
            </p>

            <details class="rounded-lg border border-[color:var(--border)] p-3">
              <summary class="cursor-pointer list-none text-sm font-medium text-[color:var(--text-primary)]">
                <span class="inline-flex items-center gap-2">
                  <Icon name="i-lucide-tag" />
                  {{ $t('forms.labels.utmParams') }}
                </span>
              </summary>
              <div class="grid grid-cols-2 gap-3 pt-3">
                <div>
                  <label class="mb-1 block text-sm text-[color:var(--text-secondary)]">{{ $t('forms.labels.utmSource') }}</label>
                  <InputText
                    v-model="form.utmParams.utm_source"
                    placeholder="qr-code"
                    size="small"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-sm text-[color:var(--text-secondary)]">{{ $t('forms.labels.utmMedium') }}</label>
                  <InputText
                    v-model="form.utmParams.utm_medium"
                    placeholder="packaging"
                    size="small"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-sm text-[color:var(--text-secondary)]">{{ $t('forms.labels.utmCampaign') }}</label>
                  <InputText
                    v-model="form.utmParams.utm_campaign"
                    placeholder="summer2025"
                    size="small"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-sm text-[color:var(--text-secondary)]">{{ $t('forms.labels.utmContent') }}</label>
                  <InputText
                    v-model="form.utmParams.utm_content"
                    size="small"
                    class="w-full"
                  />
                </div>
              </div>
            </details>
          </div>
        </div>

        <div class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
          <div class="mb-4 flex items-center gap-2">
            <Icon
              name="i-lucide-info"
              class="size-5 text-[color:var(--accent)]"
            />
            <span class="font-medium">{{ $t('forms.sections.info') }}</span>
          </div>

          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-[color:var(--text-primary)]">
                {{ $t('forms.labels.title') }} *
              </label>
              <InputText
                v-model="form.title"
                :placeholder="$t('forms.placeholders.qrTitle')"
                class="w-full"
                :invalid="!!titleError"
                :aria-invalid="!!titleError"
                :aria-describedby="titleError ? qrCreateTitleErrorId : undefined"
                :aria-required="true"
                @blur="validateTitle"
              />
              <p class="mt-1 text-xs text-[color:var(--text-muted)]">
                {{ $t('forms.hints.qrTitle') }}
              </p>
              <p
                v-if="titleError"
                :id="qrCreateTitleErrorId"
                role="alert"
                aria-live="polite"
                class="mt-1 text-xs text-[color:var(--color-error)]"
              >
                {{ titleError }}
              </p>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-[color:var(--text-primary)]">{{ $t('forms.labels.folder') }}</label>
              <Select
                v-model="form.folderId"
                :options="folderOptions"
                option-label="label"
                option-value="value"
                :placeholder="$t('forms.options.noFolder')"
                class="w-full"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-[color:var(--text-primary)]">{{ $t('forms.labels.tags') }}</label>
              <SharedTagInput
                v-model="form.tagIds"
                :available-tags="availableTags"
                @create-tag="handleCreateTag"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-[color:var(--text-primary)]">{{ $t('forms.labels.description') }}</label>
              <Textarea
                v-model="form.description"
                :placeholder="$t('forms.placeholders.description')"
                :rows="2"
                class="w-full"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-[color:var(--text-primary)]">{{ $t('forms.labels.expiresAt') }}</label>
              <InputText
                v-model="form.expiresAt"
                type="datetime-local"
                class="w-full"
              />
              <p class="mt-1 text-xs text-[color:var(--text-muted)]">
                {{ $t('forms.hints.expiresAt') }}
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
          <div class="mb-4 flex items-center gap-2">
            <Icon
              name="i-lucide-palette"
              class="size-5 text-[color:var(--accent)]"
            />
            <span class="font-medium">{{ $t('forms.sections.style') }}</span>
          </div>

          <QrStyleEditor v-model="form.style" />
        </div>

        <div class="flex items-center gap-3">
          <Button
            :loading="saving"
            :disabled="!isValid || saving"
            size="large"
            @click="handleCreate"
          >
            <template #icon>
              <Icon name="i-lucide-check" />
            </template>
            {{ $t('forms.actions.createQr') }}
          </Button>
          <Button
            as-child
            outlined
            severity="secondary"
            size="large"
          >
            <NuxtLink to="/qr">
              {{ $t('forms.actions.cancel') }}
            </NuxtLink>
          </Button>
        </div>
      </div>

      <div class="lg:col-span-1">
        <div class="space-y-4 lg:sticky lg:top-24">
          <QrPreview
            :url="form.destinationUrl || 'https://splat.ru'"
            :style="form.style"
            :title="form.title"
            :display-size="280"
          />

          <div class="text-center">
            <p class="text-xs text-[color:var(--text-muted)]">
              {{ $t('forms.hints.livePreview') }}
            </p>
          </div>
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
import type { QrStyle } from '#shared/types/qr'
import { useFormDraft } from '~/composables/useFormDraft'
import { useFormValidation } from '~/composables/useFormValidation'
import { useUnsavedChanges } from '~/composables/useUnsavedChanges'
import { SELECT_VALUE_NONE } from '~/utils/select-none-value'

const toast = useA11yToast()
const { t } = useI18n()
const qrCreateUrlErrorId = 'qr-create-url-error'
const qrCreateTitleErrorId = 'qr-create-title-error'
const { createQr } = useQr()
const { user } = useAuth()
const route = useRoute()

const saving = ref(false)
const schema = z.object({
  title: z.string().trim().min(1, 'forms.errors.required'),
  destinationUrl: z.string().trim().min(1, 'forms.errors.required').url('forms.errors.url'),
})
const { errors, touched, validate, validateField, setServerErrors, reset } = useFormValidation(schema)
const urlError = computed(() =>
  touched.value.destinationUrl ? translateError(errors.value.destinationUrl) : '',
)
const titleError = computed(() =>
  touched.value.title ? translateError(errors.value.title) : '',
)

const form = reactive({
  title: '',
  destinationUrl: '',
  type: 'dynamic' as 'dynamic' | 'static',
  description: '',
  expiresAt: '',
  folderId: (route.query.folderId as string)?.trim() || SELECT_VALUE_NONE,
  tagIds: [] as string[],
  style: {
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    moduleStyle: 'square',
    cornerStyle: 'square',
    errorCorrectionLevel: 'M',
  } as Partial<QrStyle>,
  utmParams: {
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
  },
})

// Draft autosave — ключ уникален на пользователя
const draftKey = computed(() => `qr-create:${user.value?.id ?? 'anon'}`)
const draft = useFormDraft(draftKey, form, {
  debounceMs: 1000,
  // style — большой объект, не считаем черновиком
  exclude: ['style', 'tagIds'] as (keyof typeof form)[],
})

watch(() => user.value?.id, (newUserId, oldUserId) => {
  if (typeof window === 'undefined') return
  if (!newUserId || oldUserId) return

  const anonStorageKey = 'draft:qr-create:anon'
  const personalStorageKey = `draft:qr-create:${newUserId}`
  const anonDraft = localStorage.getItem(anonStorageKey)
  if (!anonDraft) return

  if (!localStorage.getItem(personalStorageKey)) {
    localStorage.setItem(personalStorageKey, anonDraft)
  }
  localStorage.removeItem(anonStorageKey)
})

// Unsaved changes guard — форма "грязная", если есть заполненные ключевые поля
const isDirty = computed(() =>
  form.title.trim() !== ''
  || form.destinationUrl.trim() !== ''
  || form.description.trim() !== '',
)
const unsaved = useUnsavedChanges(isDirty)

// Folders & tags
const { folders, fetchFolders } = useFolders()
const folderOptions = computed(() => [
  { label: t('forms.options.noFolder'), value: SELECT_VALUE_NONE },
  ...folders.value.map(f => ({ label: f.name, value: f.id })),
])

interface Tag { id: string, name: string, color: string | null }
const allTags = ref<Tag[]>([])
const availableTags = computed(() => allTags.value)

async function loadTagsAndFolders() {
  fetchFolders()
  const res = await $fetch<{ data: Tag[] }>('/api/tags')
  allTags.value = res.data
}

async function handleCreateTag(name: string) {
  const res = await $fetch<{ data: Tag }>('/api/tags', { method: 'POST', body: { name } })
  allTags.value.push(res.data)
  form.tagIds.push(res.data.id)
}

onMounted(() => loadTagsAndFolders())

const isValid = computed(() => {
  return form.title.trim() !== ''
    && form.destinationUrl.trim() !== ''
    && !errors.value.destinationUrl
    && !errors.value.title
})

function translateError(message?: string) {
  if (!message) return ''
  return message.startsWith('forms.') ? t(message) : message
}

function validateUrl() {
  validateField('destinationUrl', form.destinationUrl)
}

function validateTitle() {
  validateField('title', form.title)
}

async function handleCreate() {
  if (!validate(form)) return

  saving.value = true
  try {
    // Clean UTM params (remove empty)
    const utmParams = Object.fromEntries(
      Object.entries(form.utmParams).filter(([, v]) => v),
    )

    const qr = await createQr({
      title: form.title,
      destinationUrl: form.destinationUrl,
      type: form.type,
      description: form.description || undefined,
      style: form.style as QrStyle,
      utmParams: Object.keys(utmParams).length > 0 ? utmParams : undefined,
      // Optional fields should be omitted from payload when empty
      folderId: form.folderId || undefined,
      tagIds: form.tagIds.length ? form.tagIds : undefined,
      expiresAt: form.expiresAt || undefined,
    })

    toast.add({ title: t('forms.toasts.qrCreated', { title: qr.title }), color: 'success' })
    if ('domainWarning' in qr && typeof qr.domainWarning === 'string') {
      toast.add({ title: t(`forms.toasts.${qr.domainWarning}`), color: 'warning' })
    }
    // Чистим черновик и снимаем unsaved-guard перед навигацией
    draft.clear()
    reset()
    unsaved.markClean()
    await navigateTo(`/qr/${qr.id}`)
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
      title: err?.data?.message || err?.statusMessage || t('forms.errors.serverGeneric'),
      color: 'error',
    })
  }
  finally {
    saving.value = false
  }
}
</script>
