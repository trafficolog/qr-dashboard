# SPLAT QR Service — Субагентная документация для Cursor IDE

> **Цель:** Детализированный план продолжения разработки (Эпики 5–14) для автономной реализации AI-агентом в Cursor IDE.
> **Контекст:** Эпики 1–4 полностью реализованы (90 файлов). Проект работает на Nuxt 3 + PostgreSQL + Drizzle ORM.
> **Каждая задача** содержит: точные файлы, зависимости, код-скелет, критерии приёмки и чеклист.

---

## Содержание

| # | Эпик | Фаза | Оценка | Зависимости |
|---|------|------|--------|-------------|
| 5 | Redirect и сбор аналитики | 1 (MVP) | 2–3 дня | Эпики 1, 4 |
| 6 | Аналитика (базовая) | 1 (MVP) | 3–4 дня | Эпики 1, 4, 5 |
| 7 | Папки и теги | 2 | 2–3 дня | Эпики 1, 4 |
| 8 | Расширенная кастомизация QR | 2 | 3–4 дня | Эпик 4 |
| 9 | A/B-тестирование | 3 | 2 дня | Эпики 4, 5 |
| 10 | Массовое создание CSV | 3 | 2–3 дня | Эпик 4 |
| 11 | Управление командой | 3 | 2 дня | Эпик 2 |
| 12 | API v1 и ключи | 4 | 2 дня | Эпики 2, 4 |
| 13 | Daily Aggregation | 3–4 | 1–2 дня | Эпики 5, 6 |
| 14 | i18n, Dark Mode, Polish | 4 | 2–3 дня | Все |

---

## Общий контекст проекта для субагента

### Стек и конвенции

```
Framework:    Nuxt 3 (SSR, compatibilityVersion 4)
UI:           Nuxt UI v3 (Reka UI + Tailwind v4)
ORM:          Drizzle ORM (relational queries, PostgreSQL 16)
Validation:   Zod на каждом API-эндпоинте
Auth:         Cookie session_token (httpOnly), SHA-256 hash в БД
Icons:        @nuxt/icon — Lucide set (i-lucide-*)
State:        useState composables + Pinia для глобального
i18n:         @nuxtjs/i18n (ru default, en)
```

### Паттерн API-хэндлера

```typescript
// server/api/entity/index.get.ts
import { z } from 'zod'
import { entityService } from '../../services/entity.service'

const querySchema = z.object({ /* ... */ })

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)           // из server/utils/auth.ts
  const query = await getValidatedQuery(event, querySchema.parse)
  const result = await entityService.list(query, user)
  return apiSuccess(result.data, result.meta) // из server/utils/response.ts
})
```

### Паттерн сервиса

```typescript
// server/services/entity.service.ts
import { db } from '../db'
import { table } from '../db/schema'

export const entityService = {
  async list(filters, user) {
    // Role-based: user.role !== 'admin' → фильтр по user.id
    // Drizzle relational queries
    // Return { data, total, page, limit, totalPages }
  }
}
```

### Паттерн composable

```typescript
// app/composables/useEntity.ts
export function useEntity() {
  const list = ref([])
  const loading = ref(false)

  async function fetchList() {
    loading.value = true
    try {
      const res = await $fetch<{ data: T[] }>('/api/entity')
      list.value = res.data
    } finally {
      loading.value = false
    }
  }

  return { list: readonly(list), loading: readonly(loading), fetchList }
}
```

### Существующие утилиты (переиспользовать)

| Утилита | Import | Использование |
|---------|--------|---------------|
| `generateShortCode()` | `server/utils/nanoid.ts` | 7-символьный код без ambiguous chars |
| `hashToken(token)` | `server/utils/hash.ts` | SHA-256 → hex |
| `getClientIp(event)` | `server/utils/ip.ts` | IP из proxy headers |
| `apiSuccess(data, meta?)` | `server/utils/response.ts` | Стандартный ответ |
| `apiError(message, code)` | `server/utils/response.ts` | throw createError |
| `requireAuth(event)` | `server/utils/auth.ts` | Проверка авторизации |
| `requireAdmin(event)` | `server/utils/auth.ts` | Проверка admin role |

### Существующие компоненты (переиспользовать)

