<template>
  <UAlert
    v-if="hasDraft"
    icon="i-lucide-history"
    color="info"
    variant="soft"
    :title="$t('forms.draft.restored')"
    :description="savedAgo"
  >
    <template #actions>
      <div class="flex gap-2">
        <UButton
          size="xs"
          color="info"
          variant="solid"
          icon="i-lucide-rotate-ccw"
          :label="$t('forms.draft.keep')"
          @click="emit('restore')"
        />
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          :label="$t('forms.draft.discard')"
          @click="emit('discard')"
        />
      </div>
    </template>
  </UAlert>
</template>

<script setup lang="ts">
const props = defineProps<{
  hasDraft: boolean
  savedAt: string | null
}>()

const emit = defineEmits<{
  restore: []
  discard: []
}>()

const { t, locale } = useI18n()

const savedAgo = computed(() => {
  if (!props.savedAt) return ''
  const date = new Date(props.savedAt)
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  const loc = locale.value === 'ru' ? 'ru-RU' : 'en-US'

  if (minutes < 1) {
    return t('forms.draft.justNow')
  }
  if (minutes < 60) {
    return t('forms.draft.minutesAgo', { n: minutes })
  }
  return t('forms.draft.savedAt', { time: date.toLocaleString(loc) })
})
</script>
