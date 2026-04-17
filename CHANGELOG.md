# Changelog
 
Все значимые изменения в проекте документируются в этом файле.
Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/).
 
---
 
## [Unreleased]

---

## [0.12.1] — 2026-04-17

### Changed — EPIC 16 documentation sync

- **`docs/epic-16-interactive-shell.md`** — документ приведён в соответствие с фактической реализацией (`settings.vue` как layout, `settings/index.vue` как redirect, уточнение scope settings-search, выравнивание списков файлов).
- **`docs/epic-17-accessibility.md`** — статус переведён в `In Progress`, добавлен блок старта работ и чек-лист первой итерации.
- **`docs/review/epic-16-17-docs-review.md`** — добавлен итоговый review по выполненной документационной работе.
- **`README.md`** — обновлена версия и раздел документации (добавлены ссылки на EPIC 16, EPIC 17 и review).
- **`package.json`** — версия проекта обновлена до `0.12.1`.

---

## [0.12.0] — 2026-04-15

### Added — EPIC 15: Forms UX Enhancement

По дорожной карте [planned-epics-15-18.md](./docs/planned-epics-15-18.md) (итерация 1); детали — [epic-15-forms-ux.md](./docs/epic-15-forms-ux.md).

- **`docs/splat-qr-ux-ui-review.md`** — снимок UX/UI состояния v0.11.0 с каталогом проблем
- **`docs/planned-epics-15-18.md`** — дорожная карта двух итераций (EPIC 15–18)
- **`docs/epic-15-forms-ux.md`** — детализация EPIC 15: задачи, файлы, критерии приёмки
- **`app/composables/useUnsavedChanges.ts`** — guard для навигации при «грязной» форме (router + beforeunload)
- **`app/composables/useFormValidation.ts`** — единый Zod-валидатор с reactive `errors`/`touched`, поддержкой server errors
- **`app/composables/useFormDraft.ts`** — автосохранение черновика в `localStorage` с debounce
- **`app/components/shared/UnsavedChangesDialog.vue`** — локализованный диалог подтверждения выхода
- **`app/components/shared/DraftRestoredBanner.vue`** — баннер «Восстановлен черновик»
- **`server/utils/zod-errors.ts`** — общий хелпер 422 + `fieldErrors` из `ZodError`

### Changed

- **`app/pages/qr/create.vue`** — подключены unsaved-guard, draft autosave, локализация строк
- **`app/pages/qr/[id]/edit.vue`** — unsaved-guard, полноформатный skeleton при загрузке
- **`app/pages/settings/team.vue`** — рендеринг server field errors для invite-формы
- **`app/pages/settings/domains.vue`** — CSS-переменные вместо `gray-*`, server field errors
- **`i18n/locales/ru.json`, `i18n/locales/en.json`** — секция `forms.*` (errors, hints, unsaved, draft, actions)
- **`server/api/team/invite.post.ts`**, **`server/api/admin/domains/*.ts`** — 422 + field map через `validateBody()`

### Примечание

EPIC 16 (Interactive Shell & Settings Redesign) запланирован в той же итерации 1 — см. `docs/planned-epics-15-18.md`; отдельный релиз при появлении готового объёма.

---

## [0.11.0] — 2026-04-13
 
### Added — Эпик 14: i18n, Dark Mode, Sentry, E2E
 
#### i18n
- **`locales/ru.json`** — полный набор ключей (app.*, nav.*, common.*, auth.*, errors.*, analytics.*)
- **`locales/en.json`** — английский перевод всех ключей
- **`app/components/app/UserMenu.vue`** — добавлен пункт переключения языка через `useI18n().setLocale()`
 
#### Polish
- **`app/components/app/Header.vue`** — добавлены breadcrumb-лейблы: `integrations`, `api-docs`, `bulk`
- **`nuxt.config.ts`** — исправлен дублированный ключ `css:`
 
#### Sentry
- **`server/plugins/sentry.ts`** — инициализация `@sentry/node` из `runtimeConfig.sentryDsn`; активируется только при наличии DSN
 
#### E2E тесты
- **`playwright.config.ts`** — конфигурация Playwright: Chromium + mobile Chrome, trace on retry
- **`e2e/auth.spec.ts`** — проверка редиректа неавторизованного пользователя, рендер формы входа, ошибка невалидного email
- **`e2e/qr-list.spec.ts`** — наличие кнопок «Создать QR» и «Массовое создание»
- **`e2e/analytics.spec.ts`** — рендер страницы аналитики с заголовком и date range selector
 
