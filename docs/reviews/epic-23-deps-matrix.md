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
