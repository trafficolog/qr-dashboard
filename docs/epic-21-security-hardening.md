# EPIC 21 — Security Hardening

**Статус:** см. [EPIC Status Matrix](./epic-status-matrix.md).
**Целевая версия:** **1.0.0** — основной релиз после полной реализации EPIC 21 (первая semver-стабильная веха для production). Промежуточные теги по фазам (например 0.13.x) допустимы до финального тега.
**Оценка:** 10–14 дней
**Зависимости:** Эпики 1–2 (auth, DB), Эпик 12 (API keys)
**Основание:** [Security Review v0.12.0](./security-review-splat-qr.md)
**Приоритет:** 🔴 Выше всех feature-эпиков — выполняется до production deploy

---

## 1. Цель

Закрыть 18 уязвимостей, выявленных в security review, в три фазы:
- **Фаза 0 (блокер deploy):** 4 критических + security headers — 2.5 дня
- **Фаза 1 (первая неделя):** high/medium уязвимости — 5.5 дней
- **Фаза 2 (вторая неделя):** low-risk hardening — 4 дня

После завершения Фазы 0 проект может быть развёрнут в production. **Фактически EPIC 21 закрыт полностью 2026-04-20**, что фиксирует критерий перехода к `1.0.0`: все security-блоки SEC-01…SEC-18 реализованы и задокументированы в отчёте [EPIC 21 Security Checklist (2026-04-20)](./reports/epic-21-security-checklist-2026-04-20.md).

---


## Статус по фазам (факт)

| Фаза | Состав | План | Факт | Статус |
|---|---|---:|---:|---|
| Фаза 0 | 21.1, 21.2, 21.3, 21.4, 21.10 | 2.5 дня | 2026-04-20 | ✅ Завершена |
| Фаза 1 | 21.5, 21.6, 21.7, 21.8, 21.11 | 5.5 дней | 2026-04-20 | ✅ Завершена |
| Фаза 2 | 21.9, 21.12, 21.13 | 4 дня | 2026-04-20 | ✅ Завершена |
| Итого | EPIC 21 (полный объём) | 12 дней | 2026-04-20 | ✅ Полностью выполнен |

### Production-ready gate (зафиксировано)

Переход к релизу `1.0.0` разрешён при одновременном выполнении условий:

- ✅ Закрыты все security-блоки EPIC 21 (SEC-01…SEC-18).
- ✅ Включены и проверены security middleware/guards (CSRF, headers/CSP, rate limits, session controls, API key scopes).
- ✅ Доступен итоговый security checklist/report в docs: [EPIC 21 Security Checklist (2026-04-20)](./reports/epic-21-security-checklist-2026-04-20.md).
- ✅ Нет открытых критических/высоких замечаний по security-review для production deploy.

---

## 2. Задачи

---

### Задача 21.1 — CSRF Protection (SEC-01)

**Приоритет:** 🔴 Critical · Фаза 0
**Оценка:** 0.5 дня

**Новые файлы:**

```
server/middleware/csrf.ts
```

**Изменяемые файлы:**

```
server/services/auth.service.ts     — генерация CSRF-токена при создании сессии
server/api/auth/me.get.ts           — возвращать csrfToken в ответе
app/composables/useAuth.ts          — хранить csrfToken, передавать в $fetch
nuxt.config.ts                      — runtimeConfig.public.csrfHeaderName
.env.example                        — CSRF_SECRET
```

**Реализация — двухслойная защита:**

#### Слой 1: Origin-проверка (middleware)

```typescript
// server/middleware/csrf.ts
export default defineEventHandler((event) => {
  const method = getMethod(event)
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return

  // Пропускаем API v1 — они используют Bearer token, не cookie
  const path = getRequestURL(event).pathname
  if (path.startsWith('/api/v1/')) return

  // Пропускаем публичные эндпоинты
  if (path === '/api/auth/login' || path === '/api/auth/verify') return

  const origin = getHeader(event, 'origin')
  const referer = getHeader(event, 'referer')
  const appUrl = useRuntimeConfig().public.appUrl

  // Если Origin присутствует — сравниваем
  if (origin) {
    const allowed = new URL(appUrl).origin
    if (origin !== allowed) {
      throw createError({ statusCode: 403, message: 'Origin mismatch' })
    }
    return
  }

  // Fallback на Referer (Safari иногда не шлёт Origin)
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin
      const allowed = new URL(appUrl).origin
      if (refOrigin !== allowed) {
        throw createError({ statusCode: 403, message: 'Referer mismatch' })
      }
      return
    } catch { /* невалидный Referer — отклоняем */ }
  }

  // Ни Origin, ни Referer — отклоняем мутирующие запросы
  throw createError({ statusCode: 403, message: 'Missing Origin header' })
})
```

