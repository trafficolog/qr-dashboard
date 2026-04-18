<template>
  <UModal
    v-model:open="isOpen"
    :close-on-escape="true"
  >
    <template #content>
      <div class="bg-[color:var(--surface-0)] p-6">
        <h3 class="mb-4 text-lg font-semibold text-[color:var(--text-primary)]">
          Экспорт QR-кода
        </h3>

        <div class="space-y-4">
          <!-- Format -->
          <UFormField label="Формат">
            <div class="flex gap-2">
              <UButton
                v-for="f in formats"
                :key="f.value"
                :variant="format === f.value ? 'solid' : 'outline'"
                :color="format === f.value ? 'primary' : 'neutral'"
                :label="f.label"
                size="sm"
                @click="format = f.value"
              />
            </div>
          </UFormField>

          <!-- Size (PNG only) -->
          <UFormField
            v-if="format === 'png'"
            label="Размер (px)"
          >
            <USelect
              v-model="size"
              :items="sizeOptions"
              size="sm"
            />
          </UFormField>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <UButton
            variant="outline"
            color="neutral"
            label="Отмена"
            @click="isOpen = false"
          />
          <UButton
            icon="i-lucide-download"
            label="Скачать"
            :loading="downloading"
            @click="handleDownload"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { createDialogFocusReturn } from '~/utils/dialog-focus-return'

const props = defineProps<{
  qrId: string
  title?: string
}>()

const isOpen = defineModel<boolean>('open', { default: false })
const focusReturn = createDialogFocusReturn()

const format = ref('png')
const size = ref('1000')
const downloading = ref(false)

const formats = [
  { label: 'PNG', value: 'png' },
  { label: 'SVG', value: 'svg' },
  { label: 'PDF', value: 'pdf' },
]

const sizeOptions = [
  { label: '300×300', value: '300' },
  { label: '500×500', value: '500' },
  { label: '1000×1000', value: '1000' },
  { label: '2000×2000', value: '2000' },
  { label: '4096×4096', value: '4096' },
]

watch(isOpen, (open) => {
  if (open) focusReturn.save()
  else focusReturn.restore()
})

async function handleDownload() {
  downloading.value = true
  try {
    const params = new URLSearchParams({ format: format.value })
    if (format.value === 'png') {
      params.append('size', size.value)
    }

    const response = await fetch(`/api/qr/${props.qrId}/export?${params}`)
    if (!response.ok) throw new Error('Export failed')

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const ext = format.value
    a.href = url
    a.download = `${props.title || 'qr-code'}.${ext}`
    a.click()
    URL.revokeObjectURL(url)

    isOpen.value = false
  }
  catch {
    console.error('Download failed')
  }
  finally {
    downloading.value = false
  }
}
</script>
