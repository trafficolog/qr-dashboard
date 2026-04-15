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
              :to="`/qr/${id}`"
            />
            <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
              Редактирование QR-кода
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
                <span class="font-medium">Ссылка</span>
              </div>
            </template>

            <div class="space-y-4">
              <UFormField
                label="URL назначения"
                :error="urlError"
                :hint="isStatic ? $t('forms.hints.destinationUrl') + ' — ' + 'URL статического QR нельзя изменить' : $t('forms.hints.destinationUrl')"
              >
                <UInput
                  v-model="form.destinationUrl"
                  placeholder="https://splat.ru/product"
                  icon="i-lucide-globe"
                  size="lg"
                  :disabled="isStatic"
                  @blur="validateUrl"
                />
              </UFormField>

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
                        size="sm"
                      />
                    </UFormField>
                    <UFormField label="Medium">
                      <UInput
                        v-model="form.utmParams.utm_medium"
                        size="sm"
                      />
                    </UFormField>
                    <UFormField label="Campaign">
                      <UInput
                        v-model="form.utmParams.utm_campaign"
                        size="sm"
                      />
                    </UFormField>
                    <UFormField label="Content">
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
                  :aria-invalid="!!titleError"
                  @blur="validateTitle"
                />
              </UFormField>

              <UFormField label="Описание">
                <UTextarea
                  v-model="form.description"
                  :rows="2"
                />
              </UFormField>

              <UFormField label="Статус">
                <USelect
                  v-model="form.status"
                  :items="statusOptions"
                />
              </UFormField>

              <UFormField label="Срок действия">
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
                <span class="font-medium">Стиль</span>
              </div>
            </template>

            <QrStyleEditor v-model="form.style" />
          </UCard>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            <UButton
              label="Сохранить изменения"
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
import type { QrCode, QrStyle, QrStatus } from '~/../types/qr'
import { useUnsavedChanges } from '~/composables/useUnsavedChanges'

interface EditableQr extends QrCode {
  tags?: { id: string, name: string, color: string | null }[]
  folder?: { id: string, name: string } | null
}

const route = useRoute()
const toast = useToast()
const { t } = useI18n()
const { fetchQrById, updateQr } = useQr()

const id = computed(() => route.params.id as string)
const qr = ref<EditableQr | null>(null)
const saving = ref(false)
const urlError = ref('')
const titleError = ref('')

const isStatic = computed(() => qr.value?.type === 'static')

const form = reactive({
  title: '',
  destinationUrl: '',
  description: '',
  status: 'active' as QrStatus,
  expiresAt: '',
  style: {} as Partial<QrStyle>,
  utmParams: {
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
  },
})

const statusOptions = [
  { label: 'Активен', value: 'active' },
  { label: 'Пауза', value: 'paused' },
  { label: 'Архив', value: 'archived' },
]

function validateUrl() {
  if (!form.destinationUrl) {
    urlError.value = t('forms.errors.required')
    return
  }
  try {
    new URL(form.destinationUrl)
    urlError.value = t('forms.errors.url')
  }
  catch {
    urlError.value = 'Некорректный URL'
  }
}

function validateTitle() {
  titleError.value = form.title.trim() === '' ? t('forms.errors.required') : ''
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
    form.style = { ...(qr.value.style || {}) }

    if (qr.value.expiresAt) {
      form.expiresAt = new Date(qr.value.expiresAt).toISOString().slice(0, 16)
    }

    const utm = qr.value.utmParams as Record<string, string> | null
    if (utm) {
      form.utmParams.utm_source = utm.utm_source || ''
      form.utmParams.utm_medium = utm.utm_medium || ''
      form.utmParams.utm_campaign = utm.utm_campaign || ''
      form.utmParams.utm_content = utm.utm_content || ''
    }

    // Фиксируем исходное состояние после загрузки — используется для isDirty
    await nextTick()
    initialSnapshot.value = serializeForm()
  }
  catch {
    toast.add({ title: 'QR-код не найден', color: 'error' })
    navigateTo('/qr')
  }
}

async function handleSave() {
  validateUrl()
  validateTitle()
  if (urlError.value || titleError.value) return

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
      style: form.style,
      utmParams: Object.keys(utmParams).length > 0 ? utmParams : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    })

    toast.add({ title: 'Изменения сохранены', color: 'success' })
    // Снимаем unsaved-guard и синхронизируем snapshot
    initialSnapshot.value = serializeForm()
    unsaved.markClean()
    navigateTo(`/qr/${id.value}`)
  }
  catch (error: unknown) {
    const err = error as { data?: { message?: string }, statusMessage?: string }
    toast.add({
      title: err?.data?.message || t('forms.errors.serverGeneric'),
      color: 'error',
    })
  }
  finally {
    saving.value = false
  }
}

onMounted(loadQr)
</script>
