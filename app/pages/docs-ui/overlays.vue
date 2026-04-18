<template>
  <div class="max-w-6xl space-y-6">
    <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
      Docs UI / Overlays
    </h1>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Modal states
        </h2>
      </template>
      <div class="flex flex-wrap gap-3">
        <UButton
          label="Open default modal"
          @click="defaultOpen = true"
        />
        <UButton
          label="Open loading modal"
          color="warning"
          @click="loadingOpen = true"
        />
        <UButton
          label="Disabled trigger"
          disabled
        />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Dropdown variants
        </h2>
      </template>
      <div class="flex flex-wrap gap-3">
        <UDropdownMenu :items="dropdownItems">
          <UButton
            label="Default menu"
            variant="outline"
          />
        </UDropdownMenu>

        <UDropdownMenu :items="dropdownItemsDisabled">
          <UButton
            label="With disabled item"
            variant="soft"
            color="neutral"
          />
        </UDropdownMenu>
      </div>
    </UCard>

    <UModal v-model:open="defaultOpen">
      <template #header>
        <h3 class="text-base font-semibold">
          Default modal
        </h3>
      </template>
      <p class="text-sm text-[color:var(--text-secondary)]">
        Базовое состояние модального окна.
      </p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            label="Close"
            variant="outline"
            color="neutral"
            @click="defaultOpen = false"
          />
          <UButton
            label="Action"
            @click="defaultOpen = false"
          />
        </div>
      </template>
    </UModal>

    <UModal v-model:open="loadingOpen">
      <template #header>
        <h3 class="text-base font-semibold">
          Loading modal
        </h3>
      </template>
      <p class="text-sm text-[color:var(--text-secondary)]">
        Демонстрация loading-состояния кнопки в футере.
      </p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            variant="outline"
            color="neutral"
            @click="loadingOpen = false"
          />
          <UButton
            label="Saving..."
            loading
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['docs-ui-enabled', 'admin-only'],
})

const defaultOpen = ref(false)
const loadingOpen = ref(false)

const dropdownItems = [
  [
    { label: 'Edit', icon: 'i-lucide-pencil' },
    { label: 'Duplicate', icon: 'i-lucide-copy' },
  ],
  [
    { label: 'Delete', icon: 'i-lucide-trash', color: 'error' as const },
  ],
]

const dropdownItemsDisabled = [
  [
    { label: 'Open', icon: 'i-lucide-folder-open' },
    { label: 'Coming soon', icon: 'i-lucide-clock', disabled: true },
  ],
]
</script>
