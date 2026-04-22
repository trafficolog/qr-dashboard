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
    <section class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
      <div class="mb-3 flex items-center gap-2">
        <Icon
          name="i-lucide-user"
          class="size-4 text-[color:var(--text-muted)]"
        />
        <h2 class="font-medium text-[color:var(--text-primary)]">
          {{ $t('settings.profile.info.label') }}
        </h2>
      </div>

      <form
        class="space-y-4"
        @submit.prevent="saveProfile"
      >
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-[color:var(--text-primary)]">
            {{ $t('settings.profile.info.name') }}
          </label>
          <InputText
            v-model="form.name"
            :placeholder="$t('settings.profile.info.namePlaceholder')"
            class="w-full"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-medium text-[color:var(--text-primary)]">
            {{ $t('settings.profile.info.email') }}
          </label>
          <InputText
            :model-value="user?.email || ''"
            class="w-full"
            disabled
          />
          <span class="text-xs text-[color:var(--text-muted)]">{{ $t('settings.profile.info.emailHint') }}</span>
        </div>

        <div class="flex justify-end">
          <Button
            type="submit"
            :loading="saving"
          >
            <template #icon>
              <Icon name="i-lucide-save" />
            </template>
            {{ $t('forms.actions.save') }}
          </Button>
        </div>
      </form>
    </section>

    <!-- Account info -->
    <section class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
      <div class="mb-3 flex items-center gap-2">
        <Icon
          name="i-lucide-shield"
          class="size-4 text-[color:var(--text-muted)]"
        />
        <h2 class="font-medium text-[color:var(--text-primary)]">
          {{ $t('settings.profile.account.label') }}
        </h2>
      </div>

      <dl class="space-y-3 text-sm">
        <div class="flex items-center justify-between">
          <dt class="text-[color:var(--text-secondary)]">
            {{ $t('settings.profile.account.role') }}
          </dt>
          <dd>
            <Tag :severity="roleSeverity(user?.role)">
              {{ roleLabel(user?.role) }}
            </Tag>
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
    </section>
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

function roleSeverity(role?: string) {
  if (role === 'admin') return 'danger'
  if (role === 'editor') return 'warn'
  return 'secondary'
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