### Changed — Эпик 14
- **`package.json`** — добавлены `@sentry/node ^8`, `@playwright/test ^1.48`; скрипт `test:e2e`
 
---
 
## [0.10.0] — 2026-04-13
 
### Added — Эпик 13: Daily Aggregation
 
#### Схема и миграция
- **`server/db/schema/scan-daily-stats.ts`** — таблица `scan_daily_stats`: составной PK (date + qr_code_id), `total_scans`, `unique_scans`, `country_breakdown` (jsonb), `device_breakdown` (jsonb); 2 индекса
- **`server/db/migrations/0001_add_scan_daily_stats.sql`** — DDL миграция для новой таблицы
- **`server/db/schema/index.ts`** — экспорт + `scanDailyStatsRelations`
 
#### Агрегация
- **`server/services/aggregation.service.ts`** — `aggregateDay(date)`: UPSERT за сутки (COUNT + JSONB breakdown по стране и устройству); `backfill(startDate)`: последовательная агрегация от startDate до вчера
 
#### Cron
- **`server/plugins/cron.ts`** — `node-cron` schedule `0 2 * * *` UTC; запускается только в production; логирует успех/ошибку
 
#### Аналитика
- **`server/services/analytics.service.ts`** — `getScansTimeSeries`: для гранулярности `week`/`month` (>90 дней) читает `scan_daily_stats` вместо `scan_events`
 
### Changed — Эпик 13
- **`package.json`** — добавлены `node-cron ^3`, `@types/node-cron ^3`
 
---
 
## [0.9.0] — 2026-04-13
 
### Added — Эпик 12: API v1 и ключи
 
#### API-ключи
- **`server/services/api-key.service.ts`** — `list` (без раскрытия секрета), `create` (генерация `sqr_live_<64hex>`, SHA-256 hash в БД, ключ в ответе единоразово), `verify` (поиск по hash + проверка expiresAt), `touchLastUsed` (fire-and-forget), `delete` (только владелец)
- **`GET /api/integrations/api-keys`** — список ключей текущего пользователя
- **`POST /api/integrations/api-keys`** — создать ключ (name); возвращает полный ключ **один раз**
- **`DELETE /api/integrations/api-keys/:id`** — отозвать ключ
 
#### REST API v1
- **`GET /api/v1/qr`** — список QR с пагинацией, фильтрами и сортировкой
- **`POST /api/v1/qr`** — создать QR (snake_case поля: `destination_url`, `utm_*`, `folder_id`, `tag_ids`)
- **`GET /api/v1/qr/:id`** — детали QR
- **`PUT /api/v1/qr/:id`** — обновить поля QR
- **`DELETE /api/v1/qr/:id`** — удалить QR (204 No Content)
- **`GET /api/v1/qr/:id/stats`** — статистика за 30 дней: `totalScans`, `uniqueScans`, `recentScans[]`
 
#### UI
- **`app/pages/integrations/index.vue`** — управление API-ключами: список с keyPrefix + дата использования; модальное окно создания; one-time reveal с копированием; диалог отзыва
- **`app/pages/api-docs/index.vue`** — интерактивная документация API: все эндпоинты с параметрами и примерами cURL; таблица кодов ошибок
- **`app/components/shared/CodeBlock.vue`** — блок кода с кнопкой копирования (hover)
 
### Changed — Эпик 12
- **`server/middleware/auth.ts`** — добавлена поддержка `Authorization: Bearer sqr_live_...` для маршрутов `/api/v1/*`; при успехе записывает `event.context.apiKeyId` и обновляет `lastUsedAt`
- **`server/middleware/rate-limit.ts`** — добавлен rate limit 100 req/min per API key для `/api/v1/*` (по `event.context.apiKeyId`)
- **`server/db/schema/index.ts`** — добавлен `apiKeysRelations` (apiKeys → users) для relational queries
- **`app/components/app/Sidebar.vue`** — добавлен пункт «Интеграции» (i-lucide-plug, `/integrations`)
- **`types/auth.ts`** — добавлен `apiKeyId?: string` в `H3EventContext`
 
---
 
## [0.8.0] — 2026-04-13
 
