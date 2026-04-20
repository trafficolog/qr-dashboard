# EPIC 19 — Области видимости QR-кодов (Public / Private / Department)

**Статус:** см. [EPIC Status Matrix](./epic-status-matrix.md).
**Целевая версия:** v0.14.0
**Оценка:** 8–12 дней
**Зависимости:** Эпики 1, 4, 7, 11 (все завершены)

---

## 1. Проблема

Текущая модель доступа SPLAT QR строится на двух уровнях: **editor видит только свои QR**, **admin видит все**. Роль `viewer` не имеет собственных QR. Это создаёт ограничения:

- Нет возможности поделиться QR с коллегами без прав admin.
- Глобальные QR-коды (для общих активностей компании) либо «принадлежат» одному человеку, либо требуют admin-доступа для просмотра.
- Нет разделения по подразделениям — маркетинг видит QR производства и наоборот, если дать admin всем.
- При уходе сотрудника его приватные QR становятся недоступны коллегам из того же отдела.

## 2. Цель

Ввести трёхуровневую модель видимости QR-кодов в рамках компании:

| Уровень | Кто видит | Сценарий |
|---------|-----------|----------|
| **Private** | Только создатель + admin | Личные/черновые QR, тесты |
| **Department** | Участники того же подразделения + admin | QR отдела маркетинга, HR-активности |
| **Public** | Все авторизованные пользователи компании | Глобальные акции, корпоративные QR |

## 3. Архитектурный анализ текущего состояния

### 3.1 Что уже есть

- **Таблица `users`:** 8 полей, enum `user_role` (admin/editor/viewer). Нет привязки к подразделению.
- **Таблица `qr_codes`:** 16 полей, `createdBy → users`. Нет поля видимости.
- **Access control в `qr.service.ts`:** `getQrList` фильтрует по `createdBy = user.id` для editor, показывает все для admin. `getQrById`, `updateQr`, `deleteQr` — проверка «владелец или admin».
- **Таблица `folders`:** привязана к `createdBy`, без concept подразделений.
- **Аналитика:** `analytics.service.ts` фильтрует по `createdBy` для editor.

### 3.2 Что нужно добавить

- Новая таблица `departments` (подразделения).
- Связь `users ↔ departments` (M2M или FK).
- Поле `visibility` в `qr_codes` (enum: private / department / public).
- Необязательная связь `qr_codes → departments` для department-level QR.
- Обновление access control во всех сервисах и API.
- Два новых UI-представления: «Мои QR» и «Общие QR».

---

## 4. Схема данных

### 4.1 Новая таблица: `departments`

```
departments
├── id: uuid (PK, default gen_random_uuid())
├── name: varchar(100), NOT NULL
├── slug: varchar(100), UNIQUE, NOT NULL
├── description: text, nullable
├── color: varchar(7), nullable        # HEX для UI-бейджа
├── headUserId: uuid → users, nullable # Руководитель подразделения
├── createdAt: timestamp, default now()
├── updatedAt: timestamp, default now()
```

### 4.2 Новая таблица: `user_departments` (M2M)

```
user_departments
├── userId: uuid → users (CASCADE), PK part
├── departmentId: uuid → departments (CASCADE), PK part
├── role: enum('member', 'head')       # Роль внутри подразделения
├── joinedAt: timestamp, default now()
```

**Обоснование M2M:** Один сотрудник может состоять в нескольких подразделениях (кросс-функциональные команды, совмещение).

### 4.3 Изменения таблицы `qr_codes`

```diff
qr_codes
  ...existing 16 fields...
+ visibility: enum('private', 'department', 'public'), NOT NULL, DEFAULT 'private'
+ departmentId: uuid → departments (SET NULL), nullable
```

**Индексы:**
- `idx_qr_codes_visibility` — B-tree на `visibility`
- `idx_qr_codes_department_id` — B-tree на `departmentId`
- `idx_qr_codes_visibility_department` — составной (visibility, departmentId) для запросов «все QR моего отдела»

### 4.4 ER-связи (новые)

```
departments 1 ←→ N user_departments N ←→ 1 users
departments 1 ←→ N qr_codes (optional, только при visibility = 'department')
```

---

## 5. Модель доступа (обновлённая)