#### Слой 2: Double-submit cookie token

```typescript
// При создании сессии (verifyOtp):
// Генерировать csrfToken = crypto.randomBytes(32).toString('hex')
// Сохранять в sessions таблицу (новое поле csrf_token)
// Отдавать в GET /api/auth/me → { user, csrfToken }

// Клиент:
// useAuth.ts хранит csrfToken в reactive ref
// $fetch interceptor добавляет заголовок X-CSRF-Token ко всем мутирующим запросам

// Middleware csrf.ts (дополнение к Origin check):
// Для cookie-auth: сравнить X-CSRF-Token с session.csrfToken
```

#### Слой 3: SameSite upgrade

```typescript
// server/services/auth.service.ts — изменить cookie:
setCookie(event, 'session_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict', // было 'lax'
  maxAge: 30 * 24 * 60 * 60,
  path: '/',
})
```

**Изменения в БД:**

```sql
ALTER TABLE sessions ADD COLUMN csrf_token VARCHAR(64);
```

**Критерии приёмки:**
- [ ] POST/PUT/DELETE запрос без Origin → 403
- [ ] POST/PUT/DELETE запрос с чужим Origin → 403
- [ ] POST/PUT/DELETE с корректным Origin + X-CSRF-Token → 200
- [ ] API v1 с Bearer token не требует CSRF
- [ ] `SameSite: strict` установлен на session cookie
- [ ] Навигация по прямым ссылкам работает (strict не ломает GET)

---

### Задача 21.2 — Хеширование OTP (SEC-02)

**Приоритет:** 🔴 Critical · Фаза 0
**Оценка:** 0.5 дня

**Изменяемые файлы:**

```
server/services/auth.service.ts
server/utils/hash.ts
.env.example
```

**Реализация:**

```typescript
// server/utils/hash.ts — добавить:
export function hashOtpWithPepper(otp: string): string {
  const pepper = useRuntimeConfig().otpPepper // env: OTP_PEPPER
  return hashToken(otp + pepper)
}

// server/services/auth.service.ts — sendOtp():
// Было:  INSERT otp_codes (email, code, ...) VALUES (email, '123456', ...)
// Стало: INSERT otp_codes (email, code, ...) VALUES (email, hashOtpWithPepper('123456'), ...)
//
// Клиенту OTP отправляется по email в plaintext (это нормально — email уже secure channel)

// server/services/auth.service.ts — verifyOtp():
// Было:  WHERE code = inputCode
// Стало: WHERE code = hashOtpWithPepper(inputCode)
```

**Новая env-переменная:**

```
OTP_PEPPER=<random-64-char-hex>  # crypto.randomBytes(32).toString('hex')
```

**Миграция:**

```sql
-- Все существующие OTP-коды становятся невалидными (TTL 10 мин — они уже истекли)
-- Просто очищаем для порядка:
DELETE FROM otp_codes WHERE used_at IS NULL;
```

**Критерии приёмки:**
- [ ] В таблице `otp_codes` хранятся только хеши, не plaintext
- [ ] `SELECT code FROM otp_codes` не содержит 6-значных числовых строк
- [ ] OTP-flow работает: отправка → email с кодом → ввод → вход
- [ ] Без OTP_PEPPER в env — сервер не стартует (explicit fail)

---

### Задача 21.3 — Безопасная инициализация admin (SEC-04)

**Приоритет:** 🔴 Critical · Фаза 0
**Оценка:** 0.5 дня

**Изменяемые файлы:**

```
server/services/auth.service.ts
server/db/seed.ts
.env.example
```

**Реализация:**

```typescript
// server/services/auth.service.ts — verifyOtp(), блок upsert user:

// БЫЛО:
// if (userCount === 0) role = 'admin'
// else role = 'editor'

// СТАЛО:
const adminEmail = useRuntimeConfig().adminEmail // env: ADMIN_EMAIL
if (!existingUser) {
  if (userCount === 0 && adminEmail) {
    // Первый пользователь И совпадает с ADMIN_EMAIL → admin
    if (email.toLowerCase() !== adminEmail.toLowerCase()) {
      throw createError({
        statusCode: 403,
        message: 'System not initialized. Contact administrator.',
      })
    }
    role = 'admin'
  } else if (userCount === 0 && !adminEmail) {
    // ADMIN_EMAIL не задан → блокируем регистрацию
    throw createError({
      statusCode: 503,
      message: 'ADMIN_EMAIL not configured. Set env variable.',
    })
  } else {
    // Последующие пользователи → viewer (не editor!)
    // Повышение до editor/admin — только через /api/team/invite
    role = 'viewer'
  }
}
```

