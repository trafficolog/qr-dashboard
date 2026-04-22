<template>
  <Message
    v-if="hasDraft"
    severity="info"
    :closable="false"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <Icon
          name="i-lucide-history"
          class="size-4"
        />
        <div>
          <p class="font-medium">
            {{ $t('forms.draft.restored') }}
          </p>
          <p class="text-sm opacity-80">
            {{ savedAgo }}
          </p>
        </div>
      </div>
      <div class="flex gap-2">
        <Button
          size="small"
          @click="emit('restore')"
        >
          <template #icon>
            <Icon
              name="i-lucide-rotate-ccw"
              class="size-4"
            />
          </template>
          {{ $t('forms.draft.keep') }}
        </Button>
        <Button
          size="small"
          text
          severity="secondary"
          @click="emit('discard')"
        >
          <template #icon>
            <Icon
              name="i-lucide-x"
              class="size-4"
            />
          </template>
          {{ $t('forms.draft.discard') }}
        </Button>
      </div>
    </div>
  </Message>
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
