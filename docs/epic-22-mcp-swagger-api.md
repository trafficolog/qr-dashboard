# EPIC 22 — OpenAPI/Swagger + MCP Server

**Статус:** 📋 Planned
**Целевая версия:** v0.15.0
**Оценка:** 9–13 дней
**Зависимости:** Эпик 12 (API v1 + ключи), Эпик 21 (Security — для API key scoping)

---

## 1. Цель

Превратить существующий REST API v1 в first-class developer experience и открыть новый канал интеграции через MCP:

1. **OpenAPI 3.1 Specification** — машиночитаемая спецификация API, авто-генерируемая из Zod-схем. Замена текущей рукописной страницы `/api-docs` на интерактивный Swagger UI (Scalar), с возможностью выполнять запросы прямо из браузера.
2. **MCP Server** — Model Context Protocol сервер, позволяющий корпоративным AI-ассистентам (Claude Desktop, внутренние GPT-инструменты, Claude API с MCP) работать с QR-кодами через natural language: создавать, запрашивать аналитику, искать QR, управлять папками.

Для крупной FMCG-компании MCP — это **ключевой интеграционный слой для AI-ассистентов сотрудников**: вместо обучения каждого сотрудника интерфейсу, они просто говорят «Создай QR для летней акции с UTM source=instagram» корпоративному ассистенту — и он это делает через MCP.

---

## 2. Контекст

### 2.1 Что есть сейчас (v0.12.0)

**API v1 (из Эпика 12):**
- 6 эндпоинтов: `GET/POST /api/v1/qr`, `GET/PUT/DELETE /api/v1/qr/:id`, `GET /api/v1/qr/:id/stats`
- Аутентификация через `Authorization: Bearer sqr_live_<key>`
- Rate limit: 100 req/min per key
- Документация: `app/pages/api-docs/index.vue` — рукописная страница с текстовым описанием и cURL-примерами

**Внутренние API (не v1):**
- 30+ эндпоинтов: `/api/qr/*`, `/api/folders/*`, `/api/tags/*`, `/api/analytics/*`, `/api/team/*`, `/api/departments/*` (EPIC 19), `/api/admin/audit` (EPIC 21)
- Аутентификация через cookie session

### 2.2 Проблемы текущего подхода

**OpenAPI gap:**
- Рукописная документация быстро отстаёт от кода
- Нет возможности тестировать запросы из UI
- Невозможно сгенерировать SDK для клиентов (1С, BI, мобильные)
- Нет типизированных клиентов из коробки

**AI-ассистент gap:**
- Сотрудники, использующие Claude Desktop или внутренний корпоративный GPT, не могут работать с QR-сервисом напрямую
- Каждая интеграция с AI требует ручной обёртки через API
- Нет стандартизированного способа экспонировать QR-функциональность LLM-ам

### 2.3 Почему MCP, а не просто REST

REST API уже есть, но:
- LLM не «знает» про него — нужен тонкий слой описания tools и resources
- MCP стандартизирует discovery: клиент сам читает список доступных инструментов
- MCP-совместимые клиенты (Claude Desktop, Cursor, VS Code Continue, внутренние агенты) работают из коробки
- Это будущее интеграций с AI-ассистентами

---

## 3. Фаза 1: OpenAPI/Swagger

---

### Задача 22.1 — Zod-to-OpenAPI инфраструктура

**Приоритет:** 🔴 Critical
**Зависимости:** нет
**Оценка:** 1 день

**Новые файлы:**

```
server/openapi/registry.ts
server/openapi/schemas/index.ts
server/openapi/schemas/qr.ts
server/openapi/schemas/analytics.ts
server/openapi/schemas/common.ts
server/openapi/generate.ts
```

**Подход:** Использовать `@asteasolutions/zod-to-openapi` — наиболее зрелая библиотека для генерации OpenAPI 3.1 спецификации из Zod-схем. Существующие Zod-схемы валидации переиспользуются, добавляется только `.openapi()` вызов с метаданными.

**Установка:**

```bash
pnpm add @asteasolutions/zod-to-openapi
```

**registry.ts — центральный реестр схем и эндпоинтов:**

```typescript
// server/openapi/registry.ts
import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export const registry = new OpenAPIRegistry()

// Регистрация security scheme
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'sqr_live_*',
  description: 'API-ключ в формате sqr_live_<64hex>. Создать ключ: /integrations',
})

export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions)
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'SPLAT QR Service API',
      version: '1.0.0',
      description: 'Корпоративный API для управления QR-кодами',
      contact: { name: 'SPLAT QR Team', email: 'qr-support@splatglobal.com' },
    },
    servers: [
      { url: 'https://qr.splatglobal.com', description: 'Production' },
      { url: 'http://localhost:3000', description: 'Development' },
    ],
    security: [{ bearerAuth: [] }],
  })
}
```

**Пример обогащения Zod-схемы:**