**seed.ts — обновление:**

```typescript
// Добавить guard:
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Seed is disabled in production. Use ADMIN_EMAIL env.')
  process.exit(1)
}
```

**Новая env-переменная:**

```
ADMIN_EMAIL=admin@splatglobal.com  # Единственный email, получающий admin при первом входе
```

**Критерии приёмки:**
- [ ] Без `ADMIN_EMAIL` в env → первый пользователь получает 503 (не admin)
- [ ] С `ADMIN_EMAIL=x@y.com` → только этот email может стать первым admin
- [ ] Попытка входа другого email до инициализации → 403
- [ ] После инициализации admin → новые пользователи получают `viewer`
- [ ] `npm run db:seed` в production → ошибка и exit

---

### Задача 21.4 — Security Headers (SEC-12)

**Приоритет:** 🔴 Critical · Фаза 0
**Оценка:** 0.5 дня

**Новые файлы:**

```
server/middleware/security-headers.ts
```

**Реализация:**

```typescript
// server/middleware/security-headers.ts
export default defineEventHandler((event) => {
  setHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '0', // Deprecated, но nosniff покрывает
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  })

  // CSP только для HTML-страниц (не для API)
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/') && !path.startsWith('/r/')) {
    setHeader(event, 'Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",  // Nuxt requires inline scripts
      "style-src 'self' 'unsafe-inline'",   // Tailwind inline styles
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '))
  }
})
```

**Критерии приёмки:**
- [ ] `curl -I https://app/dashboard` → все security headers присутствуют
- [ ] CSP не ломает рендеринг страниц (vue-echarts, Nuxt UI)
- [ ] API-эндпоинты не получают CSP (только X-Content-Type-Options, HSTS и т.д.)
- [ ] `X-Frame-Options: DENY` предотвращает clickjacking

---

### Задача 21.5 — Audit Log (SEC-03)

**Приоритет:** 🔴 Critical · Фаза 1
**Оценка:** 3 дня

**Новые файлы:**

```
server/db/schema/audit-log.ts
server/db/migrations/0003_add_audit_log.sql
server/services/audit.service.ts
server/utils/audit.ts
server/api/admin/audit/index.get.ts
app/pages/settings/audit.vue
app/composables/useAuditLog.ts
```

**Изменяемые файлы:**

```
server/db/schema/index.ts
server/services/qr.service.ts         — audit calls
server/services/team.service.ts        — audit calls
server/services/folder.service.ts      — audit calls
server/services/api-key.service.ts     — audit calls
server/api/auth/verify.post.ts         — audit login
server/api/auth/logout.post.ts         — audit logout
locales/ru.json, locales/en.json
```

**Схема БД:**

```typescript
// server/db/schema/audit-log.ts
export const auditAction = pgEnum('audit_action', [
  // Auth
  'auth.login', 'auth.logout', 'auth.otp_sent', 'auth.otp_failed',
  // QR
  'qr.create', 'qr.update', 'qr.delete', 'qr.bulk_delete',
  'qr.duplicate', 'qr.export', 'qr.bulk_create',
  // Team
  'team.invite', 'team.role_change', 'team.remove',
  // Folders
  'folder.create', 'folder.update', 'folder.delete',
  // API Keys
  'api_key.create', 'api_key.revoke',
  // Settings
  'domain.create', 'domain.toggle', 'domain.delete',
])

export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: auditAction('action').notNull(),
  entityType: varchar('entity_type', { length: 50 }),  // 'qr', 'user', 'folder', ...
  entityId: uuid('entity_id'),
  details: jsonb('details'),           // { before: {...}, after: {...} } или описание
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('idx_audit_log_user').on(t.userId),
  index('idx_audit_log_action').on(t.action),
  index('idx_audit_log_entity').on(t.entityType, t.entityId),
  index('idx_audit_log_created').on(t.createdAt),
])
```

**SQL-миграция:**

