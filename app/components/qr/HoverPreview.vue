<template>
  <div class="group relative inline-flex">
    <slot />

    <div class="pointer-events-none invisible absolute left-1/2 top-full z-30 mt-2 w-[240px] -translate-x-1/2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100">
      <div class="mx-auto h-[200px] w-[200px] overflow-hidden rounded-md border border-[color:var(--border)] bg-[color:var(--surface-0)] p-2">
        <QrPreviewMini
          :url="destinationUrl"
          :style-config="styleConfig"
        />
      </div>

      <div class="mt-3 space-y-1">
        <p class="truncate text-sm font-medium text-[color:var(--text-primary)]">
          {{ title }}
        </p>
        <p class="truncate text-xs text-[color:var(--text-secondary)]">
          {{ destinationUrl }}
        </p>
      </div>

      <div class="mt-2 flex items-center justify-between text-xs text-[color:var(--text-secondary)]">
        <QrStatusBadge :status="status" />
        <span>{{ scans.toLocaleString('ru-RU') }} сканов</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  destinationUrl: string
  status: string
  scans: number
  styleConfig?: Record<string, unknown>
}>()
</script>