### 5.1 Матрица разрешений

| Действие | Private QR | Department QR | Public QR |
|----------|-----------|---------------|-----------|
| **Просмотр** | Создатель, Admin | Участники отдела, Admin | Все авторизованные |
| **Редактирование** | Создатель, Admin | Создатель, Head отдела, Admin | Создатель, Admin |
| **Удаление** | Создатель, Admin | Создатель, Admin | Создатель, Admin |
| **Смена visibility** | Создатель, Admin | Создатель, Head отдела, Admin | Создатель, Admin |
| **Просмотр аналитики** | Создатель, Admin | Участники отдела, Admin | Все авторизованные |
| **Экспорт** | Создатель, Admin | Участники отдела, Admin | Все авторизованные |

### 5.2 Правила смены visibility

- `private → department`: требуется указать `departmentId` (создатель должен быть участником этого отдела или admin).
- `private → public`: доступно создателю или admin.
- `department → private`: создатель или admin. `departmentId` сбрасывается в NULL.
- `department → public`: создатель, head отдела, или admin. `departmentId` сохраняется (для атрибуции).
- `public → private/department`: только создатель или admin (предотвращает «кражу» общего QR).

### 5.3 Логика фильтрации списка QR

```
getQrList(filters, pagination, user):
  if user.role === 'admin':
    → все QR (без ограничений)
  else:
    userDepartmentIds = SELECT departmentId FROM user_departments WHERE userId = user.id
    → WHERE (
        (createdBy = user.id)                                           // свои
        OR (visibility = 'public')                                      // публичные
        OR (visibility = 'department' AND departmentId IN userDepartmentIds)  // отдела
      )
```

---

## 6. Дополнительные предложения

### 6.1 Быстрое действие «Сделать публичным»

Контекстное меню QR (actions dropdown) → «Сделать публичным» / «Сделать приватным» / «Поделиться с отделом» — одно действие без перехода в форму редактирования. Реализуется через PATCH-эндпоинт.

### 6.2 Индикатор видимости в списке и карточке

Визуальный бейдж рядом со статусом:
- 🔒 Private — серый бейдж с замком
- 🏢 Department — синий бейдж с названием отдела
- 🌐 Public — зелёный бейдж с глобусом

### 6.3 Фильтр видимости в списке QR

Новый фильтр в toolbar: `Все | Мои | Отдела | Публичные`. Работает в сочетании с существующими фильтрами (статус, папка, теги).

### 6.4 Страница «Общие QR-коды»

Отдельный пункт навигации в Sidebar: «Общие QR» (i-lucide-globe) — показывает все публичные QR компании с возможностью фильтрации по автору и отделу. Это точка входа для сотрудников, которые ищут корпоративные QR.

### 6.5 Управление подразделениями

Новая вкладка в Settings: «Подразделения» (admin only) — CRUD подразделений, назначение участников, назначение руководителя. Руководитель отдела получает расширенные права на department-QR без полного admin-доступа.

### 6.6 Массовое изменение видимости

В bulk-actions на странице списка QR: выбрать N QR → «Изменить видимость» → выбрать уровень → применить. Пригодится при реорганизации или запуске общей кампании.

### 6.7 Автозаполнение отдела при создании QR

Если пользователь состоит в одном отделе, при выборе visibility = «department» автоматически подставляется его отдел. Если в нескольких — показывается селектор.

### 6.8 Dashboard: фильтрация аналитики по scope

Добавить переключатель на dashboard: «Мои / Отдела / Все (public)» — меняет scope метрик в StatCard, ScanChart, TopQrTable. Admin видит четвёртый вариант: «Вся компания».

### 6.9 Уведомление при смене видимости чужого QR

Когда admin или head отдела меняет видимость QR другого пользователя, автору отправляется in-app уведомление (подготовка к будущей системе нотификаций) или, как минимум, записывается в audit log.

### 6.10 Audit log видимости

Таблица `visibility_audit_log`: who changed what, from which state to which, when. Полезно для compliance и разбора инцидентов.

---

## 7. Задачи

### Задача 19.1 — Схема и миграция БД

**Приоритет:** 🔴 Critical
**Зависимости:** нет
**Оценка:** 0.5 дня