```sql
CREATE TYPE audit_action AS ENUM (
  'auth.login', 'auth.logout', 'auth.otp_sent', 'auth.otp_failed',
  'qr.create', 'qr.update', 'qr.delete', 'qr.bulk_delete',
  'qr.duplicate', 'qr.export', 'qr.bulk_create',
  'team.invite', 'team.role_change', 'team.remove',
  'folder.create', 'folder.update', 'folder.delete',
  'api_key.create', 'api_key.revoke',
  'domain.create', 'domain.toggle', 'domain.delete'
);

CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
```

**Утилита записи:**

```typescript
// server/utils/audit.ts
export async function recordAudit(event: H3Event, params: {
  action: AuditAction
  entityType?: string
  entityId?: string
  details?: Record<string, unknown>
}) {
  const user = event.context.user
  const ip = getClientIp(event)
  const ua = getHeader(event, 'user-agent')

  // Fire-and-forget — не блокирует основной ответ
  db.insert(auditLog).values({
    userId: user?.id ?? null,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details ?? null,
    ipAddress: ip,
    userAgent: ua,
  }).catch((err) => {
    console.error('Audit log failed:', err)
    // Sentry capture если настроен
  })
}
```

**Интеграция в сервисы (пример):**

```typescript
// server/services/qr.service.ts — deleteQr():
async function deleteQr(id: string, user: User, event: H3Event) {
  const qr = await getQrById(id, user)
  // ... deletion logic ...
  await recordAudit(event, {
    action: 'qr.delete',
    entityType: 'qr',
    entityId: id,
    details: { title: qr.title, shortCode: qr.shortCode },
  })
}
```

**API-эндпоинт:**

```
GET /api/admin/audit?page=1&limit=50&userId=...&action=...&entityType=...&dateFrom=...&dateTo=...
Auth: Admin only
Response: { data: AuditEntry[], meta: { total, page, limit, totalPages } }
```

**UI — `app/pages/settings/audit.vue`:**

- Таблица: Дата/время, Пользователь (email), Действие, Объект, IP
- Фильтры: пользователь (USelect), действие (USelect), период (DateRangePicker)
- Клик на строку → modal с полными details (JSON pretty-print)
- Pagination
- Admin only

**Критерии приёмки:**
- [ ] Все мутирующие действия записываются в audit_log
- [ ] Запись содержит userId, action, entityType, entityId, IP, UA, timestamp
- [ ] Для delete-действий details содержит удалённый объект (title, shortCode)
- [ ] `/settings/audit` доступна только admin
- [ ] Фильтрация по пользователю, действию, дате работает
- [ ] Fire-and-forget — ошибка записи audit не ломает основной запрос
- [ ] Индексы обеспечивают <100ms на запрос с фильтрами

---

### Задача 21.6 — Persistent Rate Limiting (SEC-05)

**Приоритет:** 🟡 High · Фаза 1
**Оценка:** 1 день

**Изменяемые файлы:**

```
server/middleware/rate-limit.ts
server/services/auth.service.ts
```

**Реализация:**

#### Auth brute-force — DB-based

```typescript
// server/services/auth.service.ts — verifyOtp():
// Уже есть: otp_codes.attempts (max 5)
// Добавить: после 5 неудачных попыток → lock email на 30 минут
//
// 1. SELECT * FROM otp_codes WHERE email = $1 AND used_at IS NULL
//    AND created_at > NOW() - INTERVAL '10 minutes'
//    ORDER BY created_at DESC LIMIT 1
//
// 2. IF otp.attempts >= 5:
//    throw createError(429, 'Too many attempts. Try again in 30 minutes.')
//
// 3. При неверном коде:
//    UPDATE otp_codes SET attempts = attempts + 1 WHERE id = otp.id
//
// 4. Добавить проверку: COUNT неудачных попыток за последние 30 минут
//    SELECT COUNT(*) FROM otp_codes WHERE email = $1
//      AND attempts >= 5 AND created_at > NOW() - INTERVAL '30 minutes'
//    IF count > 0 → 429 (email locked)
```

#### Redirect — per-IP rate limiting

```typescript
// server/middleware/rate-limit.ts — обновить:
// БЫЛО: global bucket на 1000 req/min для /r/*
// СТАЛО: per-IP bucket на 60 req/min для /r/*
//
// LRU key: `redirect:${ip}` вместо `redirect:global`
// Limit: 60 req/min per IP (хватает для легитимного использования)
```

#### API v1 — persistent fallback

```typescript
// Оставить LRU как primary (быстрый hot path)
// Добавить DB fallback для случаев рестарта:
//   При 429 → проверить DB: SELECT COUNT(*) FROM api_usage
//     WHERE api_key_id = $1 AND created_at > NOW() - INTERVAL '1 minute'
//   Если < limit → пропустить (LRU был сброшен, DB актуален)
```