```typescript
// server/openapi/schemas/qr.ts
import { z } from 'zod'
import { registry } from '../registry'

export const QrCodeSchema = z.object({
  id: z.string().uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
  shortCode: z.string().openapi({ example: 'ABc123X' }),
  title: z.string().openapi({ example: 'Summer 2026 Promo' }),
  destinationUrl: z.string().url().openapi({ example: 'https://splatglobal.com/promo' }),
  status: z.enum(['active', 'paused', 'archived', 'expired']),
  totalScans: z.number().int().min(0),
  uniqueScans: z.number().int().min(0),
  createdAt: z.string().datetime(),
}).openapi('QrCode')

registry.register('QrCode', QrCodeSchema)

// Регистрация эндпоинта:
registry.registerPath({
  method: 'get',
  path: '/api/v1/qr',
  summary: 'Список QR-кодов',
  description: 'Возвращает пагинированный список QR-кодов с фильтрами',
  tags: ['QR Codes'],
  request: {
    query: z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
      search: z.string().optional(),
      status: z.enum(['active', 'paused', 'archived', 'expired']).optional(),
    }),
  },
  responses: {
    200: {
      description: 'Пагинированный список QR',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(QrCodeSchema),
            meta: z.object({
              total: z.number(),
              page: z.number(),
              limit: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
    401: { description: 'Unauthorized (неверный или отсутствующий API-ключ)' },
    429: { description: 'Rate limit exceeded (100 req/min)' },
  },
})
```

**generate.ts — утилита для build-time генерации:**

```typescript
// server/openapi/generate.ts
// Запускается через npm script или при build
import { writeFileSync } from 'fs'
import { buildOpenApiDocument } from './registry'
import './schemas' // триггер регистрации всех схем

const doc = buildOpenApiDocument()
writeFileSync('./public/openapi.json', JSON.stringify(doc, null, 2))
console.log('✅ OpenAPI spec generated: public/openapi.json')
```

**Критерии приёмки:**
- [ ] `pnpm openapi:generate` создаёт валидный OpenAPI 3.1 JSON
- [ ] Спецификация проходит валидацию через `swagger-cli validate openapi.json`
- [ ] Все Zod-схемы для API v1 зарегистрированы в registry

---

### Задача 22.2 — Покрытие всех API v1 эндпоинтов

**Приоритет:** 🔴 Critical
**Зависимости:** 22.1
**Оценка:** 1.5 дня

**Новые файлы:**

```
server/openapi/schemas/folders.ts
server/openapi/schemas/tags.ts
server/openapi/schemas/destinations.ts
server/openapi/schemas/stats.ts
server/openapi/paths/qr.ts
server/openapi/paths/analytics.ts
server/openapi/paths/folders.ts
server/openapi/paths/tags.ts
```

**Покрытие эндпоинтов v1:**

| Группа | Эндпоинты | Приоритет |
|---|---|---|
| QR Codes | GET/POST `/api/v1/qr`, GET/PUT/DELETE `/api/v1/qr/:id`, GET `/api/v1/qr/:id/stats` | 🔴 |
| Analytics v1 | GET `/api/v1/analytics/overview`, `/api/v1/analytics/scans` | 🟡 (новые в этом эпике) |
| Folders v1 | GET/POST `/api/v1/folders`, PUT/DELETE `/api/v1/folders/:id` | 🟡 (новые) |
| Tags v1 | GET/POST `/api/v1/tags` | 🟡 (новые) |
| Destinations v1 | CRUD `/api/v1/qr/:id/destinations` | 🟢 (A/B testing) |

**Расширение API v1** — текущий v1 не полон, нужно добавить эндпоинты для folders/tags/analytics для полноценной работы через MCP. Это расширяет Эпик 12.

**Новые файлы эндпоинтов:**

```
server/api/v1/folders/index.get.ts
server/api/v1/folders/index.post.ts
server/api/v1/folders/[id].put.ts
server/api/v1/folders/[id].delete.ts
server/api/v1/tags/index.get.ts
server/api/v1/tags/index.post.ts
server/api/v1/analytics/overview.get.ts
server/api/v1/analytics/scans.get.ts
server/api/v1/qr/[id]/destinations/index.get.ts
server/api/v1/qr/[id]/destinations/index.post.ts
server/api/v1/qr/[id]/destinations/[destId].put.ts
server/api/v1/qr/[id]/destinations/[destId].delete.ts
```

Эти эндпоинты переиспользуют существующие сервисы (`folder.service.ts`, `tag.service.ts`, `analytics.service.ts`, `destination.service.ts`), просто добавляют v1-обёртку с Bearer auth и snake_case-конверсией.

**Критерии приёмки:**
- [ ] OpenAPI spec покрывает 100% v1 эндпоинтов
- [ ] Каждый эндпоинт имеет summary, description, tags, request/response schemas, examples
- [ ] Ошибки (400, 401, 403, 404, 422, 429) документированы для каждого эндпоинта
- [ ] Схемы ссылаются через `$ref` (не дублируются inline)

---

### Задача 22.3 — Swagger UI через Scalar

**Приоритет:** 🔴 Critical
**Зависимости:** 22.1, 22.2
**Оценка:** 0.5 дня

