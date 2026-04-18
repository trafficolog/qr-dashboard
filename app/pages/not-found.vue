<template>
  <div class="min-h-screen flex items-center justify-center bg-[color:var(--surface-0)] dark:bg-gray-950 px-4">
    <div class="text-center max-w-sm">
      <img
        src="/splat-logo.svg"
        alt="SPLAT"
        class="h-10 mx-auto mb-8 opacity-80"
      >
      <div class="w-16 h-16 rounded-full bg-[color:color-mix(in_srgb,var(--danger)_16%,transparent)] dark:bg-[color:color-mix(in_srgb,var(--danger)_16%,transparent)] flex items-center justify-center mx-auto mb-4">
        <UIcon
          name="i-lucide-qr-code"
          class="size-8 text-[color:var(--danger)] dark:text-[color:var(--danger)]"
        />
      </div>
      <h1 class="text-xl font-semibold text-[color:var(--text-primary)] dark:text-[color:var(--text-primary)] mb-2">
        QR-код не найден
      </h1>
      <p class="text-sm text-[color:var(--text-muted)] dark:text-[color:var(--text-muted)]">
        Этот QR-код не существует или был удалён.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
</script>
