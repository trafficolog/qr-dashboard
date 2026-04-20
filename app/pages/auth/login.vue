<template>
  <div>
    <NuxtLayout name="auth">
      <div class="space-y-6">
        <div>
          <h2 class="text-lg font-medium text-[color:var(--text-primary)]">
            {{ step === 'email' ? $t('auth.login') : $t('auth.enterCode') }}
          </h2>
          <p class="mt-1 text-sm text-[color:var(--text-secondary)]">
            <template v-if="step === 'email'">
              {{ $t('auth.loginSubtitle') }}
            </template>
            <template v-else>
              {{ $t('auth.codeSentTo') }}
              <strong class="text-[color:var(--text-primary)]">{{ email }}</strong>
            </template>
          </p>
        </div>

        <form
          class="space-y-4"
          @submit.prevent="handlePrimaryAction"
        >
          <template v-if="step === 'email'">
            <UFormField
              label="Email"
              :error="emailError"
            >
              <UInput
                v-model="email"
                type="email"
                placeholder="name@splat.com"
                icon="i-lucide-mail"
                size="lg"
                class="w-full"
                autofocus
                :disabled="loading"
              />
            </UFormField>
          </template>

          <template v-else>
            <div class="space-y-4">
              <div>
                <label class="mb-3 block text-sm font-medium text-[color:var(--text-primary)]">
                  {{ $t('auth.codeLabel') }}
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

              <div class="flex items-center justify-between text-sm">
                <span class="text-[color:var(--text-secondary)]">
                  {{ $t('auth.codeValid') }}: {{ formatTime(countdown) }}
                </span>
                <UButton
                  type="button"
                  variant="link"
                  size="sm"
                  :disabled="resendCooldown > 0 || loading"
                  @click="handleResend"
                >
                  {{
                    resendCooldown > 0
                      ? $t('auth.resendIn', { seconds: resendCooldown })
                      : $t('auth.resend')
                  }}
                </UButton>
              </div>
            </div>
          </template>

          <UButton
            type="submit"
            block
            color="primary"
            size="lg"
            :loading="loading"
            :disabled="isPrimaryDisabled"
          >
            {{ step === 'email' ? $t('auth.getCode') : $t('auth.confirm') }}
          </UButton>
        </form>

        <UAlert
          v-if="errorMessage"
          color="error"
          variant="soft"
          :title="errorMessage"
        />

        <div
          v-if="step === 'code'"
          class="pt-2"
        >
          <UButton
            type="button"
            variant="link"
            block
            color="neutral"
            @click="handleUseAnotherEmail"
          >
            &larr; {{ $t('auth.otherEmail') }}
          </UButton>
        </div>

        <p class="text-center text-xs leading-5 text-[color:var(--text-muted)]">
          {{ $t('auth.allowedDomainsNotice') }}
          <br>
          {{ $t('auth.contactAdminNotice') }}
        </p>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

type AuthStep = 'email' | 'code'

const route = useRoute()
const router = useRouter()
const { login, verify } = useAuth()
const { t } = useI18n()
const { getSecurityMessage } = useSecurityError()

const step = ref<AuthStep>('email')
const email = ref('')
const emailError = ref('')
const errorMessage = ref('')
const loading = ref(false)
const codeDigits = ref<number[]>([])
const countdown = ref(600)
const resendCooldown = ref(0)

let countdownInterval: ReturnType<typeof setInterval> | undefined
let resendInterval: ReturnType<typeof setInterval> | undefined

const codeString = computed(() => codeDigits.value.join(''))
const isPrimaryDisabled = computed(() => {
  if (loading.value) {
    return true
  }

  return step.value === 'email'
    ? email.value.trim().length === 0
    : codeString.value.length !== 6
})

onMounted(() => {
  const queryEmail = typeof route.query.email === 'string'
    ? route.query.email
    : ''
  const queryStep = route.query.step === 'code'

  if (queryEmail) {
    email.value = queryEmail
  }

  if (queryStep && queryEmail) {
    step.value = 'code'
    restartTimers()
  }
})

onUnmounted(() => {
  stopTimers()
})

function stopTimers() {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = undefined
  }

  if (resendInterval) {
    clearInterval(resendInterval)
    resendInterval = undefined
  }
}

function restartTimers(expiresIn = 600) {
  stopTimers()
  countdown.value = expiresIn
  resendCooldown.value = 60

  countdownInterval = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    }
  }, 1000)

  resendInterval = setInterval(() => {
    if (resendCooldown.value > 0) {
      resendCooldown.value--
      return
    }

    if (resendInterval) {
      clearInterval(resendInterval)
      resendInterval = undefined
    }
  }, 1000)
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

function isValidEmail(value: string): boolean {
  const parts = value.split('@')

  if (parts.length !== 2) {
    return false
  }

  const [localPart, domainPart] = parts

  return Boolean(
    localPart
    && domainPart
    && domainPart.includes('.')
    && !domainPart.startsWith('.')
    && !domainPart.endsWith('.'),
  )
}

async function syncRouteQuery() {
  if (step.value === 'code' && email.value) {
    await router.replace({
      path: route.path,
      query: {
        email: email.value,
        step: 'code',
      },
    })
    return
  }

  await router.replace({
    path: route.path,
    query: {},
  })
}

async function handlePrimaryAction() {
  if (step.value === 'email') {
    await handleSubmit()
    return
  }

  await handleVerify()
}

async function handleSubmit() {
  emailError.value = ''
  errorMessage.value = ''

  const normalizedEmail = email.value.trim().toLowerCase()
  email.value = normalizedEmail

  if (!isValidEmail(normalizedEmail)) {
    emailError.value = t('auth.invalidEmail')
    return
  }

  loading.value = true
  try {
    const response = await login(normalizedEmail)
    step.value = 'code'
    codeDigits.value = []
    restartTimers(response.data.expiresIn)
    await syncRouteQuery()
  }
  catch (error: unknown) {
    errorMessage.value = getSecurityMessage(error, t('auth.sendCodeError'))
  }
  finally {
    loading.value = false
  }
}

async function handleVerify() {
  errorMessage.value = ''

  if (codeString.value.length !== 6) {
    errorMessage.value = t('auth.codeLength')
    return
  }

  loading.value = true
  try {
    await verify(email.value, codeString.value)
    stopTimers()
    await navigateTo('/dashboard')
  }
  catch (error: unknown) {
    errorMessage.value = getSecurityMessage(error, t('auth.invalidCode'))
    codeDigits.value = []
  }
  finally {
    loading.value = false
  }
}

async function handleResend() {
  errorMessage.value = ''

  loading.value = true
  try {
    const response = await login(email.value)
    codeDigits.value = []
    restartTimers(response.data.expiresIn)
  }
  catch (error: unknown) {
    errorMessage.value = getSecurityMessage(error, t('auth.sendCodeError'))
  }
  finally {
    loading.value = false
  }
}

async function handleUseAnotherEmail() {
  step.value = 'email'
  codeDigits.value = []
  errorMessage.value = ''
  stopTimers()
  await syncRouteQuery()
}
</script>
