# EPIC 23 — Dependency Compatibility Matrix

**Дата:** 2026-04-20  
**Контекст:** матрица обновлений для миграции `Nuxt 3.x -> Nuxt 4.x`.

| Пакет | Текущая версия | Целевая | Policy | Peer deps / совместимость | Breaking | Codemod |
|---|---:|---:|---|---|---|---|
| `nuxt` | `3.21.2` | `^4.4.x` | `range` | `vue ^3.5`, Node 20+/22 LTS | Yes (major) | `npx codemod@latest nuxt/4/migration-recipe` |
| `@nuxt/ui` | `3.3.7` | `^4.6.x` | `range` | Nuxt 4, Vue 3.5+ | Yes | `npx codemod@latest @nuxt/ui/4` *(если доступен)* |
| `@nuxtjs/i18n` | `9.5.6` | `^10.2.x` | `range` | Nuxt 3.16+/4, `vue-i18n` v10/v11 APIs | Yes | Нет официального полного codemod |
| `@pinia/nuxt` | `0.9.0` | `^0.11.3` | `range` | Pinia 2/3, Nuxt 3/4 | Minor/behavioral | Нет |
| `pinia` | `2.3.1` | `^3.x` | `range` | Vue 3.5+, TS 5+ | Yes (major) | Нет |
| `@vueuse/nuxt` | `12.8.2` | `^12.x` | `pin` *(оставить как есть: `12.8.2`)* | `@vueuse/core` same-major | No/low | Нет |
| `drizzle-orm` | `0.38.4` | `^0.45.x` | `range` | `pg`/driver-specific peers | Minor/behavioral | Нет |
| `drizzle-kit` | `0.30.6` | `^0.31.x` | `range` | sync с `drizzle-orm` stable | Minor | Нет |
| `zod` | `3.25.76` | `^3.25.x` (prep к v4) | `pin` *(оставить как есть: `3.25.76`)* | Для экосистемы часто `>=3.25` | No (в пределах v3) | Нет |
| `@sentry/node` | `8.55.1` | `^9.x` | `range` | Node LTS, Sentry SDK peers | Yes (major) | `npx @sentry/migr8@latest` *(опционально)* |
| `typescript` | `5.9.3` | `^5.8+` *(уже ок)* | `freeze-until-release` *(зафиксировать диапазон: `>=5.8 <6`)* | Nuxt 4 рекомендует TS 5.8+ | No | Нет |
| `vitest` | `2.1.9` | `^3.x` | `range` | Vite 5/6/7 matrix | Yes (major) | Нет |
| `@playwright/test` | `1.59.1` | `^1.54+` *(уже ок)* | `freeze-until-release` *(зафиксировать диапазон: `>=1.59.1 <2`)* | Нужны установленные browser binaries | No (current >= target) | Нет |
| `eslint` | `9.39.4` | `^9.x` *(уже ок)* | `freeze-until-release` *(зафиксировать диапазон: `>=9.39.4 <10`)* | flat config, `@nuxt/eslint-config` совместимость | No | Нет |
| `@nuxt/icon` | `1.15.0` | `^1.13+` *(уже ок)* | `freeze-until-release` *(зафиксировать диапазон: `>=1.15.0 <2`)* | Nuxt module compatibility | No | Нет |
| `@nuxt/eslint-config` | `0.7.6` | `^1.x` | `range` | ESLint 9 flat config | Minor/major | Нет |

## Release policy decision (EPIC 23)

**Принятое решение (2026-04-21):** EPIC 23 закрывается релизом **`0.15.0`**.  
Переход на **`1.0.0`** в рамках EPIC 23 **не объявляется** и выносится в отдельный релизный трек после стабилизации post-release follow-up (`NEXT-23-04..NEXT-23-07`) и полного e2e regression pass.

Основания решения:

1. Скоуп EPIC 23 — технологическая миграция (Nuxt 4 + ecosystem upgrades), а не финальная semver-стабилизация продуктового контракта.
2. В финальном review зафиксирован `conditional sign-off` и открытые post-release задачи высокого приоритета (в т.ч. e2e stabilization).
3. Для снижения release-risk применяется freeze-политика до выпуска `0.15.0`; дополнительные major-решения принимаются отдельным governance-решением.

## Release lock policy 0.15.0

До выхода `0.15.0` обновления зависимостей выполняются по правилам:

