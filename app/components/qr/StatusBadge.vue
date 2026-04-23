<template>
  <Tag :severity="tagSeverity">
    <div class="inline-flex items-center gap-1">
      <Icon
        :name="statusIcon"
        class="size-3.5"
      />
      <span>{{ statusLabel }}</span>
    </div>
  </Tag>
</template>

<script setup lang="ts">
const props = defineProps<{
  status: string
}>()

type TagSeverity = 'primary' | 'warn' | 'danger' | 'secondary'

const { t } = useI18n()

const tagSeverity = computed<TagSeverity>(() => {
  const map: Record<string, TagSeverity> = {
    active: 'primary',
    paused: 'warn',
    expired: 'danger',
    archived: 'secondary',
  }

  return map[props.status] ?? 'secondary'
})

const statusIcon = computed(() => {
  const map: Record<string, string> = {
    active: 'i-lucide-circle-check',
    paused: 'i-lucide-pause-circle',
    archived: 'i-lucide-archive',
    expired: 'i-lucide-clock-3',
  }

  return map[props.status] ?? 'i-lucide-circle'
})

const statusLabel = computed(() => t(`qr.status.${props.status}`))
</script>
