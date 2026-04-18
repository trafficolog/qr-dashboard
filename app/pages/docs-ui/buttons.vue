<template>
  <div class="max-w-6xl space-y-6">
    <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
      Docs UI / Buttons
    </h1>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Variants
        </h2>
      </template>
      <div class="flex flex-wrap gap-3">
        <UButton label="Solid" />
        <UButton
          label="Outline"
          variant="outline"
        />
        <UButton
          label="Soft"
          variant="soft"
        />
        <UButton
          label="Ghost"
          variant="ghost"
        />
        <UButton
          label="Link"
          variant="link"
        />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Colors & states
        </h2>
      </template>
      <div class="flex flex-wrap gap-3">
        <UButton
          label="Success"
          color="success"
        />
        <UButton
          label="Warning"
          color="warning"
        />
        <UButton
          label="Error"
          color="error"
        />
        <UButton
          label="Disabled"
          disabled
        />
        <UButton
          label="Loading"
          loading
        />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Sizes
        </h2>
      </template>
      <div class="flex flex-wrap items-center gap-3">
        <UButton
          label="XS"
          size="xs"
        />
        <UButton
          label="SM"
          size="sm"
        />
        <UButton
          label="MD"
          size="md"
        />
        <UButton
          label="LG"
          size="lg"
        />
        <UButton
          label="XL"
          size="xl"
        />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['docs-ui-enabled', 'admin-only'],
})
</script>