| Компонент | Import | Props |
|-----------|--------|-------|
| `SharedPagination` | auto-import | `:page, :limit, :total, :totalPages`, emit `update:page` |
| `SharedEmptyState` | auto-import | `:icon, :title, :description`, slot `action` |
| `SharedConfirmDialog` | auto-import | `v-model:open`, `:title, :message`, emit `confirm` |
| `SharedTagInput` | auto-import | `v-model`, `:availableTags`, emit `create-tag` |
| `QrPreview` | auto-import | `:url, :style, :shortCode, :displaySize` |
| `QrStyleEditor` | auto-import | `v-model` (Partial<QrStyle>) |

---

## Эпик 5: Redirect-эндпоинт и сбор аналитики

### Задача 5.1 — Redirect Handler

**Приоритет:** 🔴 Critical
**Зависимости:** Эпик 1 (db, schema), Эпик 4 (qr.service)
**Критический путь:** ≤50ms latency

**Создать файлы:**

#### 5.1.1 `server/routes/r/[code].get.ts`

```typescript
// Порядок обработки:
// 1. LRU-cache lookup (shortCode → {id, destinationUrl, status, expiresAt, utmParams, destinations[]})
// 2. Cache miss → DB query: db.query.qrCodes.findFirst({ where: eq(shortCode, code), with: { destinations: { where: eq(isActive, true) } } })
// 3. Если !qr → sendRedirect(event, '/not-found', 302)
// 4. Если status !== 'active' → sendRedirect(event, '/not-found', 302)
// 5. Если expiresAt && expiresAt < now → sendRedirect(event, '/expired', 302)
// 6. Определить URL:
//    - Если destinations.length > 1 → weightedRandom(destinations)
//    - Иначе → qr.destinationUrl
// 7. Append UTM params (если есть)
// 8. event.waitUntil(redirectService.recordScanEvent({...}))
// 9. event.waitUntil(db.update(qrCodes).set({ totalScans: sql`total_scans + 1` }))
// 10. sendRedirect(event, finalUrl, 302)
```

**LRU-cache:**

```typescript
// server/utils/qr-cache.ts
import { LRUCache } from 'lru-cache'

interface QrCacheEntry {
  id: string
  destinationUrl: string
  status: string
  expiresAt: Date | null
  utmParams: Record<string, string> | null
  destinations: { id: string; url: string; weight: number }[]
}

export const qrCache = new LRUCache<string, QrCacheEntry>({
  max: 10000,
  ttl: 5 * 60 * 1000, // 5 минут
})

export function invalidateQrCache(shortCode: string) {
  qrCache.delete(shortCode)
}
```

**ВАЖНО:** Вызывать `invalidateQrCache(shortCode)` в `qr.service.ts` при update/delete QR.

#### 5.1.2 Fallback-страницы

```
app/pages/not-found.vue — «QR-код не найден» с логотипом SPLAT, layout: false
app/pages/expired.vue — «Срок действия QR-кода истёк», layout: false
```

**Критерии приёмки:**
- [ ] `/r/ValidCode` → 302 redirect к destination URL за ≤50ms (cache hit)
- [ ] `/r/ValidCode` → 302 за ≤100ms (cache miss)
- [ ] `/r/InvalidCode` → красивая 404 страница
- [ ] `/r/ExpiredCode` → страница «Срок истёк»
- [ ] totalScans инкрементируется после каждого redirect
- [ ] QR cache инвалидируется при update/delete QR

---

### Задача 5.2 — Redirect Service и Scan Event Recording

**Приоритет:** 🔴 Critical

**Создать файлы:**

#### 5.2.1 `server/services/redirect.service.ts`

```typescript
// recordScanEvent(params: { qrCodeId, destinationId?, ip, userAgent, referer })
//
// 1. Parse User-Agent: import UAParser from 'ua-parser-js'
//    const ua = new UAParser(userAgent)
//    deviceType = ua.getDevice().type || 'desktop'
//    os = ua.getOS().name || 'Unknown'
//    browser = ua.getBrowser().name || 'Unknown'
//
// 2. GeoIP: import geoip from 'geoip-lite'
//    const geo = geoip.lookup(ip)
//    country = geo?.country, city = geo?.city, region = geo?.region
//    latitude = geo?.ll?.[0], longitude = geo?.ll?.[1]
//
// 3. isUnique check:
//    const dateStr = new Date().toISOString().slice(0, 10)
//    const uniqueHash = hashToken(`${ip}${userAgent}${qrCodeId}${dateStr}`)
//    Проверить: SELECT 1 FROM scan_events WHERE qrCodeId AND scannedAt::date = today AND ipAddress = ip
//    Если нет записи с таким IP за сегодня → isUnique = true
//
// 4. INSERT scan_events
//
// 5. Если isUnique → UPDATE qr_codes SET unique_scans = unique_scans + 1 WHERE id = qrCodeId
//
// 6. Если destinationId → UPDATE qr_destinations SET clicks = clicks + 1 WHERE id = destinationId
```

