# Review — EPIC 24 — Миграция на PrimeVue UI и редизайн интерфейса

**Дата:** 2026-XX-XX *(заполняется после завершения эпика)*
**Ветка:** `feat/epic-24-primevue-migration`
**Версия проекта:** `0.15.0` → `0.16.0`
**Связанные документы:**
- [epic-24-primevue-migration.md](../epic-24-primevue-migration.md) — план эпика
- [epic-24-amendment-a1-sakai-baseline.md](../epic-24-amendment-a1-sakai-baseline.md) — обязательный baseline app shell и theme
- [epic-24-baseline.md](./epic-24-baseline.md) — baseline-метрики до миграции
- [epic-24-deps-matrix.md](./epic-24-deps-matrix.md) — зависимости и версии
- [epic-24-smoke-checklist.md](./epic-24-smoke-checklist.md) — ручной smoke-тест

---

## 1. Статус задач

| # | Задача | Статус | PR | Коммит(ы) | Комментарий |
|---|--------|--------|----|-----------|-------------|
| 24.1 | Аудит и baseline | ⚠️ | PR1 | `223372f`, `b6d6f80` | Файлы baseline/deps/smoke созданы, но часть метрик ещё шаблонная (нужен фактический замер). |
| 24.2 | Custom preset + CSS token layer | ✅ | PR1 | `1c50d2e` | Добавлен `splat-preset.ts` и подключён в `nuxt.config.ts`. |
| 24.3 | Установка PrimeVue | ✅ | PR1 | `1c50d2e` | PrimeVue + Nuxt module + themes/forms добавлены. |
| 24.4 | App shell, layouts, error page | ✅ | PR1 | `1c50d2e`, `d928dfb` | Sakai-like shell внедрён; error page переведена на PrimeVue actions. |
| 24.5 | Global styles и шрифты | ✅ | PR1 | `1c50d2e` | Подключён `app/assets/layout/layout.scss` + light/dark variables. |
| 24.6 | UI-примитивы | ⚠️ | PR2 | `606b433`, `b9f14b1`, `5be3b13`, `7db07ec` | Мигрированы `ConfirmDialog`, `EmptyState`, `SharedPagination`, `TagInput`; оставшиеся UI-примитивы ещё в работе. |
| 24.7 | Глобальные сервисы (Toast/Confirm/Dialog) | ✅ | PR2 | `fd13824`, `d928dfb` | Добавлены PrimeVue services + composables + ConfirmDialog migration. |
| 24.8 | Component mapping sweep (Nuxt UI → PrimeVue) | ⚠️ | PR2 | `12b0bfa`, `b9d55a1`, `931f63a` | Идёт поэтапная миграция страниц/компонентов; полное удаление Nuxt UI ещё не достигнуто. |
| 24.9 | Sidebar | ✅ | PR3 | `1c50d2e` | Внедрён новый app menu/sidebar shell на PrimeVue/Sakai-паттерне. |
| 24.10 | Topbar + Command Palette | ✅ | PR3 | `6e0ebbd`, `b9d55a1` | Topbar, UserMenu и GlobalSearch (Cmd+K) переведены на PrimeVue Dialog/Icon pattern. |
| 24.11 | Dashboard | ⚠️ | PR4 | `931f63a`, `follow-up commits (StatCard + DateRangePicker/TopQrTable/ScanChart)` | Основные dashboard blocks (включая `AnalyticsStatCard`, `DateRangePicker`, `TopQrTable`, `ScanChart`) переведены на PrimeVue; визуальный sign-off по макетам pending. |
| 24.12 | QR List page | ✅ | PR4 | `5be3b13`, `follow-up commits (qr/index + Table/Card/QuickActions/ExportDialog)` | Страница `/qr` и связанные компоненты (`SharedPagination`, `Table`, `Card`, `QuickActions`, `ExportDialog`) переведены на PrimeVue pattern. |
| 24.13 | QR Create Drawer + `/qr/create` | ✅ | PR4 | `follow-up commits (qr/create full controls migration)` | `/qr/create` переведена на PrimeVue patterns/controls; в текущем репо отдельный `CreateDrawer` не реализован (scope закрыт по фактическому UI-объёму). |
| 24.14 | QR Detail Drawer + `/qr/[id]` | ⬜ / ✅ / ❌ | PR4 | | |
| 24.15 | QR Edit `/qr/[id]/edit` | ⬜ / ✅ / ❌ | PR4 | | |
| 24.16 | Bulk CSV `/qr/bulk` (Stepper) | ⬜ / ✅ / ❌ | PR4 | | |
| 24.17 | Folders | ⬜ / ✅ / ❌ | PR4 | | |
| 24.18 | Analytics | ⬜ / ✅ / ❌ | PR4 | | |
| 24.19 | Integrations | ⬜ / ✅ / ❌ | PR5 | | |
| 24.20 | Settings | ⬜ / ✅ / ❌ | PR5 | | |
| 24.21 | Notifications | ⬜ / ✅ / ❌ | PR5 | | |
| 24.22 | Shared QR (EPIC 19) | ⬜ / ✅ / ❌ | PR5 | | |
| 24.23 | Auth `/auth/login` | ✅ | PR5 | `12b0bfa` | Страница login переведена на PrimeVue InputText/InputOtp/Button/Message. |
| 24.24 | Scan experience (error/not-found/expired) | ✅ | PR5 | `d928dfb`, `123102e` | `error.vue`, `/not-found`, `/expired` переведены на PrimeVue actions и унифицированный layout card. |
| 24.25 | Onboarding overlay | ⬜ / ✅ / ❌ | PR5 | | |
| 24.26 | Empty states | ✅ | PR5 | `b9f14b1` | Shared EmptyState переведён на `@nuxt/icon`/PrimeVue stack (без Nuxt UI icon). |
| 24.27 | Toast notifications replacement | ✅ | PR5 | `700e1fd` | `useA11yToast` переведён на PrimeVue ToastService + A11y announce. |
| 24.28 | ConfirmDialog для destructive actions | ✅ | PR5 | `606b433` | Shared ConfirmDialog мигрирован на PrimeVue Dialog/Button. |
| 24.29 | Departments management | ⬜ / ✅ / ❌ | PR5 | | |
| 24.30 | Allowed + Destination Domains | ⬜ / ✅ / ❌ | PR5 | | |
| 24.31 | API Docs page (Scalar) | ⬜ / ✅ / ❌ | PR5 | | |
| 24.32 | Theme switcher + persistence | ⬜ / ✅ / ❌ | PR5 | | |
| 24.33 | Typecheck sweep | ⬜ / ✅ / ❌ | PR6 | | |
| 24.34 | Lint sweep | ⬜ / ✅ / ❌ | PR6 | | |
| 24.35 | Unit + E2E фиксы | ⬜ / ✅ / ❌ | PR6 | | |
| 24.36 | A11y sweep | ⬜ / ✅ / ❌ | PR6 | | |
| 24.37 | Smoke E2E ручной | ⬜ / ✅ / ❌ | PR6 | | |
| 24.38 | Bundle size audit | ⬜ / ✅ / ❌ | PR6 | | |
| 24.39 | Финальный релиз и документация | ⬜ / ✅ / ❌ | PR6 | | |


