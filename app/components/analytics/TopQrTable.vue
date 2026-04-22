<template>
  <div>
    <div
      v-if="loading"
      class="space-y-2"
    >
      <div
        v-for="i in 5"
        :key="i"
        class="h-12 animate-pulse rounded bg-[color:var(--surface-2)]"
      />
    </div>

    <div
      v-else-if="!data.length"
      class="py-10 text-center text-[color:var(--text-muted)]"
    >
      <Icon
        name="i-lucide-qr-code"
        class="mx-auto mb-2 size-10"
      />
      <p class="text-sm">
        Нет данных за выбранный период
      </p>
    </div>

    <div
      v-else
      class="overflow-x-auto"
    >
      <table
        class="w-full text-sm"
        role="table"
      >
        <thead>
          <tr class="border-b border-[color:var(--border)]">
            <th
              scope="col"
              class="w-8 py-2 pr-4 text-left font-medium text-[color:var(--text-muted)]"
            >
              #
            </th>
            <th
              scope="col"
              class="py-2 pr-4 text-left font-medium text-[color:var(--text-muted)]"
            >
              QR-код
            </th>
            <th
              scope="col"
              class="whitespace-nowrap py-2 pr-4 text-right font-medium text-[color:var(--text-muted)]"
            >
              Всего
            </th>
            <th
              scope="col"
              class="whitespace-nowrap py-2 text-right font-medium text-[color:var(--text-muted)]"
            >
              Уникальных
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(qr, idx) in data"
            :key="qr.id"
            class="transition-interactive border-b border-[color:var(--border)]/60 hover:bg-[color:var(--surface-2)]/30"
          >
            <td class="tabular-nums py-2.5 pr-4 text-[color:var(--text-muted)]">
              {{ idx + 1 }}
            </td>
            <td class="py-2.5 pr-4">
              <NuxtLink
                :to="`/qr/${qr.id}`"
                class="transition-interactive font-medium text-[color:var(--text-primary)] hover:text-[color:var(--color-success)]"
              >
                {{ qr.title || qr.shortCode }}
              </NuxtLink>
              <p class="mt-0.5 text-xs text-[color:var(--text-muted)]">
                {{ qr.shortCode }}
              </p>
            </td>
            <td class="tabular-nums py-2.5 pr-4 text-right font-medium text-[color:var(--text-primary)]">
              {{ qr.totalScans.toLocaleString('ru-RU') }}
            </td>
            <td class="tabular-nums py-2.5 text-right text-[color:var(--text-muted)]">
              {{ qr.uniqueScans.toLocaleString('ru-RU') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TopQrCode } from '#shared/types/analytics'

defineProps<{
  data: readonly TopQrCode[]
  loading?: boolean
}>()
</script>