#### 5.2.2 `server/services/geo.service.ts`

```typescript
// Обёртка над geoip-lite
// lookup(ip: string): { country, city, region, latitude, longitude } | null
// Graceful: если geoip возвращает null → return null (не падать)
```

#### 5.2.3 `server/services/ab-test.service.ts`

```typescript
// weightedRandom<T extends { weight: number }>(items: T[]): T
// totalWeight = sum(weights), random = Math.random() * totalWeight
// Iterate, subtract weight, return when <= 0
```

**Критерии приёмки:**
- [ ] Scan event записывается с корректными geo, device, browser, os
- [ ] isUnique=true только при первом сканировании с данного IP/UA за сутки
- [ ] Повторное сканирование → isUnique=false, totalScans++, uniqueScans не меняется
- [ ] GeoIP null (localhost) → поля geo = null, не crash

---

### Задача 5.3 — Export Service

**Приоритет:** 🟠 High

**Создать файлы:**

#### 5.3.1 `server/services/export.service.ts`

```typescript
// generateQrSvg(destinationUrl, style) → SVG string
//   Использовать тот же алгоритм что app/utils/qr-svg.ts
//   (копировать логику на сервер, т.к. server не имеет доступа к app/utils)
//
// generateQrPng(destinationUrl, style, size) → Buffer
//   SVG → PNG через sharp: sharp(Buffer.from(svgString)).resize(size, size).png().toBuffer()
//
// generateQrPdf(destinationUrl, style, title?) → Buffer
//   const doc = new PDFDocument({ size: 'A4' })
//   SVG embed через SVGtoPDF или rasterize SVG → PNG → embed PNG in PDF
//   Центрирование на странице, title text сверху
```

#### 5.3.2 `server/api/qr/[id]/export.get.ts`

```typescript
// Query: format (png|svg|pdf), size (number, для png)
// 1. requireAuth + getQrById
// 2. switch(format):
//    - svg: setHeader Content-Type image/svg+xml, return svgString
//    - png: setHeader Content-Type image/png, return pngBuffer
//    - pdf: setHeader Content-Type application/pdf, return pdfBuffer
// 3. Content-Disposition: attachment; filename="qr-{shortCode}.{ext}"
```

**Критерии приёмки:**
- [ ] GET `/api/qr/{id}/export?format=svg` → скачивается SVG
- [ ] GET `/api/qr/{id}/export?format=png&size=1000` → PNG 1000x1000
- [ ] GET `/api/qr/{id}/export?format=pdf` → PDF с QR по центру A4
- [ ] QR в экспортированных файлах сканируется

---

## Эпик 6: Аналитика (базовая)

### Задача 6.1 — Analytics Service

**Приоритет:** 🔴 Critical
**Зависимости:** Эпики 1, 4, 5

**Файл:** `server/services/analytics.service.ts`

```typescript
// getOverview(userId, dateRange: { from, to })
//   - Total QR (active, owned or all for admin)
//   - Total scans (sum of totalScans from qr_codes, filtered by date)
//   - Unique scans (sum of uniqueScans)
//   - Scans today
//   - Для каждой метрики: вычислить % change vs предыдущий аналогичный период
//     (если period = 30 дней, сравнить с предыдущими 30 днями)
//
// getScansTimeSeries(filters: { qrCodeId?, dateRange, userId })
//   - Определить группировку:
//     diff <= 48h → по часам (DATE_TRUNC('hour', scanned_at))
//     diff <= 90d → по дням (DATE(scanned_at))
//     diff <= 365d → по неделям (DATE_TRUNC('week', scanned_at))
//     diff > 365d → по месяцам (DATE_TRUNC('month', scanned_at))
//   - SELECT date_group, COUNT(*) as totalScans, COUNT(*) FILTER (WHERE is_unique) as uniqueScans
//     FROM scan_events WHERE ... GROUP BY date_group ORDER BY date_group
//
// getTopQrCodes(filters)
//   - Top 10 QR по totalScans за период
//   - SELECT id, title, short_code, total_scans, unique_scans FROM qr_codes
//     WHERE createdBy = userId (если editor) ORDER BY total_scans DESC LIMIT 10
```

### Задача 6.2 — API-эндпоинты аналитики

