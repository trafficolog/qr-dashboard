<template>
  <!-- eslint-disable vue/no-v-html -->
  <button
    :class="[
      'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-interactive text-sm',
      focused
        ? 'bg-[color:var(--accent-light)] text-[color:var(--accent)]'
        : 'text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]',
    ]"
    type="button"
    v-bind="$attrs"
  >
    <Icon
      :name="icon"
      class="size-4 shrink-0"
    />
    <div class="flex-1 min-w-0">
      <span
        class="block truncate"
        v-html="labelHtml"
      />
      <span
        v-if="subHtml"
        class="block truncate text-xs text-[color:var(--text-muted)]"
        v-html="subHtml"
      />
    </div>
  </button>
  <!-- eslint-enable vue/no-v-html -->
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
