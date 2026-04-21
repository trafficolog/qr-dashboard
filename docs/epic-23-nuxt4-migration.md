# EPIC 23 — Миграция на Nuxt 4 и обновление ключевых модулей

**Статус:** ✅ Done (закрыт в релизном контуре `v0.15.0`, решение от 2026-04-21)
**Целевая версия:** v0.15.0 (final for EPIC 23; `1.0.0` вне скоупа этого эпика)
**Оценка:** 8–11 дней (включая post-migration review и фиксы)
**Ветка:** `feat/epic-23-nuxt4-migration`
**Зависимости:** Эпики 1–22 (все завершены или в фазе документирования)
**Приоритет:** 🔴 Critical — Nuxt 3 LTS закончился в конце января 2026, проект живёт без получения patch/security-фиксов от апстрима.

---

## 1. Проблема

SPLAT QR Service на момент написания эпика работает на следующем стеке (см. `package.json` на `0.12.1`):

| Пакет | Текущая | Актуальная (апрель 2026) | Статус |
|-------|---------|--------------------------|--------|
| `nuxt` | `^3.16.0` | `^4.4.x` | ⚠️ v3 EOL — конец января 2026 |
| `@nuxt/ui` | `^3.0.0` | `^4.6.x` | ⚠️ v4 требует Nuxt 4 |
| `@nuxtjs/i18n` | `^9.0.0` | `^10.2.x` | ⚠️ v10 = breaking (vue-i18n v10→v11, deprecated APIs) |
| `@pinia/nuxt` | `^0.9.0` | `^0.11.3` | ⚠️ stores dir переехал в `app/stores` |
| `pinia` | `^2.3.0` | `^3.x` | ⚠️ v3 = Vue 3 only, TS 5+, devtools v7 |
| `@vueuse/nuxt` | `^12.0.0` | `^12.x` | ✅ мелкий мажор |
| `drizzle-orm` | `^0.38.0` | `^0.45.x` stable (`1.0.0-beta` доступна) | ⚠️ несколько мажоров |
| `drizzle-kit` | `^0.30.0` | `^0.31.x` stable | ⚠️ несколько мажоров |
| `zod` | `^3.24.0` | `^3.25.x` c subpath `zod/v4` | ⚠️ текущая 3.24 несовместима с некоторыми экосистемными либами |
| `@sentry/node` | `^8.0.0` | `^9.x` | ⚠️ мажор |
| `typescript` | `^5.7.0` | `^5.8.x` | ✅ минор |
| `vitest` | `^2.1.8` | `^3.x` | ⚠️ мажор |
| `@playwright/test` | `^1.48.0` | `^1.54.x` | ✅ минор |
| `eslint` | `^9.0.0` | `^9.18.x` | ✅ минор |
| `@nuxt/icon` | `^1.10.0` | `^1.13.x` | ✅ минор |
| `@nuxt/eslint-config` | `^0.7.0` | `^1.x` | ⚠️ минор-мажор |

Дополнительные риски текущего состояния:
- Отсутствие обновлений безопасности на уровне фреймворка (Nitro, h3, Vite, unjs-стек).
- Невозможность использовать новые best practices по типизации и производительности (TypeScript project references, shallow reactivity в `useAsyncData`/`useFetch`).
- Nuxt UI v3 не получает новых компонентов и багфиксов — релизы идут только в v4.
- `@asteasolutions/zod-to-openapi` и некоторые плагины требуют Zod ≥ 3.25 для корректной работы в экосистеме.
- Pinia v2 в связке с Vue 3.5 и будущими минорами может давать type regressions.

## 2. Цель

1. Мигрировать SPLAT QR Service на **Nuxt 4.x** с сохранением всей функциональности Эпиков 1–22.
2. Поднять все ключевые модули (Nuxt UI, i18n, Pinia, Drizzle, Vitest, Sentry, ESLint, Playwright, TypeScript) до актуальных на момент миграции версий.
3. Провести **полный post-migration review** (ошибки типизации, ESLint, unit и E2E тесты, smoke-прогон всех ключевых флоу) и закрыть все найденные регрессии до merge в `main`.
4. Обновить документацию (README, CHANGELOG, completed-epics, docs/reviews) и зафиксировать релизную версию `0.15.0`.

### 2.1. Что НЕ входит в объём эпика

- Полный переход на Zod 4 (только подготовительная часть — обновление до `3.25+` с возможностью импорта из `zod/v4`). Полная миграция пойдёт отдельным эпиком, когда экосистемные зависимости (`@modelcontextprotocol/sdk`, `@asteasolutions/zod-to-openapi`) начнут поставлять Zod 4 как peer.
- Переход Drizzle на `1.0.0-beta` — только stable `^0.45.x`, чтобы не мешать production deploy.
- Переход на Vue 3.6 (если выйдет) — остаёмся на последнем стабильном мажоре 3.5.x.
- Переход на Nuxt 5 testing (future compatibility). Опционально поддержим `future.compatibilityVersion: 5` для будущего эпика.

---

## 3. Архитектурный анализ текущего состояния

### 3.1. Структура проекта (фактическая)

Проект **уже использует** структуру Nuxt 4 (директория `app/` как `srcDir`) — это ключевой бонус, снижающий риски миграции. Однако есть отклонения, которые надо выправить:

```
splat-qr/
├── nuxt.config.ts
├── app.config.ts                # ❗ Nuxt 4 ожидает этот файл внутри app/
├── assets/css/main.css          # ❗ Nuxt 4 ожидает assets/ внутри app/
├── types/                       # ❗ Должно стать shared/types/
│   ├── auth.ts, qr.ts, api.ts, analytics.ts
├── locales/{ru,en}.json         # ⚠️ @nuxtjs/i18n v10 предпочитает i18n/locales/
├── app/
│   ├── app.vue, error.vue
│   ├── layouts/, middleware/, composables/, stores/
│   ├── utils/, components/, pages/
├── server/                      # ✅ остаётся в корне (соответствует Nuxt 4)
│   ├── db/, api/, services/, middleware/, utils/, plugins/
├── public/                      # ✅ остаётся в корне (соответствует Nuxt 4)
├── drizzle.config.ts            # ✅
├── eslint.config.mjs            # ✅
└── tsconfig.json                # ⚠️ Nuxt 4 рекомендует project references
```

### 3.2. Что нужно изменить на уровне структуры

| Путь сейчас | Путь после миграции | Причина |
|-------------|---------------------|---------|
| `types/` | `shared/types/` | Nuxt 4 auto-imports из `shared/types/*.ts`, типы становятся видны и на клиенте, и на сервере без ручных импортов |
| `assets/` (root) | `app/assets/` | `srcDir = app/` по умолчанию |
| `app.config.ts` (root) | `app/app.config.ts` | Файлы `app.vue`, `app.config.ts`, `error.vue` резолвятся из `srcDir` |
| `locales/` (root) | `i18n/locales/` | Convention по `@nuxtjs/i18n` v10 (не обязательно, но рекомендуется) |
| `stores/` (в `app/`) | `app/stores/` | Уже корректно, но требует обновления `@pinia/nuxt` дефолтов |

### 3.3. Что остаётся неизменным

- `server/` — в корне, полностью соответствует Nuxt 4.
- `public/`, `modules/` (если появятся), `layers/` — в корне.
- `drizzle.config.ts`, `eslint.config.mjs`, `nuxt.config.ts` — в корне.
- Миграции Drizzle (`server/db/migrations/*.sql`) — бинарно совместимы при апгрейде на `0.45.x` stable.

### 3.4. Breaking changes Nuxt 4, актуальные для SPLAT QR