**Создать файлы:**

```
server/api/analytics/overview.get.ts     — query: dateFrom, dateTo
server/api/analytics/scans.get.ts        — query: qrCodeId?, dateFrom, dateTo
server/api/qr/[id]/analytics.get.ts      — аналитика конкретного QR
```

Каждый эндпоинт: `requireAuth` → Zod-валидация query → `analyticsService.method()` → `apiSuccess(result)`

### Задача 6.3 — Dashboard

**Обновить:** `app/pages/dashboard/index.vue`

**Создать файлы:**

```
app/composables/useAnalytics.ts
app/components/analytics/StatCard.vue
app/components/analytics/ScanChart.vue
app/components/analytics/DateRangePicker.vue
app/components/analytics/TopQrTable.vue
```

#### `app/composables/useAnalytics.ts`

```typescript
// fetchOverview(dateRange) → ApiResponse<AnalyticsOverview>
// fetchScansTimeSeries(filters) → ApiResponse<ScanTimeSeriesPoint[]>
// fetchTopQr(filters) → ApiResponse<TopQrCode[]>
// Использовать Promise.all для параллельных запросов
```

#### `app/components/analytics/StatCard.vue`

```
Props: icon (string), label (string), value (number|string), change (number), loading (boolean)
Отображение: иконка в цветном круге, значение (анимация), % изменения (зелёный/красный + стрелка)
Skeleton при loading
```

#### `app/components/analytics/ScanChart.vue`

```
Props: data (ScanTimeSeriesPoint[]), loading (boolean)
Библиотека: vue-echarts (уже установлен)
Две линии: totalScans (primary green), uniqueScans (lighter)
Tooltip при наведении, responsive
```

#### `app/components/analytics/DateRangePicker.vue`

```
Props: modelValue ({ from, to })
Presets: Сегодня, 7 дней, 30 дней, 90 дней, Год, Custom
Custom: два UInput type=date
Emit: update:modelValue
```

#### `app/components/analytics/TopQrTable.vue`

```
Props: items (TopQrCode[]), loading (boolean)
Колонки: title (link to /qr/{id}), scans, created, status badge
Skeleton при loading
```

**Критерии приёмки:**
- [ ] Dashboard загружается <1 сек (параллельные запросы)
- [ ] 4 StatCard с корректными числами и % change
- [ ] ScanChart отображает данные за выбранный период
- [ ] Смена периода → все виджеты обновляются
- [ ] Скелетоны при загрузке

---

## Эпик 7: Папки и теги

### Задача 7.1 — Папки (сервер)

**Создать файлы:**

```
server/api/folders/index.get.ts    — список + count QR
server/api/folders/index.post.ts   — создание { name, parentId?, color? }
server/api/folders/[id].put.ts     — rename, color, parentId
server/api/folders/[id].delete.ts  — удаление (QR → folderId = null)
```

**Логика:** Простой CRUD. При удалении папки: `UPDATE qr_codes SET folder_id = NULL WHERE folder_id = id`. Подсчёт QR через `LEFT JOIN` или subquery.

### Задача 7.2 — Папки (клиент)

**Создать файлы:**

```
app/pages/folders/index.vue        — grid карточек (иконка, название, count)
app/pages/folders/[id].vue         — QR-коды в папке (reuse QrTable/QrCard)
app/components/folders/FolderDialog.vue  — UModal: name, color picker, parent select
app/composables/useFolders.ts      — CRUD composable
```

### Задача 7.3 — Теги (сервер + клиент)

**Создать файлы:**

```
server/api/tags/index.get.ts       — все теги + count QR
server/api/tags/index.post.ts      — создание { name, color? }
```

**Обновить:** `SharedTagInput` уже создан, но нужно подключить реальные данные вместо placeholder.

**Обновить:** `app/pages/qr/create.vue` и `app/pages/qr/[id]/edit.vue` — добавить fetch тегов и folder selector.

**Обновить:** `app/pages/qr/index.vue` — добавить fetch папок для dropdown фильтра.

---

## Эпик 8: Расширенная кастомизация QR

### Задача 8.1 — Градиенты в SVG

**Обновить:** `app/utils/qr-svg.ts`

Добавить поддержку `gradientType` и `gradientColors` в `generateQrSvg()`:
- `linearGradient`: `<linearGradient id="qr-gradient" ...><stop .../></linearGradient>` в `<defs>`
- `radialGradient`: аналогично
- Модули используют `fill="url(#qr-gradient)"` вместо `fill="${foregroundColor}"`

