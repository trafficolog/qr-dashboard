<template>
  <button
    :class="[
      'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors text-sm',
      focused
        ? 'bg-[color:var(--accent-light)] text-[color:var(--accent)]'
        : 'text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]',
    ]"
    type="button"
    v-bind="$attrs"
  >
    <UIcon
      :name="icon"
      class="size-4 shrink-0"
    />
    <div class="flex-1 min-w-0">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <span
        class="block truncate"
        v-html="labelHtml"
      />
      <!-- eslint-disable-next-line vue/no-v-html -->
      <span
        v-if="subHtml"
        class="block truncate text-xs text-[color:var(--text-muted)]"
        v-html="subHtml"
      />
    </div>
  </button>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{
  icon: string
  labelHtml: string
  subHtml?: string
  focused: boolean
}>()
</script>
