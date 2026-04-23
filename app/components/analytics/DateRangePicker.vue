<template>
  <div class="flex flex-wrap items-center gap-2">
    <div class="flex gap-1">
      <Button
        v-for="preset in presets"
        :key="preset.key"
        :severity="activePreset === preset.key ? 'primary' : 'secondary'"
        :outlined="activePreset !== preset.key"
        size="small"
        @click="applyPreset(preset)"
      >
        {{ preset.label }}
      </Button>
    </div>

    <div class="ml-2 flex items-center gap-2">
      <InputText
        v-model="fromInput"
        type="date"
        size="small"
        :max="toInput"
        @change="onCustomChange"
      />
      <span class="text-sm text-[color:var(--text-muted)]">—</span>
      <InputText
        v-model="toInput"
        type="date"
        size="small"
        :min="fromInput"
        :max="todayStr"
        @change="onCustomChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DateRange } from '#shared/types/analytics'

const props = defineProps<{
  modelValue: DateRange
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DateRange]
}>()

const todayStr = new Date().toISOString().split('T')[0]!

const presets = [
  { key: 'today', label: 'Сегодня', days: 0 },
  { key: '7d', label: '7 дней', days: 7 },
  { key: '30d', label: '30 дней', days: 30 },
  { key: '90d', label: '90 дней', days: 90 },
  { key: 'year', label: 'Год', days: 365 },
] as const

type PresetKey = typeof presets[number]['key']

const activePreset = ref<PresetKey | 'custom'>('30d')

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]!
}

function presetRange(days: number): DateRange {
  const to = new Date()
  const from = days === 0 ? new Date() : new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return { from: toDateStr(from), to: toDateStr(to) }
}

// Sync inputs with modelValue
const fromInput = ref(props.modelValue.from)
const toInput = ref(props.modelValue.to)

watch(() => props.modelValue, (v) => {
  fromInput.value = v.from
  toInput.value = v.to
})

function applyPreset(preset: { key: PresetKey, days: number }) {
  activePreset.value = preset.key
  const range = presetRange(preset.days)
  fromInput.value = range.from
  toInput.value = range.to
  emit('update:modelValue', range)
}

function onCustomChange() {
  if (fromInput.value && toInput.value) {
    activePreset.value = 'custom'
    emit('update:modelValue', { from: fromInput.value, to: toInput.value })
  }
}
</script>
