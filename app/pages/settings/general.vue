<template>
  <div class="space-y-6">
    <div>
      <h1
        id="general"
        class="text-2xl font-bold text-[color:var(--text-primary)]"
      >
        {{ $t('settings.tabs.general') }}
      </h1>
      <p class="mt-1 text-sm text-[color:var(--text-secondary)]">
        {{ $t('settings.general.subtitle') }}
      </p>
    </div>

    <!-- Theme -->
    <section
      id="theme"
      class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5"
    >
      <div class="mb-3 flex items-center gap-2">
        <Icon
          name="i-lucide-palette"
          class="size-4 text-[color:var(--text-muted)]"
        />
        <h2 class="font-medium text-[color:var(--text-primary)]">
          {{ $t('settings.general.theme.label') }}
        </h2>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <button
          v-for="theme in themes"
          :key="theme.value"
          :class="[
            'flex flex-1 items-center gap-3 rounded-lg border-2 p-3 transition-interactive text-left',
            selectedTheme === theme.value
              ? 'border-[color:var(--accent)] bg-[color:var(--accent-light)]'
              : 'border-[color:var(--border)] hover:border-[color:var(--accent)]/50',
          ]"
          @click="handleThemeSelect(theme.value)"
        >
          <Icon
            :name="theme.icon"
            class="size-5 shrink-0"
          />
          <span class="text-sm font-medium text-[color:var(--text-primary)]">{{ theme.label }}</span>
        </button>
      </div>
    </section>

    <!-- Language -->
    <section
      id="language"
      class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5"
    >
      <div class="mb-3 flex items-center gap-2">
        <Icon
          name="i-lucide-languages"
          class="size-4 text-[color:var(--text-muted)]"
        />
        <h2 class="font-medium text-[color:var(--text-primary)]">
          {{ $t('settings.general.language.label') }}
        </h2>
      </div>

      <Select
        :model-value="localeValue"
        :options="locales"
        option-label="label"
        option-value="value"
        class="w-48"
        @update:model-value="updateLocale"
      />
    </section>

    <!-- Timezone -->
    <section
      id="timezone"
      class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5"
    >
      <div class="mb-3 flex items-center gap-2">
        <Icon
          name="i-lucide-clock"
          class="size-4 text-[color:var(--text-muted)]"
        />
        <h2 class="font-medium text-[color:var(--text-primary)]">
          {{ $t('settings.general.timezone.label') }}
        </h2>
      </div>

      <p class="text-sm text-[color:var(--text-secondary)]">
        {{ $t('settings.general.timezone.auto') }}:
        <span class="font-medium text-[color:var(--text-primary)]">{{ detectedTimezone }}</span>
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '#imports'

const { themePreference, setTheme } = useLayout()
const { locale, setLocale } = useI18n()

const themes = [
  { value: 'light', label: 'Светлая', icon: 'i-lucide-sun' },
  { value: 'dark', label: 'Тёмная', icon: 'i-lucide-moon' },
] as const

const locales = [
  { label: 'Русский', value: 'ru' },
  { label: 'English', value: 'en' },
]

const selectedTheme = computed<'light' | 'dark'>(() => themePreference.value)
const localeValue = computed(() => locale.value as 'ru' | 'en')

const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

function handleThemeSelect(value: 'light' | 'dark') {
  setTheme(value)
}

function updateLocale(value: string) {
  setLocale(value as 'ru' | 'en')
}
</script>
