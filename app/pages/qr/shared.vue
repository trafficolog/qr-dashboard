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
      <Skeleton
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
        @change-visibility="handleChangeVisibility"
      />
    </div>

    <Dialog
      v-model:visible="departmentPickerOpen"
      modal
      header="Выберите отдел"
    >
      <template #default>
        <div class="space-y-4">
          <Select
            v-model="selectedDepartmentId"
            :options="departmentSelectItems"
            option-label="label"
            option-value="value"
            placeholder="Выберите отдел"
            class="w-full"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            outlined
            severity="secondary"
            @click="closeDepartmentPicker"
          >
            Отмена
          </Button>
          <Button
            :disabled="!selectedDepartmentId"
            @click="confirmDepartmentVisibilityChange"
          >
            Применить
          </Button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { QrCode } from '#shared/types/qr'
import { createDialogFocusReturn } from '~/utils/dialog-focus-return'

const toast = useA11yToast()
const { duplicateQr, deleteQr, updateQrVisibility } = useQr()
const { t } = useI18n()

const { data, pending, refresh } = await useFetch<{ data: QrCode[] }>('/api/qr/shared')

const sharedQr = computed(() => data.value?.data ?? [])
const userDepartments = ref<Array<{ id: string, name: string }>>([])
const departmentPickerOpen = ref(false)
const departmentPickerFocusReturn = createDialogFocusReturn()
const selectedDepartmentId = ref('')
const pendingQrId = ref<string | null>(null)
const departmentSelectItems = computed(() =>
  userDepartments.value.map(item => ({ label: item.name, value: item.id })),
)

type VisibilityPayload = { id: string, visibility: 'private' | 'department' | 'public', departmentId?: string | null }

watch(departmentPickerOpen, (open) => {
  if (open) departmentPickerFocusReturn.save()
  else departmentPickerFocusReturn.restore()
})

async function fetchUserDepartments() {
  try {
    const response = await $fetch<{ data: Array<{ id: string, name: string }> }>('/api/departments/my')
    userDepartments.value = response.data
  }
  catch {
    userDepartments.value = []
  }
}

function closeDepartmentPicker() {
  departmentPickerOpen.value = false
  pendingQrId.value = null
  selectedDepartmentId.value = ''
}

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

async function handleChangeVisibility(payload: VisibilityPayload) {
  if (payload.visibility === 'department') {
    if (userDepartments.value.length === 0) {
      toast.add({ title: t('qr.actions.makeDepartmentDisabledTooltip'), color: 'warning' })
      return
    }

    pendingQrId.value = payload.id
    selectedDepartmentId.value = payload.departmentId || userDepartments.value[0]?.id || ''
    departmentPickerOpen.value = true
    return
  }

  try {
    await updateQrVisibility(payload.id, { visibility: payload.visibility })
    toast.add({ title: t('qr.visibility.updated'), color: 'success' })
    await refresh()
  }
  catch {
    toast.add({ title: t('qr.visibility.updateError'), color: 'error' })
  }
}

async function confirmDepartmentVisibilityChange() {
  if (!pendingQrId.value || !selectedDepartmentId.value) {
    return
  }

  try {
    await updateQrVisibility(pendingQrId.value, {
      visibility: 'department',
      departmentId: selectedDepartmentId.value,
    })
    toast.add({ title: t('qr.visibility.updated'), color: 'success' })
    closeDepartmentPicker()
    await refresh()
  }
  catch {
    toast.add({ title: t('qr.visibility.updateError'), color: 'error' })
  }
}

onMounted(fetchUserDepartments)
</script>