**Новые файлы:**

```
server/db/schema/departments.ts
server/db/schema/user-departments.ts
server/db/migrations/0002_add_departments_and_qr_visibility.sql
```

**Изменяемые файлы:**

```
server/db/schema/qr-codes.ts        — добавить visibility enum + departmentId FK
server/db/schema/index.ts           — re-export новых таблиц + relations
server/db/seed.ts                   — добавить seed-данные: 3 department, user_departments привязки
```

**Детали реализации:**

```typescript
// server/db/schema/departments.ts
export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }),
  headUserId: uuid('head_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// server/db/schema/user-departments.ts
export const departmentRole = pgEnum('department_role', ['member', 'head'])

export const userDepartments = pgTable('user_departments', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'cascade' }).notNull(),
  role: departmentRole('role').default('member').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.departmentId] })])

// Изменения в qr-codes.ts
export const qrVisibility = pgEnum('qr_visibility', ['private', 'department', 'public'])
// Добавить в qr_codes:
//   visibility: qrVisibility('visibility').default('private').notNull(),
//   departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
```

**SQL-миграция:**

```sql
-- Enum
CREATE TYPE department_role AS ENUM ('member', 'head');
CREATE TYPE qr_visibility AS ENUM ('private', 'department', 'public');

-- Departments
CREATE TABLE departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7),
  head_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- User ↔ Department M2M
CREATE TABLE user_departments (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  role department_role DEFAULT 'member' NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, department_id)
);

-- QR visibility
ALTER TABLE qr_codes
  ADD COLUMN visibility qr_visibility DEFAULT 'private' NOT NULL,
  ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

CREATE INDEX idx_qr_codes_visibility ON qr_codes(visibility);
CREATE INDEX idx_qr_codes_department_id ON qr_codes(department_id);
CREATE INDEX idx_qr_codes_visibility_department ON qr_codes(visibility, department_id);
CREATE INDEX idx_user_departments_user ON user_departments(user_id);
CREATE INDEX idx_user_departments_department ON user_departments(department_id);
```

**Критерии приёмки:**
- [ ] `npm run db:migrate` — успешно без ошибок
- [ ] `npm run db:seed` — создаются 3 подразделения, привязки пользователей
- [ ] Все существующие QR получают `visibility = 'private'` (default)
- [ ] `npm run typecheck` — зелёный

---

### Задача 19.2 — Department Service (CRUD)

**Приоритет:** 🔴 Critical
**Зависимости:** 19.1
**Оценка:** 1 день

**Новые файлы:**

```
server/services/department.service.ts
server/api/departments/index.get.ts
server/api/departments/index.post.ts
server/api/departments/[id].get.ts
server/api/departments/[id].put.ts
server/api/departments/[id].delete.ts
server/api/departments/[id]/members.get.ts
server/api/departments/[id]/members.post.ts
server/api/departments/[id]/members/[userId].delete.ts
```

**Сервис:**

```typescript
// server/services/department.service.ts
export const departmentService = {
  // CRUD
  list(user)                          // Все подразделения с member count. Доступно всем.
  getById(id, user)                   // Детали + список участников. Доступно всем.
  create(data, user)                  // Admin only. Zod: name, slug?, description?, color?
  update(id, data, user)              // Admin only.
  delete(id, user)                    // Admin only. Guard: QR с departmentId → SET NULL.
  
  // Членство
  getMembers(departmentId)            // Список участников с ролями.
  addMember(departmentId, userId, role, user)   // Admin only. Guard: no duplicate.
  removeMember(departmentId, userId, user)      // Admin only. Guard: нельзя удалить последнего head.
  
  // Утилиты
  getUserDepartmentIds(userId)        // Массив departmentId для фильтрации QR.
  isUserInDepartment(userId, deptId)  // Boolean-проверка для access control.
  isDepartmentHead(userId, deptId)    // Проверка роли head.
}
```

**API-эндпоинты:**

| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| GET | `/api/departments` | All | Список подразделений с memberCount |
| POST | `/api/departments` | Admin | Создать подразделение |
| GET | `/api/departments/:id` | All | Детали с участниками |
| PUT | `/api/departments/:id` | Admin | Обновить |
| DELETE | `/api/admin/departments/:id` | Admin | Удалить (все `department` QR этого отдела атомарно переводятся в `private` и получают `departmentId = null`) |
| GET | `/api/departments/:id/members` | All | Список участников |
| POST | `/api/departments/:id/members` | Admin | Добавить участника { userId, role } |
| DELETE | `/api/departments/:id/members/:userId` | Admin | Убрать участника |

**Критерии приёмки:**
- [ ] CRUD подразделений работает корректно
- [ ] M2M `user_departments` корректно создаётся/удаляется
- [ ] При удалении подразделения — все QR с `visibility='department'` и этим `departmentId` атомарно переводятся в `visibility='private'` и получают `departmentId = null`
- [ ] API DELETE `/api/admin/departments/:id` возвращает понятное сообщение для UI о количестве переведённых QR
- [ ] `npm run typecheck` — зелёный

---

### Задача 19.3 — Обновление QR Service (visibility logic)

**Приоритет:** 🔴 Critical
**Зависимости:** 19.1, 19.2
**Оценка:** 1.5 дня

**Изменяемые файлы:**

```
server/services/qr.service.ts
types/qr.ts
```

**Детали:**

#### `getQrList` — обновлённая логика фильтрации

```typescript
// Добавить новый query-параметр: scope ('my' | 'department' | 'public' | 'all')
// Добавить query-параметр: departmentId (для фильтра конкретного отдела)

if (user.role === 'admin') {
  // admin: scope-фильтр опционален, по умолчанию показывает всё
  if (filters.scope === 'my') → WHERE createdBy = user.id
  if (filters.scope === 'public') → WHERE visibility = 'public'
  if (filters.scope === 'department') → WHERE visibility = 'department' AND departmentId = filters.departmentId
} else {
  const userDeptIds = await departmentService.getUserDepartmentIds(user.id)
  
  // Базовый WHERE (всегда)
  WHERE (
    createdBy = user.id                                                    // свои (любой видимости)
    OR visibility = 'public'                                               // публичные
    OR (visibility = 'department' AND departmentId IN (userDeptIds))        // отдела
  )
  
  // Дополнительные фильтры scope
  if (filters.scope === 'my') → AND createdBy = user.id
  if (filters.scope === 'public') → AND visibility = 'public' AND createdBy != user.id
  if (filters.scope === 'department') → AND visibility = 'department' AND departmentId IN (userDeptIds)
}
```

#### `checkAccess` — обновлённая логика

```typescript
function checkAccess(qr, user, action: 'view' | 'edit' | 'delete') {
  if (user.role === 'admin') return true
  if (qr.createdBy === user.id) return true
  
  if (action === 'view' || action === 'export') {
    if (qr.visibility === 'public') return true
    if (qr.visibility === 'department') {
      return departmentService.isUserInDepartment(user.id, qr.departmentId)
    }
  }
  
  if (action === 'edit') {
    if (qr.visibility === 'department') {
      return departmentService.isDepartmentHead(user.id, qr.departmentId)
    }
  }
  
  return false // private + not owner + not admin → denied
}
```

#### `createQr` — добавить обработку visibility

```typescript
// Валидация при создании:
// - visibility = 'department' → departmentId обязателен
// - visibility = 'department' → проверить, что user состоит в этом отделе (или admin)
// - visibility = 'private' / 'public' → departmentId игнорируется (null)
```

#### `updateQr` — добавить смену visibility

```typescript
// PATCH /api/qr/:id/visibility — отдельный эндпоинт для быстрой смены
// Валидация правил смены (см. раздел 5.2)
```

**Новые файлы:**

```
server/api/qr/[id]/visibility.patch.ts    — PATCH { visibility, departmentId? }
```

**Критерии приёмки:**
- [ ] Editor видит свои QR + public + department (если в отделе)
- [ ] Admin видит все QR независимо от visibility
- [ ] Создание QR с `visibility: 'department'` без `departmentId` → 422
- [ ] Создание QR с `visibility: 'department'` в чужом отделе → 403
- [ ] PATCH visibility работает с правилами из раздела 5.2
- [ ] `getQrList` с фильтром scope корректно работает для всех ролей
- [ ] Viewer может просматривать public и department QR (если в отделе), но не редактировать
- [ ] Существующие тесты не ломаются (все QR = private по default)

