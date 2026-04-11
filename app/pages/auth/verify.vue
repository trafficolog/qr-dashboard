<template>
  <div>
    <NuxtLayout name="auth">
      <div class="space-y-6">
        <div>
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ $t('auth.enterCode') }}
          </h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ $t('auth.codeSentTo') }}
            <strong class="text-gray-700 dark:text-gray-300">{{ email }}</strong>
          </p>
        </div>

        <form class="space-y-4" @submit.prevent="handleVerify">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Код подтверждения
            </label>
            <div class="flex justify-center">
              <UPinInput
                v-model="codeDigits"
                :length="6"
                type="number"
                size="lg"
                otp
                @complete="handleVerify"
              />
            </div>
          </div>

          <UButton
            type="submit"
            block
            size="lg"
            :loading="loading"
            :disabled="codeString.length !== 6 || loading"
          >
            {{ $t('auth.confirm') }}
          </UButton>
        </form>

        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500 dark:text-gray-400">
            {{ $t('auth.codeValid') }}: {{ formatTime(countdown) }}
          </span>
          <UButton
            variant="link"
            size="sm"
            :disabled="resendCooldown > 0 || loading"
            @click="handleResend"
          >
            {{
              resendCooldown > 0
                ? `Повторно через ${resendCooldown} сек`
                : $t('auth.resend')
            }}
          </UButton>
        </div>

        <div class="pt-2">
          <UButton
            variant="link"
            block
            color="neutral"
            @click="navigateTo('/auth/login')"
          >
            &larr; {{ $t('auth.otherEmail') }}
          </UButton>
        </div>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const { verify, login: sendOtp } = useAuth()
const toast = useToast()

const email = computed(() => String(route.query.email || ''))
const codeDigits = ref<string[]>([])
const codeString = computed(() => codeDigits.value.join(''))
const loading = ref(false)
const countdown = ref(600) // 10 мин
const resendCooldown = ref(60)

let countdownInterval: ReturnType<typeof setInterval>
let resendInterval: ReturnType<typeof setInterval>

onMounted(() => {
  if (!email.value) {
    navigateTo('/auth/login')
    return
  }

  countdownInterval = setInterval(() => {
    if (countdown.value > 0) countdown.value--
  }, 1000)

  resendInterval = setInterval(() => {
    if (resendCooldown.value > 0) resendCooldown.value--
  }, 1000)
})

onUnmounted(() => {
  clearInterval(countdownInterval)
  clearInterval(resendInterval)
})

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

async function handleVerify() {
  if (codeString.value.length !== 6) return

  loading.value = true
  try {
    await verify(email.value, codeString.value)
    await navigateTo('/dashboard')
  } catch (error: unknown) {
    const err = error as { data?: { message?: string }; statusMessage?: string }
    const message = err?.data?.message || err?.statusMessage || 'Неверный код'
    toast.add({ title: message, color: 'error' })
    codeDigits.value = []
  } finally {
    loading.value = false
  }
}

async function handleResend() {
  try {
    await sendOtp(email.value)
    resendCooldown.value = 60
    countdown.value = 600
    codeDigits.value = []
    toast.add({ title: 'Код отправлен повторно', color: 'success' })
  } catch (error: unknown) {
    const err = error as { data?: { message?: string }; statusMessage?: string }
    toast.add({
      title: err?.data?.message || 'Ошибка отправки',
      color: 'error',
    })
  }
}
</script>
