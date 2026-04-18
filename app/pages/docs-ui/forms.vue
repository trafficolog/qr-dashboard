<template>
  <div class="max-w-6xl space-y-6">
    <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
      Docs UI / Forms
    </h1>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Inputs: default / hint / error / disabled
        </h2>
      </template>
      <div class="grid gap-4 md:grid-cols-2">
        <UFormField label="Default input">
          <UInput placeholder="Type something..." />
        </UFormField>

        <UFormField
          label="With hint"
          hint="Hint: minimum 8 characters"
        >
          <UInput placeholder="Password" />
        </UFormField>

        <UFormField
          label="With error"
          error="Обязательное поле"
        >
          <UInput placeholder="Email" />
        </UFormField>

        <UFormField label="Disabled">
          <UInput
            model-value="readonly@example.com"
            disabled
          />
        </UFormField>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Sizes
        </h2>
      </template>
      <div class="space-y-3">
        <UInput
          placeholder="Size xs"
          size="xs"
        />
        <UInput
          placeholder="Size sm"
          size="sm"
        />
        <UInput
          placeholder="Size md"
          size="md"
        />
        <UInput
          placeholder="Size lg"
          size="lg"
        />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Textarea & Select variants
        </h2>
      </template>
      <div class="grid gap-4 md:grid-cols-2">
        <UFormField label="Textarea">
          <UTextarea
            placeholder="Комментарий"
            :rows="4"
          />
        </UFormField>

        <UFormField label="Select">
          <USelect
            :items="selectItems"
            placeholder="Выберите вариант"
          />
        </UFormField>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['docs-ui-enabled', 'admin-only'],
})

const selectItems = ['Default', 'Option A', 'Option B']
</script>