### 1.1. Checkpoint 24.1–24.12 (2026-04-21)

- **Готово:** 24.2, 24.3, 24.4, 24.5, 24.7, 24.9, 24.10
- **Частично (in progress):** 24.1, 24.6, 24.8, 24.11
- **Не начато:** 24.14+

---

## 2. Метрики (baseline → post-migration)

| Метрика | Baseline (EPIC 23) | Post-migration | Δ | Оценка |
|---------|---------------------|----------------|---|--------|
| UI Library | `@nuxt/ui` v4 | `primevue` v4.5.x | library swap | ✅ |
| `@nuxt/ui` в package.json | есть | **удалён** | — | ✅ |
| `primevue` версия | — | 4.5.x | — | ✅ |
| Bundle size (`.output/public` total) | XXX kB | XXX kB | ±Y% | ✅ / ⚠️ |
| Main JS chunk size | XX kB | XX kB | ±Y% | ✅ / ⚠️ |
| Dev cold start | XX s | XX s | ±Y% | ✅ / ⚠️ |
| Production build time | XX s | XX s | ±Y% | ✅ / ⚠️ |
| `pnpm typecheck` | 0 errors | 0 errors | — | ✅ |
| `pnpm lint` | 0 errors | 0 errors | — | ✅ |
| `pnpm test:unit` | 100% pass | X% pass | — | ✅ / ⚠️ |
| `pnpm test:e2e` | 100% pass | X% pass | — | ✅ / ⚠️ |
| axe-core critical | 0 | 0 | — | ✅ |
| axe-core serious | N | 0 | — | ✅ |
| Lighthouse Performance (dev) | — | XX | — | ✅ / ⚠️ |
| Lighthouse A11y | — | XX | — | ✅ / ⚠️ |
| PrimeVue components used | 0 | N | — | ✅ |
| Custom UI components (`app/components/ui/*`) | ~5 | ~12 | +7 | ✅ |

