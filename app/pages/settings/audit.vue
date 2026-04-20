<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
        {{ $t('pages.audit.title') }}
      </h1>
      <p class="text-sm text-[color:var(--text-secondary)] mt-0.5">
        {{ $t('pages.audit.subtitle') }}
      </p>
    </div>

    <UCard class="mb-4">
      <div class="grid grid-cols-1 md:grid-cols-6 gap-3">
        <UInput
          v-model="filters.userId"
          :placeholder="$t('pages.audit.filters.userId')"
        />
        <USelect
          v-model="filters.action"
          :items="actionOptions"
          :placeholder="$t('pages.audit.filters.action')"
        />
        <UInput
          v-model="filters.entityType"
          :placeholder="$t('pages.audit.filters.entityType')"
        />
        <UInput
          v-model="filters.dateFrom"
          type="date"
          :placeholder="$t('pages.audit.filters.dateFrom')"
        />
        <UInput
          v-model="filters.dateTo"
          type="date"
          :placeholder="$t('pages.audit.filters.dateTo')"
        />
        <div class="flex gap-2">
          <UButton
            class="flex-1"
            icon="i-lucide-search"
            @click="applyFilters"
          >
            {{ $t('forms.actions.apply') }}
          </UButton>
          <UButton
            variant="outline"
            color="neutral"
            icon="i-lucide-x"
            @click="resetFilters"
          >
            {{ $t('forms.actions.reset') }}
          </UButton>
        </div>
      </div>
    </UCard>

    <UCard>
      <div
        v-if="loading"
        class="space-y-2"
      >
        <USkeleton
          v-for="i in 6"
          :key="i"
          class="h-10 w-full"
        />
      </div>
      <div
        v-else-if="rows.length === 0"
        class="py-8 text-center text-[color:var(--text-muted)]"
      >
        {{ $t('pages.audit.empty') }}
      </div>
      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-[color:var(--border)] text-left">
              <th class="py-2">
                {{ $t('pages.audit.table.date') }}
              </th>
              <th class="py-2">
                {{ $t('pages.audit.table.user') }}
              </th>
              <th class="py-2">
                {{ $t('pages.audit.table.action') }}
              </th>
              <th class="py-2">
                {{ $t('pages.audit.table.entity') }}
              </th>
              <th class="py-2">
                {{ $t('pages.audit.table.details') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.id"
              class="border-b border-[color:var(--surface-2)]"
            >
              <td class="py-2">
                {{ formatDate(row.createdAt) }}
              </td>
              <td class="py-2">
                {{ row.user?.email || '—' }}
              </td>
              <td class="py-2">
                <UBadge
                  color="neutral"
                  variant="soft"
                >
                  {{ row.action }}
                </UBadge>
              </td>
              <td class="py-2">
                {{ row.entityType }}: {{ row.entityId || '—' }}
              </td>
              <td class="py-2">
                <UButton
                  size="xs"
                  variant="ghost"
                  icon="i-lucide-eye"
                  @click="selected = row"
                >
                  {{ $t('pages.audit.table.view') }}
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <SharedPagination
        v-if="meta.totalPages > 1"
        :page="meta.page"
        :limit="meta.limit"
        :total="meta.total"
        :total-pages="meta.totalPages"
        @update:page="handlePageChange"
      />
    </UCard>

    <UModal
      :open="!!selected"
      :title="$t('pages.audit.detailsTitle')"
      @update:open="selected = null"
    >
      <template #body>
        <pre class="max-h-[60vh] overflow-auto rounded bg-[color:var(--surface-2)] p-3 text-xs">{{ selected ? JSON.stringify(selected, null, 2) : '' }}</pre>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { AuditAction, AuditLogItem } from '~/composables/useAuditLog'

definePageMeta({
  middleware: ['admin-only'],
})

const { t, locale } = useI18n()
const { loading, items, meta, fetchAuditLogs } = useAuditLog()
const selected = ref<AuditLogItem | null>(null)
const page = ref(1)
const limit = ref(20)
const filters = reactive<{ userId: string, action?: AuditAction, entityType: string, dateFrom: string, dateTo: string }>({
  userId: '',
  action: undefined,
  entityType: '',
  dateFrom: '',
  dateTo: '',
})

const rows = computed(() => items.value)

const actionOptions = computed(() => [
  { label: t('pages.audit.filters.anyAction'), value: undefined },
  ...[
    'auth.verify',
    'auth.logout',
    'qr.create',
    'qr.update',
    'qr.update_visibility',
    'qr.delete',
    'team.invite',
    'team.update_role',
    'team.delete_user',
    'folder.create',
    'folder.update',
    'folder.delete',
    'api_key.create',
    'api_key.delete',
  ].map(value => ({ label: value, value })),
])

async function load() {
  await fetchAuditLogs(page.value, limit.value, {
    userId: filters.userId || undefined,
    action: filters.action,
    entityType: filters.entityType || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  })
}

async function applyFilters() {
  page.value = 1
  await load()
}

async function handlePageChange(nextPage: number) {
  page.value = nextPage
  await load()
}

async function resetFilters() {
  filters.userId = ''
  filters.action = undefined
  filters.entityType = ''
  filters.dateFrom = ''
  filters.dateTo = ''
  page.value = 1
  await load()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(locale.value === 'ru' ? 'ru-RU' : 'en-US')
}

await load()
</script>