**Почему Scalar, а не Swagger UI:** Scalar (`@scalar/api-reference`) — современная альтернатива Swagger UI с лучшим UX, нативной поддержкой OpenAPI 3.1, тёмной темой, и возможностью тестировать запросы прямо из интерфейса. Это то, что используют Supabase, Railway, и многие другие современные платформы.

**Новые файлы:**

```
server/api/openapi.json.get.ts
app/pages/api-docs/index.vue       — ЗАМЕНА старой версии
```

**Установка:**

```bash
pnpm add @scalar/api-reference
```

**Серверный эндпоинт (возвращает OpenAPI JSON):**

```typescript
// server/api/openapi.json.get.ts
import { buildOpenApiDocument } from '../openapi/registry'
import '../openapi/schemas'

export default defineEventHandler(async (event) => {
  // Кешируем — спецификация генерируется один раз при старте
  setHeader(event, 'Content-Type', 'application/json')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return buildOpenApiDocument()
})
```

**Страница документации:**

```vue
<!-- app/pages/api-docs/index.vue -->
<template>
  <div class="api-docs-wrapper">
    <ScalarApiReference :configuration="scalarConfig" />
  </div>
</template>

<script setup lang="ts">
import { ScalarApiReference } from '@scalar/api-reference/vue'
import '@scalar/api-reference/style.css'

const scalarConfig = {
  spec: {
    url: '/api/openapi.json',
  },
  theme: 'purple', // или кастомный SPLAT theme
  hideDownloadButton: false,
  authentication: {
    preferredSecurityScheme: 'bearerAuth',
    http: {
      bearer: { token: '' },
    },
  },
  customCss: `
    :root {
      --scalar-color-accent: var(--color-primary-600);
      --scalar-background-1: var(--surface-0);
      --scalar-color-1: var(--text-primary);
    }
  `,
}
</script>
```

**Критерии приёмки:**
- [ ] `/api-docs` показывает интерактивный Scalar UI
- [ ] Можно ввести API-ключ через кнопку «Authorize» и выполнить запросы
- [ ] Все эндпоинты отображаются с группировкой по tags
- [ ] Тема соответствует SPLAT palette (light/dark)
- [ ] `GET /api/openapi.json` возвращает валидную спецификацию
- [ ] Старая версия страницы архивирована (не удалена сразу)

---

### Задача 22.4 — SDK генерация и примеры

**Приоритет:** 🟡 Medium
**Зависимости:** 22.1, 22.2
**Оценка:** 0.5 дня

**Новые файлы:**

```
scripts/generate-sdks.sh
examples/typescript-sdk/
examples/python-client/
examples/curl-recipes.md
```

**Подход:** Поставлять клиентские SDK как side artifact для разработчиков интеграций (1С, BI, мобильные).

**TypeScript SDK:**

```bash
# scripts/generate-sdks.sh
npx openapi-typescript-codegen --input public/openapi.json --output ./generated-sdks/typescript --client fetch --name SplatQrClient
```

**Python client:**

```bash
openapi-python-client generate --path public/openapi.json --meta none
```

**Примеры использования** в `examples/`:

```typescript
// examples/typescript-sdk/README.md
import { SplatQrClient } from '@splatglobal/qr-sdk'

const client = new SplatQrClient({
  BASE: 'https://qr.splatglobal.com',
  TOKEN: process.env.SPLAT_QR_API_KEY,
})

const qrs = await client.qrCodes.listQrs({ status: 'active', limit: 50 })
console.log(`Found ${qrs.meta.total} active QR codes`)
```

**Критерии приёмки:**
- [ ] `pnpm sdks:generate` создаёт TypeScript SDK в `generated-sdks/typescript`
- [ ] README с примерами для TS, Python, cURL
- [ ] SDK публикуется в internal npm registry (или как tarball)

---

## 4. Фаза 2: MCP Server

---

### Задача 22.5 — MCP Infrastructure

**Приоритет:** 🔴 Critical
**Зависимости:** 22.2 (расширенный API v1)
**Оценка:** 1.5 дня

**Выбор подхода:** MCP-сервер встроен в Nitro (Nuxt server), а не отдельный микросервис. Это упрощает deployment, переиспользует auth и сервисы, и снижает оверхед.

**Транспорт:** HTTP Streamable (новый стандарт MCP, пришёл на смену SSE в 2025). Сервер доступен по `https://qr.splatglobal.com/mcp`.

**Новые файлы:**

```
server/mcp/server.ts                  — MCP Server instance
server/mcp/transport.ts                — HTTP Streamable transport adapter
server/mcp/auth.ts                     — API key verification
server/routes/mcp.post.ts              — MCP endpoint
server/routes/mcp.get.ts               — SSE-совместимый endpoint (legacy support)
```

**Установка:**

```bash
pnpm add @modelcontextprotocol/sdk
```

**server/mcp/server.ts:**

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { qrTools, registerQrToolHandlers } from './tools/qr'
import { analyticsTools, registerAnalyticsToolHandlers } from './tools/analytics'
import { folderTools, registerFolderToolHandlers } from './tools/folders'
import { qrResources, registerQrResourceHandlers } from './resources/qr'

