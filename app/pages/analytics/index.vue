<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
        {{ $t('analytics.title') }}
      </h1>
      <p class="mt-1 text-sm text-[color:var(--text-secondary)]">
        {{ $t('analytics.subtitle') }}
      </p>
    </div>

    <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
      <SharedEmptyState
        icon="i-lucide-bar-chart-3"
        :title="$t('analytics.placeholderTitle')"
        :description="$t('analytics.placeholderDescription')"
      >
        <template #action>
          <UButton
            to="/dashboard"
            icon="i-lucide-layout-dashboard"
          >
            {{ $t('analytics.goDashboard') }}
          </UButton>
        </template>
      </SharedEmptyState>
    </UCard>
  </div>
</template>
