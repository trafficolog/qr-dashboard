<template>
  <UCard>
    <!-- Skeleton -->
    <div
      v-if="loading"
      class="flex items-center gap-3"
    >
      <div class="size-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse shrink-0" />
      <div class="flex-1 space-y-2">
        <div class="h-7 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        <div class="h-4 w-28 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    </div>

    <!-- Content -->
    <div
      v-else
      class="flex items-start gap-3"
      :data-motion-enabled="!props.reducedMotion"
    >
      <div class="p-2 rounded-lg bg-green-50 dark:bg-green-950 shrink-0">
        <UIcon
          :name="icon"
          class="size-5 text-green-600 dark:text-green-400"
        />
      </div>
      <div class="min-w-0">
        <p class="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
          {{ formattedValue }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ label }}
        </p>
        <div
          v-if="change !== undefined"
          class="flex items-center gap-1 mt-1"
        >
          <UIcon
            :name="change >= 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
            class="size-3.5"
            :class="change >= 0 ? 'text-green-500' : 'text-red-500'"
          />
          <span
            class="text-xs font-medium"
            :class="change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
          >
            {{ change >= 0 ? '+' : '' }}{{ change }}% vs прошлый период
          </span>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps<{
  icon: string
  label: string
  value?: number | string
  change?: number
  loading?: boolean
  reducedMotion?: boolean
}>()

const formattedValue = computed(() => {
  if (props.value === undefined || props.value === null) return '—'
  if (typeof props.value === 'string') return props.value
  return props.value.toLocaleString('ru-RU')
})
</script>