Составлено по [nuxt.com/docs/4.x/getting-started/upgrade](https://nuxt.com/docs/4.x/getting-started/upgrade), с примечанием к конкретным местам в проекте:

| Изменение Nuxt 4 | Влияние на SPLAT QR |
|------------------|---------------------|
| **Singleton Data Fetching Layer** — `useAsyncData`/`useFetch` с одинаковым ключом шарят refs | Проверить `app/composables/useQr.ts`, `useAnalytics.ts`, `useFolders.ts`, `useAuth.ts` на конфликтующие опции (`deep`, `transform`, `pick`) |
| **Shallow reactivity** — `data` теперь `shallowRef` по умолчанию | Проверить все места, где мутируется `.value.something` вместо полной замены `data.value = ...` |
| **Default `data`/`error` = `undefined`** (было `null`) | Поиск сравнений `data.value === null` / `error.value === null` по всему `app/` |
| **Normalized component names** — имя компонента = путь от `components/` | Проверить `<KeepAlive>` usage и unit-тесты через `findComponent()` (у нас Vitest) |
| **`noUncheckedIndexedAccess: true` по умолчанию** | Уже включено в нашем `tsconfig.json`, но надо прогнать `typecheck` ещё раз на Nuxt 4 |
| **TypeScript project references** (opt-in) | Включаем в Phase 5 как бонус; не блокер миграции |
| **Unhead v2** | Мы не используем `vmid`/`hid`, риск минимален; проверить `useHead` в `app/pages/auth/login.vue` и `error.vue` |
| **Parsed `error.data`** | Проверить `app/error.vue` — сейчас нет ручного `JSON.parse(error.data)` |
| **`dedupe: boolean` removed** | Поиск `dedupe: true/false` — заменить на `'cancel'`/`'defer'` |
| **`generate.routes`/`generate.exclude` removed** | У нас не используется (Nitro prerender конфигурируется через `nitro.prerender`) |
| **Deduplication of route metadata** (`route.meta.name` → `route.name`) | Поиск по `app/middleware/**/*.ts` и `app/pages/**/*.vue` |
| **Absolute `builder:watch` paths** | Только если мы пишем свои модули с этим хуком — пока не пишем |

---

## 4. План работ (фазы)

```
Фаза 0 — Подготовка и baseline (0.5 дня)
  23.1 Аудит зависимостей, ветка, compatibility matrix, baseline-метрики

Фаза 1 — Минорные обновления и Nuxt 3.x latest (1 день)
  23.2 Обновить Nuxt до последнего 3.x (3.17+) + compatibilityVersion: 4
  23.3 Обновить @nuxtjs/i18n 9 → 10 (breaking!)

Фаза 2 — Миграция Nuxt 4 (2 дня)
  23.4 Reorg структуры: types → shared/types, assets → app/assets, app.config.ts → app/
  23.5 Upgrade nuxt ^3.x → ^4.0.0 + codemods + фикс breaking changes

Фаза 3 — Мажоры ключевых модулей (2 дня)
  23.6 Nuxt UI v3 → v4
  23.7 Pinia v2 → v3 + @pinia/nuxt update
  23.8 Drizzle ORM/Kit stable update (0.38 → 0.45, 0.30 → 0.31)
  23.9 Zod 3.24 → 3.25+ (подготовка к Zod 4, без полной миграции)
  23.10 Sentry 8 → 9

Фаза 4 — Dev-toolchain (1 день)
  23.11 TypeScript 5.7 → 5.8, Vitest 2 → 3, Playwright, ESLint config

Фаза 5 — Post-migration review и фиксы (1.5–2 дня)
  23.12 Typecheck sweep — фикс всех ошибок типов
  23.13 Lint sweep — фикс всех ошибок линтера
  23.14 Unit + E2E тесты — фикс всех регрессий
  23.15 Smoke E2E — ручной прогон критических флоу (auth, CRUD QR, аналитика, MCP)
  23.16 TypeScript project references (опционально, best-effort)
  23.17 Docker, docker-compose, CI — обновление образов Node, кэшей, команд

Фаза 6 — Релиз (0.5 дня)
  23.18 CHANGELOG, README, completed-epics, review-отчёт, bump версии до 0.15.0

Итого: 8–11 дней с учётом фиксов
```

---

## 5. Задачи

---

### Задача 23.1 — Аудит и baseline

**Приоритет:** 🔴 Critical · Фаза 0
**Оценка:** 0.5 дня

**Изменяемые/создаваемые файлы:**

```
docs/epic-23-nuxt4-migration.md             — этот документ
docs/reviews/epic-23-baseline.md            — baseline-метрики ПЕРЕД миграцией
package.json                                — snapshot версий (уже зафиксирован в git)
.nvmrc                                      — зафиксировать Node LTS (22.x)
```

**Действия:**

1. Создать ветку `feat/epic-23-nuxt4-migration` от `main`.
2. Зафиксировать baseline в `docs/reviews/epic-23-baseline.md`:
   - Версии всех пакетов (`pnpm list --depth=0 > baseline.txt`).
   - Результаты `pnpm typecheck` (кол-во ошибок, если есть).
   - Результаты `pnpm lint` (кол-во ошибок/предупреждений).
   - Результаты `pnpm test:unit` (pass/fail).
   - Результаты `pnpm test:e2e` (pass/fail, длительность).
   - Bundle size: `pnpm build` → `.output/public` размер.
   - Cold start dev-сервера: `time pnpm dev` до первого готового экрана.
3. Убедиться, что Node.js ≥ 22.12 (LTS рекомендованный для Nuxt 4). Зафиксировать в `.nvmrc`.
4. Поднять версию `packageManager` до актуальной: `pnpm@9.15.0` → `pnpm@10.x`.
5. Составить dependency compatibility matrix (таблица в документе `docs/reviews/epic-23-deps-matrix.md`):
   ```
   | Пакет | До | Целевая | Peer deps | Breaking | Codemod |
   |-------|----|---------|-----------|----------|---------|
   | nuxt | 3.16.x | 4.4.x | vue ^3.5 | Yes | nuxt/4/migration-recipe |
   | ... | ... | ... | ... | ... | ... |
   ```

**Критерии приёмки:**
- [ ] Ветка `feat/epic-23-nuxt4-migration` создана от актуального `main`
- [ ] Baseline-метрики зафиксированы в `docs/reviews/epic-23-baseline.md`
- [ ] Compatibility matrix зафиксирован в `docs/reviews/epic-23-deps-matrix.md`
- [ ] `.nvmrc` поднят до 22.12+
- [ ] `package.json` → `packageManager` обновлён

---

### Задача 23.2 — Nuxt 3.x → latest + `compatibilityVersion: 4`

**Приоритет:** 🔴 Critical · Фаза 1
**Зависимости:** 23.1
**Оценка:** 0.5 дня

**Обоснование:** Сначала поднимаем Nuxt 3 до последнего 3.x (где уже бэкпортирована большая часть Nuxt 4 поведения), включаем compatibility flag и проверяем, что приложение работает. Это даёт безопасный fallback, если на фазе 2 что-то пойдёт не так.

**Изменяемые файлы:**

```
package.json            — nuxt: ^3.16.0 → ^3.17.x (последний 3.x)
nuxt.config.ts          — добавить future.compatibilityVersion: 4
```

**Реализация:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4, // ← новое: готовим приложение к Nuxt 4 defaults
  },
  // ... существующая конфигурация
})
```

**Действия:**

1. `pnpm up nuxt@^3 --latest` (поднять в пределах 3.x).
2. Добавить `future.compatibilityVersion: 4`.
3. `rm -rf .nuxt node_modules && pnpm install && pnpm build`.
4. Прогнать `pnpm dev` — убедиться, что приложение стартует.
5. Прогнать `pnpm typecheck` — зафиксировать ошибки для следующих задач.
6. Прогнать `pnpm test:unit` и `pnpm test:e2e` — зафиксировать регрессии.

**Критерии приёмки:**
- [ ] `pnpm build` проходит без ошибок
- [ ] `pnpm dev` стартует и рендерит `/` (после логина)
- [ ] Регрессии от `compatibilityVersion: 4` зафиксированы в issue-трекере (если есть)

---

### Задача 23.3 — `@nuxtjs/i18n` v9 → v10 (breaking)

**Приоритет:** 🔴 Critical · Фаза 1
**Зависимости:** 23.2
**Оценка:** 0.5 дня

**Обоснование:** `@nuxtjs/i18n` v10 содержит значимые breaking changes (vue-i18n v10 → v11, deprecated API, изменённое поведение `redirectOn` при `strategy: 'prefix'`). Разбираем это ДО миграции на Nuxt 4, чтобы регрессии от i18n и от Nuxt не смешивались.

**Изменяемые файлы:**

```
package.json                    — @nuxtjs/i18n: ^9.0.0 → ^10.2.x
nuxt.config.ts                  — проверить опции i18n
app/composables/**.ts           — если используется tc() / $tc() в Legacy API mode
app/components/**/*.vue         — если используется v-t директива
locales/ru.json, locales/en.json — без изменений структуры
```

**Ключевые изменения v10:**

1. **Vue I18n v10 → v11:**
   - Legacy API mode deprecated (проверяем, что мы используем Composition API — `useI18n()`).
   - `tc()` / `$tc()` удалены из Legacy API mode.
   - `v-t` директива deprecated.

2. **Поведение `redirectOn`:**
   - При `strategy: 'prefix'` и `redirectOn: 'root'` нерутовые пути больше не редиректятся.
   - У нас `strategy: 'no_prefix'` (предположительно — надо проверить `nuxt.config.ts`), так что минимум риска. Если `strategy: 'prefix'` — явно выставить `redirectOn: 'all'` для старого поведения.

3. **Compiler constants вместо runtime config:** часть опций теперь билд-тайм.

**Действия:**

1. `pnpm up @nuxtjs/i18n@^10`.
2. Прогнать поиск по проекту:
   ```bash
   grep -rn "v-t=" app/
   grep -rn "\btc(" app/
   grep -rn "\$tc(" app/
   grep -rn "useI18n" app/        # должны остаться только эти — OK
   ```
3. Если найдены `v-t` / `tc()` — заменить на `t()` / `$t()`.
4. Проверить `nuxt.config.ts` на `strategy` и `detectBrowserLanguage.redirectOn`.
5. Прогнать `pnpm dev` — проверить смену языка EN ↔ RU на `/auth/login`, `/dashboard`, `/settings`.

**Критерии приёмки:**
- [ ] `pnpm build` проходит без ошибок
- [ ] Смена языка на UI работает корректно (EN ↔ RU)
- [ ] Все ключи локализации резолвятся (нет fallback на `[key]`)
- [ ] Нет deprecation warnings в консоли от vue-i18n

---

### Задача 23.4 — Реорганизация структуры для Nuxt 4

**Приоритет:** 🔴 Critical · Фаза 2
**Зависимости:** 23.2, 23.3
**Оценка:** 0.5 дня

**Обоснование:** Nuxt 4 по умолчанию использует `srcDir = app/` и ищет `shared/` для кросс-контекстных типов. Мы уже на 90% совместимы; нужно доделать `types/ → shared/types/`, `assets/ → app/assets/`, `app.config.ts → app/app.config.ts`.

**Изменяемые/перемещаемые файлы:**

| Было | Стало |
|------|-------|
| `types/auth.ts` | `shared/types/auth.ts` |
| `types/qr.ts` | `shared/types/qr.ts` |
| `types/api.ts` | `shared/types/api.ts` |
| `types/analytics.ts` | `shared/types/analytics.ts` |
| `assets/css/main.css` | `app/assets/css/main.css` |
| `app.config.ts` | `app/app.config.ts` |
| `locales/ru.json` | `i18n/locales/ru.json` (опционально) |
| `locales/en.json` | `i18n/locales/en.json` (опционально) |

**Действия:**

1. **Подготовка:**
   ```bash
   mkdir -p shared/types
   git mv types/auth.ts shared/types/
   git mv types/qr.ts shared/types/
   git mv types/api.ts shared/types/
   git mv types/analytics.ts shared/types/
   rmdir types
   ```

2. **Переместить CSS:**
   ```bash
   mkdir -p app/assets/css
   git mv assets/css/main.css app/assets/css/main.css
   rm -rf assets
   ```

3. **Переместить `app.config.ts`:**
   ```bash
   git mv app.config.ts app/app.config.ts
   ```

4. **Обновить `nuxt.config.ts`:**
   ```typescript
   // Путь CSS теперь относительно app/
   css: ['~/assets/css/main.css']  // резолвится как app/assets/css/main.css
   ```

5. **Обновить импорты по всему проекту:**
   ```bash
   # Поиск всех импортов из types/
   grep -rn "from '~~/types/" app/ server/
   grep -rn "from '@/types/" app/ server/
   grep -rn 'from "~~/types/' app/ server/
   ```

   Заменить на:
   ```typescript
   // Было:
   import type { User } from '~~/types/auth'
   // Стало (auto-import из shared/types/):
   // импорт больше не нужен — тип доступен глобально через auto-import
   ```

   Для явных импортов — использовать `#shared/types/...` или относительный путь.

