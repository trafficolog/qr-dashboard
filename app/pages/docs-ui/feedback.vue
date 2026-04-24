<template>
  <div class="max-w-6xl space-y-6">
    <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
      Docs UI / Feedback
    </h1>

    <section class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5 space-y-3">
      <h2 class="font-semibold">
        Messages
      </h2>
      <Message severity="success">
        Операция выполнена успешно
      </Message>
      <Message severity="info">
        Информационное сообщение
      </Message>
      <Message severity="warn">
        Проверьте введённые данные
      </Message>
      <Message severity="error">
        Что-то пошло не так
      </Message>
    </section>

    <section class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
      <h2 class="mb-3 font-semibold">
        Tags
      </h2>
      <div class="flex flex-wrap gap-2">
        <Tag
          value="Neutral"
          severity="secondary"
        />
        <Tag
          value="Success"
          severity="success"
        />
        <Tag
          value="Warning"
          severity="warn"
        />
        <Tag
          value="Error"
          severity="danger"
        />
      </div>
    </section>

    <section class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
      <h2 class="mb-3 font-semibold">
        Skeletons
      </h2>
      <div class="space-y-3">
        <Skeleton class="h-5 w-1/3" /><Skeleton class="h-5 w-2/3" /><Skeleton class="h-24 w-full" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['docs-ui-enabled', 'admin-only'] })
</script>
