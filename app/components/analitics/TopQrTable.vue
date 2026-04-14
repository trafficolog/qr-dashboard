<template>
  <div>
    <!-- Skeleton -->
    <div
      v-if="loading"
      class="space-y-2"
    >
      <div
        v-for="i in 5"
        :key="i"
        class="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
      />
    </div>

    <!-- Empty -->
    <div
      v-else-if="!data.length"
      class="py-10 text-center text-gray-400 dark:text-gray-600"
    >
      <UIcon
        name="i-lucide-qr-code"
        class="size-10 mx-auto mb-2"
      />
      <p class="text-sm">
        Нет данных за выбранный период
      </p>
    </div>

    <!-- Table -->
    <div
      v-else
      class="overflow-x-auto"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100 dark:border-gray-800">
            <th class="py-2 pr-4 text-left font-medium text-gray-500 dark:text-gray-400 w-8">
              #
            </th>
            <th class="py-2 pr-4 text-left font-medium text-gray-500 dark:text-gray-400">
              QR-код
            </th>
            <th class="py-2 pr-4 text-right font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Всего
            </th>
            <th class="py-2 text-right font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Уникальных
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(qr, idx) in data"
            :key="qr.id"
            class="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
          >
            <td class="py-2.5 pr-4 text-gray-400 dark:text-gray-600 tabular-nums">
              {{ idx + 1 }}
            </td>
            <td class="py-2.5 pr-4">
              <NuxtLink
                :to="`/qr/${qr.id}`"
                class="font-medium text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                {{ qr.title || qr.shortCode }}
              </NuxtLink>
              <p class="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                {{ qr.shortCode }}
              </p>
            </td>
            <td class="py-2.5 pr-4 text-right tabular-nums font-medium text-gray-900 dark:text-white">
              {{ qr.totalScans.toLocaleString('ru-RU') }}
            </td>
            <td class="py-2.5 text-right tabular-nums text-gray-500 dark:text-gray-400">
              {{ qr.uniqueScans.toLocaleString('ru-RU') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TopQrCode } from '~~/types/analytics'

defineProps<{
  data: TopQrCode[]
  loading?: boolean
}>()
</script>