**Критерии приёмки:**
- [ ] 6-я попытка ввести OTP → 429 (даже после рестарта сервера)
- [ ] Email заблокирован на 30 минут после 5 неудачных OTP
- [ ] Redirect per-IP: 61-й запрос за минуту с одного IP → 429
- [ ] Разные IP не влияют друг на друга для redirect rate limit

---

### Задача 21.7 — Session Invalidation при смене роли (SEC-06)

**Приоритет:** 🟡 High · Фаза 1
**Оценка:** 0.5 дня

**Изменяемые файлы:**

```
server/services/team.service.ts
```

**Реализация:**

```typescript
// server/services/team.service.ts — updateRole():
async function updateRole(targetId: string, newRole: string, currentUser: User) {
  // ... existing guards ...
  
  await db.update(users).set({ role: newRole }).where(eq(users.id, targetId))
  
  // NEW: Invalidate all sessions of target user
  await db.delete(sessions).where(eq(sessions.userId, targetId))
  
  // Audit log
  await recordAudit(event, {
    action: 'team.role_change',
    entityType: 'user',
    entityId: targetId,
    details: { oldRole, newRole },
  })
}
```

**Эффект для пользователя:** после смены роли его текущая сессия станет невалидной. При следующем запросе `GET /api/auth/me` → 401 → redirect на login. Пользователь входит заново и получает новую роль.

**Критерии приёмки:**
- [ ] Admin меняет role editor→viewer → пользователь вылетает из сессии
- [ ] Пользователь переходит на login и входит заново с новой ролью
- [ ] Admin-сессия (инициатор) не затронута

---

### Задача 21.8 — Whitelist доменов назначения (SEC-07)

**Приоритет:** 🟡 High · Фаза 1
**Оценка:** 1 день

**Новые файлы:**

```
server/db/schema/destination-domains.ts
server/db/migrations/0004_add_destination_domains.sql
server/api/admin/destination-domains/index.get.ts
server/api/admin/destination-domains/index.post.ts
server/api/admin/destination-domains/[id].delete.ts
app/pages/settings/destination-domains.vue
```

**Изменяемые файлы:**

```
server/db/schema/index.ts
server/services/qr.service.ts        — проверка URL при create/update
server/routes/r/[code].get.ts        — промежуточная страница для неизвестных доменов
app/pages/settings/index.vue
locales/ru.json, locales/en.json
```

**Логика (аналогична allowed_domains для email):**

```
destination_domains пустой (0 записей)
  → ВСЕ домены разрешены (открытый режим — backward compatible)

destination_domains содержит ≥1 записи
  → Режим белого списка:
    - QR с URL из whitelist → 302 redirect как обычно
    - QR с URL НЕ из whitelist → промежуточная страница:
      «Вы переходите на внешний сайт: {domain}. Продолжить?»
```

**При создании QR:**
- Если whitelist активен и URL не в нём → предупреждение (не блокировка)
- Admin может создавать QR на любой URL
- Editor/Viewer получают предупреждение: «Домен не в списке разрешённых»

**Критерии приёмки:**
- [ ] Пустой whitelist → все URL работают как раньше
- [ ] С whitelist → URL из whitelist redirect напрямую
- [ ] URL не из whitelist → промежуточная страница с предупреждением
- [ ] Admin может управлять whitelist в `/settings/destination-domains`
- [ ] При создании QR с URL не из whitelist → warning (не error)

---

### Задача 21.9 — API Key Scoping (SEC-08)

**Приоритет:** 🟡 Medium · Фаза 2
**Оценка:** 2 дня

**Изменяемые файлы:**

```
server/db/schema/api-keys.ts         — добавить permissions, allowed_ips, обязательный expires_at
server/services/api-key.service.ts
server/middleware/auth.ts             — проверка permissions при API v1 запросах
app/pages/integrations/index.vue      — UI для настройки scopes и IP
locales/ru.json, locales/en.json
```

**Изменения в схеме:**

```sql
ALTER TABLE api_keys
  ADD COLUMN permissions TEXT[] DEFAULT '{"qr:read","qr:create","qr:update","qr:delete","analytics:read"}',
  ADD COLUMN allowed_ips TEXT[],
  ALTER COLUMN expires_at SET DEFAULT NOW() + INTERVAL '90 days',
  ALTER COLUMN expires_at SET NOT NULL;

-- Обновить существующие ключи
UPDATE api_keys SET expires_at = created_at + INTERVAL '90 days' WHERE expires_at IS NULL;
```

