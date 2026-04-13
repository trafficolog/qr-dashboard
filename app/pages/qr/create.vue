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
              required
            >
              <UInput
                v-model="form.destinationUrl"
                placeholder="https://splat.ru/product"
                icon="i-lucide-globe"
                size="lg"
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
              required
            >
              <UInput
                v-model="form.title"
                placeholder="Промо-акция на упаковке"
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
            label="Отмена"
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
  </div>
</template>

<script setup lang="ts">
import type { QrStyle } from '~/../types/qr'

const toast = useToast()
const { createQr } = useQr()

const saving = ref(false)
const urlError = ref('')

const form = reactive({
  title: '',
  destinationUrl: '',
  type: 'dynamic' as 'dynamic' | 'static',
  description: '',
  expiresAt: '',
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

const isValid = computed(() => {
  return form.title.trim() !== '' && form.destinationUrl.trim() !== '' && !urlError.value
})

function validateUrl() {
  if (!form.destinationUrl) {
    urlError.value = ''
    return
  }
  try {
    new URL(form.destinationUrl)
    urlError.value = ''
  }
  catch {
    urlError.value = 'Введите корректный URL (https://...)'
  }
}

async function handleCreate() {
  validateUrl()
  if (!isValid.value) return

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
    await navigateTo(`/qr/${qr.id}`)
  }
  catch (error: unknown) {
    const err = error as { data?: { message?: string }, statusMessage?: string }
    toast.add({
      title: err?.data?.message || err?.statusMessage || 'Ошибка создания',
      color: 'error',
    })
  }
  finally {
    saving.value = false
  }
}
</script>
