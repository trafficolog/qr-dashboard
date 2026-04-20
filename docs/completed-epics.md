# SPLAT QR Service — Завершённые эпики

> Этот файл обновляется после завершения каждого эпика. Содержит исчерпывающую информацию о реализованном коде.

---

## Эпик 1 — Инфраструктура и настройка (Завершён 2026-04-08)

### Созданные файлы
| Файл | Тип | Описание |
|------|-----|----------|
| `nuxt.config.ts` | Config | SSR, 5 модулей, runtimeConfig (9 server + 2 public) |
| `app.config.ts` | Config | Nuxt UI colors, SPLAT brand |
| `drizzle.config.ts` | Config | Drizzle Kit подключение |
| `tsconfig.json` | Config | strict: true, noUncheckedIndexedAccess |
| `docker-compose.yml` | Infra | app + postgres:16-alpine, healthcheck, 3 volumes |
| `Dockerfile` | Infra | Multi-stage: base → deps → build → production |
| `server/db/index.ts` | DB | Drizzle client, pg.Pool max 20 |
| `server/db/schema/users.ts` | Schema | 8 полей, enum user_role |
| `server/db/schema/sessions.ts` | Schema | FK → users CASCADE, SHA-256 token |
| `server/db/schema/otp-codes.ts` | Schema | TTL 10 мин, max 5 attempts |
| `server/db/schema/folders.ts` | Schema | Self-ref parentId |
| `server/db/schema/qr-codes.ts` | Schema | 16 полей, 5 индексов, JSONB style/utm |
| `server/db/schema/qr-destinations.ts` | Schema | A/B weights, FK CASCADE |
| `server/db/schema/scan-events.ts` | Schema | 16 полей, 4 индекса (вкл. composite) |
| `server/db/schema/tags.ts` | Schema | name unique |
| `server/db/schema/qr-tags.ts` | Schema | M2M composite PK |
| `server/db/schema/allowed-domains.ts` | Schema | domain unique, isActive |
| `server/db/schema/api-keys.ts` | Schema | SHA-256 keyHash, prefix 8 chars |
| `server/db/schema/index.ts` | Schema | Re-exports + 8 relations |
| `server/db/seed.ts` | Seed | 1 domain, 1 admin, 3 folders, 6 tags, 10 QR, 400 scans |
| `server/plugins/db.ts` | Plugin | SELECT 1 проверка при старте |
| `server/utils/nanoid.ts` | Utility | generateShortCode() — 7 chars |
| `server/utils/hash.ts` | Utility | hashToken, compareHash (timing-safe) |
| `server/utils/ip.ts` | Utility | getClientIp (X-Forwarded-For) |
| `server/utils/response.ts` | Utility | apiSuccess, apiError |
| `server/utils/auth.ts` | Utility | requireAuth, requireAdmin |

### Таблицы БД: 11
users, sessions, otp_codes, folders, qr_codes, qr_destinations, scan_events, tags, qr_tags, allowed_domains, api_keys

---

## Эпик 2 — Аутентификация OTP (Завершён 2026-04-08)