### Added — Эпик 11: Управление командой
- **`server/services/team.service.ts`** — `list` (все пользователи с количеством QR через подзапрос),
  `invite` (создание пользователя с заданной ролью, 409 при дубликате),
  `updateRole` (смена роли, защита последнего администратора, запрет изменения своей роли),
  `remove` (переназначает QR-коды текущему admin, удаляет сессии, защита последнего admin и self-delete)
- **`GET /api/team`** — список участников с qrCount (admin only)
- **`POST /api/team/invite`** — создание пользователя + отправка welcome-email; Zod-валидация email и role
- **`PUT /api/team/:id`** — смена роли пользователя; guard против снятия последнего admin
- **`DELETE /api/team/:id`** — удаление пользователя с переназначением QR-кодов
- **`app/pages/settings/team.vue`** — страница управления командой:
  список участников с аватаром, email, именем, кол-вом QR, датой последнего входа;
  inline USelect для смены роли; кнопка удаления с диалогом подтверждения;
  UModal «Пригласить участника» с полями email + роль
 
### Changed — Эпик 11
- **`server/services/email.service.ts`** — добавлен `sendInviteEmail` (HTML-шаблон с кнопкой входа)
- **`app/pages/settings/index.vue`** — добавлена кнопка «Команда» (i-lucide-users, `/settings/team`)
 
---
 
## [0.7.0] — 2026-04-13
 
### Added — Эпик 10: Массовое создание QR из CSV
- **`server/services/bulk.service.ts`** — `validateRows` (проверка title + URL, преобразование snake_case → camelCase),
  `bulkCreate` (разрешение папок/тегов по имени с created-on-demand, генерация shortCode × 3 попытки,
  вставка `qrCodes` + `qrTags`), `generateTemplate` (CSV с заголовками и примером строки)
- **`POST /api/qr/bulk`** — принимает `{ rows }` JSON (max 500), Zod-валидация каждой строки,
  возвращает `{ created, failed, total, errors }`
- **`app/pages/qr/bulk.vue`** — 5-шаговый мастер загрузки CSV:
  - **Шаг 1 «Загрузка»** — drag-and-drop зона + file input, кнопка скачивания шаблона CSV
  - **Шаг 2 «Предпросмотр»** — таблица первых 5 строк, список обнаруженных заголовков
  - **Шаг 3 «Валидация»** — ✅/❌ по каждой строке, сообщения об ошибках
  - **Шаг 4 «Подтверждение»** — итоговые карточки (будет создано N / всего M / пропустить K)
  - **Шаг 5 «Результат»** — счётчик созданных, таблица ошибок (первые 20)
  - Клиентский CSV-парсинг через `papaparse` (dynamic import для исключения SSR-проблем)
 
### Changed — Эпик 10
- **`app/pages/qr/index.vue`** — добавлена кнопка «Массовое создание» (ссылка на `/qr/bulk`) рядом с «Создать QR»
 
---
 
## [0.6.0] — 2026-04-13
 
### Added — Эпик 9: A/B-тестирование ссылок
- **`server/services/destination.service.ts`** — CRUD вариантов: list, create (лимит 10 на QR),
  update (url/label/weight/isActive), delete; инвалидация LRU-кэша после каждой операции
- **`GET /api/qr/:id/destinations`** — список вариантов с clicks
- **`POST /api/qr/:id/destinations`** — добавить вариант (url, weight 1–100, label?)
- **`PUT /api/qr/:id/destinations/:destId`** — обновить поля варианта
- **`DELETE /api/qr/:id/destinations/:destId`** — удалить вариант
- **`app/components/qr/AbTestConfig.vue`** — интерактивный конфигуратор: список вариантов
  (URL + метка + range-slider веса), stacked traffic bar с цветовой легендой, валидация
  суммы весов = 100%, лимит 10 вариантов, toggle активности, кнопка удаления
 
### Changed — Эпик 9
- **`app/pages/qr/[id]/edit.vue`** — добавлена секция «A/B-тестирование» с `QrAbTestConfig`;
  при сохранении вызывается `abConfigRef.saveToServer()` для синхронизации вариантов
- **`app/pages/qr/[id]/index.vue`** — таблица вариантов с traffic bar, клики и % от суммы;
  placeholder аналитики заменён на `AnalyticsScanChart` с реальными данными за 30 дней
 
