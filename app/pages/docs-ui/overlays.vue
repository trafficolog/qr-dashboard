<template>
  <div class="max-w-6xl space-y-6">
    <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
      Docs UI / Overlays
    </h1>

    <section class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
      <h2 class="mb-3 font-semibold">
        Dialog states
      </h2>
      <div class="flex flex-wrap gap-3">
        <Button
          label="Open default dialog"
          @click="defaultOpen = true"
        />
        <Button
          label="Open loading dialog"
          severity="warn"
          @click="loadingOpen = true"
        />
      </div>
    </section>

    <Dialog
      v-model:visible="defaultOpen"
      modal
      header="Default dialog"
      :style="{ width: '30rem' }"
    >
      <p class="text-sm text-[color:var(--text-secondary)]">
        Базовое состояние диалога.
      </p>
      <template #footer>
        <Button
          outlined
          severity="secondary"
          label="Close"
          @click="defaultOpen = false"
        />
        <Button
          label="Action"
          @click="defaultOpen = false"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="loadingOpen"
      modal
      header="Loading dialog"
      :style="{ width: '30rem' }"
    >
      <p class="text-sm text-[color:var(--text-secondary)]">
        Демонстрация loading-состояния кнопки.
      </p>
      <template #footer>
        <Button
          outlined
          severity="secondary"
          label="Cancel"
          @click="loadingOpen = false"
        />
        <Button
          label="Saving..."
          loading
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { createDialogFocusReturn } from '~/utils/dialog-focus-return'

definePageMeta({ middleware: ['docs-ui-enabled', 'admin-only'] })
const defaultOpen = ref(false)
const loadingOpen = ref(false)
const defaultFocusReturn = createDialogFocusReturn()
const loadingFocusReturn = createDialogFocusReturn()
watch(defaultOpen, open => (open ? defaultFocusReturn.save() : defaultFocusReturn.restore()))
watch(loadingOpen, open => (open ? loadingFocusReturn.save() : loadingFocusReturn.restore()))
</script>
