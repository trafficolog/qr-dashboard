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

    <section class="mb-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
      <div class="grid grid-cols-1 md:grid-cols-6 gap-3">
        <InputText
          v-model="filters.userId"
          :placeholder="$t('pages.audit.filters.userId')"
        />
        <Select
          v-model="filters.action"
          :options="actionOptions"
          option-label="label"
          option-value="value"
          :placeholder="$t('pages.audit.filters.action')"
        />
        <InputText
          v-model="filters.entityType"
          :placeholder="$t('pages.audit.filters.entityType')"
        />
        <InputText
          v-model="filters.dateFrom"
          type="date"
          :placeholder="$t('pages.audit.filters.dateFrom')"
        />
        <InputText
          v-model="filters.dateTo"
          type="date"
          :placeholder="$t('pages.audit.filters.dateTo')"
        />
        <div class="flex gap-2">
          <Button
            class="flex-1"
            @click="applyFilters"
          >
            <template #icon>
              <Icon name="i-lucide-search" />
            </template>
            {{ $t('forms.actions.apply') }}
          </Button>
          <Button
            outlined
            severity="secondary"
            @click="resetFilters"
          >
            <template #icon>
              <Icon name="i-lucide-x" />
            </template>
            {{ $t('forms.actions.reset') }}
          </Button>
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5">
      <div
        v-if="loading"
        class="space-y-2"
      >
        <Skeleton
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
                <Tag severity="secondary">
                  {{ row.action }}
                </Tag>
              </td>
              <td class="py-2">
                {{ row.entityType }}: {{ row.entityId || '—' }}
              </td>
              <td class="py-2">
                <Button
                  size="small"
                  text
                  @click="selected = row"
                >
                  <template #icon>
                    <Icon name="i-lucide-eye" />
                  </template>
                  {{ $t('pages.audit.table.view') }}
                </Button>
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
    </section>

    <Dialog
      :visible="!!selected"
      modal
      :header="$t('pages.audit.detailsTitle')"
      @update:visible="selected = null"
    >
      <template #default>
        <pre class="max-h-[60vh] overflow-auto rounded bg-[color:var(--surface-2)] p-3 text-xs">{{ selected ? JSON.stringify(selected, null, 2) : '' }}</pre>
      </template>
    </Dialog>
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