**Permissions enum:**

```typescript
const API_PERMISSIONS = [
  'qr:read',       // GET /api/v1/qr, GET /api/v1/qr/:id
  'qr:create',     // POST /api/v1/qr
  'qr:update',     // PUT /api/v1/qr/:id
  'qr:delete',     // DELETE /api/v1/qr/:id
  'analytics:read', // GET /api/v1/qr/:id/stats
] as const
```

**Middleware — проверка:**

```typescript
// server/middleware/auth.ts — после verify API key:
const requiredPermission = getRequiredPermission(method, path)
// e.g. DELETE /api/v1/qr/123 → 'qr:delete'
if (requiredPermission && !key.permissions.includes(requiredPermission)) {
  throw createError({ statusCode: 403, message: 'API key lacks required permission' })
}

// IP check:
if (key.allowedIps?.length > 0) {
  const clientIp = getClientIp(event)
  if (!key.allowedIps.some(cidr => isIpInCidr(clientIp, cidr))) {
    throw createError({ statusCode: 403, message: 'IP not allowed for this API key' })
  }
}
```

**UI — обновление `/integrations`:**

- При создании ключа: checkbox-список permissions (default: все)
- Текстовое поле для allowed IPs (через запятую, валидация CIDR/IP)
- Дата истечения (default: +90 дней, max: +1 год)
- Предупреждение за 7 дней до истечения (badge «Истекает через N дней»)
- Max 5 ключей на пользователя

**Критерии приёмки:**
- [ ] Ключ с `permissions: ['qr:read']` → DELETE `/api/v1/qr/:id` → 403
- [ ] Ключ с `allowed_ips: ['10.0.0.0/8']` → запрос с другого IP → 403
- [ ] Новые ключи обязательно имеют `expires_at`
- [ ] UI показывает permissions и IP при создании
- [ ] Max 5 ключей на пользователя

---

### Задача 21.10 — Body Size и JSONB Limits (SEC-09)

**Приоритет:** 🟡 Medium · Фаза 1
**Оценка:** 0.5 дня

**Изменяемые файлы:**

```
nuxt.config.ts                          — глобальный body size limit
server/api/qr/index.post.ts             — strict Zod для JSONB
server/api/qr/[id].put.ts               — strict Zod для JSONB
server/api/qr/bulk.post.ts              — body size limit для bulk
```

**Реализация:**

```typescript
// nuxt.config.ts:
export default defineNuxtConfig({
  nitro: {
    routeRules: {
      '/api/**': { headers: { 'x-max-body-size': '1mb' } },
      '/api/qr/bulk': { headers: { 'x-max-body-size': '5mb' } },
    },
  },
})

// Zod — strict JSONB schemas:
const qrStyleSchema = z.object({
  foregroundColor: z.string().max(7).regex(/^#[0-9A-Fa-f]{6}$/),
  backgroundColor: z.string().max(7).regex(/^#[0-9A-Fa-f]{6}$/),
  cornerColor: z.string().max(7).regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  moduleStyle: z.enum(['square', 'rounded', 'dots', 'classy', 'classy-rounded']),
  cornerStyle: z.enum(['square', 'rounded', 'dot', 'extra-rounded']),
  errorCorrection: z.enum(['L', 'M', 'Q', 'H']),
  logoUrl: z.string().max(500).optional(),
  logoSize: z.number().min(0.1).max(0.3).optional(),
}).strict() // Отклонять лишние поля

const utmSchema = z.object({
  source: z.string().max(200).optional(),
  medium: z.string().max(200).optional(),
  campaign: z.string().max(200).optional(),
  content: z.string().max(200).optional(),
  term: z.string().max(200).optional(),
}).strict()
```

**Критерии приёмки:**
- [ ] Запрос с body >1MB на стандартные API → 413
- [ ] Запрос с body >5MB на bulk → 413
- [ ] JSONB с лишними полями → 400 (Zod strict)
- [ ] Строковые поля внутри JSONB ограничены `.max()`

---

### Задача 21.11 — Bulk в транзакции (SEC-11)

**Приоритет:** 🟡 Medium · Фаза 1
**Оценка:** 0.5 дня

**Изменяемые файлы:**

```
server/services/bulk.service.ts
server/api/qr/bulk-delete.post.ts
```

**Реализация:**