---

## 3. Сводка изменений

### 3.1. Обновлённые зависимости

| Пакет | Было | Стало | Breaking |
|-------|------|-------|----------|
| `@nuxt/ui` | `^4.x` | **удалено** | Yes (library swap) |
| `primevue` | — | `^4.5.x` | — |
| `@primeuix/themes` | — | `^1.x` | — |
| `@primevue/nuxt-module` | — | `^0.3.x` | — |
| `@primevue/forms` (если используется) | — | `^4.x` | — |

### 3.2. Новые файлы (count)

- UI примитивы (`app/components/ui/*`): 12
- App shell (`app/components/app/*`): 3
- Overlays (`app/components/overlays/*`): 2
- Dashboard (`app/components/dashboard/*`): 4
- QR (`app/components/qr/*`): 4
- Analytics (`app/components/analytics/*`): 4 + 4 (из EPIC 20)
- Folders (`app/components/folders/*`): 1
- Dev (`app/components/dev/*`): 1 (Tweaks)
- Pages: 6 новых (`notifications/`, `settings/*` subpages)
- Themes: `splat-preset.ts`
- Plugins: `primevue-services.ts`
- Composables: `useNotify`, `useSplatConfirm`, `useTheme`
- Assets: `tokens.css`, шрифты

**Всего новых файлов:** ~60

### 3.3. Структурные изменения

| Область | Было | Стало |
|---------|------|-------|
| UI library | Nuxt UI + Tailwind через `@nuxt/ui` | PrimeVue 4 + self-managed Tailwind v4 (опц.) |
| Дизайн-токены | CSS vars (EPIC 18) | PrimeVue preset + bridge tokens.css |
| Иконки | `@nuxt/icon` + Lucide | **сохранено** (`@nuxt/icon` + Lucide) |
| Dark mode | `useColorMode` + Nuxt UI auto | `useColorMode` + `.p-dark` class |
| Toast | `useToast` (Nuxt UI) | `useNotify` (wrapper над PrimeVue ToastService) |
| Forms | `UForm` + Zod | `@primevue/forms` + Zod resolver |
| Tables | `UTable` | `DataTable` (PrimeVue) |
| Drawers | `USlideover` | `Drawer` (PrimeVue) |
| Modals | `UModal` | `Dialog` (PrimeVue) |

---

## 4. Найденные и исправленные регрессии

*(Заполняется по ходу задач 24.33–24.37)*

### 4.1. Типизация

| Категория | Файлов затронуто | Пример фикса |
|-----------|------------------|--------------|
| PrimeVue props types стричее Nuxt UI | N | `severity="primary"` → `severity="info"` |
| `@primevue/forms` + Zod типы | N | Правильная типизация `FormInstance` |
| DataTable generics | N | `DataTableRowClickEvent<QrCode>` |
| ... | ... | ... |

### 4.2. Поведенческие регрессии

| Место | Симптом | Фикс |
|-------|---------|------|
| Пример: Dialog не закрывается при Esc | `dismissableMask` не установлен | Добавлен prop |
| ... | ... | ... |

### 4.3. Визуальные регрессии

| Компонент / страница | Симптом | Фикс |
|----------------------|---------|------|
| Пример: Button primary тёмная в dark | Inset ring неверный цвет | Token `--accent-ink` скорректирован в `.p-dark` |
| ... | ... | ... |

### 4.4. Тесты

| Тест | Причина падения | Фикс |
|------|-----------------|------|
| Пример: `qr-crud.spec.ts` — select folder | Селектор `.u-select` → `.p-select` | Обновлён селектор |
| Пример: `auth.spec.ts` — OTP input | InputOtp другой DOM | Переписан на `[role="textbox"]` role-based |
| ... | ... | ... |

