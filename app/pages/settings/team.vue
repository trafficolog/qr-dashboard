<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
          Команда
        </h1>
        <p class="mt-0.5 text-sm text-[color:var(--text-secondary)]">
          Управление участниками команды и их ролями
        </p>
      </div>
      <UButton
        icon="i-lucide-user-plus"
        label="Пригласить"
        @click="inviteOpen = true"
      />
    </div>

    <!-- Members table -->
    <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-medium text-[color:var(--text-primary)]">
            Участники
          </h2>
          <UBadge
            color="neutral"
            variant="subtle"
          >
            {{ members.length }}
          </UBadge>
        </div>
      </template>

      <!-- Loading -->
      <div
        v-if="loading"
        class="space-y-3 py-2"
      >
        <USkeleton
          v-for="i in 4"
          :key="i"
          class="h-14 w-full rounded-lg"
        />
      </div>

      <!-- Empty -->
      <div
        v-else-if="members.length === 0"
        class="py-10 text-center text-[color:var(--text-secondary)]"
      >
        <UIcon
          name="i-lucide-users"
          class="mx-auto mb-2 size-10 text-[color:var(--text-muted)]/50"
        />
        <p>Нет участников</p>
      </div>

      <!-- List -->
      <ul
        v-else
        class="divide-y divide-[color:var(--surface-2)]"
      >
        <li
          v-for="member in members"
          :key="member.id"
          class="flex items-center gap-4 py-3"
        >
          <!-- Avatar -->
          <UAvatar
            :alt="member.name || member.email"
            :src="member.avatarUrl || undefined"
            size="sm"
          />

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm text-[color:var(--text-primary)] truncate">
              {{ member.name || member.email }}
            </p>
            <p
              v-if="member.name"
              class="text-xs text-[color:var(--text-muted)] truncate"
            >
              {{ member.email }}
            </p>
          </div>

          <!-- QR count -->
          <span class="hidden sm:block text-xs text-[color:var(--text-muted)] whitespace-nowrap">
            {{ member.qrCount }} QR
          </span>

          <!-- Last login -->
          <span class="hidden md:block text-xs text-[color:var(--text-muted)] whitespace-nowrap">
            {{ member.lastLoginAt ? formatDate(member.lastLoginAt) : 'Не входил' }}
          </span>

          <!-- Role badge (self — not editable) -->
          <div v-if="member.id === currentUser?.id">
            <UBadge
              :color="roleColor(member.role)"
              variant="soft"
            >
              {{ roleLabel(member.role) }}
            </UBadge>
          </div>

          <!-- Role select for others -->
          <USelect
            v-else
            :model-value="member.role"
            :items="roleItems"
            size="xs"
            class="w-28"
            :disabled="updatingId === member.id"
            @update:model-value="handleRoleChange(member, $event as RoleValue)"
          />

          <!-- Delete -->
          <UButton
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            size="xs"
            :aria-label="t('a11y.actions.deleteMember', { name: member.name || member.email })"
            :title="t('a11y.actions.deleteMember', { name: member.name || member.email })"
            :disabled="member.id === currentUser?.id"
            :loading="deletingId === member.id"
            @click="handleDelete(member)"
          />
        </li>
      </ul>
    </UCard>

    <!-- Invite modal -->
    <UModal
      v-model:open="inviteOpen"
      title="Пригласить участника"
      :close-on-escape="true"
    >
      <template #body>
        <form
          class="space-y-4"
          @submit.prevent="handleInvite"
        >
          <UFormField
            label="Email"
            :error="inviteEmailError"
            :hint="$t('forms.hints.inviteEmail')"
            required
          >
            <UInput
              v-model="inviteForm.email"
              type="email"
              placeholder="user@company.com"
              icon="i-lucide-mail"
              :aria-invalid="!!inviteEmailError"
              :aria-describedby="inviteEmailError ? inviteEmailErrorId : undefined"
              :aria-required="true"
              autofocus
              @blur="validateInviteEmail"
            />
            <template #error="{ error }">
              <p
                v-if="error"
                :id="inviteEmailErrorId"
                role="alert"
                aria-live="polite"
              >
                {{ error }}
              </p>
            </template>
          </UFormField>

          <UFormField
            label="Роль"
            :error="inviteRoleError"
            required
          >
            <USelect
              v-model="inviteForm.role"
              :items="roleItems"
              class="w-full"
              :aria-invalid="!!inviteRoleError"
              :aria-describedby="inviteRoleError ? inviteRoleErrorId : undefined"
              :aria-required="true"
              @update:model-value="validateInviteRole"
            />
            <template #error="{ error }">
              <p
                v-if="error"
                :id="inviteRoleErrorId"
                role="alert"
                aria-live="polite"
              >
                {{ error }}
              </p>
            </template>
          </UFormField>

          <UAlert
            icon="i-lucide-info"
            color="info"
            variant="soft"
            description="Пользователь получит письмо с инструкцией по входу. Для авторизации используется OTP-код."
          />
        </form>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            label="Отмена"
            variant="outline"
            color="neutral"
            @click="inviteOpen = false"
          />
          <UButton
            label="Пригласить"
            icon="i-lucide-send"
            :loading="inviting"
            @click="handleInvite"
          />
        </div>
      </template>
    </UModal>

    <!-- Confirm delete -->
    <SharedConfirmDialog
      v-model:open="deleteOpen"
      title="Удалить участника?"
      :message="deletingMember
        ? `Пользователь «${deletingMember.name || deletingMember.email}» будет удалён. Его QR-коды будут переназначены вам.`
        : ''"
      confirm-label="Удалить"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { useFormValidation } from '~/composables/useFormValidation'
