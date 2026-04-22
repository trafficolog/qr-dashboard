<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
          Подразделения
        </h1>
        <p class="mt-0.5 text-sm text-[color:var(--text-secondary)]">
          CRUD подразделений, назначение участников и руководителей
        </p>
      </div>

      <Button @click="openCreate">
        <template #icon>
          <Icon name="i-lucide-plus" />
        </template>
        Создать подразделение
      </Button>
    </div>

    <div
      v-if="loading"
      class="space-y-3"
    >
      <Skeleton
        v-for="i in 5"
        :key="i"
        class="h-24 w-full rounded-lg"
      />
    </div>

    <SharedEmptyState
      v-else-if="departments.length === 0"
      icon="i-lucide-building-2"
      title="Нет подразделений"
      description="Создайте первое подразделение и назначьте участников."
    />

    <div
      v-else
      class="space-y-4"
    >
      <section
        v-for="department in departments"
        :key="department.id"
        class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-[color:var(--text-primary)]">
              {{ department.name }}
            </h2>
            <p class="text-xs text-[color:var(--text-muted)] mt-1">
              slug: {{ department.slug }} · участников: {{ department.memberCount }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <Button
              outlined
              size="small"
              @click="openEdit(department)"
            >
              <template #icon>
                <Icon name="i-lucide-pencil" />
              </template>
              Редактировать
            </Button>
            <Button
              text
              severity="danger"
              size="small"
              @click="handleDelete(department)"
            >
              <template #icon>
                <Icon name="i-lucide-trash-2" />
              </template>
            </Button>
          </div>
        </div>

        <div class="space-y-4 mt-4">
          <p
            v-if="department.description"
            class="text-sm text-[color:var(--text-secondary)]"
          >
            {{ department.description }}
          </p>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-[color:var(--text-primary)]">Руководитель</label>
              <Select
                :model-value="department.headUserId ?? ''"
                :options="memberOptions"
                option-label="label"
                option-value="value"
                placeholder="Не назначен"
                class="w-full"
                @update:model-value="updateHead(department, $event as string)"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium text-[color:var(--text-primary)]">Участники</label>
              <MultiSelect
                :model-value="selectedMembersByDepartment[department.id] ?? []"
                :options="memberOptions"
                option-label="label"
                option-value="value"
                filter
                placeholder="Выберите участников"
                class="w-full"
                @update:model-value="setSelectedMembers(department.id, $event as string[])"
              />
            </div>
          </div>

          <div class="flex justify-end">
            <Button
              size="small"
              :loading="savingMembersId === department.id"
              @click="saveMembers(department)"
            >
              <template #icon>
                <Icon name="i-lucide-save" />
              </template>
              Сохранить участников
            </Button>
          </div>
        </div>
      </section>
    </div>

    <Dialog
      v-model:visible="formOpen"
      modal
      :header="editingDepartment ? 'Редактировать подразделение' : 'Создать подразделение'"
    >
      <template #default>
        <form
          class="space-y-4"
          @submit.prevent="submitForm"
        >
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-[color:var(--text-primary)]">Название</label>
            <InputText
              v-model="form.name"
              class="w-full"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-[color:var(--text-primary)]">Slug</label>
            <small class="text-xs text-[color:var(--text-muted)]">Только lowercase + дефисы</small>
            <InputText
              v-model="form.slug"
              class="w-full"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-[color:var(--text-primary)]">Описание</label>
            <Textarea
              v-model="form.description"
              class="w-full"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-[color:var(--text-primary)]">Цвет (HEX)</label>
            <InputText
              v-model="form.color"
              placeholder="#0EA5E9"
              class="w-full"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-[color:var(--text-primary)]">Руководитель</label>
            <Select
              v-model="form.headUserId"
              :options="memberOptions"
              option-label="label"
              option-value="value"
              placeholder="Не назначен"
              class="w-full"
            />
          </div>
        </form>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button
            outlined
            severity="secondary"
            @click="formOpen = false"
          >
            Отмена
          </Button>
          <Button
            :loading="savingForm"
            @click="submitForm"
          >
            Сохранить
          </Button>
        </div>
      </template>
    </Dialog>

    <SharedConfirmDialog
      v-model:open="deleteOpen"
      title="Удалить подразделение?"
      :description="deletingDepartment ? `Подразделение «${deletingDepartment.name}» будет удалено.` : ''"
      confirm-label="Удалить"
      confirm-color="error"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { createDialogFocusReturn } from '~/utils/dialog-focus-return'

definePageMeta({
  middleware: 'admin-only',
})

interface UserBrief {
  id: string
  name: string | null
  email: string
}

interface Department {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  headUserId: string | null
  memberCount: number
  members: { userId: string, role: 'member' | 'head' }[]
}

const toast = useA11yToast()

const loading = ref(true)
const departments = ref<Department[]>([])
const members = ref<UserBrief[]>([])
const selectedMembersByDepartment = ref<Record<string, string[]>>({})
const savingMembersId = ref<string | null>(null)

const formOpen = ref(false)
const formDialogFocusReturn = createDialogFocusReturn()
const savingForm = ref(false)
const editingDepartment = ref<Department | null>(null)
const form = reactive({
  name: '',
  slug: '',
  description: '',
  color: '',
  headUserId: '',
})

const deleteOpen = ref(false)
const deletingDepartment = ref<Department | null>(null)

const memberOptions = computed(() => members.value.map(m => ({
  label: m.name || m.email,
  value: m.id,
})))

watch(formOpen, (open) => {
  if (open) formDialogFocusReturn.save()
  else formDialogFocusReturn.restore()
})

async function fetchData() {
  loading.value = true
  try {
    const [departmentRes, teamRes] = await Promise.all([
      $fetch<{ data: Department[] }>('/api/admin/departments'),
      $fetch<{ data: UserBrief[] }>('/api/team'),
    ])

    departments.value = departmentRes.data
    members.value = teamRes.data

    selectedMembersByDepartment.value = Object.fromEntries(
      departmentRes.data.map(d => [d.id, d.members.map(m => m.userId)]),
    )
  }
  catch {
    toast.add({ title: 'Ошибка загрузки подразделений', color: 'error' })
  }
  finally {
    loading.value = false
  }
}

function openCreate() {
  editingDepartment.value = null
  form.name = ''
  form.slug = ''
  form.description = ''
  form.color = ''
  form.headUserId = ''
  formOpen.value = true
}

function openEdit(department: Department) {
  editingDepartment.value = department
  form.name = department.name
  form.slug = department.slug
  form.description = department.description ?? ''
  form.color = department.color ?? ''
  form.headUserId = department.headUserId ?? ''
  formOpen.value = true
}

async function submitForm() {
  const payload = {
    name: form.name.trim(),
    slug: form.slug.trim().toLowerCase(),
    description: form.description.trim() || null,
    color: form.color.trim() || null,
    headUserId: form.headUserId || null,
  }

  savingForm.value = true
  try {
    if (editingDepartment.value) {
      await $fetch(`/api/admin/departments/${editingDepartment.value.id}`, {
        method: 'PATCH',
        body: payload,
      })
      toast.add({ title: 'Подразделение обновлено', color: 'success' })
    }
    else {
      await $fetch('/api/admin/departments', {
        method: 'POST',
        body: payload,
      })
      toast.add({ title: 'Подразделение создано', color: 'success' })
    }

    formOpen.value = false
    await fetchData()
  }
  catch {
    toast.add({ title: 'Ошибка сохранения подразделения', color: 'error' })
  }
  finally {
    savingForm.value = false
  }
}

async function updateHead(department: Department, userId: string) {
  try {
    await $fetch(`/api/admin/departments/${department.id}`, {
      method: 'PATCH',
      body: {
        headUserId: userId || null,
      },
    })
    await fetchData()
    toast.add({ title: 'Руководитель обновлён', color: 'success' })
  }
  catch {
    toast.add({ title: 'Ошибка обновления руководителя', color: 'error' })
  }
}

function setSelectedMembers(departmentId: string, ids: string[]) {
  selectedMembersByDepartment.value = {
    ...selectedMembersByDepartment.value,
    [departmentId]: ids,
  }
}

async function saveMembers(department: Department) {
  savingMembersId.value = department.id
  try {
    const memberIds = selectedMembersByDepartment.value[department.id] ?? []
    await $fetch(`/api/admin/departments/${department.id}/members`, {
      method: 'PUT',
      body: {
        members: memberIds.map(id => ({
          userId: id,
          role: id === department.headUserId ? 'head' : 'member',
        })),
      },
    })
    toast.add({ title: 'Состав подразделения обновлён', color: 'success' })
    await fetchData()
  }
  catch {
    toast.add({ title: 'Ошибка обновления участников', color: 'error' })
  }
  finally {
    savingMembersId.value = null
  }
}

function handleDelete(department: Department) {
  deletingDepartment.value = department
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deletingDepartment.value) return

  try {
    await $fetch(`/api/admin/departments/${deletingDepartment.value.id}`, {
      method: 'DELETE',
    })
    toast.add({ title: 'Подразделение удалено', color: 'success' })
    await fetchData()
  }
  catch {
    toast.add({ title: 'Ошибка удаления подразделения', color: 'error' })
  }
  finally {
    deletingDepartment.value = null
  }
}

onMounted(fetchData)
</script>