export function createMcpServer(context: { user: User, apiKey: ApiKey }) {
  const server = new Server(
    {
      name: 'splat-qr',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: { subscribe: false, listChanged: false },
        logging: {},
      },
    }
  )

  // Регистрация tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [...qrTools, ...analyticsTools, ...folderTools],
  }))

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params
    // Диспетчеризация по имени tool
    return dispatchToolCall(name, args, context)
  })

  // Регистрация resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [...qrResources],
  }))

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    return dispatchResourceRead(request.params.uri, context)
  })

  return server
}
```

**server/routes/mcp.post.ts:**

```typescript
import { createMcpServer } from '../mcp/server'
import { authenticateMcpRequest } from '../mcp/auth'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

export default defineEventHandler(async (event) => {
  // Аутентификация через API key
  const context = await authenticateMcpRequest(event)
  if (!context) {
    throw createError({ statusCode: 401, message: 'Invalid API key' })
  }

  // Проверка permissions для MCP
  if (!context.apiKey.permissions.includes('mcp:access')) {
    throw createError({ statusCode: 403, message: 'API key lacks mcp:access permission' })
  }

  // Создание MCP server и transport
  const server = createMcpServer(context)
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    // Обработка потоковых ответов через H3 response
  })

  await server.connect(transport)
  // Проксирование тела запроса в MCP и возврат ответа
  return transport.handleRequest(event.node.req, event.node.res)
})
```

**Критерии приёмки:**
- [ ] `POST /mcp` принимает JSON-RPC 2.0 запросы
- [ ] `initialize` метод возвращает server capabilities
- [ ] `tools/list` возвращает доступные инструменты
- [ ] Запрос без валидного API-ключа → 401
- [ ] API-ключ без `mcp:access` permission → 403
- [ ] Rate limit 100 req/min per API key (переиспользует существующий)

---

### Задача 22.6 — MCP Tools: QR Management

**Приоритет:** 🔴 Critical
**Зависимости:** 22.5
**Оценка:** 2 дня

**Новые файлы:**

```
server/mcp/tools/qr.ts
server/mcp/tools/folders.ts
server/mcp/tools/tags.ts
server/mcp/dispatcher.ts
```

**Список MCP tools для QR:**

| Tool | Описание | Underlying API |
|---|---|---|
| `list_qr_codes` | Поиск и фильтрация QR-кодов | `GET /api/v1/qr` |
| `get_qr_code` | Получить детали QR по ID или shortCode | `GET /api/v1/qr/:id` |
| `create_qr_code` | Создать новый QR-код | `POST /api/v1/qr` |
| `update_qr_code` | Обновить существующий QR | `PUT /api/v1/qr/:id` |
| `archive_qr_code` | Архивировать QR (вместо hard delete) | `PUT /api/v1/qr/:id` (status=archived) |
| `duplicate_qr_code` | Дублировать QR с новым shortCode | `POST /api/v1/qr/:id/duplicate` |
| `list_folders` | Список папок с количеством QR | `GET /api/v1/folders` |
| `create_folder` | Создать папку | `POST /api/v1/folders` |
| `move_qr_to_folder` | Переместить QR в папку | `PUT /api/v1/qr/:id` (folderId) |
| `list_tags` | Список всех тегов | `GET /api/v1/tags` |

**Пример определения tool:**

```typescript
// server/mcp/tools/qr.ts
import { z } from 'zod'
import type { Tool } from '@modelcontextprotocol/sdk/types.js'

const ListQrCodesInputSchema = z.object({
  search: z.string().optional().describe('Поиск по title или URL'),
  status: z.enum(['active', 'paused', 'archived']).optional(),
  folder_name: z.string().optional().describe('Фильтр по имени папки (не ID)'),
  limit: z.number().int().min(1).max(100).default(20),
})

export const qrTools: Tool[] = [
  {
    name: 'list_qr_codes',
    description: 'Найти QR-коды по различным критериям. Используйте для поиска конкретных QR или получения списка активных.',
    inputSchema: zodToJsonSchema(ListQrCodesInputSchema),
  },
  {
    name: 'create_qr_code',
    description: 'Создать новый QR-код. ВАЖНО: всегда подтверждайте у пользователя URL и title перед созданием.',
    inputSchema: zodToJsonSchema(z.object({
      title: z.string().min(1).max(200).describe('Название QR для внутреннего использования'),
      destination_url: z.string().url().describe('URL, куда ведёт QR-код'),
      folder_name: z.string().optional().describe('Имя папки для группировки'),
      tags: z.array(z.string()).optional().describe('Массив тегов'),
      utm_source: z.string().optional(),
      utm_medium: z.string().optional(),
      utm_campaign: z.string().optional(),
    })),
  },
  // ... остальные 8 tools
]

