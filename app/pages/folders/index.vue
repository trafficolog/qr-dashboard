<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
        Папки
      </h1>
      <p class="mt-1 text-sm text-[color:var(--text-secondary)]">
        Отдельный модуль управления папками запланирован на следующий этап.
      </p>
    </div>

    <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
      <SharedEmptyState
        icon="i-lucide-folder-open"
        title="Функциональность папок ещё не вынесена в отдельный раздел"
        description="На текущем этапе папки существуют на уровне схемы БД и используются как часть QR-модели. Полноценный интерфейс управления папками запланирован отдельным эпиком."
      >
        <template #action>
          <UButton
            to="/qr"
            icon="i-lucide-qr-code"
          >
            Перейти к QR-кодам
          </UButton>
        </template>
      </SharedEmptyState>
    </UCard>
  </div>
</template>
