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
    <UCard
      id="theme"
      class="border border-[color:var(--border)] bg-[color:var(--surface-0)]"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-palette"
            class="size-4 text-[color:var(--text-muted)]"
          />
          <h2 class="font-medium text-[color:var(--text-primary)]">
            {{ $t('settings.general.theme.label') }}
          </h2>
        </div>
      </template>

      <div class="flex flex-col sm:flex-row gap-3">
        <button
          v-for="theme in themes"
          :key="theme.value"
          :class="[
            'flex flex-1 items-center gap-3 rounded-lg border-2 p-3 transition-colors text-left',
            colorMode.preference === theme.value
              ? 'border-[color:var(--accent)] bg-[color:var(--accent-light)]'
              : 'border-[color:var(--border)] hover:border-[color:var(--accent)]/50',
          ]"
          @click="colorMode.preference = theme.value"
        >
          <UIcon
            :name="theme.icon"
            class="size-5 shrink-0"
          />
          <span class="text-sm font-medium text-[color:var(--text-primary)]">{{ theme.label }}</span>
        </button>
      </div>
    </UCard>

    <!-- Language -->
    <UCard
      id="language"
      class="border border-[color:var(--border)] bg-[color:var(--surface-0)]"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-languages"
            class="size-4 text-[color:var(--text-muted)]"
          />
          <h2 class="font-medium text-[color:var(--text-primary)]">
            {{ $t('settings.general.language.label') }}
          </h2>
        </div>
      </template>

      <USelect
        :model-value="locale"
        :items="locales"
        class="w-48"
        @update:model-value="(v) => setLocale(v as 'ru' | 'en')"
      />
    </UCard>

    <!-- Timezone -->
    <UCard
      id="timezone"
      class="border border-[color:var(--border)] bg-[color:var(--surface-0)]"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-clock"
            class="size-4 text-[color:var(--text-muted)]"
          />
          <h2 class="font-medium text-[color:var(--text-primary)]">
            {{ $t('settings.general.timezone.label') }}
          </h2>
        </div>
      </template>

      <p class="text-sm text-[color:var(--text-secondary)]">
        {{ $t('settings.general.timezone.auto') }}:
        <span class="font-medium text-[color:var(--text-primary)]">{{ detectedTimezone }}</span>
      </p>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useColorMode, useI18n } from '#imports'

const colorMode = useColorMode()
const { locale, setLocale } = useI18n()

const themes = [
  { value: 'light', label: 'Светлая', icon: 'i-lucide-sun' },
  { value: 'dark', label: 'Тёмная', icon: 'i-lucide-moon' },
  { value: 'system', label: 'Системная', icon: 'i-lucide-monitor' },
]

const locales = [
  { label: 'Русский', value: 'ru' },
  { label: 'English', value: 'en' },
]

const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
</script>
