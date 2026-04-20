# EPIC 23 Baseline — до миграции на Nuxt 4

**Дата фиксации:** 2026-04-20  
**Ветка:** `feat/epic-23-nuxt4-migration`  
**Версия проекта:** `0.13.0`

---

## 1) Среда

- **Node.js:** `v22.21.1`
- **pnpm:** `10.17.1`
- **Nuxt (resolved):** `3.21.2`
- **Совместимость Nuxt:** `compatibilityVersion: 4` (из логов `nuxt typecheck`/`nuxt build`)

---

## 2) Snapshot зависимостей (`pnpm list --depth=0`)

### Dependencies

| Пакет | Версия |
|---|---|
| @asteasolutions/zod-to-openapi | 7.3.4 |
| @modelcontextprotocol/sdk | 1.29.0 |
| @pinia/nuxt | 0.9.0 |
| @scalar/api-reference | 1.52.3 |
| @sentry/node | 8.55.1 |
| @vueuse/nuxt | 12.8.2 |
| dotenv | 16.6.1 |
| drizzle-orm | 0.38.4 |
| echarts | 5.6.0 |
| geoip-lite | 1.4.10 |
| lru-cache | 11.3.5 |
| nanoid | 5.1.9 |
| node-cron | 3.0.3 |
| nodemailer | 6.10.1 |
| nuxt | 3.21.2 |
| papaparse | 5.5.3 |
| pdfkit | 0.16.0 |
| pg | 8.20.0 |
| pinia | 2.3.1 |
| qrcode | 1.5.4 |
| sharp | 0.33.5 |
| ua-parser-js | 1.0.41 |
| vue | 3.5.32 |
| vue-echarts | 7.0.3 |
| vue-router | 4.6.4 |
| zod | 3.25.76 |

### Dev dependencies

| Пакет | Версия |
|---|---|
| @axe-core/playwright | 4.11.2 |
| @nuxt/eslint-config | 0.7.6 |
| @nuxt/icon | 1.15.0 |
| @nuxt/ui | 3.3.7 |
| @nuxtjs/i18n | 9.5.6 |
| @playwright/test | 1.59.1 |
| drizzle-kit | 0.30.6 |
| eslint | 9.39.4 |
| prettier | 3.8.3 |
| typescript | 5.9.3 |
| vitest | 2.1.9 |

---

## 3) Baseline проверки

| Проверка | Статус | Результат |
|---|---:|---|
| `pnpm typecheck` | ❌ fail | 22 TS-ошибки (преимущественно `useClipboard`/`@vueuse/core` not found, несоответствия типов DTO, тестовые runtime зависимости). Время: `real 0m44.412s`. |
| `pnpm lint` | ❌ fail | 81 проблем: **21 errors**, **60 warnings**. Время: `real 0m11.338s`. |
| `pnpm test:unit` | ❌ fail | 22 test files: **18 failed**, **4 passed**; 14 tests: **3 failed**, **11 passed**. Время: `real 0m17.579s`. |
| `pnpm test:e2e` | ❌ fail | **18 failed**, **66 skipped**. После установки browser binaries и system deps (`pnpm e2e:install-browsers`) падения перешли из env-level в тестовый контур: часть тестов требует `PLAYWRIGHT_AUTH_COOKIE`, часть UI-тестов падает на assertions/navigation. Время: `real 0m52.413s`. |
| `pnpm build` | ✅ pass | Сборка проходит после фиксов Tailwind/i18n; `tailwindcss` resolve-ошибка устранена. Остались non-blocking предупреждения от `@nuxt/fonts/unifont` (провайдеры шрифтов недоступны по сети) и предупреждение о крупных chunk'ах. |
| `timeout 40s pnpm dev` | ⚠️ partial | Dev-сервер поднимается (`Local: http://localhost:3000/`), но есть pre-transform ошибка `Can't resolve 'tailwindcss'`. Измерение ограничено `timeout 40s`. |

---

## 4) Bundle size baseline

- `pnpm build` завершился успешно; build-артефакты сформированы в `.output/` (включая `.output/public` и `.output/server`).
- В логах остались non-blocking предупреждения по `@nuxt/fonts` (сетевой доступ к внешним font providers), но они не прерывают сборку.

---

## 5) Вывод

Текущий baseline показывает, что до старта миграции есть накопленный технический долг в тестовом и build-контурах. Для корректного сравнения `baseline -> post-migration` потребуется стабилизировать pipeline (build + e2e runtime prerequisites) либо учитывать эти ограничения как «known baseline issues» в финальном review.

---

## 5.1) Quality debt triage (must-fix vs can-defer)

### Must-fix до начала фаз 23.4+

1. **Core auth/session unit flow:** `useRuntimeConfig` на module-level в `server/utils/ip.ts` ломает unit-тесты авторизации (`cookie-policy`) вне Nuxt runtime.
2. **Core API contract type safety:** DTO-мэпперы v1 (`folders`, `destinations`, `tags`) ожидают поля `updatedAt`, которые не всегда возвращаются сервисами.
3. **Core security UX type safety:** `useSecurityError` может передавать `undefined` в `t(...)` из-за индексации по коду ошибки.
4. **Test quality gates для core backend сервисов:** lint/type ошибки в `cookie-policy`, `folder.service.test`, `team.service.test` блокируют объективный gate-check.

### Допустимый технический долг (can-defer после открытия 23.4+)

1. Vue/UX lint warnings (`vue/max-attributes-per-line`, `vue/no-v-html`) без регрессии core flow.
2. Массовые типовые ошибки автоимпортов VueUse в UI-слое (`useClipboard`, `useMagicKeys`, `whenever`, и т.д.) — требуют отдельного фронтенд sweep.
3. Vitest-конфликт с Playwright e2e-спеками и пустые suites в некритичных интеграционных файлах — отдельный test harness track.

---

## 6) Migration Gates (минимальные условия перехода к 23.4/23.5)

| Gate | Минимальное условие | Owner | Целевая дата |
|---|---|---|---|
| MG-23-A (Build readiness) | ✅ Выполнено 2026-04-20: `pnpm build` проходит без ошибки `Can't resolve 'tailwindcss'` | Frontend Lead | 2026-04-22 |
| MG-23-B (E2E environment readiness) | ✅ Выполнено 2026-04-20: browser binaries + системные зависимости устанавливаются командой `pnpm e2e:install-browsers` (локально и в CI перед `pnpm test:e2e`) | QA/Automation Lead | 2026-04-22 |
| MG-23-C (Quality debt triage) | ✅ Выполнено 2026-04-20: известные TS/lint/unit долги классифицированы в `must-fix` и `can-defer` (см. раздел 5.1) | Tech Lead | 2026-04-23 |
| MG-23-D (Core quality gate) | ✅ Выполнено 2026-04-20: must-fix core flow закрыт (auth/session unit path, DTO type-safety v1, `useSecurityError` type-safety, core service tests); подтверждено целевыми проверками `eslint` + `vitest` по core-файлам. | Tech Lead + QA | 2026-04-24 |

**Правило перехода к 23.4/23.5:** старт работ разрешён **только при статусе `MG-23-D = ✅`** (и сохранении `MG-23-A..C = ✅`). До этого задачи фаз 23.4/23.5 не стартуют.