```typescript
// server/services/bulk.service.ts — bulkCreate():
async function bulkCreate(validRows: Row[], userId: string) {
  return db.transaction(async (tx) => {
    const created: QrCode[] = []
    const errors: BulkError[] = []

    for (const row of validRows) {
      try {
        const qr = await createSingleQr(tx, row, userId) // передаём tx вместо db
        created.push(qr)
      } catch (err) {
        errors.push({ row: row._index, message: err.message })
      }
    }

    // Если ВСЕ провалились — откатить транзакцию
    if (created.length === 0 && errors.length > 0) {
      throw new Error('All rows failed')
    }

    return { created, errors }
  })
}

// server/api/qr/bulk-delete.post.ts:
// Обернуть deleteQr вызовы в транзакцию
```

**Критерии приёмки:**
- [ ] Bulk create 100 QR, 50-й падает → первые 49 созданы, ошибка в массиве errors
- [ ] Bulk create, ВСЕ падают → ни один QR не создан (rollback)
- [ ] Bulk delete в транзакции: если один QR не удалился — остальные тоже нет

---

### Задача 21.12 — Trusted Proxy и Session Limits (SEC-13, SEC-16)

**Приоритет:** 🟢 Low · Фаза 2
**Оценка:** 1 день

**Изменяемые файлы:**

```
server/utils/ip.ts
server/services/auth.service.ts
.env.example
```

**Trusted Proxy:**

```typescript
// server/utils/ip.ts:
export function getClientIp(event: H3Event): string {
  const trustedProxies = useRuntimeConfig().trustedProxies // env: TRUSTED_PROXIES
  const remoteAddr = event.node.req.socket.remoteAddress || ''

  // Если запрос от trusted proxy — доверять X-Forwarded-For
  if (trustedProxies && isTrustedProxy(remoteAddr, trustedProxies)) {
    const xff = getHeader(event, 'x-forwarded-for')
    if (xff) return xff.split(',')[0].trim()
    const xri = getHeader(event, 'x-real-ip')
    if (xri) return xri.trim()
  }

  // Иначе — только remoteAddress
  return remoteAddr
}
```

**Session Limits:**

```typescript
// server/services/auth.service.ts — после создания сессии:
// Проверить количество активных сессий пользователя
const activeSessions = await db.select({ count: sql`COUNT(*)` })
  .from(sessions)
  .where(and(
    eq(sessions.userId, user.id),
    gt(sessions.expiresAt, new Date()),
  ))

if (activeSessions[0].count >= 10) {
  // Удалить самую старую сессию
  const oldest = await db.select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.userId, user.id))
    .orderBy(sessions.createdAt)
    .limit(1)
  if (oldest[0]) {
    await db.delete(sessions).where(eq(sessions.id, oldest[0].id))
  }
}
```

**Критерии приёмки:**
- [ ] С `TRUSTED_PROXIES=10.0.0.0/8` → XFF от proxy 10.0.0.1 доверяется
- [ ] Без trusted proxy → XFF игнорируется, используется remoteAddress
- [ ] 11-я сессия пользователя → самая старая удаляется автоматически

---

### Задача 21.13 — CORS для API v1 и ShortCode Hardening (SEC-15, SEC-18)

**Приоритет:** 🟢 Low · Фаза 2
**Оценка:** 1 день

**Изменяемые файлы:**

```
nuxt.config.ts
server/utils/nanoid.ts
server/middleware/rate-limit.ts
```

**CORS:**

```typescript
// nuxt.config.ts:
export default defineNuxtConfig({
  nitro: {
    routeRules: {
      // API v1 — разрешить кросс-доменные запросы (для интеграций)
      '/api/v1/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE',
          'Access-Control-Allow-Headers': 'Authorization,Content-Type',
          // НЕ включать credentials — API v1 через Bearer, не cookies
        },
      },
      // Все остальные API — без CORS (same-origin only)
    },
  },
})
```

**ShortCode — увеличение длины:**

```typescript
// server/utils/nanoid.ts:
// Новые QR: 8 символов (было 7)
// Существующие 7-символьные продолжают работать
export function generateShortCode(): string {
  return nanoid(8) // было 7
}
```

**Redirect per-IP rate limit hardening:**

```typescript
// Добавить temp ban при подозрительной активности:
// 10 последовательных 404 за 1 минуту с одного IP → 5 мин ban
```

**Критерии приёмки:**
- [ ] `OPTIONS /api/v1/qr` → CORS preflight 200 с правильными заголовками
- [ ] `fetch('/api/qr')` с другого домена → без CORS headers (same-origin)
- [ ] Новые QR создаются с 8-символьным shortCode
- [ ] Старые 7-символьные shortCodes продолжают работать