---
 
## [0.5.0] — 2026-04-13
 
### Added — Эпик 7: Папки и теги
- **`server/services/folder.service.ts`** — CRUD папок: list (с count QR через LEFT JOIN),
  getById, create, update, delete (перемещает QR в корень при удалении); role-based доступ
- **`server/services/tag.service.ts`** — list (с count QR), create (409 при дубликате,
  case-insensitive `ilike`)
- **REST API папок** (`/api/folders` GET/POST, `/api/folders/:id` GET/PUT/DELETE) — Zod-валидация,
  `requireAuth`
- **REST API тегов** (`/api/tags` GET/POST) — глобальный список, доступен всем
  авторизованным пользователям
- **`app/composables/useFolders.ts`** — реактивный composable с `fetchFolders`,
  `createFolder`, `updateFolder`, `deleteFolder`
- **`app/components/folders/FolderDialog.vue`** — UModal: поле имени, color picker
  (7 presets + `<input type="color">`), опциональный выбор родительской папки
- **`app/pages/folders/index.vue`** — grid карточек: цветная полоска-акцент, иконка,
  count QR, inline кнопки edit/delete; empty state; подтверждение удаления
- **`app/pages/folders/[id].vue`** — список QR-кодов в папке через `QrTable`,
  пагинация, создание QR через `/qr/create?folderId=:id`
 
### Changed — Эпик 7
- **`app/pages/qr/index.vue`** — folder filter теперь загружает реальный список из
  `/api/folders` (было: статический placeholder)
- **`app/pages/qr/create.vue`** — добавлены Folder selector и `SharedTagInput`;
  параметр `?folderId=` предзаполняет поле; теги создаются на лету через API
- **`app/pages/qr/[id]/edit.vue`** — folder + tags prefill из существующего QR;
  сохранение передаёт `folderId` и `tagIds` в `updateQr`
 
---
 
## [0.4.0] — 2026-04-13
 
### Added — Эпик 6: Базовый аналитический дашборд
- **`server/services/analytics.service.ts`** — сервис агрегации: `getOverview`,
  `getScansTimeSeries` (авто-гранулярность hour/day/week/month), `getTopQrCodes`,
  `getQrAnalytics`; сырой SQL с `COUNT(*) FILTER (WHERE ...)` и `DATE_TRUNC`
- **API `/api/analytics/overview`** — обзорные метрики с % изменением vs предыдущий период
- **API `/api/analytics/scans`** — временной ряд сканирований; опциональный фильтр `qrCodeId`
- **API `/api/analytics/top-qr`** — топ 10 QR-кодов по количеству сканирований
- **API `/api/qr/[id]/analytics`** — детальная аналитика конкретного QR (проверка доступа)
- **`app/composables/useAnalytics.ts`** — реактивный composable; `fetchAll(range)` с
  параллельными запросами через `Promise.all`
- **`app/components/analytics/StatCard.vue`** — карточка метрики: скелетон, иконка,
  значение (toLocaleString), % изменение с trending-иконкой
- **`app/components/analytics/ScanChart.vue`** — линейный график (vue-echarts):
  «Все сканирования» (сплошная) + «Уникальные» (штриховая), скелетон и empty state
- **`app/components/analytics/DateRangePicker.vue`** — выбор периода: пресеты
  (Сегодня / 7д / 30д / 90д / Год) + custom date-inputs
- **`app/components/analytics/TopQrTable.vue`** — таблица топ QR: ссылка, shortCode,
  всего / уникальных сканирований; скелетон и empty state
 
### Changed — Эпик 6
- **`app/pages/dashboard/index.vue`** — заменён placeholder на реальные StatCard,
  ScanChart, TopQrTable; добавлен DateRangePicker; данные из `useAnalytics`
- **`app/pages/analytics/index.vue`** — полная страница аналитики вместо
  placeholder-заглушки
 
---
 
## [0.3.0] — 2026-04-13
 
### Added — Эпик 5: Redirect и сбор аналитики
- **`/r/[code]`** — redirect-обработчик с LRU-кэшем (TTL 5 мин, max 10 000 записей);
  поддержка A/B-тестирования, UTM-параметров, проверка статуса и срока действия
- **`server/utils/qr-cache.ts`** — LRU-кэш QR-кодов; `invalidateQrCache()` вызывается
  при update/delete через `qr.service.ts`
