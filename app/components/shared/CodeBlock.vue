<template>
  <div class="relative group rounded-lg bg-gray-900 dark:bg-gray-950 overflow-hidden">
    <pre class="overflow-x-auto px-4 py-3 text-sm text-gray-100 leading-relaxed"><code>{{ code }}</code></pre>
    <button
      class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
      @click="copy"
    >
      <UIcon
        :name="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        class="size-3.5"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
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
