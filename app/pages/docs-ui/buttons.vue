<template>
  <div class="max-w-6xl space-y-6">
    <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
      Docs UI / Buttons
    </h1>

    <section class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
      <h2 class="mb-3 font-semibold">
        Variants
      </h2>
      <div class="flex flex-wrap gap-3">
        <Button label="Solid" />
        <Button
          label="Outline"
          outlined
        />
        <Button
          label="Text"
          text
          severity="secondary"
        />
        <Button
          label="Link"
          link
        />
      </div>
    </section>

    <section class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
      <h2 class="mb-3 font-semibold">
        Colors & states
      </h2>
      <div class="flex flex-wrap gap-3">
        <Button
          label="Success"
          severity="success"
        />
        <Button
          label="Warning"
          severity="warn"
        />
        <Button
          label="Danger"
          severity="danger"
        />
        <Button
          label="Disabled"
          disabled
        />
        <Button
          label="Loading"
          loading
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['docs-ui-enabled', 'admin-only'] })
</script>