6. **Опционально — локали в `i18n/locales/`:**
   ```bash
   mkdir -p i18n/locales
   git mv locales/ru.json i18n/locales/
   git mv locales/en.json i18n/locales/
   rmdir locales
   ```

   Обновить `nuxt.config.ts`:
   ```typescript
   i18n: {
     langDir: 'locales/',   // относительно restructure/i18n/
     locales: [
       { code: 'ru', file: 'ru.json' },
       { code: 'en', file: 'en.json' },
     ],
   }
   ```

**Действия по автоматизации:**

```bash
# Можно использовать codemod от Nuxt:
npx codemod@0.18.7 nuxt/4/file-structure --dry-run
# Ревью → apply
npx codemod@0.18.7 nuxt/4/file-structure
```

**Критерии приёмки:**
- [ ] `shared/types/*.ts` существуют и авто-импортятся в `app/` и `server/`
- [ ] `app/assets/css/main.css` существует, стили применяются
- [ ] `app/app.config.ts` существует, тема SPLAT применяется
- [ ] `pnpm typecheck` — количество ошибок не выше baseline
- [ ] `pnpm dev` стартует, все страницы открываются
- [ ] Локализация работает (независимо от того, переместили `locales/` или нет)

---

### Задача 23.5 — Upgrade Nuxt 3.x → 4.0

**Приоритет:** 🔴 Critical · Фаза 2
**Зависимости:** 23.4
**Оценка:** 1.5 дня

**Изменяемые файлы:**

```
package.json              — nuxt: ^3.17.x → ^4.0.0 (позже up до 4.x latest)
nuxt.config.ts            — удалить future.compatibilityVersion: 4 (дефолт)
app/composables/**.ts     — фиксы breaking changes
app/pages/**/*.vue        — фиксы breaking changes
app/middleware/**.ts      — фиксы breaking changes
```

**Действия:**

1. **Upgrade:**
   ```bash
   pnpm up nuxt@^4 --latest
   pnpm up @nuxt/icon@^1 --latest  # минорный апгрейд
   rm -rf .nuxt node_modules pnpm-lock.yaml
   pnpm install
   ```

