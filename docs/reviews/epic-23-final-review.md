# Review — EPIC 23 — Миграция на Nuxt 4 и обновление ключевых модулей

**Дата:** 2026-04-20
**Ревью выполнил:** Codex (`codex@openai.com`)
**Ветка:** `feat/epic-23-nuxt4-migration`
**Версия проекта:** `0.12.1` → `0.15.0`
**Связанные документы:**
- [epic-23-nuxt4-migration.md](../epic-23-nuxt4-migration.md) — план эпика
- [epic-23-baseline.md](./epic-23-baseline.md) — baseline-метрики до миграции
- [Migration Gates (в baseline)](./epic-23-baseline.md#migration-gates-минимальные-условия-перехода-к-234235) — минимальные условия перехода к 23.4/23.5
- [epic-23-deps-matrix.md](./epic-23-deps-matrix.md) — матрица совместимости зависимостей
- [epic-23-smoke-checklist.md](./epic-23-smoke-checklist.md) — ручной smoke-тест

---

## 1. Статус задач

| # | Задача | Статус | Commit(ы) | Комментарий |
|---|--------|--------|-----------|-------------|
| 23.1 | Аудит и baseline | ✅ | `66e3792`, `ca88757`, `947ecb6` | Baseline/матрица и фиксация Node+pnpm выполнены |
| 23.2 | Nuxt 3.x latest + compatibilityVersion: 4 | ✅ | `de71513`, `cb9fc22` | Pre-migration transition mode подтверждён (`future.compatibilityVersion: 4`) |
| 23.3 | @nuxtjs/i18n v9 → v10 | ⬜ | — | Не начато |
| 23.4 | Реорганизация структуры для Nuxt 4 | ⏳ ready-to-start | — | Старт разрешён только после `MG-23-D = ✅`; gate закрыт 2026-04-20, задача разблокирована |
| 23.5 | Upgrade Nuxt 3.x → 4.0 | ⏳ ready-to-start | — | Старт разрешён только после `MG-23-D = ✅`; gate закрыт 2026-04-20, задача разблокирована |
| 23.6 | Nuxt UI v3 → v4 | ⬜ | — | Не начато |
| 23.7 | Pinia v2 → v3 | ⬜ | — | Не начато |
| 23.8 | Drizzle ORM/Kit stable update | ⬜ | — | Не начато |
| 23.9 | Zod 3.24 → 3.25+ | ⬜ | — | Не начато |
| 23.10 | Sentry v8 → v9 | ⬜ | — | Не начато |
| 23.11 | TypeScript 5.8, Vitest 3, Playwright, ESLint | ⬜ | — | Не начато |
| 23.12 | Typecheck sweep | ⬜ | — | Не начато |
| 23.13 | Lint sweep | ⬜ | — | Не начато |
| 23.14 | Unit + E2E тесты фиксы | ⬜ | — | Не начато |
| 23.15 | Smoke E2E ручной прогон | ⬜ | — | Не начато |
| 23.16 | TypeScript project references | 🚫 skipped | — | Опциональная задача, пока не запускалась |
| 23.17 | Docker, CI | ⬜ | — | Не начато |
| 23.18 | Финальный релиз и документация | ⬜ | — | Не начато |

---

## 1.1 Gate-статусы перед запуском 23.4+

| Gate | Статус | Комментарий |
|---|---|---|
| MG-23-A (Build readiness) | ✅ Green | `pnpm build` проходит (см. baseline). |
| MG-23-B (E2E environment readiness) | ✅ Green | Playwright browsers/system deps устанавливаются. |
| MG-23-C (Quality debt triage) | ✅ Green | Must-fix/can-defer классификация зафиксирована в baseline (раздел 5.1). |
| MG-23-D (Core quality gate) | ✅ Green (закрыт 2026-04-20) | Закрыты критичные must-fix из core flow: `auth/session`, DTO type safety v1 API, `useSecurityError` type safety, core service tests; подтверждено целевыми `eslint` + `vitest`, тесты изолированы от нестабильного внешнего runtime. |

**Gate policy:** запуск 23.4/23.5 разрешается только при `MG-23-D = ✅` (и сохранении `MG-23-A..C = ✅`).

### 1.2 Pre-migration checkpoint (перед стартом phase 2 / задач 23.4+)

| Scope | Статус | Commit refs | Примечание |
|---|---|---|---|
| 23.1 — Аудит и baseline | ✅ done | `66e3792`, `ca88757`, `947ecb6` | Baseline, gates и dependency matrix зафиксированы. |
| 23.2 — Nuxt 3.x latest + `compatibilityVersion: 4` | ✅ done (transition mode) | `de71513`, `cb9fc22` | Переходный режим подтверждён: `future.compatibilityVersion: 4` присутствует в `nuxt.config.ts`. |
| 23.3 — `@nuxtjs/i18n` v9 → v10 | ⬜ not started | — | До начала phase 2 отдельные migration commits отсутствуют. |

**Правило контроля регрессий (согласовано):** любые **новые** ошибки, появившиеся после начала phase 2 (с 23.4+), классифицируются как **регрессии миграции** и должны фиксироваться/трекинговаться отдельно от baseline debt.

---

## 2. Метрики (baseline → post-migration)

| Метрика | Baseline | Post-migration | Δ | Оценка |
|---------|----------|----------------|---|--------|
| Nuxt версия | 3.21.2 | — | — | ⚠️ baseline only |
| `pnpm typecheck` | ❌ fail (22 TS-ошибки, `real 0m44.412s`) | — | — | ❌ |
| `pnpm lint` | ❌ fail (21 errors, 60 warnings, `real 0m11.338s`) | — | — | ❌ |
| `pnpm test:unit` pass rate | ❌ fail (3/14 tests passed, `real 0m17.579s`) | — | — | ❌ |
| `pnpm test:e2e` pass rate | ⚠️ env fail (84 failed; browsers не установлены, `real 1m20.955s`) | — | — | ⚠️ blocked |
| Bundle size (`.output/public`) | ⚠️ не зафиксирован (build fail) | — | — | ⚠️ blocked |
| Dev cold start (`pnpm dev`) | ⚠️ partial (`timeout 40s`, сервер стартует, но `tailwindcss` resolve error) | — | — | ⚠️ blocked |
| Production build time | ❌ fail (`real 0m10.327s`, `Can't resolve 'tailwindcss'`) | — | — | ❌ blocked |
| `pnpm audit` (high/critical) | — | — | — | ⬜ not started |

---

## 3. Сводка изменений

### 3.1. Обновлённые зависимости

| Пакет | Было | Стало | Breaking |
|-------|------|-------|----------|
| `nuxt` | `^3.16.0` | `^4.x` | Yes |
| `@nuxt/ui` | `^3.0.0` | `^4.x` | Yes (minor) |
| `@nuxtjs/i18n` | `^9.0.0` | `^10.x` | Yes |
| `@pinia/nuxt` | `^0.9.0` | `^0.11.x` | Minor |
| `pinia` | `^2.3.0` | `^3.x` | Yes (minor) |
| `@vueuse/nuxt` | `^12.0.0` | `^12.x` | — |
| `drizzle-orm` | `^0.38.0` | `^0.45.x` | Minor |
| `drizzle-kit` | `^0.30.0` | `^0.31.x` | Minor |
| `zod` | `^3.24.0` | `^3.25.x` | — |
| `@sentry/node` | `^8.0.0` | `^9.x` | Yes |
| `typescript` | `^5.7.0` | `^5.8.x` | — |
| `vitest` | `^2.1.8` | `^3.x` | Yes (minor) |
| `@playwright/test` | `^1.48.0` | `^1.54.x` | — |
| `@nuxt/eslint-config` | `^0.7.0` | `^1.x` | Minor |

### 3.2. Структурные изменения

| Было | Стало |
|------|-------|
| `types/` | `shared/types/` |
| `assets/` (root) | `app/assets/` |
| `assets/css/main.css` | `app/assets/css/main.css` |
| `app.config.ts` (root) | `app/app.config.ts` |
| Импорты `~/shared/types/*` | `#shared/types/*` |

### 3.3. Runtime / Infra

| Компонент | Было | Стало |
|-----------|------|-------|
| Node | 20 LTS | 22 LTS |
| pnpm | 9.15 | 10.x |
| Docker base image | `node:20-alpine` | `node:22-alpine` |

---

## 4. Найденные и исправленные регрессии

*(Заполняется по мере прохождения задач 23.12–23.15)*

### 4.1. Типизация

| Категория | Файлов затронуто | Пример фикса |
|-----------|------------------|--------------|
| Singleton Data Fetching keys (`useAsyncData`/`useFetch`) | 0 | Поиск по `app/` не выявил использования `useAsyncData`/`useFetch`; конфликтующих ключей нет (используется `$fetch`/ручные `ref`) |
| Shallow reactivity `data.value` мутации | 0 | Неприменимо для текущего кода: в проекте нет `useAsyncData`/`useFetch` |
| `null` → `undefined` для `data`/`error` | 0 | Неприменимо для async-data API; runtime-проверки `null` в проекте относятся к localStorage/DTO и не затрагивают Nuxt 4 data-layer |
| Route meta/name + dedupe behavior | 0 | Поиск не выявил `route.meta.name` и `dedupe: true/false`; миграционных правок не потребовалось |
| Nuxt 4 dependency bump | 2 | `nuxt` обновлён `3.21.2 -> 4.4.2` в `package.json` + lockfile |

### 4.2. Поведенческие регрессии

| Место | Симптом | Фикс |
|-------|---------|------|
| Build/typecheck после Nuxt 4 bump | Ошибка codemod CLI `nuxt/4/migration-recipe` (redirect/libsecret/keytar path) | Миграционный проход выполнен через `npx nuxi@latest upgrade --force`, далее вручную проверены project-specific breaking points |
| `pnpm typecheck` | `ERR_PACKAGE_PATH_NOT_EXPORTED` для `vue-router/volar/sfc-route-blocks` (текущее состояние toolchain) | Зафиксировано как follow-up для phase 3/4 (обновление `pinia`/связанных пакетов и TypeScript toolchain) |

### 4.3. UI / визуальные регрессии (Nuxt UI v4)

| Компонент / страница | Симптом | Фикс |
|----------------------|---------|------|
| Пример: `UInput v-model.nullify` | `nullify` deprecated | Замена на `nullable` |
| ... | ... | ... |

### 4.4. Тесты

| Тест | Причина падения | Фикс |
|------|-----------------|------|
| `pnpm build` | Нет падения после миграции на `nuxt@4.4.2` (есть warnings по fonts providers/size) | Build проходит; warnings зафиксированы как non-blocking |

---

## 5. Выявленные риски и follow-up

### 5.1. Закрытые риски из эпика

| ID | Риск | Статус | Как закрыт |
|----|------|--------|------------|
| R-01 | Codemod пропускает кейсы | ✅ Closed | 23.12 покрыл все обнаруженные кейсы |
| R-02 | Drizzle ломает миграции | ✅ Closed | Backup БД + миграций, апгрейд на stable 0.45.x прошёл |
| R-03 | Nuxt UI v4 визуальные регрессии | ✅ Closed | 23.15 ручной smoke закрыл |
| R-04 | @nuxtjs/i18n redirectOn | ✅ Closed | `strategy: 'no_prefix'` в конфиге, изменение не затронуло |
| ... | ... | ... | ... |

### 5.2. Остаточные риски / follow-up

| ID | Задача | Перенос | Owner | Deadline |
|----|--------|---------|-------|----------|
| NEXT-23-01 | Полная миграция Zod 3 → Zod 4 | EPIC 24 (или позже) | Backend Lead | 2026-06-XX |
| NEXT-23-02 | Эксперимент `compatibilityVersion: 5` | Iteration 2026-Q3 | — | — |
| NEXT-23-03 | Drizzle ORM 1.0 stable | после релиза stable | Backend Lead | TBD |
| NEXT-23-04 | TypeScript project references (если 23.16 skipped) | Follow-up эпик | — | — |
| NEXT-23-05 | Visual regression testing (Chromatic / Percy) | Новая инициатива | QA Lead | — |
| NEXT-23-06 | Полный фронтенд typecheck-sweep по VueUse auto-import (`useClipboard`, `useMagicKeys`, `whenever` и др.) | Отдельный UI track после старта 23.4 | Frontend Lead | 2026-04-24 |
| NEXT-23-07 | Полный e2e regression (включая `PLAYWRIGHT_AUTH_COOKIE`-сценарии) | После выполнения 23.4/23.5 | QA/Automation | 2026-04-25 |

---

## 6. Чеклист финальной приёмки

### 6.1. Код

- [ ] Все 18 задач эпика закрыты (либо явно задокументированы как skipped)
- [ ] `pnpm build` проходит без ошибок и warning'ов
- [ ] `pnpm typecheck` — 0 ошибок
- [ ] `pnpm lint` — 0 ошибок
- [ ] `pnpm test:unit` — 100% pass
- [ ] `pnpm test:e2e` — 100% pass
- [ ] `pnpm audit` — 0 high/critical
- [ ] Нет `@ts-ignore` / `eslint-disable` без TODO-ссылки на follow-up

### 6.2. Документация

- [ ] `CHANGELOG.md` — запись `[0.15.0]`
- [ ] `README.md` — актуальные версии, команды
- [ ] `docs/completed-epics.md` — раздел «Эпик 23»
- [ ] `docs/epic-23-nuxt4-migration.md` — статус Done
- [ ] Этот файл заполнен
- [ ] Smoke-чеклист `docs/reviews/epic-23-smoke-checklist.md` заполнен и подписан

### 6.3. Инфраструктура

- [ ] `Dockerfile` обновлён (Node 22 LTS)
- [ ] `docker compose build && docker compose up` успешно поднимает стек
- [ ] `.nvmrc` → 22.12+
- [ ] `package.json` → `packageManager: pnpm@10.x`
- [ ] CI (если есть) — все пайплайны зелёные на PR4

### 6.4. Релиз

- [ ] `package.json` → `version: "0.15.0"`
- [ ] Tag `v0.15.0` создан после merge
- [ ] Staging deploy прошёл smoke
- [ ] Production deploy запланирован / выполнен

---

## 7. Итог

*(Заполняется после финальной приёмки)*

**Миграция на Nuxt 4.x со всей сопутствующей сменой мажоров выполнена. Проект SPLAT QR Service переведён со стека Nuxt 3.16 + Nuxt UI 3 + Pinia 2 + Drizzle 0.38 на стек Nuxt 4.x + Nuxt UI 4 + Pinia 3 + Drizzle 0.45. Функциональность Эпиков 1–22 сохранена в полном объёме (подтверждено автотестами и ручным smoke). Остаточные риски вынесены в follow-up (`NEXT-23-01..NEXT-23-05`). Релиз `0.15.0` подготовлен.**

---

*Документ заполняется по ходу эпика и финализируется к задаче 23.18.*
