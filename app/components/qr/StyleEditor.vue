<template>
  <!-- eslint-disable vue/no-v-html -->
  <div class="space-y-6">
    <!-- Colors -->
    <div>
      <h4 class="mb-3 text-sm font-medium text-[color:var(--text-primary)]">
        Цвета
      </h4>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-1 block text-xs text-[color:var(--text-secondary)]">Основной</label>
          <div class="flex items-center gap-2">
            <input
              type="color"
              :value="style.foregroundColor || '#000000'"
              class="h-8 w-8 cursor-pointer rounded border border-[color:var(--border)]"
              @input="updateStyle('foregroundColor', ($event.target as HTMLInputElement).value)"
            >
            <InputText
              :model-value="style.foregroundColor || '#000000'"
              class="flex-1"
              @update:model-value="updateStyle('foregroundColor', $event)"
            />
          </div>
        </div>
        <div>
          <label class="mb-1 block text-xs text-[color:var(--text-secondary)]">Фон</label>
          <div class="flex items-center gap-2">
            <input
              type="color"
              :value="style.backgroundColor || '#FFFFFF'"
              class="h-8 w-8 cursor-pointer rounded border border-[color:var(--border)]"
              @input="updateStyle('backgroundColor', ($event.target as HTMLInputElement).value)"
            >
            <InputText
              :model-value="style.backgroundColor || '#FFFFFF'"
              class="flex-1"
              @update:model-value="updateStyle('backgroundColor', $event)"
            />
          </div>
        </div>
        <div>
          <label class="mb-1 block text-xs text-[color:var(--text-secondary)]">Углы</label>
          <div class="flex items-center gap-2">
            <input
              type="color"
              :value="style.cornerColor || style.foregroundColor || '#000000'"
              class="h-8 w-8 cursor-pointer rounded border border-[color:var(--border)]"
              @input="updateStyle('cornerColor', ($event.target as HTMLInputElement).value)"
            >
            <InputText
              :model-value="style.cornerColor || style.foregroundColor || '#000000'"
              class="flex-1"
              @update:model-value="updateStyle('cornerColor', $event)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Module Style -->
    <div>
      <h4 class="mb-3 text-sm font-medium text-[color:var(--text-primary)]">
        Стиль модулей
      </h4>
      <div class="grid grid-cols-5 gap-2">
        <button
          v-for="ms in moduleStyles"
          :key="ms.value"
          :class="[
            'flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-interactive',
            style.moduleStyle === ms.value
              ? 'border-[color:var(--accent)] bg-[color:var(--accent-light)] text-[color:var(--accent)]'
              : 'border-[color:var(--border)] text-[color:var(--text-secondary)] hover:border-[color:var(--accent)]/40 hover:bg-[color:var(--surface-2)]',
          ]"
          @click="updateStyle('moduleStyle', ms.value)"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div
            class="w-6 h-6"
            v-html="ms.icon"
          />
          <span class="text-[10px] text-[color:var(--text-secondary)]">{{ ms.label }}</span>
        </button>
      </div>
    </div>

    <!-- Corner Style -->
    <div>
      <h4 class="mb-3 text-sm font-medium text-[color:var(--text-primary)]">
        Стиль углов
      </h4>
      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="cs in cornerStyles"
          :key="cs.value"
          :class="[
            'flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-interactive',
            style.cornerStyle === cs.value
              ? 'border-[color:var(--accent)] bg-[color:var(--accent-light)] text-[color:var(--accent)]'
              : 'border-[color:var(--border)] text-[color:var(--text-secondary)] hover:border-[color:var(--accent)]/40 hover:bg-[color:var(--surface-2)]',
          ]"
          @click="updateStyle('cornerStyle', cs.value)"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div
            class="w-6 h-6"
            v-html="cs.icon"
          />
          <span class="text-[10px] text-[color:var(--text-secondary)]">{{ cs.label }}</span>
        </button>
      </div>
    </div>

    <!-- Error Correction -->
    <div>
      <h4 class="mb-3 text-sm font-medium text-[color:var(--text-primary)]">
        Коррекция ошибок
      </h4>
      <Select
        :model-value="style.errorCorrectionLevel || 'M'"
        :options="errorLevels"
        option-label="label"
        option-value="value"
        @update:model-value="updateStyle('errorCorrectionLevel', $event)"
      />
    </div>
  </div>
  <!-- eslint-enable vue/no-v-html -->
</template>

<script setup lang="ts">
import type { QrStyle } from '#shared/types/qr'

const props = defineProps<{
  modelValue: Partial<QrStyle>
}>()

const emit = defineEmits<{
  'update:modelValue': [style: Partial<QrStyle>]
}>()

const style = computed(() => props.modelValue)

function updateStyle(key: string, value: string | undefined) {
  if (value === undefined) return
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const moduleStyles = [
  { value: 'square', label: 'Квадрат', icon: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" fill="currentColor"/><rect x="13" y="4" width="7" height="7" fill="currentColor"/><rect x="4" y="13" width="7" height="7" fill="currentColor"/></svg>' },
  { value: 'rounded', label: 'Скруглён', icon: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="2" fill="currentColor"/><rect x="13" y="4" width="7" height="7" rx="2" fill="currentColor"/><rect x="4" y="13" width="7" height="7" rx="2" fill="currentColor"/></svg>' },
  { value: 'dots', label: 'Точки', icon: '<svg viewBox="0 0 24 24"><circle cx="7.5" cy="7.5" r="3.5" fill="currentColor"/><circle cx="16.5" cy="7.5" r="3.5" fill="currentColor"/><circle cx="7.5" cy="16.5" r="3.5" fill="currentColor"/></svg>' },
  { value: 'classy', label: 'Классик', icon: '<svg viewBox="0 0 24 24"><path d="M4 4h7v5a2 2 0 01-2 2H4V4z" fill="currentColor"/><rect x="13" y="4" width="7" height="7" fill="currentColor"/><rect x="4" y="13" width="7" height="7" fill="currentColor"/></svg>' },
  { value: 'classy-rounded', label: 'Класс.R', icon: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="3.5" fill="currentColor"/><rect x="13" y="4" width="7" height="7" rx="3.5" fill="currentColor"/><rect x="4" y="13" width="7" height="7" rx="3.5" fill="currentColor"/></svg>' },
]

const cornerStyles = [
  { value: 'square', label: 'Квадрат', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="7" y="7" width="10" height="10" fill="currentColor"/></svg>' },
  { value: 'rounded', label: 'Скруглён', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/></svg>' },
  { value: 'dot', label: 'Круг', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="12" cy="12" r="5" fill="currentColor"/></svg>' },
  { value: 'extra-rounded', label: 'Экстра', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="7" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="7" y="7" width="10" height="10" rx="3" fill="currentColor"/></svg>' },
]

const errorLevels = [
  { label: 'L — Низкая (7%)', value: 'L' },
  { label: 'M — Средняя (15%)', value: 'M' },
  { label: 'Q — Высокая (25%)', value: 'Q' },
  { label: 'H — Максимальная (30%, для лого)', value: 'H' },
]
</script>