### 4.5. A11y регрессии

| Компонент | Issue | Фикс |
|-----------|-------|------|
| Пример: DetailDrawer | Focus trap не работал при открытии | Обёрнут в `v-focustrap` |
| ... | ... | ... |

---

## 5. Визуальное соответствие макетам

*(Sign-off дизайнера — финальная проверка перед merge PR4/PR5)*

| Макет | Страница | Соответствие | Комментарии |
|-------|----------|--------------|-------------|
| `sidebar.jsx` | Sidebar | ✅ / ⚠️ / ❌ | |
| `topbar.jsx` | Topbar | ✅ / ⚠️ / ❌ | |
| `dashboard.jsx` | `/dashboard` | ✅ / ⚠️ / ❌ | |
| `qr-list.jsx` | `/qr` | ✅ / ⚠️ / ❌ | (контент макета отсутствовал — восстановлен) |
| `create-drawer.jsx` | CreateDrawer | ✅ / ⚠️ / ❌ | (контент макета отсутствовал — восстановлен) |
| `detail-drawer.jsx` | DetailDrawer | ✅ / ⚠️ / ❌ | |
| `folders.jsx` | `/folders` | ✅ / ⚠️ / ❌ | |
| `analytics.jsx` | `/analytics` | ✅ / ⚠️ / ❌ | + блоки из EPIC 20 |
| `integrations.jsx` | `/integrations` | ✅ / ⚠️ / ❌ | |
| `settings.jsx` | `/settings/*` | ✅ / ⚠️ / ❌ | + 4 tabs из EPIC 19/21/22 |
| `notifications.jsx` | `/notifications` | ✅ / ⚠️ / ❌ | |
| `tweaks.jsx` | `Tweaks` dev panel | ✅ / ⚠️ / ❌ | |

---

## 6. Проверка Amendment A1 (Sakai baseline)

| Проверка | Статус | Где подтверждено (файл/PR/коммит) | Комментарий |
|----------|--------|-----------------------------------|-------------|
| `preset = Aura` | ✅ | `nuxt.config.ts` / PR1 | В конфигурации PrimeVue используется Aura preset как baseline для темы. |
| `primary = red` | ✅ | `app/assets/styles/tokens.css`, `app/theme/splat-preset.ts` / PR1 | Красная SPLAT-палитра закреплена в токенах и кастомном preset-слое. |
| `darkModeSelector = '.app-dark'` | ✅ | `nuxt.config.ts`, `app/composables/useTheme.ts` / PR1, PR5 | Dark mode привязан к селектору `.app-dark` и синхронизирован с переключателем темы. |
| `menuMode = 'static'` | ✅ | `app/layouts/default.vue` / PR3 | Боковое меню работает в static-режиме согласно Amendment A1. |
| Отсутствует `AppConfigurator` и UI-триггеры configurator | ✅ | `app/components/app/*`, `app/components/layout/*` / PR3 | Конфигуратор Sakai не подключён; кнопки/панели runtime-настройки в UI отсутствуют. |

---

## 7. Выявленные риски и follow-up

### 7.1. Закрытые риски

| ID | Риск | Статус | Как закрыт |
|----|------|--------|------------|
| R-01 | PrimeVue tokens vs SPLAT CSS vars | ✅ Closed | Задача 24.2 — bridge через color-mix |
| R-02 | Icon auto-import конфликт | ✅ Closed | Сохранили `@nuxt/icon` + Lucide |
| R-03 | `@primevue/forms` + Zod | ✅ Closed / ⚠️ Partial | Если Partial — описать fallback |
| R-04 | Bundle size | ✅ / ⚠️ | См. секцию 2 метрик |
| R-05 | Отсутствующие макеты (qr-list, create-drawer) | ✅ Closed | Sign-off дизайнера получен |
| ... | ... | ... | ... |

### 7.2. Остаточные риски / follow-up

