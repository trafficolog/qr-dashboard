<template>
  <div class="space-y-4">
    <!-- Traffic distribution bar -->
    <div v-if="localDests.length > 0">
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
        Распределение трафика
      </p>
      <div class="flex h-3 w-full overflow-hidden rounded-full">
        <div
          v-for="(d, i) in activeDests"
          :key="d.id ?? i"
          :style="{ width: `${barWidth(d)}%`, backgroundColor: barColor(i) }"
          :title="`${d.label || `Вариант ${i + 1}`}: ${d.weight}%`"
          class="transition-all"
        />
      </div>
      <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
        <div
          v-for="(d, i) in activeDests"
          :key="d.id ?? i"
          class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
        >
          <span
            class="inline-block size-2.5 rounded-full shrink-0"
            :style="{ backgroundColor: barColor(i) }"
          />
          {{ d.label || `Вариант ${i + 1}` }}: {{ d.weight }}%
        </div>
      </div>

      <!-- Weight sum warning -->
      <UAlert
        v-if="totalActiveWeight !== 100 && localDests.some(d => d.isActive)"
        icon="i-lucide-alert-triangle"
        color="warning"
        variant="soft"
        :description="`Сумма весов активных вариантов: ${totalActiveWeight}% (должна быть 100%)`"
        class="mt-3"
      />
    </div>

    <!-- Destination rows -->
    <div class="space-y-3">
      <div
        v-for="(dest, idx) in localDests"
        :key="dest.id ?? `new-${idx}`"
        class="rounded-lg border p-3 space-y-3 transition-colors"
        :class="dest.isActive
          ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
          : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 opacity-60'"
      >
        <!-- Row header -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span
              class="inline-block size-3 rounded-full shrink-0"
              :style="{ backgroundColor: barColor(activeDests.indexOf(dest)) }"
            />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ dest.label || `Вариант ${idx + 1}` }}
            </span>
            <UBadge
              v-if="!dest.isActive"
              size="xs"
              color="neutral"
              variant="subtle"
            >
              Отключён
            </UBadge>
          </div>
          <div class="flex items-center gap-1">
            <UButton
              :icon="dest.isActive ? 'i-lucide-pause' : 'i-lucide-play'"
              variant="ghost"
              color="neutral"
              size="xs"
              :title="dest.isActive ? 'Отключить' : 'Включить'"
              @click="toggleActive(idx)"
            />
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="xs"
              :disabled="localDests.length <= 1"
              @click="removeDest(idx)"
            />
          </div>
        </div>

        <!-- URL + Label -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <UFormField
            label="URL"
            :error="dest._urlError"
          >
            <UInput
              v-model="dest.url"
              placeholder="https://example.com/page"
              size="sm"
              @blur="validateDestUrl(idx)"
              @input="dest._urlError = ''"
            />
          </UFormField>
          <UFormField label="Метка (необязательно)">
            <UInput
              v-model="dest.label"
              placeholder="Например: Вариант А"
              size="sm"
            />
          </UFormField>
        </div>

        <!-- Weight -->
        <div class="flex items-center gap-3">
          <UFormField
            label="Вес (%)"
            class="flex-1"
          >
            <div class="flex items-center gap-2">
              <input
                v-model.number="dest.weight"
                type="range"
                min="1"
                max="100"
                step="1"
                class="flex-1 h-1.5 rounded-full accent-green-600 cursor-pointer"
              >
              <UInput
                v-model.number="dest.weight"
                type="number"
                min="1"
                max="100"
                size="sm"
                class="w-16"
              />
            </div>
          </UFormField>
        </div>
      </div>
    </div>

    <!-- Add variant -->
    <UButton
      icon="i-lucide-plus"
      label="Добавить вариант"
      variant="outline"
      color="neutral"
      size="sm"
      :disabled="localDests.length >= 10"
      @click="addDest"
    />
  </div>
</template>

<script setup lang="ts">
interface DestinationRow {
  id?: string
  url: string
  label: string
  weight: number
  isActive: boolean
  clicks: number
  _urlError: string
  _dirty: boolean
}

const props = defineProps<{
  qrId?: string
  initialUrl?: string
}>()

const emit = defineEmits<{
  change: [dests: Omit<DestinationRow, '_urlError' | '_dirty'>[]]
}>()

const COLORS = ['#16a34a', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#ef4444', '#14b8a6', '#6366f1']

function barColor(i: number) {
  return COLORS[i % COLORS.length]!
}

const localDests = ref<DestinationRow[]>([])
const loading = ref(false)

// Init: load from server if qrId provided, otherwise start with single row
async function init() {
  if (props.qrId) {
    loading.value = true
    try {
      const res = await $fetch<{ data: DestinationRow[] }>(`/api/qr/${props.qrId}/destinations`)
      localDests.value = res.data.map(d => ({ ...d, label: d.label ?? '', _urlError: '', _dirty: false }))
    }
    finally {
      loading.value = false
    }
  }

  if (localDests.value.length === 0) {
    localDests.value = [{
      url: props.initialUrl ?? '',
      label: '',
      weight: 100,
      isActive: true,
      clicks: 0,
      _urlError: '',
      _dirty: true,
    }]
  }
}

onMounted(init)

const activeDests = computed(() => localDests.value.filter(d => d.isActive))
const totalActiveWeight = computed(() => activeDests.value.reduce((s, d) => s + d.weight, 0))

function barWidth(dest: DestinationRow) {
  if (totalActiveWeight.value === 0) return 0
  return Math.round((dest.weight / totalActiveWeight.value) * 100)
}

function addDest() {
  localDests.value.push({
    url: '',
    label: '',
    weight: 0,
    isActive: true,
    clicks: 0,
    _urlError: '',
    _dirty: true,
  })
}

function removeDest(idx: number) {
  localDests.value.splice(idx, 1)
  emitChange()
}

function toggleActive(idx: number) {
  localDests.value[idx]!.isActive = !localDests.value[idx]!.isActive
  localDests.value[idx]!._dirty = true
  emitChange()
}

function validateDestUrl(idx: number) {
  const dest = localDests.value[idx]!
  if (!dest.url) {
    dest._urlError = 'URL обязателен'
    return
  }
  try {
    new URL(dest.url)
    dest._urlError = ''
  }
  catch {
    dest._urlError = 'Некорректный URL'
  }
}

function emitChange() {
  emit('change', localDests.value.map(({ _urlError: _e, _dirty: _d, ...rest }) => rest))
}

watch(localDests, emitChange, { deep: true })

// Expose for parent save logic
defineExpose({
  localDests,
  totalActiveWeight,
  isValid: computed(() =>
    localDests.value.every(d => !d._urlError && d.url)
    && (activeDests.value.length === 0 || totalActiveWeight.value === 100),
  ),
  async saveToServer() {
    if (!props.qrId) return
    for (const dest of localDests.value) {
      const payload = { url: dest.url, label: dest.label || undefined, weight: dest.weight, isActive: dest.isActive }
      if (dest.id) {
        await $fetch(`/api/qr/${props.qrId}/destinations/${dest.id}`, { method: 'PUT', body: payload })
      }
      else if (dest.url) {
        const res = await $fetch<{ data: DestinationRow }>(`/api/qr/${props.qrId}/destinations`, { method: 'POST', body: payload })
        dest.id = res.data.id
      }
    }
  },
})
</script>
