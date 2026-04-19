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

      <UButton
        icon="i-lucide-plus"
        label="Создать подразделение"
        @click="openCreate"
      />
    </div>

    <div
      v-if="loading"
      class="space-y-3"
    >
      <USkeleton
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
      <UCard
        v-for="department in departments"
        :key="department.id"
      >
        <template #header>
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
              <UButton
                icon="i-lucide-pencil"
                size="sm"
                variant="outline"
                @click="openEdit(department)"
              >
                Редактировать
              </UButton>
              <UButton
                icon="i-lucide-trash-2"
                size="sm"
                color="error"
                variant="ghost"
                @click="handleDelete(department)"
              />
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <p
            v-if="department.description"
            class="text-sm text-[color:var(--text-secondary)]"
          >
            {{ department.description }}
          </p>

          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Руководитель">
              <USelect
                :model-value="department.headUserId ?? ''"
                :items="memberOptions"
                placeholder="Не назначен"
                @update:model-value="updateHead(department, $event as string)"
              />
            </UFormField>

            <UFormField label="Участники">
              <USelectMenu
                :model-value="selectedMembersByDepartment[department.id] ?? []"
                :items="memberOptions"
                value-key="value"
                multiple
                searchable
                placeholder="Выберите участников"
                @update:model-value="setSelectedMembers(department.id, $event as string[])"
              />
            </UFormField>
          </div>

          <div class="flex justify-end">
            <UButton
              size="sm"
              icon="i-lucide-save"
              :loading="savingMembersId === department.id"
              @click="saveMembers(department)"
            >
              Сохранить участников
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <UModal
      v-model:open="formOpen"
      :title="editingDepartment ? 'Редактировать подразделение' : 'Создать подразделение'"
      :close-on-escape="true"
    >
      <template #body>
        <form
          class="space-y-4"
          @submit.prevent="submitForm"
        >
          <UFormField
            label="Название"
            required
          >
            <UInput v-model="form.name" />
          </UFormField>

          <UFormField
            label="Slug"
            hint="Только lowercase + дефисы"
            required
          >
            <UInput v-model="form.slug" />
          </UFormField>

          <UFormField label="Описание">
            <UTextarea v-model="form.description" />
          </UFormField>

          <UFormField label="Цвет (HEX)">
            <UInput
              v-model="form.color"
              placeholder="#0EA5E9"
            />
          </UFormField>

          <UFormField label="Руководитель">
            <USelect
              v-model="form.headUserId"
              :items="memberOptions"
              placeholder="Не назначен"
            />
          </UFormField>
        </form>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            variant="outline"
            @click="formOpen = false"
          >
            Отмена
          </UButton>
          <UButton
            :loading="savingForm"
            @click="submitForm"
          >
            Сохранить
          </UButton>
        </div>
      </template>
    </UModal>

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