---

### Задача 19.4 — Обновление API-эндпоинтов QR

**Приоритет:** 🔴 Critical
**Зависимости:** 19.3
**Оценка:** 1 день

**Изменяемые файлы:**

```
server/api/qr/index.get.ts           — добавить query: scope, departmentId, visibility
server/api/qr/index.post.ts          — добавить body: visibility, departmentId
server/api/qr/[id].get.ts            — обновить checkAccess
server/api/qr/[id].put.ts            — обновить checkAccess + visibility validation
server/api/qr/[id].delete.ts         — обновить checkAccess
server/api/qr/[id]/duplicate.post.ts — дубликат наследует visibility
server/api/qr/bulk-delete.post.ts    — обновить checkAccess для каждого QR
server/api/qr/[id]/analytics.get.ts  — обновить checkAccess (view)
server/api/qr/[id]/export.get.ts     — обновить checkAccess (view)
```

**Новые файлы:**

```
server/api/qr/[id]/visibility.patch.ts
server/api/qr/bulk-visibility.patch.ts    — массовая смена видимости
```

**Zod-схемы (обновления):**

```typescript
// Дополнение к существующей createSchema:
visibility: z.enum(['private', 'department', 'public']).default('private'),
departmentId: z.string().uuid().nullable().optional(),

// Новая schema для PATCH visibility:
const visibilitySchema = z.object({
  visibility: z.enum(['private', 'department', 'public']),
  departmentId: z.string().uuid().nullable().optional(),
}).refine(
  (data) => data.visibility !== 'department' || data.departmentId,
  { message: 'departmentId required for department visibility' }
)

// Query schema для GET /api/qr (добавить):
scope: z.enum(['all', 'my', 'department', 'public']).default('all'),
departmentId: z.string().uuid().optional(),
visibility: z.enum(['private', 'department', 'public']).optional(),
```

**Критерии приёмки:**
- [ ] GET `/api/qr?scope=my` — только свои QR
- [ ] GET `/api/qr?scope=public` — публичные (кроме своих)
- [ ] GET `/api/qr?scope=department&departmentId=xxx` — QR отдела
- [ ] POST `/api/qr` с visibility: 'department' без departmentId → 422
- [ ] PATCH `/api/qr/:id/visibility` корректно работает
- [ ] PATCH `/api/qr/bulk-visibility` обновляет N QR за один запрос
- [ ] Дубликат наследует visibility оригинала
- [ ] API v1 (`/api/v1/qr/*`) также обновлён с поддержкой visibility

---

### Задача 19.5 — Обновление аналитики

**Приоритет:** 🟡 Medium
**Зависимости:** 19.3
**Оценка:** 0.5 дня

**Изменяемые файлы:**

```
server/services/analytics.service.ts
server/api/analytics/overview.get.ts
server/api/analytics/scans.get.ts
server/api/analytics/top-qr.get.ts
```

**Логика:**

```typescript
// getOverview теперь принимает scope:
// scope = 'my' → метрики только по своим QR
// scope = 'department' → метрики по QR отдела (для участников)
// scope = 'public' → метрики по публичным QR
// scope = 'all' → (admin) все; (non-admin) доступные по видимости

// getTopQrCodes — аналогичный фильтр
// getScansTimeSeries — если qrCodeId указан, проверить access; если нет — scope-фильтр
```

**Критерии приёмки:**
- [ ] Dashboard metrics учитывают scope
- [ ] Editor не видит метрики по чужим приватным QR
- [ ] Admin видит полную картину

---

### Задача 19.6 — Department Management UI

**Приоритет:** 🟡 Medium
**Зависимости:** 19.2
**Оценка:** 1.5 дня

**Новые файлы:**

```
app/pages/settings/departments.vue
app/components/departments/DepartmentDialog.vue
app/components/departments/MembersDialog.vue
app/composables/useDepartments.ts
```

**Изменяемые файлы:**

```
app/pages/settings/index.vue         — добавить кнопку «Подразделения»
app/components/app/Sidebar.vue       — если будет добавлен пункт навигации
locales/ru.json                      — секция departments.*
locales/en.json                      — секция departments.*
```

