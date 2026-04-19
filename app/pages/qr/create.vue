<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
          Создание QR-кода
        </h1>
        <p class="mt-1 text-sm text-[color:var(--text-secondary)]">
          Настройте ссылку, стиль и параметры
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
              <span class="font-medium">Ссылка</span>
            </div>
          </template>

          <div class="space-y-4">
            <UFormField
              label="URL назначения"
              :error="urlError"
              :hint="$t('forms.hints.destinationUrl')"
              required
            >
              <UInput
                v-model="form.destinationUrl"
                placeholder="https://splat.ru/product"
                icon="i-lucide-globe"
                size="lg"
                :aria-invalid="!!urlError"
                aria-describedby="qr-create-url-hint"
                @blur="validateUrl"
              />
            </UFormField>

            <div class="flex items-center gap-4">
              <label class="text-sm text-[color:var(--text-secondary)]">Тип:</label>
              <div class="flex gap-2">
                <UButton
                  :variant="form.type === 'dynamic' ? 'solid' : 'outline'"
                  :color="form.type === 'dynamic' ? 'primary' : 'neutral'"
                  size="sm"
                  label="Динамический"
                  @click="form.type = 'dynamic'"
                />
                <UButton
                  :variant="form.type === 'static' ? 'solid' : 'outline'"
                  :color="form.type === 'static' ? 'primary' : 'neutral'"
                  size="sm"
                  label="Статический"
                  @click="form.type = 'static'"
                />
              </div>
            </div>

            <p class="text-xs text-[color:var(--text-muted)]">
              {{ form.type === 'dynamic'
                ? 'Динамический QR: ссылку можно изменить после создания'
                : 'Статический QR: URL вшивается в QR-матрицу и не может быть изменён'
              }}
            </p>

            <!-- UTM params (collapsible) -->
            <UCollapsible>
              <UButton
                variant="link"
                color="neutral"
                size="sm"
                icon="i-lucide-tag"
                label="UTM-параметры"
                class="-ml-2"
              />
              <template #content>
                <div class="grid grid-cols-2 gap-3 pt-3">
                  <UFormField label="Source">
                    <UInput
                      v-model="form.utmParams.utm_source"
                      placeholder="qr-code"
                      size="sm"
                    />
                  </UFormField>
                  <UFormField label="Medium">
                    <UInput
                      v-model="form.utmParams.utm_medium"
                      placeholder="packaging"
                      size="sm"
                    />
                  </UFormField>
                  <UFormField label="Campaign">
                    <UInput
                      v-model="form.utmParams.utm_campaign"
                      placeholder="summer2025"
                      size="sm"
                    />
                  </UFormField>
                  <UFormField label="Content">
                    <UInput
                      v-model="form.utmParams.utm_content"
                      placeholder=""
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
              <span class="font-medium">Информация</span>
            </div>
          </template>

          <div class="space-y-4">
            <UFormField
              label="Название"
              :hint="$t('forms.hints.qrTitle')"
              :error="titleError"
              required
            >
              <UInput
                v-model="form.title"
                placeholder="Промо-акция на упаковке"
                :aria-invalid="!!titleError"
                @blur="validateTitle"
              />
            </UFormField>

            <UFormField label="Папка">
              <USelect
                v-model="form.folderId"
                :items="folderOptions"
                placeholder="Без папки"
              />
            </UFormField>

            <UFormField label="Теги">
              <SharedTagInput
                v-model="form.tagIds"
                :available-tags="availableTags"
                @create-tag="handleCreateTag"
              />
            </UFormField>

            <UFormField label="Описание">
              <UTextarea
                v-model="form.description"
                placeholder="Краткое описание QR-кода..."
                :rows="2"
              />
            </UFormField>

            <UFormField label="Срок действия">
              <UInput
                v-model="form.expiresAt"
                :hint="$t('forms.hints.expiresAt')"
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
              <span class="font-medium">Стиль</span>
            </div>
          </template>

          <QrStyleEditor v-model="form.style" />
        </UCard>

        <!-- Actions -->
        <div class="flex items-center gap-3">
          <UButton
            label="Создать QR-код"
            icon="i-lucide-check"
            size="lg"
            :loading="saving"
            :disabled="!isValid || saving"
            @click="handleCreate"
          />
          <UButton
            :label="$t('forms.actions.cancel')"
            variant="outline"
            color="neutral"
            size="lg"
            to="/qr"
          />
        </div>
      </div>

      <!-- Right: Live Preview (sticky) -->
      <div class="lg:col-span-1">
        <div class="lg:sticky lg:top-24 space-y-4">
          <QrPreview
            :url="form.destinationUrl || 'https://splat.ru'"
            :style="form.style"
            :title="form.title"
            :display-size="280"
          />

          <div class="text-center">
            <p class="text-xs text-[color:var(--text-muted)]">
              Предварительный просмотр обновляется в реальном времени
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
import type { QrStyle } from '~/../types/qr'
import { useFormDraft } from '~/composables/useFormDraft'
import { useFormValidation } from '~/composables/useFormValidation'
import { useUnsavedChanges } from '~/composables/useUnsavedChanges'

const toast = useA11yToast()
const { t } = useI18n()
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
  folderId: (route.query.folderId as string) || '',
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
const draft = useFormDraft(draftKey.value, form, {
  debounceMs: 1000,
  // style — большой объект, не считаем черновиком
  exclude: ['style', 'tagIds'] as (keyof typeof form)[],
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
  { label: 'Без папки', value: '' },
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
      expiresAt: form.expiresAt || undefined,
    })

    toast.add({ title: `QR «${qr.title}» создан`, color: 'success' })
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
