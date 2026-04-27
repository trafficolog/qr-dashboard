<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
          Уведомления
        </h1>
        <p class="mt-1 text-sm text-[color:var(--text-secondary)]">
          История событий команды и системы
        </p>
      </div>
      <Button
        outlined
        severity="secondary"
        :disabled="unreadCount === 0"
        @click="markAllAsRead"
      >
        <template #icon>
          <Icon name="i-lucide-check-check" />
        </template>
        Отметить всё как прочитанное
      </Button>
    </div>

    <section class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
      <div class="flex flex-wrap gap-2">
        <Button
          v-for="tab in tabs"
          :key="tab.value"
          size="small"
          :severity="activeTab === tab.value ? 'primary' : 'secondary'"
          :outlined="activeTab !== tab.value"
          @click="activeTab = tab.value"
        >
          {{ tab.label }} ({{ countByTab(tab.value) }})
        </Button>
      </div>
    </section>

    <section class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
      <div
        v-if="loading"
        class="space-y-3"
      >
        <Skeleton
          v-for="index in 4"
          :key="index"
          height="3.5rem"
          border-radius="12px"
        />
      </div>

      <div
        v-else-if="!filtered.length"
        class="py-10 text-center text-[color:var(--text-muted)]"
      >
        Нет уведомлений в выбранной вкладке
      </div>

      <ul
        v-else
        class="divide-y divide-[color:var(--surface-2)]"
      >
        <li
          v-for="item in filtered"
          :key="item.id"
          class="py-4"
        >
          <div class="flex items-start gap-3">
            <span
              class="mt-1.5 size-2 rounded-full"
              :class="item.read ? 'bg-[color:var(--text-muted)]/30' : 'bg-[color:var(--color-success)]'"
            />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <Tag
                  :severity="severityByType(item.type)"
                  :value="labelByType(item.type)"
                />
                <span class="text-xs text-[color:var(--text-muted)]">{{ formatDate(item.createdAt) }}</span>
              </div>
              <p class="mt-1 font-medium text-[color:var(--text-primary)]">
                {{ item.title }}
              </p>
              <p class="mt-0.5 text-sm text-[color:var(--text-secondary)]">
                {{ item.description }}
              </p>
            </div>
            <Button
              v-if="!item.read"
              text
              size="small"
              @click="markAsRead(item.id)"
            >
              Прочитано
            </Button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
type TabFilter = 'all' | 'team' | 'security' | 'system'

const activeTab = ref<TabFilter>('all')
const { notifications, loading, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotifications()

const tabs: Array<{ label: string, value: TabFilter }> = [
  { label: 'Все', value: 'all' },
  { label: 'Команда', value: 'team' },
  { label: 'Безопасность', value: 'security' },
  { label: 'Система', value: 'system' },
]

const filtered = computed(() => (
  activeTab.value === 'all'
    ? notifications.value
    : notifications.value.filter(item => item.type === activeTab.value)
))

function countByTab(tab: TabFilter) {
  if (tab === 'all') return notifications.value.length
  return notifications.value.filter(item => item.type === tab).length
}

function labelByType(type: 'team' | 'security' | 'system') {
  if (type === 'team') return 'Команда'
  if (type === 'security') return 'Безопасность'
  return 'Система'
}

function severityByType(type: 'team' | 'security' | 'system') {
  if (type === 'team') return 'info'
  if (type === 'security') return 'warn'
  return 'secondary'
}

onMounted(() => {
  fetchNotifications()
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
