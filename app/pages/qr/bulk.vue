<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <div class="flex items-center gap-3">
      <Button
        as-child
        text
        severity="secondary"
        size="small"
      >
        <NuxtLink
          to="/qr"
          aria-label="Назад к списку QR-кодов"
          title="Назад к списку QR-кодов"
        >
          <Icon name="i-lucide-arrow-left" />
        </NuxtLink>
      </Button>
      <div>
        <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
          Массовое создание QR-кодов
        </h1>
        <p class="mt-0.5 text-sm text-[color:var(--text-muted)]">
          Загрузите CSV-файл для создания нескольких QR-кодов за раз
        </p>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <div
        v-for="(label, i) in stepLabels"
        :key="i"
        class="flex items-center gap-2"
      >
        <div
          class="flex items-center justify-center size-7 rounded-full text-xs font-semibold transition-interactive"
          :class="stepCircleClass(i + 1)"
        >
          <Icon
            v-if="step > i + 1"
            name="i-lucide-check"
            class="size-3.5"
          />
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span
          class="text-sm hidden sm:block"
          :class="step === i + 1 ? 'font-medium text-[color:var(--text-primary)]' : 'text-[color:var(--text-muted)]'"
        >
          {{ label }}
        </span>
        <Icon
          v-if="i < stepLabels.length - 1"
          name="i-lucide-chevron-right"
          class="size-4 text-[color:var(--text-secondary)]"
        />
      </div>
    </div>

    <div
      v-if="step === 1"
      class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5"
    >
      <h2 class="mb-5 font-semibold">
        Загрузите CSV-файл
      </h2>

      <Message
        class="mb-5"
      >
        <Icon
          name="i-lucide-info"
          class="mr-1 inline size-4"
        />
        Используйте наш шаблон для правильного формата колонок.
        <Button
          text
          size="small"
          class="ml-1 p-0"
          @click="downloadTemplate"
        >
          Скачать шаблон CSV
        </Button>
      </Message>

      <div
        class="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-interactive cursor-pointer"
        :class="isDragging
          ? 'border-[color:var(--color-success)] bg-[color:color-mix(in_srgb,var(--color-success)_20%,transparent)]'
          : 'border-[color:var(--border)] hover:border-[color:var(--color-success)] hover:bg-[color:var(--surface-0)]'"
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
        <Icon
          name="i-lucide-upload-cloud"
          class="mb-3 size-12 text-[color:var(--text-secondary)]"
        />
        <p class="font-medium text-[color:var(--text-secondary)]">
          Перетащите CSV-файл или нажмите для выбора
        </p>
        <p class="text-sm text-[color:var(--text-muted)] mt-1">
          Поддерживается только .csv, до 500 строк
        </p>
      </div>

      <div
        v-if="selectedFile"
        class="mt-4 flex items-center gap-3 rounded-lg border border-[color:color-mix(in_srgb,var(--color-success)_35%,var(--border))] bg-[color:color-mix(in_srgb,var(--color-success)_20%,transparent)] px-4 py-3"
      >
        <Icon
          name="i-lucide-file-text"
          class="size-5 shrink-0 text-[color:var(--color-success)]"
        />
        <div class="min-w-0 flex-1">
          <p class="font-medium text-sm truncate">
            {{ selectedFile.name }}
          </p>
          <p class="text-xs text-[color:var(--text-muted)]">
            {{ formatFileSize(selectedFile.size) }}
          </p>
        </div>
        <Button
          text
          severity="secondary"
          size="small"
          aria-label="Очистить выбранный файл"
          title="Очистить выбранный файл"
          @click="clearFile"
        >
          <template #icon>
            <Icon name="i-lucide-x" />
          </template>
        </Button>
      </div>

      <p
        v-if="parseError"
        class="mt-3 text-sm text-[color:var(--color-error)]"
      >
        {{ parseError }}
      </p>

      <div class="mt-5 flex justify-end">
        <Button
          :disabled="!parsedRows.length"
          @click="step = 2"
        >
          Далее — Просмотр
          <Icon
            name="i-lucide-arrow-right"
            class="ml-1 size-4"
          />
        </Button>
      </div>
    </div>

    <div
      v-if="step === 2"
      class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5"
    >
      <div class="mb-5 flex items-center justify-between">
        <h2 class="font-semibold">
          Просмотр данных
        </h2>
        <Tag class="px-2 py-0.5 text-xs">
          {{ parsedRows.length }} строк
        </Tag>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-[color:var(--border)]">
              <th
                v-for="col in detectedHeaders"
                :key="col"
                class="py-2 pr-4 text-left text-xs font-medium text-[color:var(--text-muted)]"
              >
                <div class="flex items-center gap-1">
                  {{ col }}
                  <Icon
                    v-if="requiredHeaders.includes(col)"
                    name="i-lucide-asterisk"
                    class="size-2.5 text-[color:var(--color-error)]"
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in previewRows"
              :key="i"
              class="border-b border-[color:var(--border)]/60"
            >
              <td
                v-for="col in detectedHeaders"
                :key="col"
                class="max-w-[200px] truncate py-2 pr-4 text-[color:var(--text-secondary)]"
              >
                {{ row[col] || '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p
        v-if="parsedRows.length > 5"
        class="mt-3 text-xs text-[color:var(--text-muted)]"
      >
        Показаны первые 5 из {{ parsedRows.length }} строк
      </p>

      <div class="mt-5 flex justify-between">
        <Button
          outlined
          severity="secondary"
          @click="step = 1"
        >
          Назад
        </Button>
        <Button @click="runValidation">
          Далее — Валидация
          <Icon
            name="i-lucide-arrow-right"
            class="ml-1 size-4"
          />
        </Button>
      </div>
    </div>

    <div
      v-if="step === 3"
      class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5"
    >
      <div class="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-semibold">
          Результаты проверки
        </h2>
        <div class="flex gap-2">
          <Tag class="px-2 py-0.5 text-xs">
            <Icon
              name="i-lucide-check"
              class="mr-1 size-3"
            />
            Готовы: {{ validRows.length }}
          </Tag>
          <Tag
            v-if="rowErrors.length"
            class="px-2 py-0.5 text-xs"
          >
            <Icon
              name="i-lucide-x"
              class="mr-1 size-3"
            />
            Ошибки: {{ rowErrors.length }}
          </Tag>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-[color:var(--border)]">
              <th class="py-2 pr-3 w-10 text-left text-xs text-[color:var(--text-muted)]">
                #
              </th>
              <th class="py-2 pr-3 text-left text-xs text-[color:var(--text-muted)]">
                Название
              </th>
              <th class="py-2 pr-3 text-left text-xs text-[color:var(--text-muted)] hidden sm:table-cell">
                URL
              </th>
              <th class="py-2 text-left text-xs text-[color:var(--text-muted)]">
                Статус
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in validationItems"
              :key="item.row"
              class="border-b border-[color:var(--border)]/60"
              :class="item.valid ? '' : 'bg-[color:var(--color-error-soft)]'"
            >
              <td class="py-2.5 pr-3 text-[color:var(--text-muted)] tabular-nums">
                {{ item.row }}
              </td>
              <td
                class="py-2.5 pr-3 font-medium"
                :class="item.valid ? 'text-[color:var(--text-primary)]' : 'text-[color:var(--color-error)]'"
              >
                {{ item.title || '—' }}
              </td>
              <td class="py-2.5 pr-3 hidden sm:table-cell max-w-[200px]">
                <span class="truncate block text-[color:var(--text-muted)]">{{ item.url || '—' }}</span>
              </td>
              <td class="py-2.5">
                <div
                  v-if="item.valid"
                  class="flex items-center gap-1 text-[color:var(--color-success)]"
                >
                  <Icon
                    name="i-lucide-check-circle"
                    class="size-4"
                  />
                  <span class="text-xs">Ок</span>
                </div>
                <div
                  v-else
                  class="text-xs text-[color:var(--color-error)]"
                >
                  {{ item.errorMsg }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-5 flex justify-between">
        <Button
          outlined
          severity="secondary"
          @click="step = 2"
        >
          Назад
        </Button>
        <Button
          :disabled="!validRows.length"
          @click="step = 4"
        >
          Создать {{ validRows.length }} QR-кодов
          <Icon
            name="i-lucide-arrow-right"
            class="ml-1 size-4"
          />
        </Button>
      </div>
    </div>

    <div
      v-if="step === 4"
      class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5"
    >
      <h2 class="mb-5 font-semibold">
        Подтверждение
      </h2>

      <div class="space-y-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="rounded-xl border border-[color:color-mix(in_srgb,var(--color-success)_35%,var(--border))] bg-[color:color-mix(in_srgb,var(--color-success)_20%,transparent)] p-4 text-center">
            <p class="text-3xl font-bold text-[color:var(--color-success)]">
              {{ validRows.length }}
            </p>
            <p class="mt-1 text-sm text-[color:var(--text-secondary)]">
              Будет создано
            </p>
          </div>
          <div class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4 text-center">
            <p class="text-3xl font-bold text-[color:var(--text-primary)]">
              {{ parsedRows.length }}
            </p>
            <p class="mt-1 text-sm text-[color:var(--text-secondary)]">
              Всего строк
            </p>
          </div>
          <div class="rounded-xl border border-[color:color-mix(in_srgb,var(--color-error)_35%,var(--border))] bg-[color:var(--color-error-soft)] p-4 text-center">
            <p class="text-3xl font-bold text-[color:var(--color-error)]">
              {{ rowErrors.length }}
            </p>
            <p class="mt-1 text-sm text-[color:var(--text-secondary)]">
              Пропущено (ошибки)
            </p>
          </div>
        </div>

        <Message
          v-if="rowErrors.length > 0"
        >
          <Icon
            name="i-lucide-alert-triangle"
            class="mr-1 inline size-4"
          />
          {{ `${rowErrors.length} строк с ошибками будут пропущены. Проверьте данные и загрузите исправленный файл.` }}
        </Message>

        <p class="text-sm text-[color:var(--text-muted)]">
          Все QR-коды будут созданы с типом <strong>«Динамический»</strong> и стилем по умолчанию.
          После создания вы сможете отредактировать каждый QR-код отдельно.
        </p>
      </div>

      <div class="mt-5 flex justify-between">
        <Button
          outlined
          severity="secondary"
          @click="step = 3"
        >
          Назад
        </Button>
        <Button
          :loading="creating"
          :disabled="creating"
          @click="handleCreate"
        >
          <template #icon>
            <Icon name="i-lucide-zap" />
          </template>
          Создать QR-коды
        </Button>
      </div>
    </div>

    <div
      v-if="step === 5"
      class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5"
    >
      <h2 class="mb-5 font-semibold">
        Результат
      </h2>

      <div class="space-y-5">
        <div
          v-if="result.created > 0"
          class="flex items-center gap-4 rounded-xl border border-[color:color-mix(in_srgb,var(--color-success)_35%,var(--border))] bg-[color:color-mix(in_srgb,var(--color-success)_20%,transparent)] p-5"
        >
          <Icon
            name="i-lucide-check-circle"
            class="size-10 shrink-0 text-[color:var(--color-success)]"
          />
          <div>
            <p class="text-xl font-bold text-[color:var(--color-success)]">
              {{ result.created }} QR-кодов создано
            </p>
            <p class="mt-0.5 text-sm text-[color:var(--text-secondary)]">
              Все QR-коды доступны в разделе «QR-коды»
            </p>
          </div>
        </div>

        <div v-if="result.failed > 0">
          <p class="mb-2 text-sm font-medium text-[color:var(--text-secondary)]">
            Ошибки ({{ result.failed }}):
          </p>
          <div class="overflow-hidden rounded-lg border border-[color:color-mix(in_srgb,var(--color-error)_35%,var(--border))]">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-[color:var(--color-error-soft)]">
                  <th class="py-2 px-3 text-left text-xs text-[color:var(--color-error)]">
                    Строка
                  </th>
                  <th class="py-2 px-3 text-left text-xs text-[color:var(--color-error)]">
                    Поле
                  </th>
                  <th class="py-2 px-3 text-left text-xs text-[color:var(--color-error)]">
                    Ошибка
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(err, i) in result.errors.slice(0, 20)"
                  :key="i"
                  class="border-t border-[color:color-mix(in_srgb,var(--color-error)_25%,var(--border))]"
                >
                  <td class="py-2 px-3 tabular-nums">
                    {{ err.row }}
                  </td>
                  <td class="py-2 px-3 text-[color:var(--text-muted)]">
                    {{ err.field }}
                  </td>
                  <td class="py-2 px-3 text-[color:var(--color-error)]">
                    {{ err.message }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p
            v-if="result.errors.length > 20"
            class="mt-2 text-xs text-[color:var(--text-muted)]"
          >
            Показаны первые 20 из {{ result.errors.length }} ошибок
          </p>
        </div>
      </div>

      <div class="mt-5 flex gap-3">
        <Button as-child>
          <NuxtLink
            to="/qr"
            class="inline-flex items-center gap-2"
          >
            <Icon name="i-lucide-qr-code" />
            <span>Перейти к QR-кодам</span>
          </NuxtLink>
        </Button>
        <Button
          outlined
          severity="secondary"
          @click="reset"
        >
          <template #icon>
            <Icon name="i-lucide-refresh-cw" />
          </template>
          Загрузить ещё
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** CSV row from Papa Parse; values are strings */
type ParsedRow = Record<string, string | undefined>
/** Row after validation — `_rowIndex` is the 1-based CSV line number */
type ValidatedCsvRow = ParsedRow & { _rowIndex: number }

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
const validRows = ref<ValidatedCsvRow[]>([])
const rowErrors = ref<RowError[]>([])

// Create state
const creating = ref(false)
const result = ref<{ created: number, failed: number, errors: RowError[] }>({
  created: 0,
  failed: 0,
  errors: [],
})

function stepCircleClass(s: number) {
  if (step.value > s) return 'bg-[color:color-mix(in_srgb,var(--color-success)_20%,transparent)] text-[color:var(--text-primary)]'
  if (step.value === s) return 'bg-[color:color-mix(in_srgb,var(--color-success)_20%,transparent)] text-[color:var(--text-primary)]'
  return 'bg-[color:var(--surface-2)] dark:bg-[color:var(--surface-2)] text-[color:var(--text-muted)]'
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
    transformHeader: (h: string) => h.trim().toLowerCase().replace(/[\s-]+/g, '_'),
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
  const valid: ValidatedCsvRow[] = []

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
      valid.push({ ...row, _rowIndex: rowNum } as ValidatedCsvRow)
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
    const rows = validRows.value.map(({ row }) => row)

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