### Задача 8.2 — Лого Upload

**Создать файлы:**

```
server/api/upload/logo.post.ts     — Accept PNG/JPG/SVG ≤2MB, resize через sharp до 500x500, сохранить в data/uploads/
```

**Обновить:** `QrStyleEditor` — добавить drag-and-drop зону для лого, preview, slider размера (15–30%), auto H correction.

### Задача 8.3 — Рамки с CTA

**Обновить:** `app/utils/qr-svg.ts`

Добавить рендеринг рамок (`frame` в QrStyle):
- `banner-bottom`: `<rect>` + `<text>` под QR
- `banner-top`: аналогично над QR
- `rounded-box`: `<rect rx>` вокруг QR + `<text>` снизу
- `tooltip`: SVG bubble над QR

**Обновить:** `QrStyleEditor` — секция Frame: toggle, style select, text input, colors.

**Синхронизировать:** серверный рендерер `export.service.ts` должен поддерживать те же рамки.

---

## Эпик 9: A/B-тестирование ссылок

### Задача 9.1 — A/B (сервер)

**Создать файлы:**

```
server/api/qr/[id]/destinations/index.post.ts    — добавить вариант
server/api/qr/[id]/destinations/[destId].put.ts   — обновить URL/weight
server/api/qr/[id]/destinations/[destId].delete.ts — удалить вариант
```

**Валидация:** сумма весов всех активных destinations = 100.

### Задача 9.2 — A/B (клиент)

**Создать:** `app/components/qr/AbTestConfig.vue`

- Список вариантов (url + label + weight slider)
- Визуальная stacked bar для распределения трафика
- Кнопка «Добавить вариант»
- Валидация: сумма = 100%

**Интеграция:** в формы create/edit QR.

**Отображение результатов:** на странице `qr/[id]/index.vue` — таблица вариантов с clicks и %.

---

## Эпик 10: Массовое создание из CSV

### Задача 10.1 — Bulk Service

**Создать:** `server/services/bulk.service.ts`

```typescript
// parseCsv(fileBuffer) → rows[]
//   papaparse с header: true
//   Маппинг колонок: title, destination_url, folder, tags, utm_*
//
// validateRows(rows) → { valid: Row[], errors: { row: number, field: string, message: string }[] }
//   URL validation, title required
//
// bulkCreate(validRows, userId) → { created: QrCode[], errors: [] }
//   Batch insert в транзакции
//   Генерация shortCode для каждого
```

**Создать:** `server/api/qr/bulk.post.ts` — multipart/form-data, лимит 500 строк.

### Задача 10.2 — Bulk UI

**Создать:** `app/pages/qr/bulk.vue`

Wizard из 5 шагов:
1. Upload CSV (drag-and-drop)
2. Preview таблицы + маппинг колонок
3. Валидация (зелёные/красные строки)
4. Подтверждение
5. Результат + скачать template CSV

---

## Эпик 11: Управление командой

### Задача 11.1 — Team API

**Создать файлы:**

```
server/api/team/index.get.ts       — список users (admin only): email, name, role, lastLogin, QR count
server/api/team/invite.post.ts     — { email, role } → создать user, отправить email
server/api/team/[id].put.ts        — смена роли (нельзя снять last admin)
server/api/team/[id].delete.ts     — удаление user (QR остаются)
```

### Задача 11.2 — Team UI

**Создать файлы:**

```
app/pages/settings/team.vue        — таблица users + invite modal
app/pages/settings/index.vue       — профиль (имя, аватар)
app/pages/settings/domains.vue     — управление allowed_domains (admin)
```

---

## Эпик 12: API v1 и ключи

### Задача 12.1 — API-ключи

**Создать:** `server/api/integrations/api-key.post.ts`

```typescript
// Генерация: `sqr_live_` + crypto.randomBytes(32).toString('hex')
// Сохранение: SHA-256 hash + prefix (8 chars) в api_keys
// Ключ показывается ОДИН раз → response: { key: 'sqr_live_xxx...', prefix: 'sqr_live' }
```

**Middleware:** `server/middleware/api-key.ts` — проверка `Authorization: Bearer sqr_live_...`

### Задача 12.2 — API v1

**Создать:**

```
server/api/v1/qr/index.post.ts    — создать QR
server/api/v1/qr/index.get.ts     — список (paginated)
server/api/v1/qr/[id].get.ts      — детали
server/api/v1/qr/[id].put.ts      — обновить
server/api/v1/qr/[id].delete.ts   — удалить
server/api/v1/qr/[id]/stats.get.ts — статистика
```

