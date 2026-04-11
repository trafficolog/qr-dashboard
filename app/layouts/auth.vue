<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <img src="/splat-logo.svg" alt="SPLAT" class="h-10 mx-auto mb-4" />
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ $t('app.name') }}
        </h1>
      </div>
      <UCard class="shadow-lg">
        <slot />
      </UCard>
    </div>
  </div>
</template>
