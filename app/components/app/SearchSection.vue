<template>
  <div>
    <div class="px-4 pt-3 pb-1">
      <span class="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
        {{ label }}
      </span>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()
</script>