2. **Запустить codemod recipe:**
   ```bash
   npx codemod@0.18.7 nuxt/4/migration-recipe
   # Выбираем все применимые, деселектим уже сделанное (file-structure)
   ```

3. **Ручные фиксы breaking changes:**

   **A. `useAsyncData` / `useFetch` — проверка consistency:**
   ```bash
   grep -rn "useAsyncData\|useFetch" app/
   ```
   Для каждого вызова с одинаковым key — убедиться, что опции (`deep`, `transform`, `pick`, `getCachedData`) не конфликтуют между вызовами.

   **B. Shallow reactivity:**
   ```bash
   # Поиск мутаций внутри data
   grep -rn "data\.value\." app/
   ```
   Если есть — либо заменить мутацию на полную замену `data.value = {...}`, либо включить `deep: true` на конкретный вызов.

   **C. `null` → `undefined` для `data`/`error`:**
   ```bash
   grep -rn "data\.value === null\|error\.value === null" app/
   ```
   Можно автоматически: `npx codemod@latest nuxt/4/default-data-error-value`.

   **D. `dedupe: boolean` → `'cancel'` / `'defer'`:**
   ```bash
   grep -rn "dedupe: true\|dedupe: false" app/
   ```
   Auto-fix: `npx codemod@latest nuxt/4/deprecated-dedupe-value`.

   **E. `route.meta.name` → `route.name` и т.п.:**
   ```bash
   grep -rn "route\.meta\.\(name\|path\|alias\|redirect\)" app/
   ```
   Заменить на `route.name`, `route.path`, и т.д.

4. **Удалить `future.compatibilityVersion: 4`** из `nuxt.config.ts` (стало дефолтом).

5. **Прогнать:**
   ```bash
   pnpm build
   pnpm typecheck
   pnpm lint
   pnpm test:unit
   pnpm test:e2e
   ```

**Критерии приёмки:**
- [ ] `package.json` → `nuxt: ^4.0.0` (или последний 4.x)
- [ ] `nuxt.config.ts` без `future.compatibilityVersion`
- [ ] `pnpm build` проходит без ошибок
- [ ] `pnpm dev` стартует, основные страницы рендерятся
- [ ] `pnpm typecheck` — ошибок не больше, чем на 23.4
- [ ] Все существующие E2E тесты проходят (или задокументированы как регрессии в отчёте)

---

### Задача 23.6 — Nuxt UI v3 → v4

**Приоритет:** 🔴 Critical · Фаза 3
**Зависимости:** 23.5
**Оценка:** 1 день

**Обоснование:** Nuxt UI v4 = Nuxt UI + Nuxt UI Pro в одном пакете, 110+ компонентов, требует Nuxt 4. Миграция v3 → v4 обещана «smooth» без массовых breaking, но есть точечные моменты: `modelModifiers` (nullify → nullable), Form component state handling, `@source` directive в Tailwind.

**Изменяемые файлы:**

```
package.json                       — @nuxt/ui: ^3.0.0 → ^4.0.0
app/assets/css/main.css            — обновить @source directive (после реорга структуры)
app/components/**/*.vue            — проверить UInput/UTextarea/UInputNumber modelModifiers
app/components/qr/ExportDialog.vue, shared/ConfirmDialog.vue, folders/FolderDialog.vue, departments/*Dialog.vue (EPIC 19) — если используют UForm
```

**Ключевые изменения:**

1. **modelModifiers переименование:**
   ```vue
   <!-- Было -->
   <UInput v-model.nullify="value" />
   <UTextarea v-model="value" :model-modifiers="{ nullify: true }" />

   <!-- Стало -->
   <UInput v-model.nullable="value" />
   <UTextarea v-model="value" :model-modifiers="{ nullable: true }" />
   ```

2. **`@source` в CSS:**
   ```css
   /* Если у нас был @source, надо скорректировать путь после перехода в app/ */
   @import "tailwindcss";
   @import "@nuxt/ui";
   /* Было: @source "../../content/**/*"; */
   /* Стало: @source "../../../content/**/*"; — если content/ в корне */
   ```
   В нашем случае content/ не используется — проверить, но скорее всего правка не нужна.

3. **UForm:** схема transformations теперь применяется только к `@submit` data, не мутирует state формы. Проверить `app/components/qr/*Dialog.vue`, `app/components/folders/FolderDialog.vue`, `app/components/departments/DepartmentDialog.vue` (из EPIC 19) — если используется UForm с transform.

4. **AI chat компоненты** — не используем, не актуально.

**Действия:**

1. `pnpm up @nuxt/ui@^4`.
2. Обновить `app/assets/css/main.css`, если нужно.
3. Прогнать поиск:
   ```bash
   grep -rn "nullify" app/
   grep -rn "UForm\|:schema=" app/
   ```
4. Прогнать `pnpm dev` и smoke-тест:
   - `/auth/login` — форма email + OTP работает
   - `/qr/create` — форма QR работает, валидация работает
   - `/settings` — все формы работают
   - Все USelect/UInputMenu открываются, выбор работает
   - Toast, Modal, Dialog открываются корректно
5. Проверить `app.config.ts` — тема `primary: splat` продолжает применяться.

**Критерии приёмки:**
- [ ] `pnpm build` проходит
- [ ] Все формы (login, create QR, edit QR, bulk CSV, team invite, domains) работают
- [ ] Нет визуальных регрессий на `/dashboard`, `/qr`, `/analytics`, `/settings`
- [ ] Тема SPLAT (красная палитра) применяется
- [ ] Нет консольных warning'ов от Nuxt UI

---

### Задача 23.7 — Pinia v2 → v3 + @pinia/nuxt

**Приоритет:** 🟡 High · Фаза 3
**Зависимости:** 23.5
**Оценка:** 0.5 дня

**Обоснование:** Pinia v3 поддерживает только Vue 3, TS 5+, devtools v7. Breaking changes минимальны (deprecated `PiniaPluginContext` type alias removed). Главное — обновить `@pinia/nuxt` до `0.11.3+`, где уже учтён новый `app/stores/` путь для Nuxt 4.

**Изменяемые файлы:**

```
package.json                — pinia: ^2.3.0 → ^3.x, @pinia/nuxt: ^0.9.0 → ^0.11.3
app/stores/auth.ts          — проверить типы, потенциальные deprecated API
app/stores/ui.ts            — то же
nuxt.config.ts              — проверить pinia.storesDirs (должно быть ['./stores'] или ['app/stores'])
```

**Действия:**

1. `pnpm up pinia@^3 @pinia/nuxt@^0.11`.
2. Проверить `nuxt.config.ts` — сейчас должна быть дефолтная настройка, автоподхват из `app/stores/`. Если была явная `pinia.storesDirs: ['./stores']` — убрать или поправить.
3. Прогнать `pnpm typecheck` — искать ошибки вида `Type 'PiniaPluginContext' is deprecated`.
4. Проверить `app/stores/auth.ts`:
   ```typescript
   // Должно работать без изменений:
   export const useAuthStore = defineStore('auth', () => { ... })
   ```

**Критерии приёмки:**
- [ ] `pnpm build` проходит
- [ ] Auth flow работает (login → session хранится в store → logout)
- [ ] UI store (`ui.ts`) работает — тема, sidebar collapsed, etc.

---

### Задача 23.8 — Drizzle ORM / Kit stable update

**Приоритет:** 🟡 High · Фаза 3
**Зависимости:** 23.5
**Оценка:** 0.5 дня

