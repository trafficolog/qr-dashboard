<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
        {{ $t('settings.tabs.profile') }}
      </h1>
      <p class="mt-1 text-sm text-[color:var(--text-secondary)]">
        {{ $t('settings.profile.subtitle') }}
      </p>
    </div>

    <!-- Profile info -->
    <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-user"
            class="size-4 text-[color:var(--text-muted)]"
          />
          <h2 class="font-medium text-[color:var(--text-primary)]">
            {{ $t('settings.profile.info.label') }}
          </h2>
        </div>
      </template>

      <form
        class="space-y-4"
        @submit.prevent="saveProfile"
      >
        <UFormField :label="$t('settings.profile.info.name')">
          <UInput
            v-model="form.name"
            icon="i-lucide-user"
            :placeholder="$t('settings.profile.info.namePlaceholder')"
          />
        </UFormField>

        <UFormField :label="$t('settings.profile.info.email')">
          <UInput
            :model-value="user?.email || ''"
            icon="i-lucide-mail"
            disabled
          />
          <template #hint>
            <span class="text-xs text-[color:var(--text-muted)]">{{ $t('settings.profile.info.emailHint') }}</span>
          </template>
        </UFormField>

        <div class="flex justify-end">
          <UButton
            type="submit"
            :loading="saving"
            icon="i-lucide-save"
            :label="$t('forms.actions.save')"
          />
        </div>
      </form>
    </UCard>

    <!-- Account info -->
    <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-shield"
            class="size-4 text-[color:var(--text-muted)]"
          />
          <h2 class="font-medium text-[color:var(--text-primary)]">
            {{ $t('settings.profile.account.label') }}
          </h2>
        </div>
      </template>

      <dl class="space-y-3 text-sm">
        <div class="flex items-center justify-between">
          <dt class="text-[color:var(--text-secondary)]">
            {{ $t('settings.profile.account.role') }}
          </dt>
          <dd>
            <UBadge
              :color="user?.role === 'admin' ? 'error' : user?.role === 'editor' ? 'warning' : 'neutral'"
              variant="soft"
            >
              {{ roleLabel(user?.role) }}
            </UBadge>
          </dd>
        </div>
        <div class="flex items-center justify-between">
          <dt class="text-[color:var(--text-secondary)]">
            {{ $t('settings.profile.account.memberId') }}
          </dt>
          <dd class="font-mono text-xs text-[color:var(--text-muted)]">
            {{ user?.id }}
          </dd>
        </div>
      </dl>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const { user, fetchUser } = useAuth()
const toast = useA11yToast()
const { t } = useI18n()

const saving = ref(false)
const form = ref({ name: user.value?.name || '' })

function roleLabel(role?: string) {
  if (role === 'admin') return t('settings.profile.account.roleAdmin')
  if (role === 'editor') return t('settings.profile.account.roleEditor')
  return t('settings.profile.account.roleViewer')
}

async function saveProfile() {
  saving.value = true
  try {
    await $fetch<unknown>('/api/auth/me', {
      method: 'PUT' as const,
      body: { name: form.value.name.trim() || null },
    })
    await fetchUser()
    toast.add({ title: t('settings.profile.savedToast'), color: 'success' })
  }
  catch {
    toast.add({ title: t('forms.errors.serverGeneric'), color: 'error' })
  }
  finally {
    saving.value = false
  }
}
</script>
