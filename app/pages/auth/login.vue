<template>
  <div>
    <NuxtLayout name="auth">
      <div class="space-y-6">
        <div>
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ $t('auth.login') }}
          </h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ $t('auth.loginSubtitle') }}
          </p>
        </div>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <UFormField label="Email" :error="emailError">
            <UInput
              v-model="email"
              type="email"
              placeholder="name@splat.com"
              icon="i-lucide-mail"
              size="lg"
              autofocus
              :disabled="loading"
            />
          </UFormField>

          <UButton
            type="submit"
            block
            size="lg"
            :loading="loading"
            :disabled="!email || loading"
          >
            {{ $t('auth.getCode') }}
          </UButton>
        </form>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { login } = useAuth()
const toast = useToast()

const email = ref('')
const emailError = ref('')
const loading = ref(false)

async function handleSubmit() {
  emailError.value = ''

  if (!email.value || !email.value.includes('@')) {
    emailError.value = 'Введите корректный email'
    return
  }

  loading.value = true
  try {
    await login(email.value)
    await navigateTo(`/auth/verify?email=${encodeURIComponent(email.value)}`)
  } catch (error: unknown) {
    const err = error as { data?: { message?: string }; statusMessage?: string }
    const message = err?.data?.message || err?.statusMessage || 'Ошибка отправки кода'
    toast.add({ title: message, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
