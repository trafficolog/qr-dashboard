# SPLAT QR Service — Отчёт о реализации (Эпики 1–4)

> **Дата:** 2026-04-07
> **Фаза:** 1 (MVP) — частично завершена
> **Файлов в проекте:** 90
> **Статус:** Реализованы Эпики 1–4 (инфраструктура, аутентификация, layout, CRUD QR-кодов)

---

## 1. Обзор реализованного

### 1.1 Покрытие задач

| Эпик | Название | Статус | Задачи |
|------|----------|--------|--------|
| 1 | Инфраструктура и настройка | ✅ Завершён | 1.1–1.5 все выполнены |
| 2 | Аутентификация (OTP) | ✅ Завершён | 2.1–2.5 все выполнены |
| 3 | Layout и навигация | ✅ Завершён | 3.1 полностью |
| 4 | CRUD QR-кодов | ✅ Завершён | 4.1–4.5 все выполнены |
| 5 | Redirect и аналитика | ⏳ Не начат | — |
| 6 | Аналитика (базовая) | ⏳ Не начат | — |

### 1.2 Технологический стек (фактический)

| Компонент | Технология | Версия |
|-----------|-----------|--------|
| Framework | Nuxt 3 | ^3.16.0 |
| UI Kit | Nuxt UI v3 | ^3.0.0 |
| ORM | Drizzle ORM | ^0.38.0 |
| Database | PostgreSQL | 16-alpine |
| Language | TypeScript (strict) | ^5.7.0 |
| Package Manager | pnpm | 9.15.0 |
| Icons | @nuxt/icon (Lucide) | ^1.10.0 |
| i18n | @nuxtjs/i18n | ^9.0.0 |
| State | Pinia + useState | ^2.3.0 |
| Utilities | @vueuse/nuxt | ^12.0.0 |
| Charts | ECharts + vue-echarts | ^5.5.0 / ^7.0.0 |
| Email | nodemailer | ^6.9.0 |
| QR Generation | qrcode | ^1.5.0 |
| Image Processing | sharp | ^0.33.0 |
| PDF | pdfkit | ^0.16.0 |
| GeoIP | geoip-lite | ^1.4.0 |
| User-Agent | ua-parser-js | ^1.0.0 |
| Rate Limiting | lru-cache | ^11.0.0 |
| Short IDs | nanoid | ^5.0.0 |

---

## 2. Эпик 1: Инфраструктура и настройка проекта

### 2.1 Задача 1.1 — Инициализация Nuxt 3

**Файлы:**

| Файл | Назначение |
|------|-----------|
| `package.json` | 20 dependencies, 16 devDependencies, 10 npm-скриптов |
| `nuxt.config.ts` | SSR mode, 5 модулей, runtimeConfig (9 server + 2 public) |
| `app.config.ts` | Nuxt UI colors (primary: green, neutral: slate), SPLAT brand |
| `tsconfig.json` | strict: true, noUncheckedIndexedAccess, forceConsistentCasingInFileNames |
| `assets/css/main.css` | Tailwind v4 imports, 4 кастомных CSS-переменных бренда |
| `.env.example` | 15 переменных окружения |
| `eslint.config.mjs` | Nuxt flat config с tooling + stylistic |
| `.prettierrc` | semi: false, singleQuote: true, tabWidth: 2 |
| `.gitignore` | .output, .nuxt, node_modules, .env, data/ |

**Модули Nuxt:**
- `@nuxt/ui` — компоненты UI (Reka UI + Tailwind v4)
- `@nuxt/icon` — Iconify иконки (Lucide set)
- `@nuxtjs/i18n` — ru/en с lazy loading
- `@pinia/nuxt` — глобальный state
- `@vueuse/nuxt` — утилиты (useMagicKeys, useClipboard, refDebounced)

**Локализация:** `locales/ru.json` (30+ ключей), `locales/en.json` (30+ ключей)

### 2.2 Задача 1.2 — PostgreSQL + Drizzle ORM

**Файлы:** `drizzle.config.ts`, `server/db/index.ts`, 11 файлов схемы, `server/db/schema/index.ts`, `server/plugins/db.ts`

**Схема базы данных — 11 таблиц:**