**Обоснование:** Drizzle 0.38 → 0.45 stable — несколько мажоров с мелкими breaking changes в типах и мелкими API-улучшениями. НЕ идём на 1.0.0-beta, чтобы не ловить миграцию формата migrations folder.

**Изменяемые файлы:**

```
package.json                        — drizzle-orm: ^0.38.0 → ^0.45.x, drizzle-kit: ^0.30.0 → ^0.31.x
drizzle.config.ts                   — проверить совместимость
server/db/index.ts                  — проверить импорты
server/db/schema/**.ts              — проверить импорты (pgTable, references, etc.)
server/db/migrations/migrate.ts     — проверить API migrator
server/services/**.ts               — проверить query builder API (if changed)
```

**Действия:**

1. **Backup БД и migration folder** (страховка перед любым апгрейдом Drizzle):
   ```bash
   cp -r server/db/migrations server/db/migrations.backup.pre-epic-23
   pg_dump $DATABASE_URL > backup-pre-epic-23.sql
   ```

2. `pnpm up drizzle-orm@^0.45 drizzle-kit@^0.31`.

3. **Запустить проверку миграций:**
   ```bash
   pnpm db:generate   # должна проходить без ошибок, не должна генерить пустые diff'ы
   ```

4. **Прогнать миграции на dev-БД:**
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

5. **Проверить Drizzle Studio:**
   ```bash
   pnpm db:studio
   ```

6. **Прогнать unit тесты по сервисам:**
   ```bash
   pnpm test:unit -- server/services
   ```

7. **Точки внимания в API:**
   - Если где-то использовались внутренние импорты `drizzle-orm/pg-core/types` — проверить.
   - `onConflictDoUpdate` — без изменений.
   - `drizzle-zod` теперь встроен в `drizzle-orm` (с 1.0-beta; на 0.45 ещё отдельный пакет, если используется — оставить).

**Критерии приёмки:**
- [ ] `pnpm db:generate` не генерит diff (схема совпадает с текущими миграциями)
- [ ] `pnpm db:migrate` выполняется успешно на чистой БД
- [ ] `pnpm db:seed` работает (10 QR, 400 scan events создаются)
- [ ] Все unit тесты по сервисам (`*.service.test.ts`) зелёные
- [ ] API `/api/qr`, `/api/analytics/*` возвращают корректные данные

---

### Задача 23.9 — Zod 3.24 → 3.25+ (подготовка к Zod 4)

**Приоритет:** 🟡 High · Фаза 3
**Зависимости:** 23.5
**Оценка:** 0.5 дня

**Обоснование:** Zod 3.25 ввёл subpath `zod/v4` при сохранении Zod 3 как дефолта. Это НЕ миграция на Zod 4 — это обновление, которое устраняет deprecated warnings и открывает путь к постепенной миграции в отдельном эпике. Важно: часть экосистемных зависимостей (`@asteasolutions/zod-to-openapi`, `@modelcontextprotocol/sdk`) всё ещё ожидают Zod 3.

**Изменяемые файлы:**

```
package.json                       — zod: ^3.24.0 → ^3.25.x (НЕ ^4)
server/utils/validate.ts           — убедиться, что используется zod (не zod/v3 явно)
server/openapi/schemas.ts          — то же
server/api/**.ts                   — без изменений (импорты остаются `from 'zod'`)
```

**Действия:**

1. `pnpm up zod@^3.25`.
2. Прогнать `pnpm typecheck` — искать новые type errors (вряд ли будут).
3. Убедиться, что все импорты `from 'zod'` работают как раньше.
4. **НЕ** мигрировать на `zod/v4` в рамках этого эпика — это отдельный план.

**Критерии приёмки:**
- [ ] `pnpm build` проходит
- [ ] OpenAPI спецификация генерируется корректно (`pnpm openapi:generate`)
- [ ] Все валидации на API работают (валидные payload → 200, невалидные → 422)

---

### Задача 23.10 — Sentry v8 → v9

**Приоритет:** 🟢 Medium · Фаза 3
**Зависимости:** 23.5
**Оценка:** 0.5 дня

**Обоснование:** Sentry v9 содержит умеренные breaking changes в API инициализации и интеграций. У нас минимальная интеграция (`@sentry/node` на Nitro), риск низкий.

**Изменяемые файлы:**

```
package.json                           — @sentry/node: ^8.0.0 → ^9.x
server/plugins/sentry.ts               — если есть (проверить)
server/utils/sentry.ts                 — если есть
nuxt.config.ts                         — runtime config для Sentry DSN
```

**Действия:**

1. `pnpm up @sentry/node@^9`.
2. Проверить release notes Sentry v9 (миграционный guide).
3. Проверить `server/plugins/sentry.ts` (если есть) на deprecated API инициализации.
4. Прогнать dev-сервер и убедиться, что Sentry подключается без ошибок (лог инициализации в stdout).
5. Опционально — триггернуть тестовую ошибку и проверить, что она доходит до Sentry (если Sentry активен в dev).

