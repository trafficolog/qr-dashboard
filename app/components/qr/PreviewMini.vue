<template>
  <div v-if="svgHtml" v-html="svgHtml" class="w-full h-full" />
  <div v-else class="w-full h-full flex items-center justify-center">
    <UIcon name="i-lucide-qr-code" class="size-4 text-gray-300" />
  </div>
</template>

<script setup lang="ts">
import { generateQrSvg } from '~/app/utils/qr-svg'

const props = defineProps<{
  url: string
  styleConfig?: Record<string, unknown>
}>()

const svgHtml = computed(() => {
  try {
    return generateQrSvg(props.url, props.styleConfig || {})
  } catch {
    return ''
  }
})
</script>