### Созданные файлы
| Файл | Тип | Описание |
|------|-----|----------|
| `server/services/auth.service.ts` | Service | sendOtp, verifyOtp, verifySession, logout |
| `server/services/email.service.ts` | Service | SMTP/Console provider, HTML шаблон |
| `server/api/auth/login.post.ts` | API | Zod: email → sendOtp |
| `server/api/auth/verify.post.ts` | API | Zod: email+code → session cookie |
| `server/api/auth/logout.post.ts` | API | Delete session + cookie |
| `server/api/auth/me.get.ts` | API | Verify cookie → user |
| `server/middleware/auth.ts` | Middleware | Protect /api/**, attach user to context |
| `server/middleware/rate-limit.ts` | Middleware | LRU: auth 5/15min, redirect 1000/min |
| `app/composables/useAuth.ts` | Composable | login, verify, logout, SSR cookie-aware fetchUser, authResolved, sync with Pinia |
| `app/middleware/auth.global.ts` | Middleware | Client redirect: unauth→login, auth→dashboard |
| `app/layouts/auth.vue` | Layout | Centered card + SPLAT logo |
| `app/pages/auth/login.vue` | Page | Единый auth-flow: email + OTP на одной странице, resend, inline errors |
| `app/pages/auth/verify.vue` | Page | Совместимый redirect на `/auth/login?step=code` |
| `app/stores/auth.ts` | Store | Pinia: user, isAuthenticated |

### API-эндпоинты
| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| POST | `/api/auth/login` | Public | Отправка OTP |
| POST | `/api/auth/verify` | Public | Верификация OTP → cookie |
| POST | `/api/auth/logout` | User | Удаление сессии |
| GET | `/api/auth/me` | User | Текущий пользователь |

---

## Эпик 3 — Layout и навигация (Завершён 2026-04-08)

### Созданные файлы
| Файл | Тип | Описание |
|------|-----|----------|
| `app/components/app/Sidebar.vue` | Component | 240/64px, 5 nav items, tooltips, fade animation |
| `app/components/app/Header.vue` | Component | Sticky, breadcrumbs, Cmd+K search, burger |
| `app/components/app/UserMenu.vue` | Component | Avatar dropdown: email, settings, logout |
| `app/components/app/MobileNav.vue` | Component | USlideover, nav + user info + logout |
| `app/layouts/default.vue` | Layout | Sidebar + Header + MobileNav, localStorage persist |

### Компоненты
| Компонент | Props | Emits |
|-----------|-------|-------|
| `AppSidebar` | `:collapsed` | `toggle` |
| `AppHeader` | — | `toggleSidebar, toggleMobileNav` |
| `AppUserMenu` | — | — |
| `AppMobileNav` | `v-model:open` | — |

---

## Эпик 4 — CRUD QR-кодов (Завершён 2026-04-08)

### Созданные файлы
| Файл | Тип | Описание |
|------|-----|----------|
| `server/services/qr.service.ts` | Service | createQr, getQrList, getQrById, updateQr, deleteQr, bulkDeleteQr, duplicateQr |
| `server/api/qr/index.get.ts` | API | Список: 10 query params, пагинация |
| `server/api/qr/index.post.ts` | API | Создание: Zod body validation |
| `server/api/qr/[id].get.ts` | API | Детали с relations |
| `server/api/qr/[id].put.ts` | API | Обновление: partial fields |
| `server/api/qr/[id].delete.ts` | API | Hard delete |
| `server/api/qr/[id]/duplicate.post.ts` | API | Дублирование |
| `server/api/qr/bulk-delete.post.ts` | API | Массовое удаление |
| `app/composables/useQr.ts` | Composable | CRUD + debounced search + reactive filters |
| `app/utils/qr-svg.ts` | Utility | SVG renderer: 5 moduleStyle × 4 cornerStyle + logo |
| `app/components/qr/Preview.vue` | Component | Reactive SVG + copy URL |
| `app/components/qr/PreviewMini.vue` | Component | 40×40 SVG for table rows |
| `app/components/qr/StyleEditor.vue` | Component | Colors, module/corner visual selectors |
| `app/components/qr/Table.vue` | Component | Checkbox, sort, actions dropdown |
| `app/components/qr/Card.vue` | Component | Grid view card |
| `app/components/qr/ExportDialog.vue` | Component | PNG/SVG/PDF + size select |
| `app/components/shared/Pagination.vue` | Component | Prev/next + pages + count |
| `app/components/shared/EmptyState.vue` | Component | Icon + title + description + action slot |
| `app/components/shared/ConfirmDialog.vue` | Component | Red icon, title, message, confirm/cancel |
| `app/components/shared/TagInput.vue` | Component | Autocomplete + inline creation |
| `app/pages/qr/index.vue` | Page | List: filters, table/grid, bulk actions |
| `app/pages/qr/create.vue` | Page | Two-column: settings + live preview |
| `app/pages/qr/[id]/index.vue` | Page | Details: stats, info, actions, export |
| `app/pages/qr/[id]/edit.vue` | Page | Prefilled form, static URL disabled |

### API-эндпоинты
| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| GET | `/api/qr` | User | Список с фильтрами и пагинацией |
| POST | `/api/qr` | User | Создание QR-кода |
| GET | `/api/qr/:id` | User | Детали с relations |
| PUT | `/api/qr/:id` | User | Обновление |
| DELETE | `/api/qr/:id` | User | Удаление |
| POST | `/api/qr/:id/duplicate` | User | Дублирование |
| POST | `/api/qr/bulk-delete` | User | Массовое удаление |

### Компоненты
| Компонент | Props | Emits |
|-----------|-------|-------|
| `QrPreview` | `:url, :style, :shortCode, :displaySize` | — |
| `QrPreviewMini` | `:url, :styleConfig` | — |
| `QrStyleEditor` | `v-model (Partial<QrStyle>)` | `update:modelValue` |
| `QrTable` | `:items, :selectedIds, :allSelected, :sortBy, :sortOrder` | `toggleAll, toggleSelect, sort, edit, duplicate, delete` |
| `QrCard` | `:qr` | `edit, duplicate, delete` |
| `QrExportDialog` | `v-model:open, :qrId, :title` | — |
| `SharedPagination` | `:page, :limit, :total, :totalPages` | `update:page` |
| `SharedEmptyState` | `:icon, :title, :description` | slot `action` |
| `SharedConfirmDialog` | `v-model:open, :title, :message, :loading` | `confirm` |
| `SharedTagInput` | `v-model (string[]), :availableTags` | `create-tag` |

### Известные ограничения
- Export API-эндпоинт (`/api/qr/[id]/export`) — UI готов, серверная часть в Эпике 5
- Folder/Tag selectors на create/edit — placeholder, реальные данные в Эпике 7
 
---
 
## Хотфикс: Стили, Auth, Навигация, Docker (2026-04-13)
 
### Исправленные файлы
| Файл | Тип | Описание |
|------|-----|----------|
| `nuxt.config.ts` | Config | Добавлен глобальный CSS и `colorMode`; тема подключается из `~~/assets/css/main.css` |
| `app.config.ts` | Config | Тема Nuxt UI переведена на SPLAT palette (`primary: splat`, `neutral: neutral`) |
| `Dockerfile` | Infra | Исправлен: `npm ci` вместо `pnpm install`, добавлен stage `migrator`, порт 3000 |
| `docker-compose.yml` | Infra | Добавлен сервис `migrate`; убран `profiles: ["app"]`; порт 3000; `app` depends_on `migrate` |
| `server/services/auth.service.ts` | Service | Логика доменов: пустой список → все домены разрешены (открытый режим) |
| `app/app.vue` | App Shell | Корневой Nuxt UI shell обёрнут в `UApp` для глобальной primary theme |
| `app/composables/useAuth.ts` | Composable | login, verify, logout, SSR cookie-aware fetchUser, authResolved, sync with Pinia |
| `app/composables/useQr.ts` | Composable | Исправлены type imports и refetch списка при поиске с `page > 1` |
| `app/middleware/auth.global.ts` | Middleware | Не перехватывает неизвестные маршруты, поэтому 404 рендерится через branded error page |
| `app/pages/auth/login.vue` | Page | Auth переведён в один экран: email → OTP → redirect на dashboard |
| `app/stores/auth.ts` | Store | Исправлен import shared type `User` из корневого `types/` |
| `app/utils/qr-svg.ts` | Utility | Исправлен import shared type `QrStyle`, typecheck/lint приведены к зелёному состоянию |
| `server/services/qr.service.ts` | Service | Исправлены shared-type imports, nullable `description`, lint/style issues |
| `server/middleware/rate-limit.ts` | Middleware | `Retry-After` возвращается в ожидаемом типе |
| `server/utils/auth.ts` | Utility | Исправлен import shared type `User` |
| `i18n/locales/ru.json` | I18n | Добавлены строки для analytics placeholder, one-page auth и global error screen |
| `i18n/locales/en.json` | I18n | Добавлены строки для analytics placeholder, one-page auth и global error screen |
 
### Новые файлы
| Файл | Тип | Описание |
|------|-----|----------|
| `server/db/migrations/migrate.ts` | Script | Standalone миграция через `drizzle-orm/migrator` (не требует drizzle-kit) |
| `server/api/admin/domains/index.get.ts` | API | GET список доменов (admin) |
| `server/api/admin/domains/index.post.ts` | API | POST добавить домен (admin) |
| `server/api/admin/domains/[id].patch.ts` | API | PATCH toggle isActive (admin) |
| `server/api/admin/domains/[id].delete.ts` | API | DELETE домен (admin) |
| `app/pages/settings/index.vue` | Page | Обзор настроек (карточки по роли) |
| `app/pages/settings/domains.vue` | Page | Управление белым списком доменов |
| `app/error.vue` | Page | Универсальный branded экран для `404` и runtime errors |
| `app/pages/analytics/index.vue` | Page | Placeholder для navigation target `/analytics` |
| `app/pages/folders/index.vue` | Page | Placeholder для раздела папок до отдельного эпика |
| `app/pages/auth/login.vue` | Page | Единый auth-flow: email + OTP на одной странице, resend, inline errors |
| `app/pages/auth/verify.vue` | Page | Совместимый redirect на `/auth/login?step=code` |
| `CHANGELOG.md` | Docs | История изменений |
 
### Логика доменов
```
allowed_domains пустой (0 активных записей)
  → ВСЕ домены разрешены (открытый режим — по умолчанию)
 
allowed_domains содержит ≥1 активной записи
  → Режим белого списка: принимаются только домены из таблицы
```

### Проверка хотфикса
- `corepack pnpm typecheck` → 0 ошибок
- `/dashboard`, `/qr`, `/folders`, `/analytics`, `/settings` → открываются после входа без ложного redirect на `/auth/login`
- `/auth/login` для авторизованного пользователя → redirect на `/dashboard`
- Неизвестный URL → branded `404` через `app/error.vue`

---
 
## Хотфикс: Стили, Auth, Навигация, Docker (2026-04-13)
 
### Исправленные файлы
| Файл | Тип | Описание |
|------|-----|----------|
| `nuxt.config.ts` | Config | Добавлен глобальный CSS и `colorMode`; тема подключается из `~~/assets/css/main.css` |
| `app.config.ts` | Config | Тема Nuxt UI переведена на SPLAT palette (`primary: splat`, `neutral: neutral`) |
| `Dockerfile` | Infra | Исправлен: `npm ci` вместо `pnpm install`, добавлен stage `migrator`, порт 3000 |
| `docker-compose.yml` | Infra | Добавлен сервис `migrate`; убран `profiles: ["app"]`; порт 3000; `app` depends_on `migrate` |
| `server/services/auth.service.ts` | Service | Логика доменов: пустой список → все домены разрешены (открытый режим) |
| `app/app.vue` | App Shell | Корневой Nuxt UI shell обёрнут в `UApp` для глобальной primary theme |
| `app/composables/useAuth.ts` | Composable | SSR `fetchUser()` пробрасывает cookie headers; auth-state синхронизирован с Pinia |
| `app/composables/useQr.ts` | Composable | Исправлены type imports и refetch списка при поиске с `page > 1` |
| `app/middleware/auth.global.ts` | Middleware | Не перехватывает неизвестные маршруты, поэтому 404 рендерится через branded error page |
| `app/pages/auth/login.vue` | Page | Auth переведён в один экран: email → OTP → redirect на dashboard |
| `app/stores/auth.ts` | Store | Исправлен import shared type `User` из корневого `types/` |
| `app/utils/qr-svg.ts` | Utility | Исправлен import shared type `QrStyle`, typecheck/lint приведены к зелёному состоянию |
| `server/services/qr.service.ts` | Service | Исправлены shared-type imports, nullable `description`, lint/style issues |
| `server/middleware/rate-limit.ts` | Middleware | `Retry-After` возвращается в ожидаемом типе |
| `server/utils/auth.ts` | Utility | Исправлен import shared type `User` |
| `i18n/locales/ru.json` | I18n | Добавлены строки для analytics placeholder, one-page auth и global error screen |
| `i18n/locales/en.json` | I18n | Добавлены строки для analytics placeholder, one-page auth и global error screen |
 
### Новые файлы
| Файл | Тип | Описание |
|------|-----|----------|
| `server/db/migrations/migrate.ts` | Script | Standalone миграция через `drizzle-orm/migrator` (не требует drizzle-kit) |
| `server/api/admin/domains/index.get.ts` | API | GET список доменов (admin) |
| `server/api/admin/domains/index.post.ts` | API | POST добавить домен (admin) |
| `server/api/admin/domains/[id].patch.ts` | API | PATCH toggle isActive (admin) |
| `server/api/admin/domains/[id].delete.ts` | API | DELETE домен (admin) |
| `app/pages/settings/index.vue` | Page | Обзор настроек (карточки по роли) |
| `app/pages/settings/domains.vue` | Page | Управление белым списком доменов |
| `app/error.vue` | Page | Универсальный branded экран для `404` и runtime errors |
| `app/pages/analytics/index.vue` | Page | Placeholder для navigation target `/analytics` |
| `app/pages/folders/index.vue` | Page | Placeholder для раздела папок до отдельного эпика |
| `CHANGELOG.md` | Docs | История изменений |
 
### Логика доменов
```
allowed_domains пустой (0 активных записей)
  → ВСЕ домены разрешены (открытый режим — по умолчанию)
 
allowed_domains содержит ≥1 активной записи
  → Режим белого списка: принимаются только домены из таблицы
```
 
### Проверка хотфикса
- `corepack pnpm typecheck` → 0 ошибок
- `/dashboard`, `/qr`, `/folders`, `/analytics`, `/settings` → открываются после входа без ложного redirect на `/auth/login`
- `/auth/login` для авторизованного пользователя → redirect на `/dashboard`
- Неизвестный URL → branded `404` через `app/error.vue`
---
 
## Эпик 5 — Redirect и сбор аналитики (Завершён 2026-04-13)
 
### Созданные файлы
| Файл | Тип | Описание |
|------|-----|----------|
| `server/utils/qr-cache.ts` | Utility | LRU-кэш QR (max 10k, TTL 5 мин), `invalidateQrCache()` |
| `server/routes/r/[code].get.ts` | Route | 302 redirect: кэш → DB, A/B, UTM, fire-and-forget analytics |
| `server/services/geo.service.ts` | Service | Обёртка geoip-lite; graceful null для localhost |
| `server/services/ab-test.service.ts` | Service | `weightedRandom<T>()` — взвешенный случайный выбор |
| `server/services/redirect.service.ts` | Service | `recordScanEvent()`: UA-парсинг, GeoIP, isUnique, DB insert |
| `server/services/export.service.ts` | Service | SVG/PNG (sharp)/PDF (pdfkit) — полный серверный рендерер |
| `server/api/qr/[id]/export.get.ts` | API | GET ?format=svg|png|pdf &size=N → скачивание файла |
| `app/pages/not-found.vue` | Page | «QR-код не найден», layout: false |
| `app/pages/expired.vue` | Page | «Срок действия истёк», layout: false |
 
### Изменённые файлы
| Файл | Изменение |
|------|-----------|
| `server/services/qr.service.ts` | Добавлен import `invalidateQrCache`; вызов при `updateQr` и `deleteQr` |
 
### Логика redirect-обработчика
```
GET /r/:code
  ├─ cache hit  → статус/expiry проверка → A/B → UTM → fire-and-forget scan → 302
  └─ cache miss → DB query → set cache → статус/expiry → A/B → UTM → scan → 302
 
Fallbacks:
  - status ≠ 'active' → /not-found
  - expiresAt < now   → /expired
  - shortCode не найден → /not-found
```
 
### Критерии приёмки
- [ ] `/r/ValidCode` → 302 redirect ≤50ms (cache hit)
- [ ] `/r/ValidCode` → 302 redirect ≤100ms (cache miss)
- [ ] `/r/InvalidCode` → `/not-found`
- [ ] `/r/ExpiredCode` → `/expired`
- [ ] `totalScans` инкрементируется при каждом сканировании
- [ ] `uniqueScans` инкрементируется только при первом IP за сутки
- [ ] QR cache инвалидируется при update/delete
- [ ] Export SVG/PNG/PDF скачивается и содержит рабочий QR
 
---
 
## Эпик 6 — Базовый аналитический дашборд (Завершён 2026-04-13)
 
### Созданные файлы
| Файл | Тип | Описание |
|------|-----|----------|
| `server/services/analytics.service.ts` | Service | Агрегация: overview, time series, top QR, QR analytics |
| `server/api/analytics/overview.get.ts` | API | Обзорные метрики + % изменение vs предыдущий период |
| `server/api/analytics/scans.get.ts` | API | Временной ряд; опциональный `qrCodeId` |
| `server/api/analytics/top-qr.get.ts` | API | Топ 10 QR по сканированиям |
| `server/api/qr/[id]/analytics.get.ts` | API | Детальная аналитика QR с проверкой доступа |
| `app/composables/useAnalytics.ts` | Composable | Реактивный fetchAll(range), overview/timeSeries/topQr |
| `app/components/analytics/StatCard.vue` | Component | Карточка метрики со скелетоном и trending % |
| `app/components/analytics/ScanChart.vue` | Component | Линейный график vue-echarts (total + unique) |
| `app/components/analytics/DateRangePicker.vue` | Component | Пресеты + custom date inputs |
| `app/components/analytics/TopQrTable.vue` | Component | Топ QR: ссылка, сканирования, скелетон |
 
### Изменённые файлы
| Файл | Изменение |
|------|-----------|
| `app/pages/dashboard/index.vue` | Реальная аналитика вместо placeholder |
| `app/pages/analytics/index.vue` | Полная страница вместо заглушки |
 
### Архитектурные решения
 
#### Агрегация в raw SQL
Использован `db.execute(sql\`...\`)` вместо ORM-запросов для:
- `COUNT(*) FILTER (WHERE is_unique = true)` — подсчёт уникальных за один проход
- `DATE_TRUNC(granularity, scanned_at)` — группировка по времени с переменной гранулярностью
- Параллельные CTE и агрегаты в одном запросе
 
#### Авто-гранулярность временного ряда
```
≤2 дня   → hour
≤60 дней → day
≤180 дней → week
>180 дней → month
```
 
#### % изменение vs предыдущий период
`getOverview()` вычисляет длину запрошенного периода и запрашивает тот же промежуток времени до него, затем вычисляет `Math.round(((current - prev) / prev) * 100)`.
 
### Критерии приёмки
- [ ] Дашборд показывает 4 StatCard с реальными данными и скелетоном при загрузке
- [ ] DateRangePicker пресеты меняют данные без перезагрузки страницы
- [ ] ScanChart отображает 2 серии (total/unique) с tooltip
- [ ] TopQrTable показывает ≤10 записей, клик по названию — переход на QR
- [ ] Страница `/analytics` работает аналогично дашборду
- [ ] Все запросы используют RBAC (admin видит всё, editor/viewer — только свои QR)
 
---
 
## Эпик 7 — Папки и теги (Завершён 2026-04-13)
 
### Созданные файлы
| Файл | Тип | Описание |
|------|-----|----------|
| `server/services/folder.service.ts` | Service | CRUD папок: list (с count QR), getById, create, update, delete (QR → root) |
| `server/services/tag.service.ts` | Service | list (с count QR), create (409 при дубликате, case-insensitive) |
| `server/api/folders/index.get.ts` | API | GET список папок с qrCount |
| `server/api/folders/index.post.ts` | API | POST создать папку (name, parentId?, color?) |
| `server/api/folders/[id].get.ts` | API | GET папку по ID |
| `server/api/folders/[id].put.ts` | API | PUT rename/recolor/reparent |
| `server/api/folders/[id].delete.ts` | API | DELETE папку (QR → folderId = null) |
| `server/api/tags/index.get.ts` | API | GET все теги с qrCount |
| `server/api/tags/index.post.ts` | API | POST создать тег |
| `app/composables/useFolders.ts` | Composable | CRUD-composable: folders, fetchFolders, createFolder, updateFolder, deleteFolder |
| `app/components/folders/FolderDialog.vue` | Component | UModal: имя, color picker (7 presets), parent select |
| `app/pages/folders/index.vue` | Page | Grid карточек папок: цветная полоска, иконка, count QR, edit/delete |
| `app/pages/folders/[id].vue` | Page | QR-коды в папке: QrTable + пагинация, кнопка создания QR с folderId |
 
### Изменённые файлы
| Файл | Изменение |
|------|-----------|
| `app/pages/qr/index.vue` | Folder filter загружает реальные папки из API вместо placeholder |
| `app/pages/qr/create.vue` | Добавлены Folder selector + SharedTagInput + загрузка данных |
| `app/pages/qr/[id]/edit.vue` | Добавлены Folder selector + SharedTagInput; prefill из existing QR |
 
### Логика
- **Папки**: каждый пользователь видит только свои папки; admin видит все; при удалении папки QR-коды перемещаются в корень
- **Теги**: глобальный список тегов (видят все авторизованные пользователи); уникальность проверяется case-insensitive; цвет опционален
- **Связи**: схема `qr_tags` (m2m) уже существовала; сервис/API только надстройка
 
### Критерии приёмки
- [ ] `/folders` — отображает сетку папок с количеством QR-кодов
- [ ] Создание / переименование / удаление папки через диалог
- [ ] `/folders/:id` — список QR-кодов в папке, работает пагинация
- [ ] Создание QR с `/qr/create?folderId=…` — папка предзаполнена
- [ ] Форма создания/редактирования QR — folder dropdown + tag input работают
- [ ] Фильтр по папкам на `/qr` загружает реальный список папок
 
---
 
## Эпик 9 — A/B-тестирование ссылок (Завершён 2026-04-13)
 
### Созданные файлы
| Файл | Тип | Описание |
|------|-----|----------|
| `server/services/destination.service.ts` | Service | CRUD вариантов: list, create (max 10), update, delete; инвалидация LRU-кэша |
| `server/api/qr/[id]/destinations/index.get.ts` | API | GET список вариантов |
| `server/api/qr/[id]/destinations/index.post.ts` | API | POST новый вариант (url, weight, label?) |
| `server/api/qr/[id]/destinations/[destId].put.ts` | API | PUT обновить вариант |
| `server/api/qr/[id]/destinations/[destId].delete.ts` | API | DELETE вариант |
| `app/components/qr/AbTestConfig.vue` | Component | Конфигуратор вариантов: stacked bar, slider весов, валидация суммы = 100% |
 
### Изменённые файлы
| Файл | Изменение |
|------|-----------|
| `app/pages/qr/[id]/edit.vue` | Секция «A/B-тестирование» с QrAbTestConfig; saveToServer при сохранении |
| `app/pages/qr/[id]/index.vue` | Таблица вариантов с traffic bar, clicks, %; аналитика через AnalyticsScanChart |
 
### Архитектура
 
#### Redirect-поведение (уже работало в Эпике 5)
```
destinations.length === 0 → qr.destinationUrl (основной)
destinations.length === 1 → destinations[0].url
destinations.length > 1  → abTestService.weightedRandom(activeDestinations)
```
 
#### Сохранение из UI
`AbTestConfig.saveToServer()` различает варианты:
- `dest.id` есть → PUT (обновление)
- `dest.id` нет + url заполнен → POST (создание, id записывается обратно)
 
Вызывается из `edit.vue` после `updateQr()`, до перехода на страницу деталей.
 
#### LRU-кэш инвалидируется
При каждом create/update/delete через `invalidateQrCache(qr.shortCode)` — следующий redirect подтянет свежие destinations из БД.
 
### Критерии приёмки
- [ ] На странице редактирования QR видна секция «A/B-тестирование»
- [ ] Добавление 2+ вариантов с суммой весов = 100% сохраняется
- [ ] Stacked bar отображает пропорции в реальном времени
- [ ] Предупреждение при сумме ≠ 100%
- [ ] `/r/:code` распределяет трафик по весам (проверить несколько раз)
- [ ] Страница деталей QR показывает таблицу вариантов с кликами
- [ ] Удаление варианта инвалидирует кэш
 
---
 
## Эпик 10 — Массовое создание из CSV (Завершён 2026-04-13)
 
### Созданные файлы
| Файл | Тип | Описание |
|------|-----|----------|
| `server/services/bulk.service.ts` | Service | `validateRows` (title+URL обязательны, snake_case→camelCase), `bulkCreate` (resolve folders/tags по имени, create-on-demand для тегов, INSERT qrCodes+qrTags), `generateTemplate` (CSV заголовки + пример строки) |
| `server/api/qr/bulk.post.ts` | API | POST `{ rows }` JSON, max 500 строк, Zod-валидация каждой строки, возвращает `{ created, failed, total, errors }` |
| `app/pages/qr/bulk.vue` | Page | 5-шаговый мастер: Upload → Preview → Validation → Confirmation → Result; papaparse через dynamic import; drag-and-drop зона; таблица ошибок |
 
### Изменённые файлы
| Файл | Изменение |
|------|-----------|
| `app/pages/qr/index.vue` | Добавлена кнопка «Массовое создание» (i-lucide-upload, `/qr/bulk`) рядом с «Создать QR» |
 
### Архитектура
 
#### Клиент → Сервер
```
CSV файл (браузер)
  → papaparse.parse() (dynamic import, только client-side)
  → массив объектов { title, destination_url, ... }
  → POST /api/qr/bulk { rows: [...] }
  → bulkService.validateRows() — фильтрация invalid строк
  → bulkService.bulkCreate() — разрешение папок/тегов, INSERT QR
  → { created, failed, total, errors }
```
 
#### Разрешение папок при bulk-создании
- Уникальные имена папок из строк собираются в `Set`
- Для каждого имени: `ilike` поиск в БД → доступ по роли/owner → `folderMap`
- Отсутствующие/чужие папки молча игнорируются (QR создаётся без папки)
 
#### Разрешение тегов при bulk-создании
- Уникальные имена тегов собираются в `Set`
- Для каждого: `ilike` → если есть → id; если нет → `INSERT` и id
- Теги глобальные — создаются без привязки к пользователю
 
#### Шаги мастера
| # | Шаг | Описание |
|---|-----|----------|
| 1 | Upload | Drag-and-drop или file input; шаблон CSV; auto-parse при выборе файла |
| 2 | Preview | Таблица первых 5 строк; список обнаруженных заголовков |
| 3 | Validation | ✅/❌ per row; сообщения об ошибках; кол-во valid/invalid |
| 4 | Confirm | Карточки: будет создано / всего / пропустить |
| 5 | Result | Счётчик created; таблица ошибок (первые 20 строк) |
 
### API-эндпоинты
| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| POST | `/api/qr/bulk` | User | Массовое создание QR из CSV-строк |
 
### Критерии приёмки
- [ ] Кнопка «Массовое создание» на `/qr` ведёт на `/qr/bulk`
- [ ] Drag-and-drop и file input загружают CSV-файл
- [ ] Шаблон CSV скачивается с заголовками и примером строки
- [ ] Шаг «Предпросмотр» показывает первые 5 строк
- [ ] Шаг «Валидация» помечает строки без title/URL как ошибочные
- [ ] Шаг «Подтверждение» отображает корректные счётчики
- [ ] Шаг «Результат» показывает `created` и таблицу ошибок
- [ ] Папки разрешаются case-insensitive; чужие/несуществующие — молча пропускаются
- [ ] Теги создаются автоматически при отсутствии в БД
- [ ] Лимит 500 строк на один запрос
 
---
 
## Эпик 11 — Управление командой (Завершён 2026-04-13)
 
### Созданные файлы
| Файл | Тип | Описание |
|------|-----|----------|
| `server/services/team.service.ts` | Service | `list` (с qrCount через subquery), `invite` (INSERT user + 409 guard), `updateRole` (last-admin + self-role guards), `remove` (reassign QR + delete sessions + last-admin + self guards) |
| `server/api/team/index.get.ts` | API | GET список участников (admin only) |
| `server/api/team/invite.post.ts` | API | POST создать пользователя + sendInviteEmail; Zod: email + role |
| `server/api/team/[id].put.ts` | API | PUT сменить роль пользователя |
| `server/api/team/[id].delete.ts` | API | DELETE пользователя с переназначением QR |
| `app/pages/settings/team.vue` | Page | Таблица участников: аватар, email, имя, qrCount, lastLoginAt; inline role select; invite modal; delete confirm |
 
### Изменённые файлы
| Файл | Изменение |
|------|-----------|
| `server/services/email.service.ts` | Добавлен `sendInviteEmail` — HTML-письмо с кнопкой «Войти» |
| `app/pages/settings/index.vue` | Добавлена кнопка «Команда» (i-lucide-users, `/settings/team`) |
 
### Архитектура
 
#### Защитные ограничения (guards)
| Действие | Guard | Код |
|----------|-------|-----|
| Изменение роли | Нельзя снять последнего admin | 422 |
| Изменение роли | Нельзя изменить свою роль | 422 |
| Удаление | Нельзя удалить самого себя | 422 |
| Удаление | Нельзя удалить последнего admin | 422 |
| Приглашение | Нельзя создать дубликат email | 409 |
 
#### Invite-flow
```
POST /api/team/invite { email, role }
  → teamService.invite() → INSERT users (role=role)
  → emailService.sendInviteEmail() → HTML-письмо с кнопкой входа
  → пользователь переходит /auth/login → OTP flow
  → verifyOtp() находит existing user → использует его role
```
 
#### Удаление пользователя
```
DELETE /api/team/:id
  → guards (self + last-admin)
  → UPDATE qr_codes SET createdBy = currentAdmin.id WHERE createdBy = target.id
  → DELETE sessions WHERE userId = target.id
  → DELETE users WHERE id = target.id
```
 
### API-эндпоинты
| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| GET | `/api/team` | Admin | Список участников с qrCount |
| POST | `/api/team/invite` | Admin | Создать + пригласить пользователя |
| PUT | `/api/team/:id` | Admin | Сменить роль |
| DELETE | `/api/team/:id` | Admin | Удалить участника |
 
### Критерии приёмки
- [ ] `/settings/team` доступна только admin; не-admin редиректит на `/dashboard`
- [ ] Список участников отображает email, роль, кол-во QR, дату входа
- [ ] Смена роли через dropdown → мгновенно обновляется без перезагрузки
- [ ] Нельзя изменить собственную роль (dropdown заменён на бейдж)
- [ ] Нельзя снять admin у единственного администратора (ошибка 422)
- [ ] Invite modal: email + роль → POST → участник появляется в списке
- [ ] 409 при повторном приглашении того же email
- [ ] Удаление: QR-коды переназначаются текущему admin
- [ ] Нельзя удалить единственного admin или самого себя (кнопка disabled)
 
---
 
## Эпик 12 — API v1 и ключи (Завершён 2026-04-13)
 
### Созданные файлы
| Файл | Тип | Описание |
|------|-----|----------|
| `server/services/api-key.service.ts` | Service | `list`, `create` (генерация `sqr_live_<64hex>`, SHA-256 в БД), `verify` (hash lookup + expiresAt), `touchLastUsed` (fire-and-forget), `delete` (owner check) |
| `server/api/integrations/api-keys/index.get.ts` | API | GET список ключей без раскрытия секрета |
| `server/api/integrations/api-keys/index.post.ts` | API | POST создать ключ; полный ключ в ответе единоразово |
| `server/api/integrations/api-keys/[id].delete.ts` | API | DELETE отозвать ключ |
| `server/api/v1/qr/index.get.ts` | API v1 | GET список QR с пагинацией, фильтрами, сортировкой |
| `server/api/v1/qr/index.post.ts` | API v1 | POST создать QR (snake_case поля) |
| `server/api/v1/qr/[id].get.ts` | API v1 | GET детали QR |
| `server/api/v1/qr/[id].put.ts` | API v1 | PUT обновить QR |
| `server/api/v1/qr/[id].delete.ts` | API v1 | DELETE удалить QR (204) |
| `server/api/v1/qr/[id]/stats.get.ts` | API v1 | GET статистика: totalScans, uniqueScans, recentScans[] (30 дней) |
| `app/pages/integrations/index.vue` | Page | Список ключей + create modal + one-time reveal + revoke confirm |
| `app/pages/api-docs/index.vue` | Page | Документация API: эндпоинты, параметры, cURL-примеры, коды ошибок |
| `app/components/shared/CodeBlock.vue` | Component | Блок кода с кнопкой копирования (hover) |
 
### Изменённые файлы
| Файл | Изменение |
|------|-----------|
| `server/middleware/auth.ts` | Bearer token support для `/api/v1/*`; записывает `apiKeyId` в контекст; `touchLastUsed` fire-and-forget |
| `server/middleware/rate-limit.ts` | Rate limit 100 req/min per `apiKeyId` для `/api/v1/*` |
| `server/db/schema/index.ts` | Добавлен `apiKeysRelations` (apiKeys → users) |
| `app/components/app/Sidebar.vue` | Добавлен пункт «Интеграции» (i-lucide-plug, `/integrations`) |
| `types/auth.ts` | Добавлен `apiKeyId?: string` в `H3EventContext` |
 
### Архитектура
 
#### Формат API-ключа
```
Полный ключ:  sqr_live_<64 hex chars>  (73 chars total)
keyPrefix DB: sqr_live                  (8 chars, для идентификации в UI)
keyHash DB:   SHA-256(fullKey)          (64 chars hex, timing-safe сравнение)
```
 
#### Аутентификация API-запросов
```
GET /api/v1/qr  →  auth.ts middleware
  ├─ Authorization: Bearer sqr_live_... присутствует?
  │    → apiKeyService.verify(key)
  │    → 401 если hash не найден или ключ истёк
  │    → event.context.user = key.user
  │    → event.context.apiKeyId = key.id
  │    → touchLastUsed() fire-and-forget
  └─ Нет Bearer → cookie auth как обычно
```
 
#### Rate Limiting API v1
```
rate-limit.ts (выполняется после auth.ts, т.к. a < r алфавитно):
  path starts /api/v1/ && apiKeyId присутствует
    → LRU bucket key = "v1:<apiKeyId>"
    → max 100 req / 60s
    → 429 + Retry-After: 60 при превышении
```
 
#### One-time key reveal
```
POST /api/integrations/api-keys
  → INSERT api_keys (hash stored, full key NOT stored)
  → response: { ...record, key: "sqr_live_..." }  ← единственный раз
  
UI: показывает modal с ключом + кнопка копирования
    После закрытия modal ключ недоступен
```
 
### API-эндпоинты
| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| GET | `/api/integrations/api-keys` | Session | Список ключей пользователя |
| POST | `/api/integrations/api-keys` | Session | Создать ключ |
| DELETE | `/api/integrations/api-keys/:id` | Session | Отозвать ключ |
| GET | `/api/v1/qr` | API Key / Session | Список QR |
| POST | `/api/v1/qr` | API Key / Session | Создать QR |
| GET | `/api/v1/qr/:id` | API Key / Session | Детали QR |
| PUT | `/api/v1/qr/:id` | API Key / Session | Обновить QR |
| DELETE | `/api/v1/qr/:id` | API Key / Session | Удалить QR (204) |
| GET | `/api/v1/qr/:id/stats` | API Key / Session | Статистика QR |
 
### Критерии приёмки
- [ ] `POST /api/integrations/api-keys` → возвращает полный ключ, последующие GET — только prefix
- [ ] `Authorization: Bearer sqr_live_<key>` → 200 на `/api/v1/qr`
- [ ] Неверный ключ → 401
- [ ] 101-й запрос в минуту → 429 + `Retry-After: 60`
- [ ] `lastUsedAt` обновляется после каждого запроса с API-ключом
- [ ] Страница `/integrations`: создание, one-time reveal, удаление ключа
- [ ] Страница `/api-docs`: отображает все эндпоинты с параметрами и примерами cURL
- [ ] Пункт «Интеграции» виден в сайдбаре для всех авторизованных пользователей

---

## Эпик 13 — Daily Aggregation (Завершён 2026-04-13, v0.10.0)

### Созданные файлы
| Файл | Тип | Описание |
|------|-----|----------|
| `server/db/schema/scan-daily-stats.ts` | Schema | Таблица `scan_daily_stats`: PK (date + qr_code_id), `total_scans`, `unique_scans`, `country_breakdown` / `device_breakdown` (jsonb), индексы |
| `server/db/migrations/0001_add_scan_daily_stats.sql` | Migration | DDL для `scan_daily_stats` |
| `server/services/aggregation.service.ts` | Service | `aggregateDay(date)`, `backfill(startDate)` — UPSERT агрегатов из `scan_events` |
| `server/plugins/cron.ts` | Plugin | `node-cron` `0 2 * * *` UTC, только production |

### Изменённые файлы
| Файл | Изменение |
|------|-----------|
| `server/db/schema/index.ts` | Экспорт + `scanDailyStatsRelations` |
| `server/services/analytics.service.ts` | `getScansTimeSeries`: для `week`/`month` и диапазона >90 дней — чтение из `scan_daily_stats` |
| `package.json` | `node-cron`, `@types/node-cron` |

### API-эндпоинты
Прямых публичных эндпоинтов нет — агрегация по cron и использование в `analytics.service`.

### Зависимости
- Эпики 5, 6 (scan_events, аналитика)

---

## Эпик 14 — i18n, Dark Mode, Sentry, E2E (Завершён 2026-04-13, v0.11.0)

### Созданные файлы
| Файл | Тип | Описание |
|------|-----|----------|
| `locales/ru.json`, `locales/en.json` | i18n | Ключи app.*, nav.*, common.*, auth.*, errors.*, analytics.* (полный набор) |
| `server/plugins/sentry.ts` | Plugin | `@sentry/node` из `runtimeConfig.sentryDsn` |
| `playwright.config.ts` | E2E | Chromium + mobile Chrome, trace on retry |
| `e2e/auth.spec.ts` | E2E | Редирект неавторизованного, форма входа, невалидный email |
| `e2e/qr-list.spec.ts` | E2E | Кнопки «Создать QR», «Массовое создание» |
| `e2e/analytics.spec.ts` | E2E | Страница аналитики, date range |

### Изменённые файлы
| Файл | Изменение |
|------|-----------|
| `app/components/app/UserMenu.vue` | Переключение языка через `useI18n().setLocale()` |
| `app/components/app/Header.vue` | Breadcrumb-лейблы: integrations, api-docs, bulk |
| `nuxt.config.ts` | Устранено дублирование ключа `css:` |
| `package.json` | `@sentry/node`, `@playwright/test`, скрипт `test:e2e` |

### API-эндпоинты
Без изменений по сравнению с предыдущими эпиками (инфраструктура качества).

---

## Эпик 15 — Forms UX Enhancement (Завершён 2026-04-15, v0.12.0)

Подробно: [epic-15-forms-ux.md](./epic-15-forms-ux.md), [CHANGELOG.md](../CHANGELOG.md) `[0.12.0]`.

### Созданные файлы
| Файл | Тип | Описание |
|------|-----|----------|
| `docs/splat-qr-ux-ui-review.md` | Docs | Снимок UX/UI v0.11.0 |
| `docs/planned-epics-15-18.md` | Docs | Дорожная карта EPIC 15–18 |
| `docs/epic-15-forms-ux.md` | Docs | Задачи и критерии EPIC 15 |
| `app/composables/useUnsavedChanges.ts` | Composable | Guard: `onBeforeRouteLeave` + `beforeunload` |
| `app/composables/useFormValidation.ts` | Composable | Zod + `errors`/`touched`, `setServerErrors` |
| `app/composables/useFormDraft.ts` | Composable | Черновик в `localStorage` с debounce |
| `app/components/shared/UnsavedChangesDialog.vue` | Component | Локализованный диалог выхода |
| `app/components/shared/DraftRestoredBanner.vue` | Component | Баннер восстановления черновика |
| `server/utils/zod-errors.ts` | Util | `zodToFieldErrors`, `validateBody` → 422 + `fieldErrors` |

### Изменённые файлы
| Файл | Изменение |
|------|-----------|
| `app/pages/qr/create.vue` | Unsaved guard, draft, локализация |
| `app/pages/qr/[id]/edit.vue` | Unsaved guard, skeleton при загрузке |
| `app/pages/settings/team.vue` | Ошибки полей invite с сервера |
| `app/pages/settings/domains.vue` | Тематические CSS-переменные, field errors |
| `i18n/locales/ru.json`, `en.json` | Секция `forms.*` |
| `server/api/team/invite.post.ts` | 422 через `validateBody` |
| `server/api/admin/domains/index.post.ts`, `[id].patch.ts` | 422 через `validateBody` |

### API-эндпоинты
| Метод | URL | Изменение |
|-------|-----|-----------|
| POST | `/api/team/invite` | При ошибке валидации — 422 + `data.fieldErrors` |
| POST | `/api/admin/domains` | То же |
| PATCH | `/api/admin/domains/:id` | То же |

### Зависимости
- Эпик 14 (i18n), формы QR (Эпик 4)

---

## Эпик 20 — UX/UI Enhancement Pack (Done with notes, Unreleased v0.13.0)

Подробно: [epic-20-ux-analytics-cards.md](./epic-20-ux-analytics-cards.md), [CHANGELOG.md](../CHANGELOG.md) `[Unreleased]`.

### Файлы (основной объём)
| Группа | Файлы |
|---|---|
| Analytics API | `server/api/analytics/geo.get.ts`, `devices.get.ts`, `time-distribution.get.ts` |
| Analytics UI | `app/components/analytics/GeoMap.vue`, `GeoTable.vue`, `DevicePieChart.vue`, `DeviceBreakdown.vue`, `HourlyChart.vue`, `WeekdayChart.vue`, `ScanChart.vue` |
| QR Cards | `app/components/qr/Card.vue`, `Table.vue`, `QuickActions.vue`, `HoverPreview.vue` |
| Empty states | `app/components/shared/EmptyState.vue`, `EmptyIllustration.vue`, `public/illustrations/*.svg`, `app/pages/not-found.vue`, `app/pages/expired.vue` |
| Onboarding | `app/components/shared/OnboardingOverlay.vue`, `app/composables/useOnboarding.ts`, `app/pages/dashboard/index.vue` |
| Shared data layer | `server/services/analytics.service.ts`, `app/composables/useAnalytics.ts`, `app/pages/analytics/index.vue`, `locales/ru.json`, `locales/en.json` |

### API
| Метод | URL | Назначение |
|---|---|---|
| GET | `/api/analytics/geo` | Гео-разбивка country/city для карты и таблицы |
| GET | `/api/analytics/devices` | Разбивка по device type / OS / browser |
| GET | `/api/analytics/time-distribution` | Разбивка по часу и дню недели |

### Компоненты
- **Analytics:** `GeoMap`, `GeoTable`, `DeviceBreakdown`, `HourlyChart`, `WeekdayChart`, обновлённый `ScanChart` с compare previous period.
- **QR List:** `QuickActions`, `HoverPreview`, обновлённые `Card` и `Table`.
- **Shared UX:** `EmptyIllustration`, расширенный `EmptyState`, `OnboardingOverlay`.

### Критерии приёмки (итог)
- ✅ Закрыт блок **analytics**: geo/devices/time distribution + compare previous period.
- ✅ Закрыт блок **cards**: enriched cards + inline actions + hover-preview.
- ✅ Закрыт блок **empty states**: SVG-иллюстрации + интеграция в пустые/error-экраны.
- ✅ Закрыт блок **onboarding**: first-run overlay, skip/complete, повторный вход без показа, ru/en.
- ℹ️ **Usage Widget (20.8)** оставлен за рамками релизного объёма EPIC 20 и вынесен в следующий UX-пакет.

---

## EPIC 17 (phase 1) — Accessibility baseline (в процессе)

### Реализовано в phase 1
- `app/composables/useA11yAnnouncer.ts`, `app/composables/useA11yToast.ts` — озвучивание toast-сообщений через `aria-live`.
- `app/app.vue` — добавлен screen-reader регион `role="status"` / `aria-live`.
- `assets/css/main.css` — добавлены глобальные `:focus-visible` стили.
- `app/components/qr/Table.vue`, `app/components/analitics/TopQrTable.vue` — улучшена семантика таблиц (`role="table"`, `scope="col"`), aria-label у интерактивных элементов.
- `app/components/qr/StatusBadge.vue` — статус QR теперь содержит иконку + текст; канонический маппинг иконок: `active → i-lucide-circle-check`, `paused → i-lucide-pause-circle`, `archived → i-lucide-archive`, `expired → i-lucide-clock-3`.
- `app/components/shared/ConfirmDialog.vue`, `app/components/shared/unsavedChangesDialog.vue` — `Esc` закрытие и восстановление фокуса.
- `e2e/a11y.spec.ts` + `@axe-core/playwright` — базовый a11y smoke в e2e.

### Статус
- EPIC 17 переведён в `In Progress`.
- Завершён первый технический срез (phase 1); оставшиеся пункты закрываются в последующих итерациях EPIC 17.

### Известные ограничения
- EPIC 18–21 описаны в отдельных `docs/epic-*.md`; сводный план — [planned-epics-15-18.md](./planned-epics-15-18.md), [splat-qr-cursor-plan.md](./splat-qr-cursor-plan.md). **EPIC 21** (security) — блокер production по спецификации.

---

## Hotfix — Folder delete hierarchy re-link (2026-04-20)

### Бизнес-логика удаления папки
- Перед удалением папки её прямые дочерние папки **переназначаются на родителя удаляемой папки**.
- То есть при удалении `folder(id=X, parentId=P)` выполняется обновление для всех `parentId = X` → `parentId = P`.
- После этого выполняется стандартное удаление папки и отвязка QR-кодов (`folderId = NULL`).

### Зачем так сделано
- Сохраняется структура дерева без «потери» вложенных папок.
- Поведение единообразно и предсказуемо для пользователя: удаляется только выбранный узел, а его дети поднимаются на уровень выше.