**Критерии приёмки:**
- [ ] `pnpm build` проходит
- [ ] Инициализация Sentry в Nitro не кидает ошибок на старте сервера
- [ ] Runtime errors на сервере ловятся и пересылаются (проверить на тестовом endpoint'е, если есть)

---

### Задача 23.11 — Dev-toolchain: TypeScript 5.8, Vitest 3, Playwright, ESLint

**Приоритет:** 🟢 Medium · Фаза 4
**Зависимости:** 23.5
**Оценка:** 1 день

**Изменяемые файлы:**

```
package.json             — typescript, vitest, @playwright/test, @axe-core/playwright, eslint, @nuxt/eslint-config, @nuxt/eslint-config-prettier
tsconfig.json            — проверить совместимость
vitest.config.ts         — проверить API (если был v2-specific)
eslint.config.mjs        — проверить совместимость с @nuxt/eslint-config ^1.x
playwright.config.ts     — обновления API (если были)
```

**Действия:**

1. **TypeScript 5.7 → 5.8:**
   ```bash
   pnpm up typescript@^5.8 --save-dev
   pnpm typecheck
   ```
   Ожидается: нулевое количество новых ошибок (TS 5.8 в основном quality-of-life изменения).

2. **Vitest 2 → 3:**
   ```bash
   pnpm up vitest@^3 --save-dev
   pnpm test:unit
   ```
   Breaking changes vitest 3:
   - Built-in test context (ранее `expect`, `test`, `it` авто-импортились; если `globals: false` — надо импортить явно).
   - Некоторые deprecated API удалены (проверить `vitest.config.ts`).
   - Новые defaults для coverage (v8 вместо c8).

3. **Playwright update:**
   ```bash
   pnpm up @playwright/test@^1 --latest
   pnpm exec playwright install
   pnpm test:e2e
   ```

4. **ESLint config:**
   ```bash
   pnpm up @nuxt/eslint-config@^1 eslint@^9 --save-dev
   pnpm lint
   ```
   ESLint 9 flat config уже используется (`eslint.config.mjs`) — должно пройти гладко.

5. **`@nuxt/eslint-config-prettier`** — убедиться, что совместим с `prettier@^3.4`.

**Критерии приёмки:**
- [ ] `pnpm typecheck` — 0 ошибок (или не больше, чем зафиксировано в baseline)
- [ ] `pnpm test:unit` — все тесты зелёные
- [ ] `pnpm test:e2e` — все E2E тесты зелёные
- [ ] `pnpm lint` — 0 ошибок

---

### Задача 23.12 — Typecheck sweep (post-migration)

**Приоритет:** 🔴 Critical · Фаза 5
**Зависимости:** 23.5, 23.6, 23.7, 23.8, 23.9, 23.10, 23.11
**Оценка:** 0.5 дня

**Цель:** Исправить ВСЕ новые ошибки типизации, появившиеся после комплексной миграции.

**Частые категории ошибок (ожидаемые):**

1. **`noUncheckedIndexedAccess`** (усилено в Nuxt 4 defaults):
   ```typescript
   // Было (раньше проходило):
   const item = arr[0]
   console.log(item.name)   // item потенциально undefined

   // Надо:
   const item = arr[0]
   if (item) console.log(item.name)
   // или
   const item = arr.at(0)!
   ```

2. **Shallow ref data:**
   ```typescript
   const { data } = useFetch('/api/qr')
   // Было (работало):
   data.value.items.push(newItem)   // мутация вложенного массива не триггерит ре-рендер
   // Надо:
   data.value = { ...data.value, items: [...data.value.items, newItem] }
   ```

3. **`null` → `undefined` для data/error.**

4. **Pinia v3** — `PiniaPluginContext` deprecated type alias.

5. **Drizzle 0.45** — уточнения типов для некоторых query builder паттернов.

**Действия:**

1. `pnpm typecheck > typecheck-output.txt`
2. Группировать ошибки по файлу/категории.
3. Фиксить партиями по категориям — так проще найти паттерн.
4. Коммит с чёткими сообщениями: `fix(types): Nuxt 4 — handle shallow ref in useAnalytics`, etc.

**Критерии приёмки:**
- [ ] `pnpm typecheck` — **0 ошибок**
- [ ] Не добавлено ни одного `// @ts-ignore` без комментария с TODO-ссылкой
- [ ] Исправления покрыты существующими тестами

---

### Задача 23.13 — Lint sweep (post-migration)

**Приоритет:** 🔴 Critical · Фаза 5
**Зависимости:** 23.12
**Оценка:** 0.25 дня

**Действия:**

1. `pnpm lint > lint-output.txt`
2. По возможности — `pnpm lint:fix`.
3. Оставшиеся ошибки — фиксить вручную.
4. Особое внимание — к правилам `@nuxt/eslint-config` v1, которые могли усилить строгость.

**Критерии приёмки:**
- [ ] `pnpm lint` — **0 ошибок**, 0 warnings (или warnings задокументированы в `docs/reviews/epic-23-lint-exceptions.md` с обоснованием)

---

### Задача 23.14 — Unit + E2E tests фиксы

**Приоритет:** 🔴 Critical · Фаза 5
**Зависимости:** 23.12, 23.13
**Оценка:** 0.5 дня

**Действия:**

1. Прогнать `pnpm test:unit` и `pnpm test:e2e`, зафиксировать список падений.
2. Категоризировать причины:
   - **Vitest 3 API** — мелкие фиксы, возможно `vi.mock` изменения.
   - **Nuxt 4 data reactivity** — `.value` вместо mutations.
   - **Nuxt UI v4 DOM структура** — изменились атрибуты/классы у компонентов → меняем селекторы.
   - **i18n v10** — локализация ключей, если были hard-coded.
3. Фиксить партиями, каждый фикс — отдельный commit с ref на тест.

**Ключевые E2E сценарии, которые обязаны работать (из существующих тестов):**

- `auth.spec.ts` — email → OTP → dashboard
- `qr-crud.spec.ts` — create, edit, delete QR
- `analytics.spec.ts` — открытие страницы аналитики, geo map, device breakdown
- `bulk-csv.spec.ts` — bulk import 10 QR из CSV
- `a11y.spec.ts` — axe-core smoke
- `mcp.spec.ts` (EPIC 22) — MCP endpoint доступен и отвечает

**Критерии приёмки:**
- [ ] `pnpm test:unit` — 100% зелёное
- [ ] `pnpm test:e2e` — 100% зелёное
- [ ] Нет skipped/todo тестов, добавленных во время миграции (кроме явно задокументированных follow-up)

---

### Задача 23.15 — Smoke E2E ручной прогон

**Приоритет:** 🔴 Critical · Фаза 5
**Зависимости:** 23.14
**Оценка:** 0.25 дня

**Цель:** Убедиться, что автотесты не пропустили визуальные/UX регрессии.

**Чеклист ручного прогона** (фиксируется в `docs/reviews/epic-23-smoke-checklist.md`):

**Auth flow:**
- [ ] `/auth/login` открывается, форма email валидирует домен
- [ ] OTP отправляется на email, код принимается
- [ ] После успешного login → `/dashboard`
- [ ] Logout возвращает на `/auth/login`

**QR CRUD:**
- [ ] `/qr` — список QR корректно отображается (enriched cards, table view)
- [ ] `/qr/create` — форма создаёт QR со style editor
- [ ] `/qr/[id]` — детали QR, превью, статистика
- [ ] `/qr/[id]/edit` — редактирование, folder/tag/visibility
- [ ] Bulk delete / bulk visibility change работает

**Analytics:**
- [ ] `/analytics` — все 5 блоков (scans chart, geo map, devices, time distribution, top QR) загружаются
- [ ] Compare previous period работает
- [ ] Фильтры по periоду / по QR применяются

**Settings:**
- [ ] `/settings` — табы Profile, Team, Domains, Departments (EPIC 19)
- [ ] Invite team member отправляет email
- [ ] Добавление/toggle/удаление allowed domain работает

**MCP (EPIC 22):**
- [ ] `GET /mcp/capabilities` возвращает список tools/resources
- [ ] `POST /mcp` с корректным API key отвечает
- [ ] Scopes соблюдаются (нет доступа к tool без `mcp:access`)

**Доступность / i18n:**
- [ ] Смена EN ↔ RU переключает все UI-тексты
- [ ] Tab navigation, Esc для закрытия Modal — работают
- [ ] axe DevTools не даёт critical issues на ключевых страницах

**Dark / Light theme:**
- [ ] Переключение работает, SPLAT palette применяется в обеих темах

**Критерии приёмки:**
- [ ] Все пункты чеклиста отмечены в `docs/reviews/epic-23-smoke-checklist.md`
- [ ] Найденные регрессии либо исправлены, либо занесены в follow-up issue

---

### Задача 23.16 — TypeScript project references (опционально)

**Приоритет:** 🟢 Low · Фаза 5
**Зависимости:** 23.12
**Оценка:** 0.5 дня

**Обоснование:** Nuxt 4 предлагает новый TS setup с раздельными `tsconfig.app.json`, `tsconfig.server.json`, `tsconfig.shared.json`, `tsconfig.node.json`. Это даёт лучший IntelliSense и типовую изоляцию. Best-effort: делаем, если укладываемся в бюджет; откатываем и переносим в follow-up, если ломается CI.

**Изменяемые файлы:**

```
tsconfig.json       — убрать "extends": "./.nuxt/tsconfig.json", добавить "references"
package.json        — "typecheck": "nuxt prepare && vue-tsc -b --noEmit"
```

**Реализация:**

```json
// tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./.nuxt/tsconfig.app.json" },
    { "path": "./.nuxt/tsconfig.server.json" },
    { "path": "./.nuxt/tsconfig.shared.json" },
    { "path": "./.nuxt/tsconfig.node.json" }
  ]
}
```

```json
// package.json
{
  "scripts": {
    "typecheck": "nuxt prepare && vue-tsc -b --noEmit"
  }
}
```

**Действия:**

1. Удалить `server/tsconfig.json` (если был) — теперь контекст управляется auto-сгенерированными tsconfig'ами.
2. Проверить, что type augmentations живут в правильных папках:
   - Augmentation для app → `app/**/*.d.ts`
   - Augmentation для server → `server/**/*.d.ts`
   - Shared → `shared/**/*.d.ts`
3. Прогнать `pnpm typecheck`.

**Критерии приёмки:**
- [ ] `pnpm typecheck` — 0 ошибок
- [ ] IntelliSense в IDE корректно различает server и client контексты
- [ ] Если есть регрессии — откатываем задачу, пишем follow-up

---

### Задача 23.17 — Docker, CI, runtime инфраструктура

**Приоритет:** 🟡 High · Фаза 5
**Зависимости:** 23.14
**Оценка:** 0.5 дня

**Изменяемые файлы:**

```
Dockerfile                  — обновить базовый образ Node 20 → Node 22 LTS
docker-compose.yml          — без изменений (если не используется Node явно)
.github/workflows/*.yml      — если есть CI
.nvmrc                      — зафиксировать 22.x (уже сделано в 23.1)
```

**Действия:**

1. **Dockerfile:**
   ```dockerfile
   # Было:
   FROM node:20-alpine AS base
   # Стало:
   FROM node:22-alpine AS base
   ```
   Перепроверить stage `builder`, `migrator`, `production`.

2. **docker-compose.yml:** проверить, что `service: app` собирается из нового Dockerfile без ошибок.

3. **pnpm:** поднять до 10.x (`packageManager` поле + corepack).

4. **CI (если есть):** обновить Node версию в `actions/setup-node` и кэши для `pnpm@10`.

5. **Локальный прогон:**
   ```bash
   docker compose build --no-cache app
   docker compose up -d postgres migrate
   docker compose up app
   # Проверить, что http://localhost:3000 отвечает
   ```

**Критерии приёмки:**
- [ ] `docker compose build app` проходит на чистом кеше
- [ ] `docker compose up` запускает полный стек (postgres + migrate + app)
- [ ] App отвечает на `/api/auth/me` (401) и рендерит `/auth/login`

---

### Задача 23.18 — Финальный релиз и документация

**Приоритет:** 🔴 Critical · Фаза 6
**Зависимости:** все предыдущие
**Оценка:** 0.5 дня

**Изменяемые файлы:**

```
package.json                              — version 0.12.1 → 0.15.0
CHANGELOG.md                              — новая запись [0.15.0] - 2026-04-30 (пример даты)
README.md                                 — бейдж версии Nuxt, команды, версии
docs/completed-epics.md                   — раздел «Эпик 23 — Миграция на Nuxt 4»
docs/epic-23-nuxt4-migration.md           — mark as Done
docs/reviews/epic-23-final-review.md      — финальный отчёт (см. ниже)
```

**CHANGELOG.md (шаблон):**

```markdown
## [0.15.0] - 2026-04-XX

### Changed
- **BREAKING (infra):** Миграция на Nuxt 4.x с сохранением всей функциональности
- **BREAKING (infra):** Обновление `@nuxt/ui` v3 → v4, `@nuxtjs/i18n` v9 → v10, Pinia v2 → v3
- Обновление `drizzle-orm` 0.38 → 0.45, `drizzle-kit` 0.30 → 0.31
- Обновление `vitest` v2 → v3, TypeScript 5.7 → 5.8
- Реорганизация: `types/` → `shared/types/`, `assets/` → `app/assets/`, `app.config.ts` → `app/app.config.ts`
- Docker base image: Node 20 → Node 22 LTS

### Fixed
- Типизация `useAsyncData`/`useFetch` под shallow reactivity Nuxt 4
- Фикс регрессий `i18n` v10 на flow смены локали
- Фиксы в формах (Nuxt UI v4) — `nullable` modifier

### Security
- Все зависимости обновлены до версий, получающих security-патчи
```

**`docs/reviews/epic-23-final-review.md` — структура:**

1. Статус всех 18 задач эпика
2. Финальные baseline vs post-migration метрики (bundle size, dev cold start, typecheck time)
3. Список найденных и исправленных регрессий
4. Список follow-up задач (если есть)
5. Threat / risk re-assessment (появились ли новые риски безопасности)

**Действия:**

1. Bump версии в `package.json`.
2. Обновить `CHANGELOG.md`.
3. Написать `docs/reviews/epic-23-final-review.md` (по шаблону).
4. Обновить `README.md`:
   - Бейдж Nuxt 4.x
   - Актуальные команды (без изменений, но проверить)
   - Ссылка на миграционный review
5. Добавить раздел «Эпик 23» в `docs/completed-epics.md`.
6. Создать tag `v0.15.0` после merge PR.

**Критерии приёмки:**
- [ ] Все 18 задач эпика отмечены выполненными
- [ ] `package.json` → `version: "0.15.0"`
- [ ] `CHANGELOG.md` содержит запись `[0.15.0]`
- [ ] `docs/reviews/epic-23-final-review.md` опубликован
- [ ] `README.md` обновлён
- [ ] PR прошёл CI (lint, typecheck, tests)

---

## 6. Зависимости между задачами

| Задача | Зависит от | Блокирует |
|--------|------------|-----------|
| 23.1 | — | все последующие |
| 23.2 | 23.1 | 23.3, 23.4 |
| 23.3 | 23.2 | 23.4 |
| 23.4 | 23.2, 23.3 | 23.5 |
| 23.5 | 23.4 | 23.6–23.11 |
| 23.6 | 23.5 | 23.12 |
| 23.7 | 23.5 | 23.12 |
| 23.8 | 23.5 | 23.12 |
| 23.9 | 23.5 | 23.12 |
| 23.10 | 23.5 | 23.12 |
| 23.11 | 23.5 | 23.12 |
| 23.12 | 23.6–23.11 | 23.13 |
| 23.13 | 23.12 | 23.14 |
| 23.14 | 23.12, 23.13 | 23.15 |
| 23.15 | 23.14 | 23.18 |
| 23.16 | 23.12 | 23.18 (опц.) |
| 23.17 | 23.14 | 23.18 |
| 23.18 | все | — |

**Критический путь:** 23.1 → 23.2 → 23.3 → 23.4 → 23.5 → 23.6 → 23.12 → 23.13 → 23.14 → 23.15 → 23.18

---

## 7. Риски и митигация

| ID | Риск | Вероятность | Импакт | Митигация |
|----|------|-------------|--------|-----------|
| R-01 | Codemod от Nuxt пропускает часть кейсов → ручные фиксы затягиваются | Средняя | Medium | Делаем задачу 23.12 «typecheck sweep» специальной задачей с бюджетом 0.5 дня. Все найденные кейсы документируются и учитываются как паттерн для ревью. |
| R-02 | Drizzle 0.45 ломает бинарную совместимость старых миграций | Низкая | High | Backup БД и migrations folder перед апгрейдом (23.8). Не идём на 1.0.0-beta, где формат migrations точно меняется. |
| R-03 | Nuxt UI v4 даёт визуальные регрессии (измененные классы/атрибуты) | Средняя | Medium | Ручной smoke (23.15), визуальный ревью на staging. При критичных регрессиях — быстрый rollback Nuxt UI до 3.x (возможно с Nuxt 4, если не будет других issue). |
| R-04 | `@nuxtjs/i18n` v10 + `strategy: 'prefix'` меняет поведение редиректов | Низкая | Medium | 23.3 выделен как отдельная задача с явной проверкой `nuxt.config.ts`. У нас по умолчанию `no_prefix`, риск низкий. |
| R-05 | Pinia v3 type regression в связке с Vue 3.5 + TS 5.8 | Низкая | Low | Мелкая задача 23.7, быстрый роллбэк возможен. Pinia v2 совместима с Vue 3.5 и продолжит работать. |
| R-06 | Zod 3.25 несовместим с `@asteasolutions/zod-to-openapi` 7.3.4 | Низкая | Medium | Проверить генерацию OpenAPI после апгрейда (23.9). Если проблема — поднять `@asteasolutions/zod-to-openapi` до последней мажорной версии. |
| R-07 | Vitest 3 ломает существующие mocks / globals | Средняя | Low | Задача 23.14 посвящена фиксам тестов, бюджет 0.5 дня с запасом. |
| R-08 | TypeScript project references (23.16) ломают CI | Низкая | Medium | 23.16 помечен как опциональный; откат до flat tsconfig — 1 коммит. |
| R-09 | Docker: Node 22 Alpine не стартует / не находит native модули (sharp, @sentry/node) | Низкая | High | 23.17 с явным локальным прогоном. Backup образа Node 20 до полного подтверждения. |
| R-10 | Смешанные изменения в одной ветке → сложность ревью | Высокая | Medium | **Делаем PR-серии по фазам:** PR1 (23.1–23.3), PR2 (23.4–23.5), PR3 (23.6–23.11), PR4 (23.12–23.18). Каждый PR проходит CI и ревью отдельно. |
| R-11 | Регрессия в MCP Server (EPIC 22) при обновлении Zod | Средняя | High | MCP активно использует Zod схемы. В 23.15 обязательный smoke по MCP tools + resources. |
| R-12 | Production deploy: несовместимость с существующими сессиями / API ключами после bump | Низкая | High | Перед деплоем — прогон миграции на staging с production-snapshot. API ключи хранятся как SHA-256 hash, сессии — в БД; формат не меняется. |

---

## 8. Сводка изменённых/созданных файлов

### Новые файлы (~5)

```
shared/types/auth.ts                        ← перенос из types/
shared/types/qr.ts                          ← перенос из types/
shared/types/api.ts                         ← перенос из types/
shared/types/analytics.ts                   ← перенос из types/
app/app.config.ts                           ← перенос из корня
app/assets/css/main.css                     ← перенос из assets/
docs/epic-23-nuxt4-migration.md             ← этот документ
docs/reviews/epic-23-baseline.md
docs/reviews/epic-23-deps-matrix.md
docs/reviews/epic-23-smoke-checklist.md
docs/reviews/epic-23-final-review.md
.nvmrc                                      ← 22.12+
```

### Удалённые файлы

```
types/                                      ← перемещено в shared/types/
assets/                                     ← перемещено в app/assets/
app.config.ts (root)                        ← перемещено в app/
server/tsconfig.json                        ← если был (project references на 23.16)
```

### Изменённые файлы (~30)

```
package.json                                 — все зависимости + version + scripts
pnpm-lock.yaml                              — regenerated
nuxt.config.ts                              — i18n opts, css path, remove compatibilityVersion
tsconfig.json                               — project references (23.16) + compilerOptions
eslint.config.mjs                           — @nuxt/eslint-config v1 совместимость
vitest.config.ts                            — Vitest 3 API
playwright.config.ts                        — Playwright 1.54+ API
Dockerfile                                  — Node 22 LTS
docker-compose.yml                          — если нужно
drizzle.config.ts                           — проверка совместимости

app/app.vue                                 — возможные мелкие правки
app/error.vue                               — Unhead v2 check
app/composables/useAuth.ts                  — default undefined → undefined, shallow ref
app/composables/useQr.ts                    — аналогично
app/composables/useAnalytics.ts             — аналогично
app/composables/useFolders.ts               — аналогично
app/composables/useDepartments.ts           — (EPIC 19) аналогично
app/stores/auth.ts                          — Pinia v3 совместимость
app/stores/ui.ts                            — Pinia v3 совместимость
app/components/**/*.vue                     — Nuxt UI v4 modelModifiers, UForm
app/pages/**/*.vue                          — мелкие фиксы data.value usage
app/middleware/auth.global.ts               — route.meta.name → route.name

server/db/index.ts                          — Drizzle 0.45 импорты
server/db/schema/**.ts                      — проверка (обычно без изменений)
server/services/**.ts                       — проверка query builder API
server/api/**.ts                            — проверка
server/plugins/sentry.ts                    — Sentry v9 (если есть)

CHANGELOG.md
README.md
docs/completed-epics.md
```

---

## 9. Метрики успеха

| Метрика | Baseline (до) | Target (после) | Критерий |
|---------|---------------|----------------|----------|
| `pnpm typecheck` | 0 ошибок | 0 ошибок | Must |
| `pnpm lint` | 0 ошибок | 0 ошибок | Must |
| `pnpm test:unit` | 100% pass | 100% pass | Must |
| `pnpm test:e2e` | 100% pass | 100% pass | Must |
| Nuxt версия | 3.16.x | 4.x (latest) | Must |
| Bundle size (`.output/public`) | baseline | ≤ baseline + 5% | Must |
| Dev cold start (`pnpm dev`) | baseline | ≤ baseline − 10% (ожидается улучшение) | Should |
| Security audit (`pnpm audit`) | N high/critical | 0 high/critical | Must |
| Функциональность EPIC 1–22 | 100% | 100% (smoke-covered) | Must |
| OpenAPI спецификация | генерится | генерится | Must |
| MCP Server (EPIC 22) | работает | работает (smoke-covered) | Must |

---

## 10. Стратегия PR-серии

Для минимизации риска и удобства ревью — эпик разбивается на **4 последовательных PR**:

**PR1 — Подготовка и мягкие обновления** (задачи 23.1–23.3)
- Cкоуп: baseline, branch, Nuxt 3.latest + compatibilityVersion: 4, @nuxtjs/i18n v10
- Размер: ~500–800 LOC diff
- Ревьюер фокус: конфиги, i18n поведение

**PR2 — Миграция Nuxt 4** (задачи 23.4–23.5)
- Скоуп: реорг структуры, nuxt ^4.x, codemods
- Размер: 300–500 файлов перемещены (git mv), ~1500 LOC функциональных изменений
- Ревьюер фокус: корректность перемещений, фиксы breaking changes

**PR3 — Мажоры модулей** (задачи 23.6–23.11)
- Скоуп: Nuxt UI v4, Pinia v3, Drizzle, Zod, Sentry, Vitest, TS
- Размер: ~1000 LOC
- Ревьюер фокус: каждый мажор — отдельный commit для простоты revert

**PR4 — Review, фиксы, релиз** (задачи 23.12–23.18)
- Скоуп: typecheck, lint, test фиксы, Docker, release
- Размер: ~500 LOC
- Ревьюер фокус: отчёты, чеклисты, финальная версия

После merge PR4 → tag `v0.15.0` → deploy на staging → smoke → deploy на production.

---

## 11. Follow-up задачи (планируются ПОСЛЕ эпика)

Эти задачи **не входят** в scope EPIC 23, но фиксируются здесь как направление:

- **NEXT-23-01:** Полная миграция Zod 3 → Zod 4 (когда `@asteasolutions/zod-to-openapi` и `@modelcontextprotocol/sdk` будут официально поддерживать Zod 4 как peer).
- **NEXT-23-02:** Эксперимент с `future.compatibilityVersion: 5` для подготовки к Nuxt 5 (Vite 6 Environment API, hookable v6).
- **NEXT-23-03:** Drizzle ORM 0.45 → 1.0 (stable), с учётом нового формата migrations folder.
- **NEXT-23-04:** Vue 3.6 (когда станет стабильным) + проверка Vapor mode.
- **NEXT-23-05:** Переход на Pinia Colada для server state (если решим отказаться от нашего паттерна composables + useFetch).

---

*Документ подготовлен в рамках планирования EPIC 23.*
*Дата: 2026-04-20.*
*Автор плана: команда Cenalasta.*