| Таблица | Поля | FK | Индексы | Особенности |
|---------|------|----|---------|-------------|
| `users` | 8 | — | email (unique) | Enum `user_role` (admin/editor/viewer) |
| `sessions` | 7 | userId → users (CASCADE) | token (unique) | SHA-256 hash token |
| `otp_codes` | 7 | — | — | TTL 10 мин, max 5 attempts |
| `folders` | 6 | parentId (self-ref), createdBy → users | — | Вложенная иерархия |
| `qr_codes` | 16 | folderId → folders (SET NULL), createdBy → users | 5 индексов | Enums status/type, JSONB style/utm |
| `qr_destinations` | 8 | qrCodeId → qr_codes (CASCADE) | — | A/B testing weights |
| `scan_events` | 16 | qrCodeId → qr_codes (CASCADE), destinationId → qr_destinations | 4 индекса (incl. composite) | Geo, device, isUnique |
| `tags` | 4 | — | name (unique) | — |
| `qr_tags` | 2 | qrCodeId, tagId (CASCADE) | composite PK | M2M junction |
| `allowed_domains` | 4 | — | domain (unique) | isActive toggle |
| `api_keys` | 7 | userId → users (CASCADE) | — | SHA-256 keyHash, prefix 8 chars |

**Relations (Drizzle relational queries):** 8 relation definitions covering all FK relationships + self-referencing folders.

**Connection pool:** `pg.Pool` max 20 connections, idle timeout 30s.

**Nitro plugin:** Проверка подключения `SELECT 1` при старте сервера.

### 2.3 Задача 1.3 — Docker

**Файлы:** `docker-compose.yml`, `Dockerfile`, `.dockerignore`

- **docker-compose:** 2 сервиса (app + postgres:16-alpine), healthcheck, 3 volumes (pgdata, uploads, geoip)
- **Dockerfile:** Multi-stage (base → deps → build → production), node:20-alpine + pnpm, финальный образ только `.output` + `data`

### 2.4 Задача 1.4 — Seed Data

**Файл:** `server/db/seed.ts`

