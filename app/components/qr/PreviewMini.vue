<template>
  <!-- eslint-disable vue/no-v-html -->
  <div
    v-if="svgHtml"
    class="w-full h-full"
    v-html="svgHtml"
  />
  <div
    v-else
    class="flex h-full w-full items-center justify-center"
  >
    <Icon
      name="i-lucide-qr-code"
      class="size-4 text-[color:var(--text-muted)]/50"
    />
  </div>
  <!-- eslint-enable vue/no-v-html -->
</template>

<script setup lang="ts">
import { generateQrSvg } from '~/utils/qr-svg'

const props = defineProps<{
  url: string
  styleConfig?: Record<string, unknown>
}>()

const svgHtml = computed(() => {
  try {
    return generateQrSvg(props.url, props.styleConfig || {})
  }
  catch {
    return ''
  }
})
</script>