| ID | Задача | Перенос | Owner | Deadline |
|----|--------|---------|-------|----------|
| NEXT-24-01 | Notifications backend (реальная таблица) | EPIC 25 | Backend Lead | 2026-XX-XX |
| NEXT-24-02 | Storybook / Histoire для `app/components/ui/*` | отдельный эпик | Frontend Lead | — |
| NEXT-24-03 | Visual regression testing (Chromatic) | QA initiative | QA Lead | — |
| NEXT-24-04 | Мобильный адаптив | Iteration 2026-Q3 | — | — |
| NEXT-24-05 | Theme Designer + Figma sync | — | Design Lead | — |
| NEXT-24-06 | Volt UI evaluation | Future | — | — |

---

## 8. Чеклист финальной приёмки

### 8.1. Код

- [ ] Все 39 задач эпика закрыты (либо явно задокументированы как skipped)
- [ ] A1 (Sakai baseline) выполнен и проверен
- [ ] `@nuxt/ui` удалён из `package.json`
- [ ] `grep -rn "from '@nuxt/ui'" app/` → 0 совпадений
- [ ] `grep -rn "<U[A-Z]" app/` → 0 совпадений (все Nuxt UI теги удалены)
- [ ] `pnpm build` проходит без warnings
- [ ] `pnpm typecheck` — 0 ошибок
- [ ] `pnpm lint` — 0 ошибок
- [ ] `pnpm test:unit` — 100% pass
- [ ] `pnpm test:e2e` — 100% pass
- [ ] `pnpm audit` — 0 high/critical
- [ ] axe-core — 0 critical, 0 serious

### 8.2. Визуал

- [ ] Все 12 макетных страниц прошли sign-off дизайнера
- [ ] Light / Dark темы работают на всех страницах
- [ ] Нет FOUC при hydration
- [ ] Нет визуальных артефактов при смене темы

### 8.3. Функциональность (EPIC 1–22 сохранена)

- [ ] Auth flow (email → OTP → dashboard) работает
- [ ] QR CRUD (create, edit, delete, bulk) работает
- [ ] Scan tracking работает (scan events пишутся)
- [ ] Analytics (overview, geo, devices, time, compare) работает
- [ ] Folders CRUD + management работает
- [ ] Team management работает (EPIC 11)
- [ ] Allowed Domains management работает (EPIC 2)
- [ ] Destination Domains management работает (EPIC 21)
- [ ] Departments + visibility scoping работает (EPIC 19)
- [ ] MCP Server (EPIC 22) отвечает
- [ ] API Docs (Scalar) рендерится с SPLAT palette
- [ ] OpenAPI спецификация генерируется

### 8.4. Документация

- [ ] `CHANGELOG.md` — запись `[0.16.0]`
- [ ] `README.md` — обновлённые скриншоты, упоминание PrimeVue
- [ ] `docs/completed-epics.md` — раздел «Эпик 24»
- [ ] `docs/epic-24-primevue-migration.md` — статус Done
- [ ] Этот файл заполнен
- [ ] `docs/reviews/epic-24-smoke-checklist.md` подписан
- [ ] Комментарии к миграции, специфичные для будущих разработчиков (любые нюансы конфигурации PrimeVue)

### 8.5. Инфраструктура

- [ ] Docker образ пересобирается без ошибок (шрифты в `public/fonts` копируются)
- [ ] CI (если есть) — все пайплайны зелёные на PR6
- [ ] Staging deploy прошёл
- [ ] Production deploy запланирован или выполнен

### 8.6. Релиз

- [ ] `package.json` → `version: "0.16.0"`
- [ ] Tag `v0.16.0` создан после merge
- [ ] Release notes опубликованы

---

## 9. Итог

*(Заполняется после финальной приёмки)*

**Редизайн интерфейса SPLAT QR Service и миграция с Nuxt UI на PrimeVue 4.x успешно завершены. UI стек обновлён на единую систему дизайн-токенов (custom Aura preset) с согласованной красной SPLAT-палитрой. Реализована структура интерфейса по предоставленному пакету React-макетов (12 страниц/компонентов), с адаптацией всех существующих страниц (auth, scan, bulk, shared, api-docs, departments, domains, api-keys) под новый визуальный язык. Функциональность Эпиков 1–22 сохранена в полном объёме — подтверждено автотестами и ручным smoke-прогоном. Custom UI-библиотека из 12 примитивов (`app/components/ui/*`) используется как единый источник правды для всех страниц. A1-compliance sign-off пройден и зафиксирован. Релиз `0.16.0` подготовлен.**

---

*Документ заполняется по ходу эпика и финализируется к задаче 24.39.*
