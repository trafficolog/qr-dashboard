# Review — EPIC 23 — Миграция на Nuxt 4 и обновление ключевых модулей

**Дата:** 2026-04-XX *(заполняется после завершения эпика)*
**Ветка:** `feat/epic-23-nuxt4-migration`
**Версия проекта:** `0.12.1` → `0.15.0`
**Связанные документы:**
- [epic-23-nuxt4-migration.md](../epic-23-nuxt4-migration.md) — план эпика
- [epic-23-baseline.md](./epic-23-baseline.md) — baseline-метрики до миграции
- [epic-23-deps-matrix.md](./epic-23-deps-matrix.md) — матрица совместимости зависимостей
- [epic-23-smoke-checklist.md](./epic-23-smoke-checklist.md) — ручной smoke-тест

---

## 1. Статус задач

| # | Задача | Статус | Commit(ы) | Комментарий |
|---|--------|--------|-----------|-------------|
| 23.1 | Аудит и baseline | ⬜ / ✅ / ❌ | `abc1234` | |
| 23.2 | Nuxt 3.x latest + compatibilityVersion: 4 | ⬜ / ✅ / ❌ | | |
| 23.3 | @nuxtjs/i18n v9 → v10 | ⬜ / ✅ / ❌ | | |
| 23.4 | Реорганизация структуры для Nuxt 4 | ⬜ / ✅ / ❌ | | |
| 23.5 | Upgrade Nuxt 3.x → 4.0 | ⬜ / ✅ / ❌ | | |
| 23.6 | Nuxt UI v3 → v4 | ⬜ / ✅ / ❌ | | |
| 23.7 | Pinia v2 → v3 | ⬜ / ✅ / ❌ | | |
| 23.8 | Drizzle ORM/Kit stable update | ⬜ / ✅ / ❌ | | |
| 23.9 | Zod 3.24 → 3.25+ | ⬜ / ✅ / ❌ | | |
| 23.10 | Sentry v8 → v9 | ⬜ / ✅ / ❌ | | |
| 23.11 | TypeScript 5.8, Vitest 3, Playwright, ESLint | ⬜ / ✅ / ❌ | | |
| 23.12 | Typecheck sweep | ⬜ / ✅ / ❌ | | |
| 23.13 | Lint sweep | ⬜ / ✅ / ❌ | | |
| 23.14 | Unit + E2E тесты фиксы | ⬜ / ✅ / ❌ | | |
| 23.15 | Smoke E2E ручной прогон | ⬜ / ✅ / ❌ | | |
| 23.16 | TypeScript project references | ⬜ / ✅ / ❌ / 🚫 skipped | | Опциональная задача |
| 23.17 | Docker, CI | ⬜ / ✅ / ❌ | | |
| 23.18 | Финальный релиз и документация | ⬜ / ✅ / ❌ | | |

---

## 2. Метрики (baseline → post-migration)

| Метрика | Baseline | Post-migration | Δ | Оценка |
|---------|----------|----------------|---|--------|
| Nuxt версия | 3.16.x | 4.x.x | +1 major | ✅ |
| `pnpm typecheck` | N errors | 0 errors | — | ✅ / ⚠️ |
| `pnpm lint` | N errors | 0 errors | — | ✅ / ⚠️ |
| `pnpm test:unit` pass rate | X% | 100% | — | ✅ / ⚠️ |
| `pnpm test:e2e` pass rate | X% | 100% | — | ✅ / ⚠️ |
| Bundle size (`.output/public`) | XXX kB | XXX kB | ±Y% | ✅ / ⚠️ |
| Dev cold start (`pnpm dev`) | XX s | XX s | −Y% | ✅ / ⚠️ |
| Production build time | XX s | XX s | ±Y% | ✅ / ⚠️ |
| `pnpm audit` (high/critical) | N | 0 | — | ✅ / ⚠️ |

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
| `assets/css/main.css` | `app/assets/css/main.css` |
| `app.config.ts` (root) | `app/app.config.ts` |
| `locales/` | `i18n/locales/` *(если перенесли)* |

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
| `noUncheckedIndexedAccess` — unchecked array access | N | `arr[0].name` → `arr[0]?.name ?? ''` |
| Shallow reactivity `data.value` мутации | N | мутация → полная замена объекта |
| `null` → `undefined` для `data`/`error` | N | `data.value === null` → `data.value === undefined` |
| Pinia v3 type aliases | N | `PiniaPluginContext` → `PiniaPlugin` |
| Drizzle 0.45 query builder типы | N | — |

### 4.2. Поведенческие регрессии

| Место | Симптом | Фикс |
|-------|---------|------|
| Пример: `/auth/login` | После ввода OTP — не редиректит | Исправлен shallow ref в `useAuth().fetchUser` |
| ... | ... | ... |

### 4.3. UI / визуальные регрессии (Nuxt UI v4)

| Компонент / страница | Симптом | Фикс |
|----------------------|---------|------|
| Пример: `UInput v-model.nullify` | `nullify` deprecated | Замена на `nullable` |
| ... | ... | ... |

### 4.4. Тесты

| Тест | Причина падения | Фикс |
|------|-----------------|------|
| Пример: `qr-crud.spec.ts` — select QR type | Изменился DOM USelect | Обновлён селектор |
| ... | ... | ... |

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