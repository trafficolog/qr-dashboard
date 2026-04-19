<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
          {{ $t('pages.team.title') }}
        </h1>
        <p class="mt-0.5 text-sm text-[color:var(--text-secondary)]">
          {{ $t('pages.team.subtitle') }}
        </p>
      </div>
      <UButton
        icon="i-lucide-user-plus"
        :label="$t('forms.actions.invite')"
        @click="inviteOpen = true"
      />
    </div>

    <!-- Members table -->
    <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-medium text-[color:var(--text-primary)]">
            {{ $t('team.members.title') }}
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
        <p>{{ $t('team.members.empty') }}</p>
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
            {{ $t('team.members.qrCount', { count: member.qrCount }) }}
          </span>

          <!-- Last login -->
          <span class="hidden md:block text-xs text-[color:var(--text-muted)] whitespace-nowrap">
            {{ member.lastLoginAt ? formatDate(member.lastLoginAt) : $t('team.members.neverLoggedIn') }}
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
      :open="inviteOpen"
      :title="$t('team.invite.modalTitle')"
      :close-on-escape="true"
      @update:open="handleInviteModalOpenChange"
    >
      <template #body>
        <form
          class="space-y-4"
          @submit.prevent="handleInvite"
        >
          <UFormField
            :label="$t('forms.labels.email')"
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
            :label="$t('forms.labels.role')"
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
            :description="$t('team.invite.alertDescription')"
          />
        </form>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            :label="$t('forms.actions.cancel')"
            variant="outline"
            color="neutral"
            @click="requestInviteClose"
          />
          <UButton
            :label="$t('forms.actions.invite')"
            icon="i-lucide-send"
            :loading="inviting"
            @click="handleInvite"
          />
        </div>
      </template>
    </UModal>

    <SharedUnsavedChangesDialog
      v-model:open="inviteUnsaved.showDialog.value"
      @confirm="confirmInviteDiscard"
      @cancel="inviteUnsaved.cancel"
    />

    <!-- Confirm delete -->
    <SharedConfirmDialog
      v-model:open="deleteOpen"
      :title="$t('team.delete.title')"
      :message="deletingMember
        ? t('team.delete.message', { name: deletingMember.name || deletingMember.email })
        : ''"
      :confirm-label="$t('forms.actions.delete')"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { useFormValidation } from '~/composables/useFormValidation'
import { useUnsavedChanges } from '~/composables/useUnsavedChanges'
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
const { t, locale } = useI18n()
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
  email: z.string().trim().min(1, 'forms.errors.required').email('forms.errors.email'),
  role: z.enum(['admin', 'editor', 'viewer'], { message: 'forms.errors.required' }),
})
const { errors: inviteErrors, touched: inviteTouched, validate: validateInvite, validateField: validateInviteField, setServerErrors: setInviteServerErrors, reset: resetInviteValidation } = useFormValidation(inviteSchema)
const inviteEmailError = computed(() => inviteTouched.value.email ? translateError(inviteErrors.value.email) : '')
const inviteRoleError = computed(() => inviteTouched.value.role ? translateError(inviteErrors.value.role) : '')
const isInviteDirty = computed(() => inviteOpen.value && inviteForm.value.email.trim() !== '')
const inviteUnsaved = useUnsavedChanges(isInviteDirty)

// Delete confirmation
const deleteOpen = ref(false)
const deletingMember = ref<TeamMember | null>(null)

watch(inviteOpen, (open) => {
  if (open) focusReturn.save()
  else focusReturn.restore()
})

const roleItems = computed(() => [
  { label: t('team.roles.admin'), value: 'admin' as RoleValue },
  { label: t('team.roles.editor'), value: 'editor' as RoleValue },
  { label: t('team.roles.viewer'), value: 'viewer' as RoleValue },
])

function roleLabel(role: RoleValue) {
  return roleItems.value.find(r => r.value === role)?.label ?? role
}

function roleColor(role: RoleValue): 'error' | 'warning' | 'neutral' {
  if (role === 'admin') return 'error'
  if (role === 'editor') return 'warning'
  return 'neutral'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(locale.value === 'ru' ? 'ru-RU' : 'en-US', {
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
    toast.add({ title: t('team.toasts.loadError'), color: 'error' })
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
    toast.add({ title: t('team.toasts.roleChanged', { role: roleLabel(newRole) }), color: 'success' })
  }
  catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    toast.add({ title: e?.data?.message ?? t('team.toasts.roleChangeError'), color: 'error' })
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
    toast.add({ title: t('team.toasts.inviteSent', { email: inviteForm.value.email }), color: 'success' })
    inviteOpen.value = false
    cleanInviteForm()
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

function cleanInviteForm() {
  inviteUnsaved.markClean()
  inviteForm.value = { email: '', role: 'editor' }
  resetInviteValidation()
}

function requestInviteClose() {
  handleInviteModalOpenChange(false)
}

function handleInviteModalOpenChange(nextOpen: boolean) {
  if (nextOpen) {
    inviteOpen.value = true
    return
  }

  if (isInviteDirty.value) {
    inviteUnsaved.showDialog.value = true
    return
  }

  inviteOpen.value = false
}

function confirmInviteDiscard() {
  cleanInviteForm()
  inviteOpen.value = false
  inviteUnsaved.confirm()
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
    toast.add({ title: t('team.toasts.memberDeleted'), color: 'success' })
  }
  catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    toast.add({ title: e?.data?.message ?? t('team.toasts.deleteError'), color: 'error' })
  }
  finally {
    deletingId.value = null
    deletingMember.value = null
  }
}

onMounted(fetchMembers)
</script>
