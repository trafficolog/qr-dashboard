<template>
  <UPopover
    :open-delay="300"
    :close-delay="100"
  >
    <slot />

    <template #content>
      <div class="w-[240px] space-y-3 p-3">
        <div class="mx-auto h-[200px] w-[200px] overflow-hidden rounded-md border border-[color:var(--border)] bg-[color:var(--surface-0)] p-2">
          <QrPreviewMini
            :url="destinationUrl"
            :style-config="styleConfig"
          />
        </div>

        <div class="space-y-1">
          <p class="truncate text-sm font-medium text-[color:var(--text-primary)]">
            {{ title }}
          </p>
          <p class="truncate text-xs text-[color:var(--text-secondary)]">
            {{ destinationUrl }}
          </p>
        </div>

        <div class="flex items-center justify-between text-xs text-[color:var(--text-secondary)]">
          <QrStatusBadge :status="status" />
          <span>{{ scans.toLocaleString('ru-RU') }} сканов</span>
        </div>
      </div>
    </template>
  </UPopover>
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