---

## 3. Порядок реализации

```
ФАЗА 0 — Блокер deploy (2.5 дня)
  21.1  CSRF Protection                      — 0.5 дня
  21.2  Хеширование OTP                      — 0.5 дня
  21.3  Безопасная инициализация admin        — 0.5 дня
  21.4  Security Headers                      — 0.5 дня
  21.10 Body Size + JSONB Limits              — 0.5 дня

ФАЗА 1 — Первая неделя (5.5 дней)
  21.5  Audit Log                             — 3 дня
  21.6  Persistent Rate Limiting              — 1 день
  21.7  Session Invalidation on Role Change   — 0.5 дня
  21.8  Destination URL Whitelist             — 1 день

ФАЗА 2 — Вторая неделя (4 дня)
  21.9  API Key Scoping                       — 2 дня
  21.11 Bulk в транзакции                     — 0.5 дня
  21.12 Trusted Proxy + Session Limits        — 1 день
  21.13 CORS + ShortCode Hardening            — 0.5 дня

Суммарно: 12 дней
```

---

## 4. Изменённые/созданные файлы (сводка)

### Новые файлы (~15)

```
server/middleware/csrf.ts
server/middleware/security-headers.ts
server/db/schema/audit-log.ts
server/db/schema/destination-domains.ts
server/db/migrations/0003_add_audit_log.sql
server/db/migrations/0004_add_destination_domains.sql
server/services/audit.service.ts
server/utils/audit.ts
server/api/admin/audit/index.get.ts
server/api/admin/destination-domains/index.get.ts
server/api/admin/destination-domains/index.post.ts
server/api/admin/destination-domains/[id].delete.ts
app/pages/settings/audit.vue
app/pages/settings/destination-domains.vue
app/composables/useAuditLog.ts
```

### Изменённые файлы (~20)

```
server/services/auth.service.ts
server/services/qr.service.ts
server/services/team.service.ts
server/services/folder.service.ts
server/services/api-key.service.ts
server/services/bulk.service.ts
server/middleware/auth.ts
server/middleware/rate-limit.ts
server/utils/hash.ts
server/utils/ip.ts
server/db/schema/api-keys.ts
server/db/schema/sessions.ts
server/db/schema/index.ts
server/db/seed.ts
server/api/auth/me.get.ts
server/api/auth/verify.post.ts
server/api/qr/index.post.ts
server/api/qr/[id].put.ts
server/api/qr/bulk.post.ts
server/api/qr/bulk-delete.post.ts
server/routes/r/[code].get.ts
app/composables/useAuth.ts
app/pages/settings/index.vue
nuxt.config.ts
.env.example
locales/ru.json
locales/en.json
```

---

## 5. Новые env-переменные

| Переменная | Обязательная | Default | Описание |
|---|---|---|---|
| `OTP_PEPPER` | ✅ Да | — | 64-hex secret для хеширования OTP |
| `ADMIN_EMAIL` | ✅ Да | — | Email первого admin-пользователя |
| `TRUSTED_PROXIES` | Нет | — | CIDR-список trusted proxies (через запятую) |
| `CSRF_SECRET` | Нет | auto-generated | Secret для CSRF-токенов |

---

## 6. Метрики успеха

- **Фаза 0:** Security review score поднимается с текущих 5.5/10 до 7/10.
- **Фаза 1:** Audit log покрывает 100% мутирующих действий. Rate limit persistent.
- **Фаза 2:** API keys scoped. Все headers на месте. Score ≥ 8.5/10.
- **Типизация:** `npm run typecheck` — 0 ошибок после каждой фазы.
- **Регрессия:** Все E2E-тесты проходят. Auth flow не сломан.
---

## 7. Итог review

**Дата финального review:** 2026-04-20
**Документ review:** [`docs/reviews/epic-21-threat-model-review.md`](./reviews/epic-21-threat-model-review.md)

### Результат

- ✅ Проведён финальный threat-model review по SEC-01..SEC-18.
- ✅ Закрытые угрозы подтверждены ссылками на кодовые реализации и security-документацию.
- ✅ Зафиксированы residual risks и compensating controls (без блокировки релиза 1.0.0).
- ✅ Вынесены follow-up риски в следующий эпик/итерации с owner и дедлайнами.

### Финальный статус готовности

**EPIC 21: READY / GO для релиза 1.0.0** при условии процессного закрытия sign-off approvals (Tech Lead + Security Owner + Product).
С технической точки зрения security scope EPIC 21 считается завершённым и проверенным.