export async function handleListQrCodes(args: unknown, ctx: McpContext) {
  const parsed = ListQrCodesInputSchema.parse(args)
  const result = await qrService.getQrList(
    { ...parsed, folderId: await resolveFolderByName(parsed.folder_name) },
    { page: 1, limit: parsed.limit },
    ctx.user,
  )
  return {
    content: [{
      type: 'text',
      text: formatQrListForLLM(result.data),
    }],
  }
}

function formatQrListForLLM(qrs: QrCode[]): string {
  // Форматирование результата в читаемом для LLM виде (не JSON dump)
  if (qrs.length === 0) return 'Не найдено ни одного QR-кода по заданным критериям.'
  return qrs.map((q, i) => (
    `${i + 1}. "${q.title}" (ID: ${q.id}, код: ${q.shortCode})\n` +
    `   URL: ${q.destinationUrl}\n` +
    `   Сканирований: ${q.totalScans} (${q.uniqueScans} уникальных)\n` +
    `   Статус: ${q.status}, создан ${formatDate(q.createdAt)}`
  )).join('\n\n')
}
```

**Важный паттерн:** **форматирование для LLM**, а не dump JSON. LLM лучше работает с natural language описанием результатов, чем с сырыми данными.

**Критерии приёмки:**
- [ ] 10 tools для управления QR доступны через `tools/list`
- [ ] Каждый tool имеет детальное `description` с hints для LLM
- [ ] Результаты отформатированы для LLM (читаемый текст, не JSON dump)
- [ ] Mutating tools (create, update, delete) требуют явные параметры, а не «guess»
- [ ] Тестирование через Claude Desktop: tools вызываются корректно

---

### Задача 22.7 — MCP Tools: Analytics & Insights

**Приоритет:** 🔴 Critical
**Зависимости:** 22.5, Эпик 20 (расширенная аналитика)
**Оценка:** 1 день

**Новые файлы:**

```
server/mcp/tools/analytics.ts
```

**Список tools:**

| Tool | Описание | Underlying API |
|---|---|---|
| `get_analytics_overview` | Общие метрики за период | `GET /api/v1/analytics/overview` |
| `get_qr_scan_stats` | Статистика сканирований конкретного QR | `GET /api/v1/qr/:id/stats` |
| `get_top_qr_codes` | Топ QR по сканированиям за период | `GET /api/v1/analytics/top-qr` |
| `get_scans_by_geo` | Распределение сканирований по регионам | `GET /api/v1/analytics/geo` (EPIC 20) |
| `get_scans_by_device` | Breakdown по устройствам/ОС | `GET /api/v1/analytics/devices` (EPIC 20) |
| `get_scans_by_time` | Распределение по часам/дням | `GET /api/v1/analytics/time-distribution` (EPIC 20) |

**Пример tool с date range:**

```typescript
export const analyticsTools: Tool[] = [
  {
    name: 'get_top_qr_codes',
    description: 'Получить топ QR-кодов по количеству сканирований за период. Используйте для ответа на вопросы типа "какие QR были популярнее всего".',
    inputSchema: zodToJsonSchema(z.object({
      date_from: z.string().datetime().optional().describe('Начало периода (ISO 8601). По умолчанию — 30 дней назад.'),
      date_to: z.string().datetime().optional().describe('Конец периода. По умолчанию — сейчас.'),
      limit: z.number().int().min(1).max(20).default(10),
    })),
  },
]

// Форматирование для LLM:
function formatTopQrForLLM(items: TopQr[], period: string): string {
  if (items.length === 0) return `За период ${period} не было сканирований.`
  
  const lines = [`Топ QR-кодов за период ${period}:`]
  items.forEach((qr, i) => {
    lines.push(
      `${i + 1}. "${qr.title}" — ${qr.totalScans} сканирований (${qr.uniqueScans} уникальных)`
    )
  })
  return lines.join('\n')
}
```

**Критерии приёмки:**
- [ ] 6 аналитических tools доступны
- [ ] Результаты форматируются с контекстом периода («за последние 30 дней»)
- [ ] LLM может ответить на вопросы: «Какой QR был самым популярным в июле?», «Сколько раз сканировали QR X?», «Из каких регионов больше всего сканирований?»

---

### Задача 22.8 — MCP Resources

**Приоритет:** 🟡 Medium
**Зависимости:** 22.5
**Оценка:** 0.5 дня

**Новые файлы:**

```
server/mcp/resources/qr.ts
server/mcp/resources/analytics.ts
```

**Отличие Resources от Tools:**
- **Tools** — действия, которые LLM вызывает по запросу пользователя («создай QR»)
- **Resources** — контекст, который LLM может «прочитать» для понимания ситуации («покажи мне все активные QR для справки»)

**Список resources:**

| URI | Описание |
|---|---|
| `qr://codes/active` | Все активные QR текущего пользователя (до 100) |
| `qr://codes/recent` | 20 последних созданных QR |
| `qr://folders` | Список всех папок с количеством QR |
| `qr://tags` | Список всех тегов |
| `qr://analytics/summary/30d` | Сводка аналитики за последние 30 дней |

**Пример:**