**UI:**

#### Страница `/settings/departments` (admin only)

- Grid карточек подразделений: название, цвет-бейдж, кол-во участников, кол-во QR, руководитель
- Кнопка «Создать подразделение» → DepartmentDialog (UModal)
- Действия: Редактировать, Управить участниками, Удалить

#### DepartmentDialog.vue

- Поля: Название, Slug (auto-generate), Описание, Цвет (color picker), Руководитель (USelect из users)
- Zod-валидация на клиенте

#### MembersDialog.vue

- Список текущих участников с ролью (member/head)
- Поиск пользователей для добавления (UCommandPalette или USelect с поиском)
- Inline-смена роли
- Удаление участника с подтверждением

**Критерии приёмки:**
- [ ] `/settings/departments` доступна только admin
- [ ] CRUD подразделений через UI работает
- [ ] Управление участниками через модальное окно
- [ ] Цвет-бейдж отдела корректно отображается
- [ ] Удаление подразделения показывает предупреждение о связанных QR

---

### Задача 19.7 — QR List UI: фильтры и бейджи видимости

**Приоритет:** 🔴 Critical
**Зависимости:** 19.4
**Оценка:** 1.5 дня

**Изменяемые файлы:**

```
app/pages/qr/index.vue              — добавить scope-табы, фильтр visibility
app/components/qr/Table.vue         — добавить колонку/бейдж видимости
app/components/qr/Card.vue          — добавить бейдж видимости
app/composables/useQr.ts            — добавить scope и visibility в filters
types/qr.ts                         — обновить типы QrCode, QrFilters
```

**Новые файлы:**

```
app/components/qr/VisibilityBadge.vue
app/components/qr/VisibilitySelect.vue
app/components/qr/BulkVisibilityDialog.vue
```

**UI:**

#### Табы scope (над таблицей/гридом)

```
[Все] [Мои QR] [Отдела ▾] [Публичные]
```

- «Отдела» — если пользователь в нескольких, dropdown с выбором конкретного
- Активный таб подсвечивается, счётчики рядом: `Мои QR (24)`
- Табы реализовать через `UTabs` или кастомный toggle-bar
- Persist выбранного scope в query params (`?scope=my`)

#### VisibilityBadge.vue

```vue
<UBadge :color="visibilityColor" variant="subtle">
  <UIcon :name="visibilityIcon" class="size-3.5 mr-1" />
  {{ t(`qr.visibility.${visibility}`) }}
  <template v-if="visibility === 'department' && departmentName">
    · {{ departmentName }}
  </template>
</UBadge>
```

Маппинг:
- `private` → `i-lucide-lock`, gray
- `department` → `i-lucide-building-2`, blue
- `public` → `i-lucide-globe`, green

#### VisibilitySelect.vue (для форм create/edit)

- URadioGroup или USelect с тремя вариантами
- При выборе «department» → показать USelect с отделами пользователя
- Inline-подсказки под каждым вариантом: «Только вы», «Участники отдела», «Все в компании»

#### Quick action в actions dropdown

- «Сделать публичным» (если private/department)
- «Сделать приватным» (если public/department)
- «Поделиться с отделом» (если private, и user в ≥1 отделе)

#### Bulk actions

- При выборе нескольких QR → новая кнопка «Изменить видимость» → BulkVisibilityDialog

**Критерии приёмки:**
- [ ] Scope-табы корректно фильтруют список
- [ ] Бейджи видимости отображаются в таблице и карточках
- [ ] Quick action смены видимости работает из dropdown
- [ ] VisibilitySelect корректно работает на create/edit
- [ ] Bulk visibility change работает для выбранных QR
- [ ] Счётчики в табах обновляются при смене видимости

---

### Задача 19.8 — Страница «Общие QR-коды»

**Приоритет:** 🟡 Medium
**Зависимости:** 19.7
**Оценка:** 0.5 дня

**Новые файлы:**

```
app/pages/shared/index.vue
```

**Изменяемые файлы:**

```
app/components/app/Sidebar.vue       — новый пункт «Общие QR» (i-lucide-globe)
locales/ru.json, locales/en.json     — ключи shared.*
```

**UI:**

