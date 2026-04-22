<template>
  <div class="relative group rounded-lg bg-[color:var(--surface-2)] dark:bg-[color:var(--surface-2)] overflow-hidden">
    <pre class="overflow-x-auto px-4 py-3 text-sm text-[color:var(--text-primary)] leading-relaxed"><code>{{ code }}</code></pre>
    <button
      class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-[color:var(--surface-3)] hover:bg-[color:var(--surface-2)] text-[color:var(--text-secondary)]"
      @click="copy"
    >
      <Icon
        :name="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        class="size-3.5"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const props = defineProps<{
  code: string
  language?: string
}>()

const copied = ref(false)
const { copy: copyToClipboard } = useClipboard()

async function copy() {
  await copyToClipboard(props.code)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>