```typescript
export const qrResources: Resource[] = [
  {
    uri: 'qr://codes/active',
    name: 'Активные QR-коды',
    description: 'Список всех QR-кодов в статусе active для текущего пользователя',
    mimeType: 'text/plain',
  },
]

export async function readQrResource(uri: string, ctx: McpContext) {
  if (uri === 'qr://codes/active') {
    const qrs = await qrService.getQrList(
      { status: 'active' },
      { page: 1, limit: 100 },
      ctx.user,
    )
    return {
      contents: [{
        uri,
        mimeType: 'text/plain',
        text: formatQrListForLLM(qrs.data),
      }],
    }
  }
  // ... другие URI
}
```

**Критерии приёмки:**
- [ ] 5 resources доступны через `resources/list`
- [ ] Чтение resource возвращает отформатированный текст
- [ ] Resources учитывают access control (editor видит только свои)

---

### Задача 22.9 — MCP Auth и Permissions

**Приоритет:** 🔴 Critical
**Зависимости:** 22.5, Эпик 21 (API key scoping)
**Оценка:** 0.5 дня

**Изменяемые файлы:**

```
server/db/schema/api-keys.ts          — добавить 'mcp:access' в permissions
server/services/api-key.service.ts    — поддержка нового scope
app/pages/integrations/index.vue      — UI для включения MCP scope
server/mcp/auth.ts                     — извлечение и проверка
```

**Добавление scope:**

```typescript
// Расширение списка permissions (из EPIC 21):
const API_PERMISSIONS = [
  'qr:read', 'qr:create', 'qr:update', 'qr:delete',
  'analytics:read',
  'mcp:access',     // NEW: разрешение на использование через MCP
]
```

**Логика MCP permissions:**

```typescript
// MCP-ключ может быть отдельным ключом (только 'mcp:access' + необходимые scopes)
// Или обычным ключом с дополнительным 'mcp:access'

// При вызове tool через MCP:
// - list_qr_codes требует 'qr:read'
// - create_qr_code требует 'qr:create'
// - etc.
//
// Если у ключа нет нужного permission → MCP tool возвращает ошибку
// с текстом для LLM: "У API-ключа недостаточно прав для этого действия"
```

**UI — `/integrations`:**

- Отдельная секция «MCP Integration» при создании ключа
- Checkbox «Enable for MCP» (добавляет `mcp:access`)
- Info-блок: «Используйте этот ключ для подключения Claude Desktop / Cursor / других MCP-клиентов»
- Ссылка на документацию подключения

**Критерии приёмки:**
- [ ] API-ключ без `mcp:access` → 403 при подключении к `/mcp`
- [ ] Ключ с `mcp:access` + `qr:read` → может вызвать `list_qr_codes`, но не `create_qr_code`
- [ ] UI чётко отличает «обычные» и «MCP» ключи
- [ ] Документация подключения на `/integrations/mcp-setup`

---

### Задача 22.10 — MCP Setup Guide и Testing

**Приоритет:** 🟡 Medium
**Зависимости:** 22.5–22.9
**Оценка:** 1 день

**Новые файлы:**

```
app/pages/integrations/mcp-setup.vue
examples/mcp/claude-desktop-config.json
examples/mcp/cursor-config.json
examples/mcp/test-mcp-connection.ts
```

**`/integrations/mcp-setup`:**

Пошаговое руководство подключения с вкладками по клиентам:

**Вкладка Claude Desktop:**

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "splat-qr": {
      "url": "https://qr.splatglobal.com/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer sqr_live_<YOUR_KEY>"
      }
    }
  }
}
```

**Вкладка Cursor:**

```json
// .cursor/mcp.json
{
  "mcpServers": {
    "splat-qr": {
      "url": "https://qr.splatglobal.com/mcp",
      "env": {
        "SPLAT_QR_API_KEY": "sqr_live_..."
      }
    }
  }
}
```

**Вкладка Custom Integration:**

Примеры кода на TypeScript и Python с использованием `@modelcontextprotocol/sdk` для корпоративных AI-ассистентов.

**test-mcp-connection.ts** — автоматический скрипт проверки:

```typescript
// examples/mcp/test-mcp-connection.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const transport = new StreamableHTTPClientTransport(
  new URL('https://qr.splatglobal.com/mcp'),
  {
    headers: { Authorization: `Bearer ${process.env.SPLAT_QR_API_KEY}` },
  },
)

const client = new Client({ name: 'test', version: '1.0' }, { capabilities: {} })
await client.connect(transport)

const tools = await client.listTools()
console.log('Available tools:', tools.tools.map(t => t.name))

const result = await client.callTool({
  name: 'list_qr_codes',
  arguments: { status: 'active', limit: 5 },
})
console.log('Active QR codes:', result.content)
```

**Примеры запросов пользователя в Claude Desktop:**

```
"Покажи мне активные QR-коды в папке 'Летняя акция'"
→ Claude вызывает list_qr_codes({ status: 'active', folder_name: 'Летняя акция' })