- Переиспользует `QrTable` / `QrCard` с `scope = 'public'`
- Дополнительные фильтры: по автору (USelect), по отделу-атрибуции (USelect)
- EmptyState: «Нет публичных QR-кодов. Сделайте свой QR доступным для всей компании.»
- Ссылка в sidebar между «Папки» и «Аналитика»

**Критерии приёмки:**
- [ ] `/shared` показывает все public QR компании
- [ ] Фильтрация по автору и отделу работает
- [ ] Пункт навигации появляется в sidebar
- [ ] EmptyState отображается при отсутствии публичных QR

---

### Задача 19.9 — Обновление форм create/edit

**Приоритет:** 🔴 Critical
**Зависимости:** 19.7
**Оценка:** 0.5 дня

**Изменяемые файлы:**

```
app/pages/qr/create.vue
app/pages/qr/[id]/edit.vue
app/pages/qr/bulk.vue               — добавить visibility в CSV и wizard
```

**Детали:**

- На странице создания: добавить секцию «Видимость» с `VisibilitySelect`
- На странице редактирования: предзаполнить из текущего QR, показать текущую видимость
- В bulk-создании: добавить колонку `visibility` в CSV-шаблон (default: private)
- В wizard bulk: на шаге 2 (preview) показать колонку visibility
- Валидация: `department` без `departmentId` → ошибка на шаге 3

**Критерии приёмки:**
- [ ] VisibilitySelect появляется на create/edit
- [ ] Default visibility = 'private' (не ломает существующий flow)
- [ ] CSV-шаблон содержит колонку visibility
- [ ] Bulk-создание корректно обрабатывает visibility

---

### Задача 19.10 — Dashboard scope selector

**Приоритет:** 🟢 Low
**Зависимости:** 19.5
**Оценка:** 0.5 дня

**Изменяемые файлы:**

```
app/pages/dashboard/index.vue
app/composables/useAnalytics.ts
```

**UI:**

- Переключатель рядом с DateRangePicker: `[Мои | Отдела | Публичные | Все]`
- «Все» доступен только admin; для остальных означает «все доступные по visibility»
- Переключатель сохраняет состояние в localStorage

**Критерии приёмки:**
- [ ] Scope selector отображается на dashboard
- [ ] Метрики обновляются при смене scope
- [ ] Admin видит вариант «Все» (вся компания)

---

### Задача 19.11 — Локализация и документация

**Приоритет:** 🟡 Medium
**Зависимости:** 19.6–19.10
**Оценка:** 0.5 дня

**Изменяемые файлы:**

```
locales/ru.json
locales/en.json
README.md
CHANGELOG.md
docs/completed-epics.md
```

**Новые ключи i18n:**

```json
{
  "qr": {
    "visibility": {
      "private": "Приватный",
      "department": "Отдел",
      "public": "Публичный",
      "label": "Видимость",
      "hint_private": "Только вы и администраторы",
      "hint_department": "Все участники выбранного отдела",
      "hint_public": "Все авторизованные сотрудники компании",
      "change": "Изменить видимость",
      "make_public": "Сделать публичным",
      "make_private": "Сделать приватным",
      "share_department": "Поделиться с отделом"
    },
    "scope": {
      "all": "Все",
      "my": "Мои QR",
      "department": "Отдела",
      "public": "Публичные"
    }
  },
  "departments": {
    "title": "Подразделения",
    "create": "Создать подразделение",
    "edit": "Редактировать",
    "delete": "Удалить подразделение",
    "members": "Участники",
    "add_member": "Добавить участника",
    "head": "Руководитель",
    "member": "Участник",
    "name": "Название",
    "slug": "Код",
    "description": "Описание",
    "color": "Цвет",
    "qr_count": "{count} QR",
    "member_count": "{count} участников",
    "empty": "Нет подразделений",
    "empty_hint": "Создайте подразделение для разделения QR-кодов по отделам"
  },
  "shared": {
    "title": "Общие QR-коды",
    "empty": "Нет публичных QR-кодов",
    "empty_hint": "Сделайте свой QR доступным для всей компании",
    "filter_author": "Автор",
    "filter_department": "Отдел"
  }
}
```

---

## 8. Порядок реализации