- **`server/services/geo.service.ts`** — обёртка над geoip-lite, graceful null при
  localhost/private IP
- **`server/services/ab-test.service.ts`** — взвешенный случайный выбор destination
  для A/B-тестов
- **`server/services/redirect.service.ts`** — запись `scan_events` (UA-парсинг,
  GeoIP, isUnique по IP за сутки, инкремент `uniqueScans` и `destination.clicks`)
- **`server/services/export.service.ts`** — генерация QR в форматах SVG, PNG (через
  sharp), PDF (через pdfkit); полный серверный рендерер SVG без зависимости от app/
- **`GET /api/qr/:id/export`** — скачивание QR в выбранном формате; query: `format`
  (svg|png|pdf), `size` (px, для PNG)
- **`app/pages/not-found.vue`** — брендированная страница «QR-код не найден»
  (layout: false)
- **`app/pages/expired.vue`** — брендированная страница «Срок действия истёк»
  (layout: false)
 
---
 
## [0.2.0] — 2026-04-13
 
### Fixed
- **Стили**: подключён `assets/css/main.css` в `nuxt.config.ts` — исправлено
  отсутствие Tailwind CSS и Nuxt UI на страницах авторизации
- **Тема Tailwind / Nuxt UI**: в `assets/css/main.css` в блоке `@theme` заданы
  `--color-primary` и шкала `--color-primary-50`…`950` как ссылки на палитру
  `splat`. Утилиты вида `text-primary`, `bg-primary`, `ring-primary/50` и
  вариант `color="primary"` больше не используют зелёный primary по умолчанию
  из темы Tailwind
- **app.config.ts**: тема Nuxt UI `ui.colors` — `primary: 'splat'`, `neutral: 'neutral'`;
  секция `brand` с корпоративными hex-цветами
- **Dockerfile**: исправлено использование `npm ci` вместо `pnpm install` (проект
  использует `package-lock.json`); выровнен порт приложения (3000); добавлен
  stage `migrator` для запуска миграций в Docker
 
### Added
- **Единый экран входа** (`app/pages/auth/login.vue`): email и OTP на одной
  странице; `verify.vue` оставлен как redirect для совместимости
- **Глобальная оболочка Nuxt UI**: корневое приложение в `UApp` (`app/app.vue`)
- **Страницы ошибок и заглушек**: `app/error.vue` (брендированный 404 и общие
  ошибки), `app/pages/analytics/index.vue`
- **Логика допустимых доменов**: если список пуст — разрешены все домены
  (открытый режим); как только администратор добавляет хотя бы один активный
  домен — включается режим белого списка
- **API управления доменами** (`/api/admin/domains`): CRUD-эндпоинты
  только для администраторов (GET, POST, PATCH, DELETE)
- **Страница настроек** (`/settings`): обзор разделов настроек с учётом роли
- **Страница управления доменами** (`/settings/domains`): UI для
  добавления/отключения/удаления email-доменов в белый список
- **Docker migrate-сервис**: `docker compose up` автоматически выполняет
  миграции перед запуском приложения (`service_completed_successfully`)
- **`server/db/migrate.ts`**: standalone-скрипт миграций через `drizzle-orm/migrator`
  (не требует drizzle-kit в production)
 
### Changed
- **`docker-compose.yml`**: убран `profiles: ["app"]` — приложение запускается
  по умолчанию; добавлен сервис `migrate`; выровнены порты; `app` зависит от
  `migrate`
- **Клиентская авторизация**: `useAuth` передаёт cookie при SSR-запросе к
  `/api/auth/me`; middleware и навигация согласованы с новыми маршрутами
- **README.md** и **CHANGELOG.md**: актуализированы разделы про тему, хотфиксы
  и историю изменений
 
---
 
## [0.1.0] — 2026-04-11
 
### Added
- Эпик 1: Инфраструктура — Nuxt 3, PostgreSQL 16, Docker, 11 таблиц БД, seed-данные
- Эпик 2: Аутентификация — Email OTP, rate limiting, SHA-256 хеширование токенов, сессии 30 дней
- Эпик 3: Layout — sidebar (collapse 240/64px), header с breadcrumbs, мобильная навигация
- Эпик 4: CRUD QR-кодов — 11 API-эндпоинтов, SVG-рендеринг (5 стилей модулей × 4 стиля углов)