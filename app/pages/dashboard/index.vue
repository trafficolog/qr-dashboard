<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
        {{ $t('nav.dashboard') }}
      </h1>
    </div>

    <!-- Stat cards placeholder -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <UCard
        v-for="stat in stats"
        :key="stat.label"
        class="border border-[color:var(--border)] bg-[color:var(--surface-0)]"
      >
        <div class="flex items-center gap-3">
          <div class="rounded-lg bg-[color:var(--accent-light)] p-2">
            <UIcon
              :name="stat.icon"
              class="size-5 text-[color:var(--accent)]"
            />
          </div>
          <div>
            <p class="text-2xl font-bold text-[color:var(--text-primary)]">
              {{ stat.value }}
            </p>
            <p class="text-sm text-[color:var(--text-secondary)]">
              {{ stat.label }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Quick actions -->
    <div class="flex gap-3">
      <UButton
        icon="i-lucide-plus"
        label="Создать QR"
        to="/qr/create"
      />
      <UButton
        icon="i-lucide-qr-code"
        label="Все QR-коды"
        to="/qr"
        variant="outline"
      />
    </div>

    <!-- Placeholder for charts (Epic 6) -->
    <UCard class="mt-8 border border-[color:var(--border)] bg-[color:var(--surface-0)]">
      <div class="flex h-64 items-center justify-center text-[color:var(--text-muted)]">
        <div class="text-center">
          <UIcon
            name="i-lucide-bar-chart-3"
            class="size-12 mx-auto mb-2"
          />
          <p>График сканирований — будет реализован в Эпике 6</p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const stats = [
  { label: 'Всего QR', value: '—', icon: 'i-lucide-qr-code' },
  { label: 'Всего сканирований', value: '—', icon: 'i-lucide-scan-line' },
  { label: 'Уникальных', value: '—', icon: 'i-lucide-users' },
  { label: 'Сегодня', value: '—', icon: 'i-lucide-trending-up' },
]
</script>