import { createDialogFocusReturn } from '~/utils/dialog-focus-return'

definePageMeta({
  middleware: () => {
    const { user } = useAuth()
    if (user.value?.role !== 'admin') {
      return navigateTo('/dashboard')
    }
  },
})

  type RoleValue = 'admin' | 'editor' | 'viewer'

interface TeamMember {
  id: string
  email: string
  name: string | null
  role: RoleValue
  avatarUrl: string | null
  lastLoginAt: string | null
  createdAt: string
  qrCount: number
}

const { user: currentUser } = useAuth()
const toast = useA11yToast()
const { t } = useI18n()
const inviteEmailErrorId = 'settings-team-invite-email-error'
const inviteRoleErrorId = 'settings-team-invite-role-error'

const loading = ref(true)
const members = ref<TeamMember[]>([])
const updatingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)

// Invite modal
const inviteOpen = ref(false)
const focusReturn = createDialogFocusReturn()
const inviting = ref(false)
const inviteForm = ref({ email: '', role: 'editor' as RoleValue })
const inviteSchema = z.object({
  email: z.string().trim().min(1, 'forms.errors.required').email('Некорректный email'),
  role: z.enum(['admin', 'editor', 'viewer'], { message: 'forms.errors.required' }),
})
const { errors: inviteErrors, touched: inviteTouched, validate: validateInvite, validateField: validateInviteField, setServerErrors: setInviteServerErrors, reset: resetInviteValidation } = useFormValidation(inviteSchema)
const inviteEmailError = computed(() => inviteTouched.value.email ? translateError(inviteErrors.value.email) : '')
const inviteRoleError = computed(() => inviteTouched.value.role ? translateError(inviteErrors.value.role) : '')

// Delete confirmation
const deleteOpen = ref(false)
const deletingMember = ref<TeamMember | null>(null)

watch(inviteOpen, (open) => {
  if (open) focusReturn.save()
  else focusReturn.restore()
})

const roleItems = [
  { label: 'Администратор', value: 'admin' },
  { label: 'Редактор', value: 'editor' },
  { label: 'Наблюдатель', value: 'viewer' },
]

function roleLabel(role: RoleValue) {
  return roleItems.find(r => r.value === role)?.label ?? role
}

function roleColor(role: RoleValue): 'error' | 'warning' | 'neutral' {
  if (role === 'admin') return 'error'
  if (role === 'editor') return 'warning'
  return 'neutral'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

async function fetchMembers() {
  loading.value = true
  try {
    const res = await $fetch<{ data: TeamMember[] }>('/api/team')
    members.value = res.data
  }
  catch {
    toast.add({ title: 'Ошибка загрузки команды', color: 'error' })
  }
  finally {
    loading.value = false
  }
}

async function handleRoleChange(member: TeamMember, newRole: RoleValue) {
  if (member.role === newRole) return
  updatingId.value = member.id
  try {
    const res = await $fetch<{ data: TeamMember }>(`/api/team/${member.id}`, {
      method: 'PUT',
      body: { role: newRole },
    })
    const idx = members.value.findIndex(m => m.id === member.id)
    if (idx !== -1) members.value[idx] = res.data
    toast.add({ title: `Роль изменена на «${roleLabel(newRole)}»`, color: 'success' })
  }
  catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    toast.add({ title: e?.data?.message ?? 'Ошибка изменения роли', color: 'error' })
  }
  finally {
    updatingId.value = null
  }
}

async function handleInvite() {
  if (!validateInvite(inviteForm.value)) return

  inviting.value = true
  try {
    const res = await $fetch<{ data: TeamMember }>('/api/team/invite', {
      method: 'POST',
      body: { email: inviteForm.value.email, role: inviteForm.value.role },
    })
    members.value.push(res.data)
    toast.add({ title: `Приглашение отправлено на ${inviteForm.value.email}`, color: 'success' })
    inviteOpen.value = false
    inviteForm.value = { email: '', role: 'editor' }
    resetInviteValidation()
  }
  catch (err: unknown) {
    const e = err as {
      statusCode?: number
      data?: {
        message?: string
        fieldErrors?: Record<string, string>
      }
    }
    // 422 → server-side field errors
    if (e?.statusCode === 422 && e.data?.fieldErrors) {
      setInviteServerErrors(e.data.fieldErrors)
    }
    else {
      const msg = e?.data?.message ?? t('forms.errors.serverGeneric')
      setInviteServerErrors({ email: msg })
    }
  }
  finally {
    inviting.value = false
  }
}

function validateInviteEmail() {
  validateInviteField('email', inviteForm.value.email)
}

function validateInviteRole() {
  validateInviteField('role', inviteForm.value.role)
}

function translateError(message?: string) {
  if (!message) return ''
  return message.startsWith('forms.') ? t(message) : message
}

function handleDelete(member: TeamMember) {
  deletingMember.value = member
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deletingMember.value) return
  deletingId.value = deletingMember.value.id
  try {
    await $fetch(`/api/team/${deletingMember.value.id}`, { method: 'DELETE' })
    members.value = members.value.filter(m => m.id !== deletingMember.value!.id)
    toast.add({ title: 'Участник удалён', color: 'success' })
  }
  catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    toast.add({ title: e?.data?.message ?? 'Ошибка удаления', color: 'error' })
  }
  finally {
    deletingId.value = null
    deletingMember.value = null
  }
}

onMounted(fetchMembers)
</script>