```
Фаза 1 — Backend (3.5 дня)
  19.1 Schema + Migration
  19.2 Department Service
  19.3 QR Service (visibility logic)
  19.4 QR API updates
  19.5 Analytics updates

Фаза 2 — Frontend (4.5 дня)
  19.6 Department Management UI
  19.7 QR List UI (filters + badges)
  19.8 Shared QR page
  19.9 Create/Edit forms
  19.10 Dashboard scope
  19.11 i18n + docs

Суммарно: 8–12 дней (включая тестирование и полировку)
```

---

## 9. Риски и миграционная стратегия

| Риск | Митигация |
|------|-----------|
| Все существующие QR станут private → пользователи потеряют admin-обзор | Миграция безопасна: admin по-прежнему видит всё. Можно добавить one-time скрипт для массовой смены visibility по желанию. |
| Производительность: JOIN через user_departments при каждом запросе списка | Кешировать `getUserDepartmentIds(userId)` в LRU (TTL 5 мин). Индексы на user_departments. |
| Сложность access control: много точек проверки | Единая функция `checkQrAccess(qr, user, action)` вынесена в `server/utils/qr-access.ts`, используется во всех эндпоинтах. |
| Пользователь без отдела не видит department QR | Корректное поведение. EmptyState с подсказкой: «Обратитесь к администратору для добавления в подразделение». |
| Удаление подразделения с активными department-QR | Операция атомарна: такие QR автоматически переводятся в `private` и открепляются (`departmentId = null`), API возвращает количество затронутых QR. |

---

## 10. Изменённые/созданные файлы (сводка)

### Новые файлы (~20)

```
server/db/schema/departments.ts
server/db/schema/user-departments.ts
server/db/migrations/0002_add_departments_and_qr_visibility.sql
server/services/department.service.ts
server/api/departments/index.get.ts
server/api/departments/index.post.ts
server/api/departments/[id].get.ts
server/api/departments/[id].put.ts
server/api/departments/[id].delete.ts
server/api/departments/[id]/members.get.ts
server/api/departments/[id]/members.post.ts
server/api/departments/[id]/members/[userId].delete.ts
server/api/qr/[id]/visibility.patch.ts
server/api/qr/bulk-visibility.patch.ts
server/utils/qr-access.ts
app/pages/settings/departments.vue
app/pages/shared/index.vue
app/components/departments/DepartmentDialog.vue
app/components/departments/MembersDialog.vue
app/components/qr/VisibilityBadge.vue
app/components/qr/VisibilitySelect.vue
app/components/qr/BulkVisibilityDialog.vue
app/composables/useDepartments.ts
```

### Изменённые файлы (~20)

```
server/db/schema/qr-codes.ts
server/db/schema/index.ts
server/db/seed.ts
server/services/qr.service.ts
server/services/analytics.service.ts
server/api/qr/index.get.ts
server/api/qr/index.post.ts
server/api/qr/[id].get.ts
server/api/qr/[id].put.ts
server/api/qr/[id].delete.ts
server/api/qr/[id]/duplicate.post.ts
server/api/qr/bulk-delete.post.ts
server/api/qr/[id]/analytics.get.ts
server/api/qr/[id]/export.get.ts
types/qr.ts
app/pages/qr/index.vue
app/pages/qr/create.vue
app/pages/qr/[id]/edit.vue
app/pages/qr/bulk.vue
app/pages/dashboard/index.vue
app/pages/settings/index.vue
app/components/qr/Table.vue
app/components/qr/Card.vue
app/components/app/Sidebar.vue
app/composables/useQr.ts
app/composables/useAnalytics.ts
locales/ru.json
locales/en.json
CHANGELOG.md
README.md
docs/completed-epics.md
```

---

## 11. Метрики успеха

- **Функциональность:** все 11 задач выполнены и приняты по критериям.
- **Производительность:** `getQrList` с visibility-фильтрацией ≤150ms (p95).
- **Совместимость:** все существующие E2E-тесты проходят без изменений (default = private).
- **Типизация:** `npm run typecheck` — 0 ошибок.
- **Линтинг:** `npm run lint` — 0 ошибок.
- **Охват:** новые API-эндпоинты покрыты E2E-тестами для основных сценариев.