"Создай QR на https://splatglobal.com/promo-summer с названием 'Summer Promo 2026'"
→ Claude спрашивает: "Добавить UTM-метки или папку?"
→ Пользователь: "Папка 'Маркетинг 2026', UTM source=qr"
→ Claude вызывает create_qr_code({ ... })

"Сколько сканирований было у QR 'Summer Promo 2026' за прошлую неделю?"
→ Claude вызывает list_qr_codes → находит ID → вызывает get_qr_scan_stats

"Какие QR были самыми популярными в июле?"
→ Claude вызывает get_top_qr_codes({ date_from, date_to, limit: 10 })
```

**Критерии приёмки:**
- [ ] `/integrations/mcp-setup` показывает пошаговое руководство
- [ ] Конфигурация для Claude Desktop работает out-of-the-box
- [ ] Тестовый скрипт `test-mcp-connection.ts` подключается и вызывает tool
- [ ] Примеры запросов документированы с expected behavior

---

## 5. Порядок реализации

```
ФАЗА 1 — OpenAPI/Swagger (3.5 дня)
  22.1 Zod-to-OpenAPI infrastructure          — 1 день
  22.2 Покрытие всех API v1 эндпоинтов         — 1.5 дня (+ новые v1 для folders/tags/analytics)
  22.3 Swagger UI через Scalar                 — 0.5 дня
  22.4 SDK генерация и примеры                 — 0.5 дня

ФАЗА 2 — MCP Server (5.5 дней)
  22.5 MCP Infrastructure                      — 1.5 дня
  22.6 MCP Tools: QR Management                 — 2 дня
  22.7 MCP Tools: Analytics                     — 1 день
  22.8 MCP Resources                            — 0.5 дня
  22.9 MCP Auth и Permissions                   — 0.5 дня
  22.10 MCP Setup Guide и Testing               — 1 день

