<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
    <div class="text-center max-w-sm">
      <img
        src="/splat-logo.svg"
        alt="SPLAT"
        class="h-10 mx-auto mb-8 opacity-80"
      >
      <div class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto mb-4">
        <UIcon
          name="i-lucide-qr-code"
          class="size-8 text-red-500 dark:text-red-400"
        />
      </div>
      <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        QR-код не найден
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Этот QR-код не существует или был удалён.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
</script>
