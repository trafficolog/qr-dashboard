<template>
  <Dialog
    v-model:visible="isOpen"
    modal
    :dismissable-mask="true"
    :close-on-escape="true"
    class="w-full max-w-lg"
  >
    <div class="space-y-4 py-1">
      <h3 class="text-lg font-semibold text-[color:var(--text-primary)]">
        Экспорт QR-кода
      </h3>

      <div class="space-y-4">
        <div>
          <p class="mb-2 text-sm font-medium text-[color:var(--text-secondary)]">
            Формат
          </p>
          <div class="flex gap-2">
            <Button
              v-for="f in formats"
              :key="f.value"
              :outlined="format !== f.value"
              :severity="format === f.value ? 'primary' : 'secondary'"
              size="small"
              @click="format = f.value"
            >
              {{ f.label }}
            </Button>
          </div>
        </div>

        <div v-if="format === 'png'">
          <p class="mb-2 text-sm font-medium text-[color:var(--text-secondary)]">
            Размер (px)
          </p>
          <Select
            v-model="size"
            :options="sizeOptions"
            option-label="label"
            option-value="value"
            size="small"
          />
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <Button
          outlined
          severity="secondary"
          size="small"
          @click="isOpen = false"
        >
          Отмена
        </Button>
        <Button
          :loading="downloading"
          size="small"
          @click="handleDownload"
        >
          <template #icon>
            <Icon name="i-lucide-download" />
          </template>
          Скачать
        </Button>
      </div>
    </div>
  </Dialog>
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
