<template>
  <div class="max-w-6xl space-y-6">
    <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
      Docs UI / Forms
    </h1>

    <section class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
      <h2 class="mb-3 font-semibold">
        Inputs / Textarea / Select
      </h2>
      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-1">
          <label>Default input</label><InputText
            placeholder="Type something..."
            class="w-full"
          />
        </div>
        <div class="space-y-1">
          <label>Password</label><Password
            placeholder="Password"
            :feedback="false"
            toggle-mask
            class="w-full"
          />
        </div>
        <div class="space-y-1">
          <label>Textarea</label><Textarea
            placeholder="Комментарий"
            :rows="4"
            class="w-full"
          />
        </div>
        <div class="space-y-1">
          <label>Select</label><Select
            :options="selectItems"
            placeholder="Выберите вариант"
            class="w-full"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['docs-ui-enabled', 'admin-only'] })
const selectItems = ['Default', 'Option A', 'Option B']
</script>