1. **`freeze-until-release`**: обновления запрещены, кроме security/critical fixes. Версии удерживаются в зафиксированном диапазоне до релиза.
2. **`pin`**: точечная фиксация текущей версии в lockfile и `package.json` (без авто-апдейта даже в пределах minor/patch).
3. **`range`**: обновления допустимы только в рамках согласованного целевого range из матрицы и только через отдельный PR с changelog review.
4. Любой major-бамп во время freeze-периода переносится после `0.15.0`, если не одобрен отдельно как release blocker.

## Обязательный regression pass после изменения версии

При любом изменении версии обязателен полный regression pass для следующих пакетов:

- `@nuxt/ui`
- `@nuxtjs/i18n`
- `pinia`
- `vitest`
- `@sentry/node`

Минимальный объём regression pass:

- smoke навигации/SSR-гидрации,
- i18n routes и переключение локалей,
- state persistence / store hydration,
- unit/integration тесты на новом runtime vitest,
- error capture pipeline (Sentry DSN/env, source maps, release tags).

## Примечания

1. По ряду пакетов «текущая» в lockfile уже выше, чем в исходном плане эпика (из-за широких semver ranges в `package.json`).
2. Для `@nuxt/ui`, `@nuxtjs/i18n`, `pinia`, `vitest`, `@sentry/node` требуется отдельный трек миграционных фиксов и регрессионного тестирования.
3. Для `playwright` baseline указывает на runtime prerequisite: обязательно выполнить `pnpm exec playwright install` в CI/локальной среде перед smoke/E2E.


## Upgrade log (wave-by-wave) — 2026-04-21

### Wave 1 — UI/i18n track (`@nuxt/ui`, `@nuxtjs/i18n`)

- `@nuxt/ui`: `3.3.7 -> 4.6.1`
- `@nuxtjs/i18n`: `9.5.6 -> 10.2.4`
- Проверка целевых страниц: `auth`, `qr`, `analytics`, `settings` запущена через Playwright-спеки:
  - `e2e/auth.spec.ts`
  - `e2e/qr-list.spec.ts`
  - `e2e/analytics.spec.ts`
  - `e2e/settings-tabs.spec.ts`
- Результат прогона: блокер окружения (в контейнере отсутствуют browser binaries Playwright), требуется `pnpm exec playwright install` перед повторным smoke.

**Breaking notes:**
- Для Nuxt UI v4 в проекте подтверждена совместимость базовых компонентов (`UButton`, `UInput`, `UModal`, `UCard`) без немедленных API-правок в коде; финальная визуальная регрессия остаётся в post-install smoke.
- Для `@nuxtjs/i18n` v10 сохранён текущий контракт `strategy: 'no_prefix'`, `lazy: true`, `langDir: 'locales/'`.

### Wave 2 — State track (`@pinia/nuxt`, `pinia`)

- `@pinia/nuxt`: `0.9.0 -> 0.11.3`
- `pinia`: `2.3.1 -> 3.0.4`
- Зафиксирован контракт setup-store для `auth` в unit-тесте `app/stores/auth.store.contract.spec.ts`.

**Breaking notes:**
- Контракт store-actions/state для `useAuthStore` подтверждён на Pinia v3 (инициализация через `createPinia()/setActivePinia()`, работа `setUser/clear`, вычисление `isAuthenticated`).

### Wave 3 — Data layer (`drizzle-orm`, `drizzle-kit`, `zod`)

- `drizzle-orm`: `0.38.4 -> 0.45.2`
- `drizzle-kit`: `0.30.6 -> 0.31.10`
- `zod`: `3.25.76` сохранён и зафиксирован в `package.json` как `^3.25.76`

**Breaking notes:**
- Контракт DTO/map-адаптеров и серверных схем подтверждён существующими unit-тестами (`server/api/v1/contracts.test.ts`, `server/services/folder.service.test.ts`).
- Переход на `drizzle-orm` 0.45.x не потребовал немедленной правки schema DSL в текущем коде.

### Wave 4 — Observability (`@sentry/node`)

- `@sentry/node`: `8.55.1 -> 9.47.1`
- Введён явный builder контракта конфигурации: `createSentryNodeOptions() (server/utils/sentry-config.ts)`.
- Добавлен unit-тест контракта: `server/utils/sentry-config.test.ts`.

**Breaking notes:**
- Для Sentry v9 зафиксирован серверный init-контракт: `dsn`, `environment`, `release`, `tracesSampleRate`, `sendDefaultPii`.
- `release` теперь читается из `process.env.NUXT_APP_VERSION` для единообразной трассировки релизов.