**Данные:**
- 1 разрешённый домен (`splat.com`)
- 1 admin-пользователь (`admin@splat.com`)
- 3 папки: Упаковка (#4CAF50), Рекламные материалы (#2196F3), Мероприятия (#FF9800)
- 6 тегов: paste, rinse, brush, promo, event, packaging — каждый с цветом
- 10 QR-кодов с разными стилями:
  - 5 разных moduleStyle (square, rounded, dots, classy, classy-rounded)
  - 4 разных cornerStyle
  - 6 active, 1 paused, 1 expired, 2 active с особыми стилями
  - Разные папки и теги
- 400 scan events за 30 дней:
  - Geo: RU 60%, KZ 15%, BY 10%, UA 15% с конкретными городами
  - Devices: mobile 60%, desktop 30%, tablet 10%
  - Browsers: Chrome 50%, Safari 25%, Firefox 10%, Samsung Internet 10%, Edge 5%
  - OS: Android 40%, iOS 25%, Windows 20%, macOS 10%, Linux 5%
  - Временное распределение: пик 10:00–18:00
  - ~70% уникальных сканов

**Идемпотентность:** Проверка `COUNT(*) FROM users WHERE email = 'admin@splat.com'` перед вставкой.

### 2.5 Задача 1.5 — Серверные утилиты

**Файлы:** 5 файлов в `server/utils/`

| Утилита | Файл | Функции |
|---------|------|---------|
| nanoid | `nanoid.ts` | `generateShortCode()` — 7 символов, алфавит без ambiguous (0/O, 1/l/I) |
| hash | `hash.ts` | `hashToken()` (SHA-256), `hashOtp()`, `compareHash()` (timing-safe) |
| ip | `ip.ts` | `getClientIp()` — X-Forwarded-For → X-Real-IP → remoteAddress |
| response | `response.ts` | `apiSuccess<T>(data, meta?)`, `apiError(message, statusCode)` |
| auth | `auth.ts` | `requireAuth(event)`, `requireAdmin(event)` — хелперы для handlers |

---

## 3. Эпик 2: Аутентификация (Email OTP)

### 3.1 Задача 2.1 — Auth Service

**Файл:** `server/services/auth.service.ts`

**Функции:**

| Функция | Логика | Ошибки |
|---------|--------|--------|
| `sendOtp(email)` | Проверка домена → rate limit (5/15 мин) → crypto.randomInt 6 цифр → INSERT otp_codes → emailService.sendOtpEmail | 403 домен, 429 rate limit |
| `verifyOtp(email, code)` | Поиск последнего активного OTP → attempts check → сравнение → пометка usedAt → upsert user → создание сессии | 400 код, 429 attempts |
| `verifySession(token)` | SHA-256 hash → поиск по hash + expiresAt > now → авто-продление если < 7 дней до expiry | null если не найден |
| `logout(token)` | SHA-256 hash → DELETE sessions | — |

**Безопасность:**
- OTP plaintext в БД (TTL 10 мин, одноразовый)
- Session token: `crypto.randomBytes(32).toString('hex')` → SHA-256 hash в БД
- Первый пользователь автоматически `admin`, последующие `editor`
- Session TTL: 30 дней, авто-продление при активности

### 3.2 Задача 2.2 — Email Service

**Файл:** `server/services/email.service.ts`

- Абстракция `EmailProvider` с двумя реализациями:
  - `SmtpProvider` — nodemailer транспорт
  - `ConsoleProvider` — вывод в console (dev mode)
- Автоматический выбор по наличию `SMTP_HOST` в env
- HTML-шаблон письма с брендингом SPLAT (зелёный код, моноширинный шрифт, 10-мин предупреждение)
- Graceful error handling — 500 с понятным сообщением

### 3.3 Задача 2.3 — API-эндпоинты

| Эндпоинт | Файл | Zod-валидация | Cookie |
|----------|------|---------------|--------|
| `POST /api/auth/login` | `login.post.ts` | `{ email: z.string().email() }` | — |
| `POST /api/auth/verify` | `verify.post.ts` | `{ email, code: z.string().length(6) }` | SET session_token (httpOnly, secure, sameSite:lax, 30d) |
| `POST /api/auth/logout` | `logout.post.ts` | — | DELETE session_token |
| `GET /api/auth/me` | `me.get.ts` | — | READ session_token → user |

### 3.4 Задача 2.4 — Server Middleware

| Middleware | Файл | Логика |
|-----------|------|--------|
| auth | `server/middleware/auth.ts` | Пропуск публичных путей (`/api/auth/login`, `/api/auth/verify`, `/r/`, non-API). Для `/api/**` — проверка cookie → `event.context.user` |
| rate-limit | `server/middleware/rate-limit.ts` | LRU-based. Auth: 5 req/15 min per IP. Redirect: 1000 req/min global. `Retry-After` header |

### 3.5 Задача 2.5 — Клиентские страницы

**Файлы:**

| Файл | Назначение |
|------|-----------|
| `app/layouts/auth.vue` | Центрированная карточка, логотип SPLAT, light/dark |
| `app/pages/auth/login.vue` | UInput email, валидация, POST → redirect на verify |
| `app/pages/auth/verify.vue` | UPinInput 6 цифр, таймер 10 мин, resend cooldown 60s, auto-submit on complete |
| `app/composables/useAuth.ts` | `login()`, `verify()`, `logout()`, `fetchUser()`, reactive `user`, `isAuthenticated`, `isAdmin` |
| `app/middleware/auth.global.ts` | Redirect неавторизованных → login, авторизованных с auth-страниц → dashboard |
| `app/stores/auth.ts` | Pinia store: user, isAuthenticated, setUser, clear |

---

## 4. Эпик 3: Layout и навигация

### 4.1 Задача 3.1 — Default Layout

**Файлы:** 5 компонентов + обновлённый layout

| Компонент | Файл | Описание |
|-----------|------|----------|
| Sidebar | `app/components/app/Sidebar.vue` | 240px expanded / 64px collapsed. 5 nav items (Lucide icons). Tooltips при collapsed. Fade-анимация. Логотип + версия |
| Header | `app/components/app/Header.vue` | Sticky, backdrop-blur. Dynamic breadcrumbs. Cmd+K search modal. Burger для mobile |
| UserMenu | `app/components/app/UserMenu.vue` | UDropdownMenu: аватар (инициалы), email, Настройки, Выйти |
| MobileNav | `app/components/app/MobileNav.vue` | USlideover слева. Полная навигация + user info + logout |
| Layout | `app/layouts/default.vue` | Sidebar (hidden md:flex) + Header + content. Sidebar state persisted в localStorage |

**Адаптивность:**
- Desktop (≥1024px): sidebar 240px + content
- Tablet (768–1023px): sidebar toggleable
- Mobile (<768px): burger → slideover, bottom padding для mobile nav

---

## 5. Эпик 4: CRUD QR-кодов

### 5.1 Задача 4.1 — QR Service

**Файл:** `server/services/qr.service.ts`

| Функция | Описание | Access Control |
|---------|----------|---------------|
| `createQr(data, user)` | ShortCode retry 3x, default styles merge, logo→H correction, tag association | Любой авторизованный |
| `getQrList(filters, pagination, user)` | 6 фильтров (search, status, folderId, tagIds, dateFrom, dateTo), пагинация, сортировка, tag join | Editor: свои. Admin: все |
| `getQrById(id, user)` | С relations: folder, destinations, tags | Владелец или admin |
| `updateQr(id, data, user)` | Static URL protection, tag re-association | Владелец или admin |
| `deleteQr(id, user)` | Hard delete (cascade) | Владелец или admin |
| `bulkDeleteQr(ids, user)` | Проверка доступа ко всем, batch delete | Владелец или admin |
| `duplicateQr(id, user)` | Копия всех полей, новый shortCode, title + " (копия)", counters = 0 | Владелец или admin |

### 5.2 Задача 4.2 — API-эндпоинты

| Эндпоинт | Метод | Zod-валидация | Ответ |
|----------|-------|---------------|-------|
| `/api/qr` | GET | query: page, limit, sortBy, sortOrder, search, status, folderId, tags, dateFrom, dateTo | `{ data: [], meta: { total, page, limit, totalPages } }` |
| `/api/qr` | POST | body: title (req), destinationUrl (req, URL), type, description, style, utmParams, folderId, tagIds, expiresAt | `{ data: QrCode }` 201 |
| `/api/qr/[id]` | GET | — | `{ data: QrCode }` с relations |
| `/api/qr/[id]` | PUT | body: partial fields (nullable) | `{ data: QrCode }` |
| `/api/qr/[id]` | DELETE | — | `{ data: { success: true } }` |
| `/api/qr/[id]/duplicate` | POST | — | `{ data: QrCode }` 201 |
| `/api/qr/bulk-delete` | POST | body: `{ ids: uuid[] }` min 1 | `{ data: { success, deleted } }` |

### 5.3 Задача 4.3 — Страница списка

**Файл:** `app/pages/qr/index.vue`

**Функциональность:**
- Search с debounce 300ms
- Фильтры: статус (USelect), папка (USelect)
- Переключатель table/grid (persisted в localStorage)
- Bulk select: checkbox в table, «Выбрано N» bar, массовое удаление
- Skeleton loading, EmptyState компонент
- Сортировка по клику на заголовки (title, totalScans, createdAt)
- Pagination (prev/next + номера + «Показано X–Y из Z»)

**Компоненты:**

| Компонент | Файл | Описание |
|-----------|------|----------|
| QrTable | `app/components/qr/Table.vue` | Колонки: checkbox, mini QR preview (40x40), title + tags, URL (truncated), status badge, scans, date, actions dropdown |
| QrCard | `app/components/qr/Card.vue` | Grid: QR preview, title, status badge, scans, tags, actions menu. Responsive grid (1/2/3/4 cols) |
| QrPreviewMini | `app/components/qr/PreviewMini.vue` | Миниатюрный SVG QR для строк таблицы |
| Pagination | `app/components/shared/Pagination.vue` | Prev/Next + visible pages (±2) + «Показано X–Y из Z» |
| EmptyState | `app/components/shared/EmptyState.vue` | Иконка + title + description + slot для CTA |
| ConfirmDialog | `app/components/shared/ConfirmDialog.vue` | UModal с красной иконкой, title, message, confirm/cancel buttons, loading state |

### 5.4 Задача 4.4 — Страница создания

**Файл:** `app/pages/qr/create.vue`

**Layout:** Двухколоночный (2/3 настройки + 1/3 live preview)

**Левая колонка — 3 секции:**
1. **Ссылка:** URL input + валидация, toggle dynamic/static, UTM-конструктор (collapsible: source, medium, campaign, content)
2. **Информация:** title (required), description (textarea), expires (datetime-local)
3. **Стиль:** QrStyleEditor компонент

**Правая колонка (sticky):**
- QrPreview — reactive SVG, обновляется при любом изменении
- Текст «Предварительный просмотр обновляется в реальном времени»

**Компоненты:**

| Компонент | Файл | Описание |
|-----------|------|----------|
| QrPreview | `app/components/qr/Preview.vue` | Reactive SVG рендеринг через `generateQrSvg()`. Copy redirect URL по клику. Configurable display size |
| QrStyleEditor | `app/components/qr/StyleEditor.vue` | 3 color pickers (foreground, background, corner) с HEX input. 5 moduleStyle визуальных кнопок с SVG-иконками. 4 cornerStyle визуальных кнопок. Error correction dropdown |
| TagInput | `app/components/shared/TagInput.vue` | Autocomplete по существующим, inline создание (Enter), цветные badges, крестик удаления |

### 5.5 Задача 4.5 — Детали и редактирование

**Файлы:**

| Страница | Файл | Описание |
|----------|------|----------|
| Детали | `app/pages/qr/[id]/index.vue` | Stats (3 карточки: total/unique scans, тип). Info table (URL, shortCode, папка, теги, даты). Actions dropdown (edit, duplicate, pause/resume, delete). Export dialog. Analytics placeholder |
| Редактирование | `app/pages/qr/[id]/edit.vue` | Prefilled form (как create). Static URL disabled. Status selector. Save → redirect на detail |
| Export | `app/components/qr/ExportDialog.vue` | UModal: формат (PNG/SVG/PDF), размер для PNG (300–4096), fetch + blob download |

### 5.6 QR SVG-рендерер

**Файл:** `app/utils/qr-svg.ts`

**Возможности:**
- Генерация QR-матрицы через `qrcode` (QRCode.create)
- 5 стилей модулей: square (rect), rounded (rx), dots (circle), classy (path с одним скруглением), classy-rounded (высокий rx)
- 4 стиля углов (finder patterns): square (rect), rounded (rx), dot (circle), extra-rounded (высокий rx)
- Отдельный цвет для углов (cornerColor)
- Logo overlay: центрирование, белый padding, configurable size (15–30%), borderRadius
- Quiet zone (4-модульный margin)
- `generateQrSvg(data, style)` → SVG string
- `qrSvgToDataUrl(svg)` → data URL для скачивания

---

## 6. Структура проекта (текущая)

```
splat-qr/ (90 файлов)
├── nuxt.config.ts
├── app.config.ts
├── drizzle.config.ts
├── tsconfig.json
├── package.json
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .dockerignore
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── README.md
│
├── assets/css/main.css
├── public/splat-logo.svg
├── locales/{ru,en}.json
│
├── types/
│   ├── auth.ts          # User, H3EventContext extend
│   ├── qr.ts            # QrCode, QrStyle, QrDestination, UtmParams
│   ├── api.ts           # ApiMeta, ApiSuccessResponse, ApiErrorResponse
│   └── analytics.ts     # Overview, TimeSeries, Geo, Device, TopQr
│
├── app/
│   ├── app.vue
│   ├── layouts/
│   │   ├── default.vue  # Sidebar + Header + MobileNav
│   │   └── auth.vue     # Centered card
│   ├── middleware/
│   │   └── auth.global.ts
│   ├── composables/
│   │   ├── useAuth.ts
│   │   └── useQr.ts
│   ├── stores/
│   │   ├── auth.ts
│   │   └── ui.ts
│   ├── utils/
│   │   └── qr-svg.ts    # SVG renderer
│   ├── components/
│   │   ├── app/
│   │   │   ├── Sidebar.vue
│   │   │   ├── Header.vue
│   │   │   ├── UserMenu.vue
│   │   │   └── MobileNav.vue
│   │   ├── qr/
│   │   │   ├── Preview.vue
│   │   │   ├── PreviewMini.vue
│   │   │   ├── StyleEditor.vue
│   │   │   ├── Table.vue
│   │   │   ├── Card.vue
│   │   │   └── ExportDialog.vue
│   │   └── shared/
│   │       ├── Pagination.vue
│   │       ├── EmptyState.vue
│   │       ├── ConfirmDialog.vue
│   │       └── TagInput.vue
│   └── pages/
│       ├── index.vue         # → /dashboard redirect
│       ├── auth/login.vue
│       ├── auth/verify.vue
│       ├── dashboard/index.vue
│       ├── qr/index.vue      # Список
│       ├── qr/create.vue     # Создание
│       ├── qr/[id]/index.vue # Детали
│       └── qr/[id]/edit.vue  # Редактирование
│
├── server/
│   ├── plugins/db.ts
│   ├── db/
│   │   ├── index.ts         # Drizzle client + pool
│   │   ├── seed.ts          # 400 scan events, 10 QR, etc.
│   │   ├── schema/
│   │   │   ├── users.ts
│   │   │   ├── sessions.ts
│   │   │   ├── otp-codes.ts
│   │   │   ├── folders.ts
│   │   │   ├── qr-codes.ts
│   │   │   ├── qr-destinations.ts
│   │   │   ├── scan-events.ts
│   │   │   ├── tags.ts
│   │   │   ├── qr-tags.ts
│   │   │   ├── allowed-domains.ts
│   │   │   ├── api-keys.ts
│   │   │   └── index.ts     # Re-exports + 8 relations
│   │   └── migrations/      # (пусто — генерируется drizzle-kit)
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   └── qr.service.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── rate-limit.ts
│   ├── utils/
│   │   ├── nanoid.ts
│   │   ├── hash.ts
│   │   ├── ip.ts
│   │   ├── response.ts
│   │   └── auth.ts
│   └── api/
│       ├── auth/{login,verify,logout,me}.ts
│       └── qr/
│           ├── index.{get,post}.ts
│           ├── [id].{get,put,delete}.ts
│           ├── [id]/duplicate.post.ts
│           └── bulk-delete.post.ts
│
├── data/
│   ├── .gitkeep
│   └── uploads/.gitkeep
│
└── tests/{unit,e2e}/
```

---

## 7. Паттерны и конвенции

### 7.1 API Response Format

```typescript
// Успех
{ data: T, meta?: { total, page, limit, totalPages } }

// Ошибка (через createError)
{ data: null, error: { message: string, statusCode: number } }
```

### 7.2 API Handler Pattern

```typescript
export default defineEventHandler(async (event) => {
  const user = requireAuth(event)                    // 1. Auth
  const body = await readValidatedBody(event, schema.parse)  // 2. Validate
  const result = await service.method(body, user)    // 3. Service call
  return apiSuccess(result)                           // 4. Response
})
```

### 7.3 Service Pattern

- Бизнес-логика только в `server/services/`
- API-хэндлеры — тонкие: валидация → сервис → ответ
- Access control: `checkAccess(qr, user)` в каждом методе
- Ошибки через `createError({ statusCode, message })`

### 7.4 Composable Pattern

```typescript
export function useEntity() {
  const list = ref([])
  const loading = ref(false)
  const filters = ref({...defaults})

  async function fetchList() { ... }
  async function create(data) { ... }

  return { list: readonly(list), loading: readonly(loading), filters, fetchList, create }
}
```

### 7.5 Component Naming

- `app/components/app/` — layout компоненты (Sidebar, Header, etc.)
- `app/components/qr/` — QR-специфичные
- `app/components/shared/` — переиспользуемые
- `app/components/analytics/` — графики и виджеты (будет в Эпике 6)
- `app/components/folders/` — папки (будет в Эпике 7)

---

## 8. Известные ограничения и TODO

### 8.1 Не реализовано в Эпике 4

- Export API-эндпоинт (`server/api/qr/[id]/export.get.ts`) — UI готов, сервер нужен в Эпике 5
- Folder selector на странице создания — загружает placeholder, реальные данные в Эпике 7
- Tag fetch на странице списка — фильтр по тегам будет работать после Эпика 7

### 8.2 Технический долг

- QR Preview: import path `~/app/utils/qr-svg` может потребовать настройки alias в Nuxt 4 compatibility mode
- Search на Header: placeholder модальное окно, полнотекстовый поиск — отдельная задача
- Нет unit-тестов (запланированы в Эпике 14)
- Нет E2E тестов (запланированы в Эпике 14)
