<template>
  <UModal
    v-model:open="open"
    :close-on-escape="true"
  >
    <template #header>
      <h3 class="text-base font-semibold">
        {{ folder ? 'Редактировать папку' : 'Новая папка' }}
      </h3>
    </template>

    <div class="space-y-4">
      <UFormField
        label="Название"
        required
        :error="nameError"
      >
        <UInput
          v-model="form.name"
          placeholder="Например: Промо-акции 2025"
          autofocus
        />
      </UFormField>

      <UFormField label="Цвет">
        <div class="flex items-center gap-3">
          <input
            v-model="form.color"
            type="color"
            class="h-8 w-10 cursor-pointer rounded border border-[color:var(--border)] dark:border-[color:var(--border)] p-0.5"
          >
          <span class="text-sm text-[color:var(--text-muted)] dark:text-[color:var(--text-muted)] font-mono">{{ form.color || '#6b7280' }}</span>
          <UButton
            v-if="form.color"
            variant="ghost"
            color="neutral"
            size="xs"
            icon="i-lucide-x"
            aria-label="Сбросить выбранный цвет"
            title="Сбросить выбранный цвет"
            @click="form.color = ''"
          />
        </div>
        <div class="flex gap-2 mt-2">
          <button
            v-for="preset in colorPresets"
            :key="preset"
            :style="{ backgroundColor: preset }"
            class="size-6 rounded-full border-2 transition-transform hover:scale-110"
            :class="form.color === preset ? 'border-[color:var(--text-primary)] dark:border-[color:var(--text-primary)]' : 'border-transparent'"
            @click="form.color = preset"
          />
        </div>
      </UFormField>

      <UFormField
        v-if="parentOptions.length > 1"
        label="Родительская папка"
      >
        <USelect
          v-model="form.parentId"
          :items="parentOptions"
          placeholder="Корневая папка"
        />
      </UFormField>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          label="Отмена"
          variant="outline"
          color="neutral"
          @click="open = false"
        />
        <UButton
          :label="folder ? 'Сохранить' : 'Создать'"
          :loading="saving"
          :disabled="!form.name.trim() || saving"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Folder } from '~/composables/useFolders'
import { createDialogFocusReturn } from '~/utils/dialog-focus-return'

const props = defineProps<{
  folder?: Folder | null
  allFolders?: Folder[]
}>()

const emit = defineEmits<{
  created: [folder: Folder]
  updated: [folder: Folder]
}>()

const open = defineModel<boolean>('open', { default: false })
const focusReturn = createDialogFocusReturn()
const toast = useA11yToast()

const colorPresets = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

const saving = ref(false)
const nameError = ref('')

const form = reactive({
  name: '',
  color: '',
  parentId: '',
})

watch(open, (val) => {
  if (val) {
    focusReturn.save()
    form.name = props.folder?.name ?? ''
    form.color = props.folder?.color ?? ''
    form.parentId = props.folder?.parentId ?? ''
    nameError.value = ''
  }
  else {
    focusReturn.restore()
  }
})

watch(() => form.name, () => {
  if (nameError.value) nameError.value = ''
})

const parentOptions = computed(() => {
  const base = [{ label: 'Корневая папка', value: '' }]
  const others = (props.allFolders ?? [])
    .filter(f => f.id !== props.folder?.id)
    .map(f => ({ label: f.name, value: f.id }))
  return [...base, ...others]
})

async function handleSubmit() {
  if (!form.name.trim()) return
  saving.value = true
  nameError.value = ''
  try {
    const normalizedParentId = form.parentId.trim()
    const normalizedColor = form.color.trim()

    const payload = {
      name: form.name.trim(),
      color: normalizedColor || null,
      parentId: normalizedParentId || null,
    }

    if (props.folder) {
      const res = await $fetch<{ data: Folder }>(`/api/folders/${props.folder.id}`, {
        method: 'PUT',
        body: payload,
      })
      emit('updated', res.data)
    }
    else {
      const res = await $fetch<{ data: Folder }>('/api/folders', {
        method: 'POST',
        body: payload,
      })
      emit('created', res.data)
    }

    open.value = false
  }
  catch (error: unknown) {
    const err = error as {
      statusCode?: number
      statusMessage?: string
      message?: string
      data?: {
        message?: string
        fieldErrors?: Record<string, string>
        data?: { issues?: Array<{ path?: Array<string | number>, message?: string }> }
      }
    }

    const statusCode = err.statusCode ?? 0
    const fieldErrors = err.data?.fieldErrors
    const zodIssueNameError = err.data?.data?.issues?.find((issue) => {
      const fieldPath = issue.path?.map(String).join('.') ?? ''
      return fieldPath === 'name'
    })?.message

    if ((statusCode === 400 || statusCode === 422) && (fieldErrors?.name || zodIssueNameError)) {
      nameError.value = fieldErrors?.name || zodIssueNameError || 'Некорректное значение поля'
    }

    const fallbackMessage = 'Не удалось сохранить папку. Проверьте соединение и попробуйте снова.'
    toast.add({
      title: err.data?.message || err.statusMessage || err.message || fallbackMessage,
      color: 'error',
    })
  }
  finally {
    saving.value = false
  }
}
</script>