Rate limit: 100 req/min per key.

**Документация:** `app/pages/api-docs/index.vue` — описание эндпоинтов, примеры curl.

---

## Эпик 13: Daily Aggregation

### Задача 13.1 — Aggregation

**Создать схему:**

```typescript
// server/db/schema/scan-daily-stats.ts
// pgTable('scan_daily_stats', {
//   date: date, qrCodeId: uuid, totalScans: integer, uniqueScans: integer,
//   countryBreakdown: jsonb, deviceBreakdown: jsonb
// }, (t) => [primaryKey({ columns: [t.date, t.qrCodeId] })])
```

**Создать:** `server/services/aggregation.service.ts`

```typescript
// aggregateDay(date: string)
//   SELECT qr_code_id, COUNT(*), COUNT(*) FILTER(WHERE is_unique),
//     jsonb_object_agg(country, count), jsonb_object_agg(device_type, count)
//   FROM scan_events WHERE DATE(scanned_at) = date
//   GROUP BY qr_code_id
//   UPSERT into scan_daily_stats
```

**Cron:** `server/plugins/cron.ts`

```typescript
import { schedule } from 'node-cron'
// schedule('0 2 * * *', () => aggregationService.aggregateDay(yesterday))
```

**Добавить** `node-cron` в dependencies.

**Обновить** `analytics.service.ts`: для периодов >30 дней использовать `scan_daily_stats`.

---

## Эпик 14: i18n, Dark Mode, Polish

### Задача 14.1 — i18n

- Расширить `locales/ru.json` и `locales/en.json` всеми строками из UI (labels, messages, errors)
- Заменить все hardcoded строки на `$t('key')` / `t('key')`
- Переключатель языка в UserMenu

### Задача 14.2 — Dark Mode

- Nuxt UI: `colorMode: { preference: 'system' }` в `nuxt.config.ts`
- Проверить все кастомные компоненты (color pickers, SVG previews, charts)
- QR Preview: checkerboard background для прозрачности
- Toggle в Header/Settings

### Задача 14.3 — Sentry

- `pnpm add @sentry/nuxt`
- Настроить DSN из env
- Error boundaries на клиенте
- Server-side tracking

### Задача 14.4 — E2E тесты

- `pnpm add -D @playwright/test`
- Тесты: auth flow, QR CRUD, redirect + scan recording

---

## Порядок реализации (рекомендованный для Cursor)

```
Сессия 1: Эпик 5 (redirect + scan recording + export service)
           → Это разблокирует аналитику и завершит MVP redirect-loop
           
Сессия 2: Эпик 6 (analytics service + API + dashboard обновление)
           → Завершает Фазу 1 (MVP)
           
Сессия 3: Эпик 7 (папки + теги — сервер и клиент)
           → Интеграция в существующие QR формы и фильтры
           
Сессия 4: Эпик 8 (градиенты + лого upload + рамки)
           → Расширение qr-svg.ts и StyleEditor
           
Сессия 5: Эпик 9 (A/B тестирование)
           → Destinations CRUD + AbTestConfig компонент
           
Сессия 6: Эпик 10 + 11 (CSV bulk + team management)
           → Два независимых модуля
           
Сессия 7: Эпик 12 + 13 (API v1 + aggregation)
           → API-ключи + cron jobs
           
Сессия 8: Эпик 14 (polish, i18n, dark mode, tests)
           → Финальная полировка
```

---

## Чеклист готовности к деплою

- [ ] Все API-эндпоинты валидируют вход через Zod
- [ ] Все ответы в формате `{ data, meta?, error? }`
- [ ] TypeScript strict — 0 ошибок (`pnpm typecheck`)
- [ ] ESLint — 0 ошибок (`pnpm lint`)
- [ ] `docker compose up` запускает систему с нуля
- [ ] `pnpm db:migrate && pnpm db:seed` — без ошибок
- [ ] Auth flow работает end-to-end
- [ ] QR CRUD работает (create → view → edit → delete)
- [ ] Redirect `/r/:code` → destination URL, scan event записан
- [ ] Dashboard показывает корректную аналитику
- [ ] Export QR в PNG/SVG/PDF — QR сканируется
- [ ] Layout адаптивный на 320px / 768px / 1024px / 1440px
- [ ] Dark mode без визуальных артефактов
- [ ] i18n: все строки переведены (ru + en)
- [ ] E2E тесты проходят
