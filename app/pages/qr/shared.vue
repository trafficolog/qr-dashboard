<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
        Общие QR
      </h1>
      <p class="mt-0.5 text-sm text-[color:var(--text-secondary)]">
        Публичные QR-коды компании
      </p>
    </div>

    <div
      v-if="pending"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <USkeleton
        v-for="i in 8"
        :key="i"
        class="h-72 rounded-lg"
      />
    </div>

    <SharedEmptyState
      v-else-if="sharedQr.length === 0"
      icon="i-lucide-globe"
      title="Публичных QR пока нет"
      description="Администратор может назначить видимость QR как Public, и он появится здесь."
    />

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <QrCard
        v-for="qr in sharedQr"
        :key="qr.id"
        :qr="qr as any"
        @edit="navigateTo(`/qr/${$event}/edit`)"
        @duplicate="handleDuplicate"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QrCode } from '~~/types/qr'

const toast = useA11yToast()
const { duplicateQr, deleteQr } = useQr()

const { data, pending, refresh } = await useFetch<{ data: QrCode[] }>('/api/qr/shared')

const sharedQr = computed(() => data.value?.data ?? [])

async function handleDuplicate(id: string) {
  try {
    const qr = await duplicateQr(id)
    toast.add({ title: `QR «${qr.title}» создан`, color: 'success' })
    refresh()
  }
  catch {
    toast.add({ title: 'Ошибка дублирования', color: 'error' })
  }
}

async function handleDelete(id: string) {
  try {
    await deleteQr(id)
    toast.add({ title: 'QR удалён', color: 'success' })
    refresh()
  }
  catch {
    toast.add({ title: 'Ошибка удаления', color: 'error' })
  }
}
</script>
