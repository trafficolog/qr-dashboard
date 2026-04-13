<template>
  <div class="flex flex-col items-center">
    <!-- QR SVG -->
    <div
      class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4 shadow-sm"
      :style="{ width: `${displaySize + 32}px` }"
    >
      <div
        v-if="svgHtml"
        class="w-full aspect-square"
        v-html="svgHtml"
      />
      <div
        v-else
        class="flex aspect-square w-full items-center justify-center text-[color:var(--text-muted)]/50"
      >
        <UIcon
          name="i-lucide-qr-code"
          class="size-16"
        />
      </div>
    </div>

    <!-- Redirect URL (copy on click) -->
    <div
      v-if="redirectUrl"
      class="mt-3 flex cursor-pointer items-center gap-2 text-sm text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--accent)]"
      @click="copyUrl"
    >
      <UIcon
        name="i-lucide-link"
        class="size-4 shrink-0"
      />
      <span class="truncate max-w-[240px]">{{ redirectUrl }}</span>
      <UIcon
        :name="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        class="size-4 shrink-0"
      />
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
  }
  catch {
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
