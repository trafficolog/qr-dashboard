<template>
  <div class="flex items-center justify-between gap-4 pt-4">
    <p class="whitespace-nowrap text-sm text-[color:var(--text-secondary)]">
      Показано {{ from }}–{{ to }} из {{ total }}
    </p>
    <div class="flex items-center gap-1">
      <Button
        severity="secondary"
        outlined
        size="small"
        aria-label="Предыдущая страница"
        title="Предыдущая страница"
        :disabled="page <= 1"
        @click="$emit('update:page', page - 1)"
      >
        <Icon
          name="i-lucide-chevron-left"
          class="size-4"
        />
      </Button>

      <Button
        v-for="p in visiblePages"
        :key="p"
        size="small"
        :severity="p === page ? 'primary' : 'secondary'"
        :outlined="p !== page"
        @click="$emit('update:page', p)"
      >
        {{ p }}
      </Button>

      <Button
        severity="secondary"
        outlined
        size="small"
        aria-label="Следующая страница"
        title="Следующая страница"
        :disabled="page >= totalPages"
        @click="$emit('update:page', page + 1)"
      >
        <Icon
          name="i-lucide-chevron-right"
          class="size-4"
        />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  page: number
  limit: number
  total: number
  totalPages: number
}>()

defineEmits<{
  'update:page': [page: number]
}>()

const from = computed(() => Math.min((props.page - 1) * props.limit + 1, props.total))
const to = computed(() => Math.min(props.page * props.limit, props.total))

const visiblePages = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, props.page - 2)
  const end = Math.min(props.totalPages, props.page + 2)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})
</script>
