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
| `app/composables/useAuth.ts` | Composable | login, verify, logout, fetchUser, user, isAuthenticated |
| `app/middleware/auth.global.ts` | Middleware | Client redirect: unauth→login, auth→dashboard |
| `app/layouts/auth.vue` | Layout | Centered card + SPLAT logo |
| `app/pages/auth/login.vue` | Page | Email input, validation, toast errors |
| `app/pages/auth/verify.vue` | Page | PinInput 6 digits, timer 10min, resend 60s |
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
