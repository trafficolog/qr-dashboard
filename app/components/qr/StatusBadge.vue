<template>
  <UBadge
    :color="badgeColor"
    variant="subtle"
    size="sm"
  >
    <UIcon
      :name="statusIcon"
      class="size-3.5 mr-1"
    />
    {{ statusLabel }}
  </UBadge>
</template>

<script setup lang="ts">
const props = defineProps<{
  status: string
}>()

type BadgeColor = 'primary' | 'warning' | 'error' | 'neutral'

const { t } = useI18n()

const badgeColor = computed<BadgeColor>(() => {
  const map: Record<string, BadgeColor> = {
    active: 'primary',
    paused: 'warning',
    expired: 'error',
    archived: 'neutral',
  }

  return map[props.status] ?? 'neutral'
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
