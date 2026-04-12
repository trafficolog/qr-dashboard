<template>
  <div class="flex flex-col items-center">
    <!-- QR SVG -->
    <div
      class="bg-white rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
      :style="{ width: `${displaySize + 32}px` }"
    >
      <div
        v-if="svgHtml"
        v-html="svgHtml"
        class="w-full aspect-square"
      />
      <div
        v-else
        class="w-full aspect-square flex items-center justify-center text-gray-300"
      >
        <UIcon name="i-lucide-qr-code" class="size-16" />
      </div>
    </div>

    <!-- Redirect URL (copy on click) -->
    <div
      v-if="redirectUrl"
      class="mt-3 flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      @click="copyUrl"
    >
      <UIcon name="i-lucide-link" class="size-4 shrink-0" />
      <span class="truncate max-w-[240px]">{{ redirectUrl }}</span>
      <UIcon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" class="size-4 shrink-0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { generateQrSvg } from '~/utils/qr-svg'
import type { QrStyle } from '~/../types/qr'

const props = withDefaults(
  defineProps<{
    url?: string
    style?: Partial<QrStyle>
    shortCode?: string
    displaySize?: number
  }>(),
  {
    url: 'https://splat.ru',
    displaySize: 240,
  },
)

const { public: publicConfig } = useRuntimeConfig()
const { copy, copied } = useClipboard()
const toast = useToast()

const redirectUrl = computed(() => {
  if (!props.shortCode) return ''
  return `${publicConfig.appUrl}/r/${props.shortCode}`
})

const qrData = computed(() => {
  if (props.shortCode) {
    return `${publicConfig.appUrl}/r/${props.shortCode}`
  }
  return props.url || 'https://splat.ru'
})

const svgHtml = computed(() => {
  if (!qrData.value) return ''
  try {
    return generateQrSvg(qrData.value, props.style || {})
  } catch {
    return ''
  }
})

function copyUrl() {
  if (redirectUrl.value) {
    copy(redirectUrl.value)
    toast.add({ title: 'URL скопирован', color: 'success' })
  }
}
</script>
