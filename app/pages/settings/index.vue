<template>
  <div>
    <h1 class="mb-6 text-2xl font-bold text-[color:var(--text-primary)]">
      Настройки
    </h1>
    <div class="flex flex-col gap-2 max-w-md">
      <UButton
        v-if="isAdmin"
        to="/settings/team"
        variant="soft"
        color="neutral"
        icon="i-lucide-users"
        block
      >
        Команда
      </UButton>
      <UButton
        v-if="isAdmin"
        to="/settings/domains"
        variant="soft"
        color="neutral"
        icon="i-lucide-globe"
        block
      >
        Допустимые домены
      </UButton>
      <p
        v-if="!isAdmin"
        class="text-sm text-[color:var(--text-secondary)]"
      >
        Доступных разделов нет
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth()
const isAdmin = computed(() => user.value?.role === 'admin')
</script>
