<template>
  <div class="max-w-4xl space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-[color:var(--text-primary)]">
        API Documentation
      </h1>
      <p class="mt-1 text-[color:var(--text-secondary)]">
        SPLAT QR Service REST API v1 — базовый URL:
        <code class="ml-1 rounded bg-[color:var(--surface-2)] px-2 py-0.5 text-sm font-mono">{{ baseUrl }}/api/v1</code>
      </p>
    </div>

    <!-- Auth section -->
    <section>
      <h2 class="text-lg font-semibold text-[color:var(--text-primary)] mb-3">
        Аутентификация
      </h2>
      <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
        <p class="text-sm text-[color:var(--text-secondary)] mb-3">
          Передавайте API-ключ в заголовке <code class="font-mono">Authorization</code> каждого запроса:
        </p>
        <SharedCodeBlock
          language="bash"
          :code="`Authorization: Bearer sqr_live_<your_key>`"
        />
        <p class="mt-3 text-sm text-[color:var(--text-secondary)]">
          Ключи создаются на странице
          <NuxtLink
            to="/integrations"
            class="text-[color:var(--accent)] underline"
          >
            Интеграции
          </NuxtLink>.
          Rate limit: <strong>100 запросов / минуту</strong> на ключ.
        </p>
      </UCard>
    </section>

    <!-- Endpoints -->
    <section
      v-for="group in endpointGroups"
      :key="group.title"
    >
      <h2 class="text-lg font-semibold text-[color:var(--text-primary)] mb-3">
        {{ group.title }}
      </h2>
      <div class="space-y-3">
        <UCard
          v-for="ep in group.endpoints"
          :key="ep.method + ep.path"
          class="border border-[color:var(--border)] bg-[color:var(--surface-0)]"
        >
          <!-- Endpoint title -->
          <div class="flex items-center gap-3 mb-3">
            <UBadge
              :color="methodColor(ep.method)"
              variant="solid"
              class="font-mono text-xs min-w-[52px] justify-center"
            >
              {{ ep.method }}
            </UBadge>
            <code class="text-sm font-mono text-[color:var(--text-primary)]">{{ ep.path }}</code>
            <span class="text-sm text-[color:var(--text-secondary)]">— {{ ep.description }}</span>
          </div>

          <!-- Parameters -->
          <div
            v-if="ep.params?.length"
            class="mb-3"
          >
            <p class="text-xs font-medium text-[color:var(--text-muted)] uppercase tracking-wide mb-2">
              Параметры
            </p>
            <div class="rounded-lg border border-[color:var(--border)] overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-[color:var(--surface-2)]">
                  <tr>
                    <th class="py-1.5 px-3 text-left text-xs font-medium text-[color:var(--text-muted)]">
                      Поле
                    </th>
                    <th class="py-1.5 px-3 text-left text-xs font-medium text-[color:var(--text-muted)]">
                      Тип
                    </th>
                    <th class="py-1.5 px-3 text-left text-xs font-medium text-[color:var(--text-muted)]">
                      Описание
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="p in ep.params"
                    :key="p.name"
                    class="border-t border-[color:var(--border)]"
                  >
                    <td class="py-1.5 px-3 font-mono text-xs text-[color:var(--accent)]">
                      {{ p.name }}
                      <span
                        v-if="p.required"
                        class="text-[color:var(--color-error)]"
                      >*</span>
                    </td>
                    <td class="py-1.5 px-3 font-mono text-xs text-[color:var(--text-muted)]">
                      {{ p.type }}
                    </td>
                    <td class="py-1.5 px-3 text-xs text-[color:var(--text-secondary)]">
                      {{ p.desc }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Example -->
          <div>
            <p class="text-xs font-medium text-[color:var(--text-muted)] uppercase tracking-wide mb-2">
              Пример
            </p>
            <SharedCodeBlock
              language="bash"
              :code="ep.example"
            />
          </div>
        </UCard>
      </div>
    </section>

    <!-- Error codes -->
    <section>
      <h2 class="text-lg font-semibold text-[color:var(--text-primary)] mb-3">
        Коды ошибок
      </h2>
      <UCard class="border border-[color:var(--border)] bg-[color:var(--surface-0)]">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-[color:var(--border)]">
              <th class="py-2 pr-4 text-left text-xs font-medium text-[color:var(--text-muted)]">
                Код
              </th>
              <th class="py-2 text-left text-xs font-medium text-[color:var(--text-muted)]">
                Описание
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="e in errorCodes"
              :key="e.code"
              class="border-b border-[color:var(--surface-2)] last:border-0"
            >
              <td class="py-2 pr-4 font-mono font-semibold text-[color:var(--text-primary)]">
                {{ e.code }}
              </td>
              <td class="py-2 text-[color:var(--text-secondary)]">
                {{ e.desc }}
              </td>
            </tr>
          </tbody>
        </table>
      </UCard>
    </section>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const baseUrl = computed(() => config.public.appUrl || 'http://localhost:3000')

function methodColor(method: string): 'success' | 'info' | 'warning' | 'error' | 'neutral' {
  const map: Record<string, 'success' | 'info' | 'warning' | 'error' | 'neutral'> = {
    GET: 'info',
    POST: 'success',
    PUT: 'warning',
    DELETE: 'error',
  }
  return map[method] ?? 'neutral'
}

const endpointGroups = [
  {
    title: 'QR-коды',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/qr',
        description: 'Список QR-кодов с пагинацией',
        params: [
          { name: 'page', type: 'number', required: false, desc: 'Страница (default: 1)' },
          { name: 'limit', type: 'number', required: false, desc: 'Записей на странице, 1–100 (default: 20)' },
          { name: 'search', type: 'string', required: false, desc: 'Поиск по названию' },
          { name: 'status', type: 'string', required: false, desc: 'active | paused | expired | archived' },
          { name: 'visibility', type: 'string', required: false, desc: 'private | department | public' },
          { name: 'scope', type: 'string', required: false, desc: 'mine | department | public | all' },
          { name: 'department_id', type: 'uuid', required: false, desc: 'ID отдела (для scope=department)' },
          { name: 'sortBy', type: 'string', required: false, desc: 'createdAt | title | totalScans' },
          { name: 'sortOrder', type: 'string', required: false, desc: 'asc | desc' },
        ],
        example: `curl -H "Authorization: Bearer sqr_live_<key>" \\
    "${baseUrl.value}/api/v1/qr?page=1&limit=20"`,
      },
      {
        method: 'POST',
        path: '/api/v1/qr',
        description: 'Создать QR-код',
        params: [
          { name: 'title', type: 'string', required: true, desc: 'Название QR-кода' },
          { name: 'destination_url', type: 'string', required: true, desc: 'URL назначения' },
          { name: 'description', type: 'string', required: false, desc: 'Описание' },
          { name: 'type', type: 'string', required: false, desc: 'dynamic | static (default: dynamic)' },
          { name: 'utm_source', type: 'string', required: false, desc: 'UTM Source' },
          { name: 'utm_medium', type: 'string', required: false, desc: 'UTM Medium' },
          { name: 'utm_campaign', type: 'string', required: false, desc: 'UTM Campaign' },
          { name: 'folder_id', type: 'uuid', required: false, desc: 'ID папки' },
          { name: 'tag_ids', type: 'uuid[]', required: false, desc: 'Массив ID тегов' },
          { name: 'expires_at', type: 'ISO 8601', required: false, desc: 'Дата истечения' },
        ],
        example: `curl -X POST \\
    -H "Authorization: Bearer sqr_live_<key>" \\
    -H "Content-Type: application/json" \\
    -d '{"title":"Промо","destination_url":"https://example.com"}' \\
    "${baseUrl.value}/api/v1/qr"`,
      },
      {
        method: 'GET',
        path: '/api/v1/qr/:id',
        description: 'Получить QR-код по ID',
        params: [],
        example: `curl -H "Authorization: Bearer sqr_live_<key>" \\
    "${baseUrl.value}/api/v1/qr/<id>"`,
      },
      {
        method: 'PUT',
        path: '/api/v1/qr/:id',
        description: 'Обновить QR-код',
        params: [
          { name: 'title', type: 'string', required: false, desc: 'Новое название' },
          { name: 'destination_url', type: 'string', required: false, desc: 'Новый URL (только dynamic)' },
          { name: 'status', type: 'string', required: false, desc: 'active | paused | archived' },
          { name: 'folder_id', type: 'uuid|null', required: false, desc: 'Папка (null = корень)' },
          { name: 'tag_ids', type: 'uuid[]', required: false, desc: 'Перезаписывает теги' },
          { name: 'expires_at', type: 'ISO 8601|null', required: false, desc: 'Дата истечения' },
        ],
        example: `curl -X PUT \\
    -H "Authorization: Bearer sqr_live_<key>" \\
    -H "Content-Type: application/json" \\
    -d '{"status":"paused"}' \\
    "${baseUrl.value}/api/v1/qr/<id>"`,
      },
      {
        method: 'DELETE',
        path: '/api/v1/qr/:id',
        description: 'Удалить QR-код (204 No Content)',
        params: [],
        example: `curl -X DELETE \\
    -H "Authorization: Bearer sqr_live_<key>" \\
    "${baseUrl.value}/api/v1/qr/<id>"`,
      },
      {
        method: 'GET',
        path: '/api/v1/qr/:id/stats',
        description: 'Статистика QR-кода за последние 30 дней',
        params: [],
        example: `curl -H "Authorization: Bearer sqr_live_<key>" \\
    "${baseUrl.value}/api/v1/qr/<id>/stats"`,
      },
    ],
  },
]

const errorCodes = [
  { code: '400', desc: 'Некорректный запрос — проверьте тело или параметры' },
  { code: '401', desc: 'Не авторизован — отсутствует или недействителен API-ключ' },
  { code: '403', desc: 'Нет доступа — ресурс принадлежит другому пользователю' },
  { code: '404', desc: 'Ресурс не найден' },
  { code: '422', desc: 'Ошибка валидации — проверьте поля запроса' },
  { code: '429', desc: 'Превышен лимит — 100 запросов/мин на ключ, повторите через 60с' },
  { code: '500', desc: 'Внутренняя ошибка сервера' },
]
</script>
