<template>
  <div class="max-w-6xl space-y-6">
    <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
      Docs UI / Feedback
    </h1>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Alerts states
        </h2>
      </template>
      <div class="space-y-3">
        <UAlert
          icon="i-lucide-check-circle"
          color="success"
          title="Success"
          description="Операция выполнена успешно"
        />
        <UAlert
          icon="i-lucide-info"
          color="info"
          title="Info"
          description="Информационное сообщение"
        />
        <UAlert
          icon="i-lucide-triangle-alert"
          color="warning"
          title="Warning"
          description="Проверьте введённые данные"
        />
        <UAlert
          icon="i-lucide-circle-x"
          color="error"
          title="Error"
          description="Что-то пошло не так"
        />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Badges variants
        </h2>
      </template>
      <div class="flex flex-wrap gap-3">
        <UBadge label="Neutral" />
        <UBadge
          label="Success"
          color="success"
        />
        <UBadge
          label="Warning"
          color="warning"
        />
        <UBadge
          label="Error"
          color="error"
        />
        <UBadge
          label="Soft"
          variant="soft"
        />
        <UBadge
          label="Outline"
          variant="outline"
        />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Loading placeholders
        </h2>
      </template>
      <div class="space-y-3">
        <USkeleton class="h-5 w-1/3" />
        <USkeleton class="h-5 w-2/3" />
        <USkeleton class="h-24 w-full" />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['docs-ui-enabled', 'admin-only'],
})
</script>
