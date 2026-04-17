<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <UButton
        icon="i-lucide-arrow-left"
        variant="ghost"
        color="neutral"
        size="sm"
        to="/qr"
      />
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Массовое создание QR-кодов
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Загрузите CSV-файл для создания нескольких QR-кодов за раз
        </p>
      </div>
    </div>

    <!-- Step indicator -->
    <div class="flex items-center gap-2">
      <div
        v-for="(label, i) in stepLabels"
        :key="i"
        class="flex items-center gap-2"
      >
        <div
          class="flex items-center justify-center size-7 rounded-full text-xs font-semibold transition-colors"
          :class="stepCircleClass(i + 1)"
        >
          <UIcon
            v-if="step > i + 1"
            name="i-lucide-check"
            class="size-3.5"
          />
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span
          class="text-sm hidden sm:block"
          :class="step === i + 1 ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-400'"
        >
          {{ label }}
        </span>
        <UIcon
          v-if="i < stepLabels.length - 1"
          name="i-lucide-chevron-right"
          class="size-4 text-gray-300 dark:text-gray-600"
        />
      </div>
    </div>

    <!-- ───────── Step 1: Upload ───────── -->
    <UCard v-if="step === 1">
      <template #header>
        <h2 class="font-semibold">
          Загрузите CSV-файл
        </h2>
      </template>

      <!-- Template download -->
      <UAlert
        icon="i-lucide-info"
        color="info"
        variant="soft"
        class="mb-5"
      >
        <template #description>
          Используйте наш шаблон для правильного формата колонок.
          <UButton
            variant="link"
            size="xs"
            class="ml-1 p-0"
            @click="downloadTemplate"
          >
            Скачать шаблон CSV
          </UButton>
        </template>
      </UAlert>

      <!-- Drop zone -->
      <div
        class="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors cursor-pointer"
        :class="isDragging
          ? 'border-green-400 bg-green-50 dark:bg-green-950/30'
          : 'border-gray-200 dark:border-gray-700 hover:border-green-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="onFileDrop"
        @click="fileInputRef?.click()"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept=".csv,text/csv"
          class="hidden"
          @change="onFileSelect"
        >
        <UIcon
          name="i-lucide-upload-cloud"
          class="size-12 text-gray-300 dark:text-gray-600 mb-3"
        />
        <p class="font-medium text-gray-700 dark:text-gray-300">
          Перетащите CSV-файл или нажмите для выбора
        </p>
        <p class="text-sm text-gray-400 mt-1">
          Поддерживается только .csv, до 500 строк
        </p>
      </div>

      <div
        v-if="selectedFile"
        class="mt-4 flex items-center gap-3 rounded-lg border border-green-100 dark:border-green-900 bg-green-50 dark:bg-green-950/30 px-4 py-3"
      >
        <UIcon
          name="i-lucide-file-text"
          class="size-5 text-green-600 shrink-0"
        />
        <div class="flex-1 min-w-0">
          <p class="font-medium text-sm truncate">
            {{ selectedFile.name }}
          </p>
          <p class="text-xs text-gray-500">
            {{ formatFileSize(selectedFile.size) }}
          </p>
        </div>
        <UButton
          icon="i-lucide-x"
          variant="ghost"
          color="neutral"
          size="xs"
          @click="clearFile"
        />
      </div>

      <p
        v-if="parseError"
        class="mt-3 text-sm text-red-500"
      >
        {{ parseError }}
      </p>

      <template #footer>
        <div class="flex justify-end">
          <UButton
            label="Далее — Просмотр"
            trailing-icon="i-lucide-arrow-right"
            :disabled="!parsedRows.length"
            @click="step = 2"
          />
        </div>
      </template>
    </UCard>

    <!-- ───────── Step 2: Preview ───────── -->
    <UCard v-if="step === 2">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">
            Просмотр данных
          </h2>
          <UBadge
            color="neutral"
            variant="subtle"
          >
            {{ parsedRows.length }} строк
          </UBadge>
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-800">
              <th
                v-for="col in detectedHeaders"
                :key="col"
                class="py-2 pr-4 text-left text-xs font-medium text-gray-500"
              >
                <div class="flex items-center gap-1">
                  {{ col }}
                  <UIcon
                    v-if="requiredHeaders.includes(col)"
                    name="i-lucide-asterisk"
                    class="size-2.5 text-red-400"
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in previewRows"
              :key="i"
              class="border-b border-gray-50 dark:border-gray-800/50"
            >
              <td
                v-for="col in detectedHeaders"
                :key="col"
                class="py-2 pr-4 max-w-[200px] truncate text-gray-700 dark:text-gray-300"
              >
                {{ row[col] || '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p
        v-if="parsedRows.length > 5"
        class="mt-3 text-xs text-gray-400"
      >
        Показаны первые 5 из {{ parsedRows.length }} строк
      </p>

      <template #footer>
        <div class="flex justify-between">
          <UButton
            label="Назад"
            variant="outline"
            color="neutral"
            @click="step = 1"
          />
          <UButton
            label="Далее — Валидация"
            trailing-icon="i-lucide-arrow-right"
            @click="runValidation"
          />
        </div>
      </template>
    </UCard>

    <!-- ───────── Step 3: Validation ───────── -->
    <UCard v-if="step === 3">
      <template #header>
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="font-semibold">
            Результаты проверки
          </h2>
          <div class="flex gap-2">
            <UBadge
              color="success"
              variant="subtle"
              icon="i-lucide-check"
            >
              Готовы: {{ validRows.length }}
            </UBadge>
            <UBadge
              v-if="rowErrors.length"
              color="error"
              variant="subtle"
              icon="i-lucide-x"
            >
              Ошибки: {{ rowErrors.length }}
            </UBadge>
          </div>
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-800">
              <th class="py-2 pr-3 w-10 text-left text-xs text-gray-500">
                #
              </th>
              <th class="py-2 pr-3 text-left text-xs text-gray-500">
                Название
              </th>
              <th class="py-2 pr-3 text-left text-xs text-gray-500 hidden sm:table-cell">
                URL
              </th>
              <th class="py-2 text-left text-xs text-gray-500">
                Статус
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in validationItems"
              :key="item.row"
              class="border-b border-gray-50 dark:border-gray-800/50"
              :class="item.valid ? '' : 'bg-red-50/50 dark:bg-red-950/20'"
            >
              <td class="py-2.5 pr-3 text-gray-400 tabular-nums">
                {{ item.row }}
              </td>
              <td
                class="py-2.5 pr-3 font-medium"
                :class="item.valid ? 'text-gray-900 dark:text-white' : 'text-red-700 dark:text-red-400'"
              >
                {{ item.title || '—' }}
              </td>
              <td class="py-2.5 pr-3 hidden sm:table-cell max-w-[200px]">
                <span class="truncate block text-gray-500">{{ item.url || '—' }}</span>
              </td>
              <td class="py-2.5">
                <div
                  v-if="item.valid"
                  class="flex items-center gap-1 text-green-600 dark:text-green-400"
                >
                  <UIcon
                    name="i-lucide-check-circle"
                    class="size-4"
                  />
                  <span class="text-xs">Ок</span>
                </div>
                <div
                  v-else
                  class="text-xs text-red-600 dark:text-red-400"
                >
                  {{ item.errorMsg }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <UButton
            label="Назад"
            variant="outline"
            color="neutral"
            @click="step = 2"
          />
          <UButton
            :label="`Создать ${validRows.length} QR-кодов`"
            trailing-icon="i-lucide-arrow-right"
            :disabled="!validRows.length"
            @click="step = 4"
          />
        </div>
      </template>
    </UCard>

    <!-- ───────── Step 4: Confirmation ───────── -->
    <UCard v-if="step === 4">
      <template #header>
        <h2 class="font-semibold">
          Подтверждение
        </h2>
      </template>

      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="rounded-xl border border-green-100 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-4 text-center">
            <p class="text-3xl font-bold text-green-600 dark:text-green-400">
              {{ validRows.length }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Будет создано
            </p>
          </div>
          <div class="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4 text-center">
            <p class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ parsedRows.length }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Всего строк
            </p>
          </div>
          <div class="rounded-xl border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4 text-center">
            <p class="text-3xl font-bold text-red-500">
              {{ rowErrors.length }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Пропущено (ошибки)
            </p>
          </div>
        </div>

        <UAlert
          v-if="rowErrors.length > 0"
          icon="i-lucide-alert-triangle"
          color="warning"
          variant="soft"
          :description="`${rowErrors.length} строк с ошибками будут пропущены. Проверьте данные и загрузите исправленный файл.`"
        />

        <p class="text-sm text-gray-500 dark:text-gray-400">
          Все QR-коды будут созданы с типом <strong>«Динамический»</strong> и стилем по умолчанию.
          После создания вы сможете отредактировать каждый QR-код отдельно.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <UButton
            label="Назад"
            variant="outline"
            color="neutral"
            @click="step = 3"
          />
          <UButton
            label="Создать QR-коды"
            icon="i-lucide-zap"
            :loading="creating"
            :disabled="creating"
            @click="handleCreate"
          />
        </div>
      </template>
    </UCard>

    <!-- ───────── Step 5: Result ───────── -->
    <UCard v-if="step === 5">
      <template #header>
        <h2 class="font-semibold">
          Результат
        </h2>
      </template>

      <div class="space-y-5">
        <!-- Success -->
        <div
          v-if="result.created > 0"
          class="flex items-center gap-4 rounded-xl border border-green-100 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-5"
        >
          <UIcon
            name="i-lucide-check-circle"
            class="size-10 text-green-500 shrink-0"
          />
          <div>
            <p class="text-xl font-bold text-green-700 dark:text-green-400">
              {{ result.created }} QR-кодов создано
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Все QR-коды доступны в разделе «QR-коды»
            </p>
          </div>
        </div>

        <!-- Errors -->
        <div v-if="result.failed > 0">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ошибки ({{ result.failed }}):
          </p>
          <div class="rounded-lg border border-red-100 dark:border-red-900 overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-red-50 dark:bg-red-950/30">
                  <th class="py-2 px-3 text-left text-xs text-red-600">
                    Строка
                  </th>
                  <th class="py-2 px-3 text-left text-xs text-red-600">
                    Поле
                  </th>
                  <th class="py-2 px-3 text-left text-xs text-red-600">
                    Ошибка
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(err, i) in result.errors.slice(0, 20)"
                  :key="i"
                  class="border-t border-red-50 dark:border-red-900/50"
                >
                  <td class="py-2 px-3 tabular-nums">
                    {{ err.row }}
                  </td>
                  <td class="py-2 px-3 text-gray-500">
                    {{ err.field }}
                  </td>
                  <td class="py-2 px-3 text-red-600 dark:text-red-400">
                    {{ err.message }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p
            v-if="result.errors.length > 20"
            class="mt-2 text-xs text-gray-400"
          >
            Показаны первые 20 из {{ result.errors.length }} ошибок
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <UButton
            icon="i-lucide-qr-code"
            label="Перейти к QR-кодам"
            to="/qr"
          />
          <UButton
            icon="i-lucide-refresh-cw"
            label="Загрузить ещё"
            variant="outline"
            color="neutral"
            @click="reset"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
interface ParsedRow {
  [key: string]: string
}

interface RowError {
  row: number
  field: string
  message: string
}

const stepLabels = ['Загрузка', 'Просмотр', 'Проверка', 'Подтверждение', 'Результат']
const requiredHeaders = ['title', 'destination_url']

const step = ref(1)
const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const parseError = ref('')
const parsedRows = ref<ParsedRow[]>([])
const detectedHeaders = ref<string[]>([])

// Validation state
const validRows = ref<(ParsedRow & { _rowIndex: number })[]>([])
const rowErrors = ref<RowError[]>([])

// Create state
const creating = ref(false)
const result = ref<{ created: number, failed: number, errors: RowError[] }>({
  created: 0,
  failed: 0,
  errors: [],
})

function stepCircleClass(s: number) {
  if (step.value > s) return 'bg-green-500 text-white'
  if (step.value === s) return 'bg-green-600 text-white'
  return 'bg-gray-100 dark:bg-gray-800 text-gray-400'
}

const previewRows = computed(() => parsedRows.value.slice(0, 5))

const validationItems = computed(() => {
  const errorsByRow = new Map<number, RowError[]>()
  for (const e of rowErrors.value) {
    if (!errorsByRow.has(e.row)) errorsByRow.set(e.row, [])
    errorsByRow.get(e.row)!.push(e)
  }

  return parsedRows.value.map((row, i) => {
    const rowNum = i + 2
    const errs = errorsByRow.get(rowNum)
    return {
      row: rowNum,
      title: row.title || '',
      url: row.destination_url || row.url || '',
      valid: !errs,
      errorMsg: errs ? errs.map(e => e.message).join('; ') : '',
    }
  })
})

// Template CSV
function downloadTemplate() {
  const headers = 'title,destination_url,description,utm_source,utm_medium,utm_campaign,utm_content,expires_at,folder,tags'
  const example = 'Промо-акция лето 2025,https://splat.ru/promo/summer,QR для упаковки,qr-code,packaging,summer2025,,,Рекламные материалы,"promo,summer"'
  const blob = new Blob([`${headers}\n${example}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'qr-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`
  return `${(bytes / 1024).toFixed(1)} КБ`
}

function clearFile() {
  selectedFile.value = null
  parsedRows.value = []
  detectedHeaders.value = []
  parseError.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function parseFile(file: File) {
  selectedFile.value = file
  parseError.value = ''

  const text = await file.text()

  // Dynamic import of papaparse
  const Papa = await import('papaparse')
  const result = Papa.default.parse<ParsedRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim().toLowerCase().replace(/[\s-]+/g, '_'),
  })

  if (result.errors.length > 0 && result.data.length === 0) {
    parseError.value = `Ошибка разбора CSV: ${result.errors[0]?.message}`
    return
  }

  if (result.data.length > 500) {
    parseError.value = 'Файл содержит более 500 строк. Разбейте на несколько файлов.'
    return
  }

  if (result.data.length === 0) {
    parseError.value = 'CSV-файл не содержит данных'
    return
  }

  parsedRows.value = result.data
  detectedHeaders.value = result.meta.fields ?? []
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) parseFile(input.files[0])
}

function onFileDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
    parseFile(file)
  }
  else {
    parseError.value = 'Пожалуйста, загрузите файл в формате .csv'
  }
}

function runValidation() {
  const errors: RowError[] = []
  const valid: (ParsedRow & { _rowIndex: number })[] = []

  for (let i = 0; i < parsedRows.value.length; i++) {
    const row = parsedRows.value[i]!
    const rowNum = i + 2
    const rowErrors: RowError[] = []

    const title = row.title?.trim()
    const url = (row.destination_url || row.url || '').trim()

    if (!title) rowErrors.push({ row: rowNum, field: 'title', message: 'Название обязательно' })

    if (!url) {
      rowErrors.push({ row: rowNum, field: 'destination_url', message: 'URL обязателен' })
    }
    else {
      try {
        new URL(url)
      }
      catch {
        rowErrors.push({ row: rowNum, field: 'destination_url', message: 'Некорректный URL' })
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors)
    }
    else {
      valid.push({ ...row, _rowIndex: rowNum })
    }
  }

  rowErrors.value = errors
  validRows.value = valid
  step.value = 3
}

async function handleCreate() {
  creating.value = true
  try {
    // Normalize row keys to match server schema
    const rows = validRows.value.map(({ _rowIndex: _, ...row }) => row)

    const res = await $fetch<{ data: { created: number, failed: number, total: number, errors: RowError[] } }>(
      '/api/qr/bulk',
      { method: 'POST', body: { rows } },
    )

    result.value = res.data
    step.value = 5
  }
  catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    useA11yToast().add({ title: e?.data?.message ?? 'Ошибка при создании', color: 'error' })
  }
  finally {
    creating.value = false
  }
}

function reset() {
  step.value = 1
  selectedFile.value = null
  parsedRows.value = []
  detectedHeaders.value = []
  parseError.value = ''
  validRows.value = []
  rowErrors.value = []
  result.value = { created: 0, failed: 0, errors: [] }
}
</script>
