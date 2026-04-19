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
        class="h-12 bg-[color:var(--surface-2)] dark:bg-[color:var(--surface-2)] rounded animate-pulse"
      />
    </div>

    <!-- Empty -->
    <div
      v-else-if="!data.length"
      class="py-10 text-center text-[color:var(--text-muted)] dark:text-[color:var(--text-secondary)]"
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
      <table
        class="w-full text-sm"
        role="table"
      >
        <thead>
          <tr class="border-b border-[color:var(--border)] dark:border-[color:var(--border)]">
            <th
              scope="col"
              class="py-2 pr-4 text-left font-medium text-[color:var(--text-muted)] dark:text-[color:var(--text-muted)] w-8"
            >
              #
            </th>
            <th
              scope="col"
              class="py-2 pr-4 text-left font-medium text-[color:var(--text-muted)] dark:text-[color:var(--text-muted)]"
            >
              QR-код
            </th>
            <th
              scope="col"
              class="py-2 pr-4 text-right font-medium text-[color:var(--text-muted)] dark:text-[color:var(--text-muted)] whitespace-nowrap"
            >
              Всего
            </th>
            <th
              scope="col"
              class="py-2 text-right font-medium text-[color:var(--text-muted)] dark:text-[color:var(--text-muted)] whitespace-nowrap"
            >
              Уникальных
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(qr, idx) in data"
            :key="qr.id"
            class="border-b border-[color:var(--border)]/60 dark:border-[color:var(--border)]/60 hover:bg-[color:var(--surface-0)] dark:hover:bg-[color:var(--surface-2)]/30 transition-colors"
          >
            <td class="py-2.5 pr-4 text-[color:var(--text-muted)] dark:text-[color:var(--text-secondary)] tabular-nums">
              {{ idx + 1 }}
            </td>
            <td class="py-2.5 pr-4">
              <NuxtLink
                :to="`/qr/${qr.id}`"
                class="font-medium text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)] hover:text-[color:var(--color-success)] dark:hover:text-[color:var(--color-success)] transition-colors"
              >
                {{ qr.title || qr.shortCode }}
              </NuxtLink>
              <p class="text-xs text-[color:var(--text-muted)] dark:text-[color:var(--text-secondary)] mt-0.5">
                {{ qr.shortCode }}
              </p>
            </td>
            <td class="py-2.5 pr-4 text-right tabular-nums font-medium text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)]">
              {{ qr.totalScans.toLocaleString('ru-RU') }}
            </td>
            <td class="py-2.5 text-right tabular-nums text-[color:var(--text-muted)] dark:text-[color:var(--text-muted)]">
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
  data: readonly TopQrCode[]
  loading?: boolean
}>()
</script>
