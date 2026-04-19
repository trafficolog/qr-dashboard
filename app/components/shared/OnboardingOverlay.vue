<template>
  <div class="fixed inset-0 z-[60]">
    <div class="absolute inset-0 bg-black/60" />

    <div
      v-if="highlightStyle"
      class="absolute rounded-xl border-2 border-primary-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-[top,left,width,height] duration-200"
      :style="highlightStyle"
    />

    <div class="relative z-10 flex min-h-full items-end justify-center p-4 sm:items-center">
      <UCard class="w-full max-w-lg">
        <template #header>
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm text-[color:var(--text-secondary)]">
                {{ $t('onboarding.progress', { current: currentStep + 1, total: steps.length }) }}
              </p>
              <h3 class="text-lg font-semibold text-[color:var(--text-primary)]">
                {{ t(steps[currentStep]!.titleKey) }}
              </h3>
            </div>
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-lucide-x"
              :aria-label="$t('onboarding.actions.skip')"
              @click="emit('close')"
            />
          </div>
        </template>

        <p class="text-sm text-[color:var(--text-secondary)]">
          {{ t(steps[currentStep]!.descriptionKey) }}
        </p>

        <template #footer>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <UButton
              variant="ghost"
              color="neutral"
              :label="$t('onboarding.actions.skip')"
              @click="emit('close')"
            />

            <div class="flex items-center gap-2">
              <UButton
                v-if="currentStep > 0"
                variant="outline"
                color="neutral"
                :label="$t('onboarding.actions.back')"
                @click="goBack"
              />
              <UButton
                :label="isLastStep ? $t('onboarding.actions.finish') : $t('onboarding.actions.next')"
                @click="goNext"
              />
            </div>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

interface OnboardingStep {
  target: string
  titleKey: string
  descriptionKey: string
}

const steps: OnboardingStep[] = [
  {
    target: '[data-onboarding="dashboard-actions"]',
    titleKey: 'onboarding.steps.actions.title',
    descriptionKey: 'onboarding.steps.actions.description',
  },
  {
    target: '[data-onboarding="dashboard-date-range"]',
    titleKey: 'onboarding.steps.dateRange.title',
    descriptionKey: 'onboarding.steps.dateRange.description',
  },
  {
    target: '[data-onboarding="dashboard-stats"]',
    titleKey: 'onboarding.steps.stats.title',
    descriptionKey: 'onboarding.steps.stats.description',
  },
  {
    target: '[data-onboarding="dashboard-top-qr"]',
    titleKey: 'onboarding.steps.topQr.title',
    descriptionKey: 'onboarding.steps.topQr.description',
  },
]

const emit = defineEmits<{
  close: []
}>()

const currentStep = ref(0)
const highlightStyle = ref<Record<string, string> | null>(null)
const isLastStep = computed(() => currentStep.value === steps.length - 1)

function updateHighlight() {
  const selector = steps[currentStep.value]?.target
  if (!selector || !import.meta.client) {
    highlightStyle.value = null
    return
  }

  const element = document.querySelector(selector)
  if (!element) {
    highlightStyle.value = null
    return
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'center' })

  const rect = element.getBoundingClientRect()
  highlightStyle.value = {
    top: `${Math.max(rect.top - 8, 8)}px`,
    left: `${Math.max(rect.left - 8, 8)}px`,
    width: `${rect.width + 16}px`,
    height: `${rect.height + 16}px`,
    pointerEvents: 'none',
  }
}

function goNext() {
  if (isLastStep.value) {
    emit('close')
    return
  }

  currentStep.value += 1
}

function goBack() {
  if (currentStep.value > 0) {
    currentStep.value -= 1
  }
}

onMounted(() => {
  updateHighlight()
  window.addEventListener('resize', updateHighlight)
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('resize', updateHighlight)
  }
})

watch(currentStep, () => {
  setTimeout(updateHighlight, 150)
})
</script>