Суммарно: 9–13 дней (с тестированием)
```

---

## 6. Архитектурные решения

### 6.1 Почему OpenAPI из Zod, а не написанный вручную YAML

- **Единый источник истины:** Zod-схемы уже существуют для валидации API, добавление `.openapi()` не дублирует работу
- **Автообновление:** при изменении Zod-схемы OpenAPI обновляется автоматически
- **Type safety:** TypeScript-типы и OpenAPI-типы всегда синхронизированы

### 6.2 Почему Scalar, а не Swagger UI

- Нативная поддержка OpenAPI 3.1 (Swagger UI всё ещё заточен под 3.0)
- Современный UX с поддержкой dark mode
- Меньше bundle size (~50KB vs 500KB)
- Используется крупными платформами (Supabase, Vercel, Railway)

### 6.3 Почему MCP встроен в Nitro, а не отдельный сервис

- Переиспользует существующие сервисы (qr.service, analytics.service)
- Единый deployment (одна команда `docker compose up`)
- Использует ту же аутентификацию (API keys с permissions)
- Нет дополнительной сети между MCP и API

### 6.4 MCP Tool результаты — текст, а не JSON

LLM значительно лучше работает с natural language описанием результатов, чем с JSON. Пример:

**❌ Плохо:**
```json
[{"id":"abc","title":"Promo","totalScans":142}, ...]
```

**✅ Хорошо:**
```
Найдено 3 QR-кода:
1. "Summer Promo 2026" (код: ABc123X) — 142 сканирования (98 уникальных)
2. "Autumn Collection" (код: XYz789W) — 87 сканирований (54 уникальных)
3. "Black Friday" (код: Q1w2E3r) — 1,240 сканирований (890 уникальных)
```

LLM может проще рассуждать над форматированным выводом.

### 6.5 Разделение permissions: отдельный scope для MCP

Это создаёт защитный барьер: даже если обычный API-ключ скомпрометирован, MCP-интеграция недоступна без отдельного `mcp:access`. Это важно для корпоративной среды, где MCP используется AI-ассистентами и случайный leak ключа мог бы привести к автоматизированной атаке через LLM.

---

## 7. Новые зависимости

```
@asteasolutions/zod-to-openapi    ^7.x   — Zod → OpenAPI 3.1 генератор
@scalar/api-reference              ^1.x   — Интерактивный Swagger UI
@modelcontextprotocol/sdk          ^1.x   — MCP Server SDK
openapi-typescript-codegen         ^0.25  — Опционально, для генерации TS SDK
```

---

## 8. Новые API-эндпоинты

| Метод | URL | Auth | Назначение |
|---|---|---|---|
| GET | `/api/openapi.json` | Public | OpenAPI 3.1 спецификация |
| POST | `/mcp` | API Key | MCP JSON-RPC endpoint |
| GET | `/api/v1/folders` | API Key | Список папок |
| POST | `/api/v1/folders` | API Key | Создать папку |
| PUT | `/api/v1/folders/:id` | API Key | Обновить папку |
| DELETE | `/api/v1/folders/:id` | API Key | Удалить папку |
| GET | `/api/v1/tags` | API Key | Список тегов |
| POST | `/api/v1/tags` | API Key | Создать тег |
| GET | `/api/v1/analytics/overview` | API Key | Общие метрики |
| GET | `/api/v1/analytics/scans` | API Key | Временной ряд |
| GET | `/api/v1/analytics/top-qr` | API Key | Топ QR |
| GET/POST/PUT/DELETE | `/api/v1/qr/:id/destinations/*` | API Key | A/B destinations |

---

## 9. Изменённые/созданные файлы (сводка)

### Новые файлы (~30)

```
server/openapi/registry.ts
server/openapi/generate.ts
server/openapi/schemas/common.ts
server/openapi/schemas/qr.ts
server/openapi/schemas/folders.ts
server/openapi/schemas/tags.ts
server/openapi/schemas/analytics.ts
server/openapi/schemas/destinations.ts
server/openapi/paths/qr.ts
server/openapi/paths/folders.ts
server/openapi/paths/analytics.ts
server/openapi/paths/tags.ts
server/api/openapi.json.get.ts

server/api/v1/folders/index.get.ts
server/api/v1/folders/index.post.ts
server/api/v1/folders/[id].put.ts
server/api/v1/folders/[id].delete.ts
server/api/v1/tags/index.get.ts
server/api/v1/tags/index.post.ts
server/api/v1/analytics/overview.get.ts
server/api/v1/analytics/scans.get.ts
server/api/v1/analytics/top-qr.get.ts
server/api/v1/qr/[id]/destinations/*.ts  (4 файла)

server/mcp/server.ts
server/mcp/transport.ts
server/mcp/auth.ts
server/mcp/dispatcher.ts
server/mcp/tools/qr.ts
server/mcp/tools/analytics.ts
server/mcp/tools/folders.ts
server/mcp/tools/tags.ts
server/mcp/resources/qr.ts
server/mcp/resources/analytics.ts
server/routes/mcp.post.ts

app/pages/integrations/mcp-setup.vue

scripts/generate-sdks.sh
examples/typescript-sdk/README.md
examples/python-client/README.md
examples/mcp/claude-desktop-config.json
examples/mcp/cursor-config.json
examples/mcp/test-mcp-connection.ts
```

### Изменённые файлы (~8)

```
server/db/schema/api-keys.ts       — добавить 'mcp:access' в permissions
server/services/api-key.service.ts
app/pages/api-docs/index.vue       — замена на Scalar
app/pages/integrations/index.vue   — секция MCP Integration
app/components/app/Sidebar.vue     — убрать «API Docs» (теперь через /api-docs с Scalar)
nuxt.config.ts                     — включить генерацию OpenAPI при build
package.json                       — новые зависимости, npm scripts
locales/ru.json, locales/en.json   — строки для mcp-setup
```

---

## 10. Env-переменные

| Переменная | Обязательная | Default | Описание |
|---|---|---|---|
| `MCP_SERVER_ENABLED` | Нет | `true` | Вкл/выкл MCP endpoint |
| `MCP_SERVER_URL` | Нет | `${APP_URL}/mcp` | URL сервера для публикации в setup-guide |

---

## 11. Метрики успеха

- **OpenAPI:** 100% покрытие v1 эндпоинтов спецификацией
- **Swagger UI:** ≥ 95 Lighthouse score на `/api-docs`
- **MCP:**
  - 16 tools + 5 resources доступны через MCP
  - Подключение Claude Desktop занимает ≤ 5 минут по setup-guide
  - Успешное выполнение 10 типовых сценариев («найди», «создай», «покажи статистику»)
- **Производительность:** `GET /api/openapi.json` ≤ 100ms (кешируется)
- **Типизация:** `pnpm typecheck` — 0 ошибок
- **Регрессия:** все существующие E2E-тесты проходят

---

## 12. Риски и митигация

| Риск | Митигация |
|---|---|
| MCP SDK нестабилен (v1.x) | Закрепить точную версию в package.json. Следить за breaking changes в CHANGELOG SDK. |
| LLM может выполнить нежелательные массовые операции (delete всех QR) | Для mutating tools в `description` указать required confirmations. `mcp:access` scope отдельный от `qr:delete` — можно дать read-only MCP доступ. |
| OpenAPI spec устаревает относительно кода | Auto-generation при CI build. `pnpm openapi:generate` в pre-commit hook. Contract-тесты: сравнивать spec с реальными ответами. |
| Scalar UI конфликтует с SPLAT theme | Кастомный CSS override, изолированный iframe как fallback. |
| Безопасность: MCP-ключ утёк в LLM context | Отдельный `mcp:access` scope. Лог всех вызовов через audit_log (EPIC 21). Rotation каждые 90 дней (EPIC 21). |

---

## 13. Follow-up (после релиза)

- **MCP Sampling** — пока не используется, но в будущем можно добавить: сервер может запросить LLM completion у клиента (например, для генерации описаний QR)
- **MCP Prompts** — пресеты промптов для типовых задач («Создай ежемесячный отчёт по QR»)
- **Webhooks из MCP** — регистрация webhook'ов через tool (интеграция с системой уведомлений)
- **Multi-tenant MCP** — если система станет мультитенантной, добавить tenant isolation в MCP context