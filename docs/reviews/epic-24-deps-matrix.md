# EPIC 24 — Dependency Compatibility Matrix

**Дата:** 2026-04-XX *(обновляется по ходу PR1 задачи 24.1)*
**Ветка:** `feat/epic-24-primevue-migration`
**Цель:** зафиксировать список всех изменений в `package.json` с обоснованием, peer-зависимостями и breaking changes. Используется как справочник при выполнении задач 24.3, 24.8, 24.33 и при финальной сверке в 24.38.

---

## 1. Резюме изменений

| Группа | Добавлено | Удалено | Обновлено |
|--------|-----------|---------|-----------|
| Production deps | 3 | 1 | 0 |
| Dev deps | 1 | 0 | 1 |
| Peer deps | — | — | — |
| **Итого** | **4** | **1** | **1** |

### 1.1. Добавляется

| Пакет | Версия | Scope | Назначение |
|-------|--------|-------|------------|
| `primevue` | `^4.5.x` | dependencies | Основная UI-библиотека |
| `@primeuix/themes` | `^1.x` | dependencies | Theme presets (Aura/Material/Lara/Nora) + `definePreset` |
| `@primevue/forms` | `^4.x` | dependencies | Form-инфраструктура с Zod-резолвером (заменяет UForm) |
| `@primevue/nuxt-module` | `^0.3.x` | devDependencies | Nuxt-интеграция: auto-import компонентов/директив/composables с tree-shaking |

### 1.2. Удаляется

| Пакет | Текущая | Причина |
|-------|---------|---------|
| `@nuxt/ui` | `^4.x` (после EPIC 23) | Полностью замещается `primevue`. Удаляется в финале задачи 24.8 после прохода component mapping sweep |

### 1.3. Остаётся без изменений (явно перечислено для контроля)

Эти пакеты **не трогаются** EPIC 24 — только документальная фиксация.

| Пакет | Версия (после EPIC 23) | Обоснование неизменности |
|-------|------------------------|--------------------------|
| `nuxt` | `^4.x` | Фреймворк, обновлён в EPIC 23 |
| `@nuxt/icon` | `^1.x` | Сохраняем для Lucide иконок (см. раздел 5) |
| `@nuxtjs/i18n` | `^10.x` | Локализация, обновлена в EPIC 23 |
| `@pinia/nuxt` | `^0.11.x` | State management, обновлён в EPIC 23 |
| `pinia` | `^3.x` | То же |
| `@vueuse/nuxt` | `^12.x` | Утилиты |
| `vue` | `^3.5.x` | Фреймворк |
| `vue-router` | `^4.5.x` | Роутинг (обёрнут Nuxt'ом) |
| `vue-echarts` + `echarts` | `^7.x` / `^5.5.x` | Графики — используются и в новых компонентах (24.11, 24.18) |
| `drizzle-orm` / `drizzle-kit` | `^0.45.x` / `^0.31.x` | DB слой, обновлён в EPIC 23 |
| `zod` | `^3.25.x` | Валидация, обновлена в EPIC 23 |
| `@sentry/node` | `^9.x` | Monitoring, обновлён в EPIC 23 |
| `typescript` | `^5.8.x` | Обновлён в EPIC 23 |
| `vitest` | `^3.x` | Обновлён в EPIC 23 |
| `@playwright/test` | `^1.54.x` | Обновлён в EPIC 23 |
| `@axe-core/playwright` | `^4.11.x` | A11y тесты |
| Остальные (nodemailer, geoip-lite, qrcode, sharp, …) | — | Серверная логика, не затрагиваются UI-миграцией |

---

## 2. Матрица совместимости (новые пакеты)

### 2.1. `primevue`

| Параметр | Значение |
|----------|----------|
| Целевая версия | `^4.5.x` (последний stable на момент старта эпика) |
| Peer deps | `vue ^3.4` — совместимо с нашим `vue ^3.5.x` ✅ |
| Поддержка Nuxt 4 | ✅ официально, через `@primevue/nuxt-module` |
| Поддержка SSR | ✅ (компоненты SSR-safe; overlay-компоненты — Teleport на клиенте) |
| Dark mode | ✅ через `darkModeSelector: '.app-dark'` (см. amendment A1) |
| Tree-shaking | ✅ через `components.include/exclude` в модуле |
| TypeScript | ✅ strict types из коробки |
| Breaking vs Nuxt UI | **Library swap** — полная замена API, см. раздел 4 |

### 2.2. `@primeuix/themes`

| Параметр | Значение |
|----------|----------|
| Целевая версия | `^1.x` |
| Peer deps | `primevue ^4` |
| Presets available | Aura, Material, Lara, Nora |
| Custom preset API | `definePreset(base, { semantic, primitive, colorScheme })` |
| Token primitives | red/zinc/emerald/slate/blue/indigo/… (из `@primeuix/styled`) |

**Для SPLAT:** `definePreset(Aura, { semantic: { primary: { 50..950: '{red.*}' } } })` — SPLAT красный primary поверх Aura neutral surfaces.

### 2.3. `@primevue/forms`

| Параметр | Значение |
|----------|----------|
| Целевая версия | `^4.x` |
| Peer deps | `primevue ^4`, `zod ^3` |
| Zod resolver | ✅ `@primevue/forms/resolvers/zod` |
| Yup / Valibot resolvers | ✅ также поддерживаются (не используем) |
| Breaking vs Nuxt UI `UForm` | API другой, требует явной миграции форм в задачах 24.13, 24.15, 24.16, 24.20, 24.23 |
| SSR-safe | ✅ |

### 2.4. `@primevue/nuxt-module`

| Параметр | Значение |
|----------|----------|
| Целевая версия | `^0.3.x` |
| Peer deps | `nuxt ^3.8 \|\| ^4`, `primevue ^4` |
| Auto-import | ✅ components + directives + composables с tree-shaking |
| Config через `primevue: {}` в `nuxt.config.ts` | ✅ |
| Поддержка `importTheme` | ✅ позволяет импортировать кастомный preset отдельным файлом |
| Поддержка `importPT` | ✅ для pass-through стилей (не используется в EPIC 24) |

---

## 3. Peer-dependency конфликты: проверочный список

Команда для проверки перед финальным merge PR1:

```bash
pnpm install --frozen-lockfile 2>&1 | grep -i 'peer\|ERESOLVE\|mismatch' || echo 'OK: no peer issues'
```

Ожидаемый результат: `OK: no peer issues`.

### 3.1. Известные потенциальные конфликты

| Пакет A | Пакет B | Риск | Митигация |
|---------|---------|------|-----------|
| `primevue ^4` | `vue ^3.5` | ⚠️ potentially — PrimeVue официально поддерживает `vue ^3.4`, наш 3.5 входит | Работает, проверено сообществом |
| `@primevue/forms` | `zod ^3.25` | ⚠️ — `@primevue/forms` указывает `zod ^3` без верхней границы | Наш `^3.25` совместим, но проверить в 24.33 |
| `@primevue/nuxt-module` | `nuxt ^4` | ✅ | Проверено |
| `@primevue/nuxt-module` | `@nuxt/icon ^1` | ✅ | Модули не конфликтуют; icon auto-import работает независимо |

### 3.2. Удаление `@nuxt/ui` — что тянется с ним

Перед удалением (в финале задачи 24.8) проверить, что ни один из transitive deps не требуется для других пакетов:

```bash
pnpm why @radix-icons/vue reka-ui tailwindcss @tailwindcss/vite
```

Ожидание: после удаления `@nuxt/ui` эти пакеты удаляются сами (они были pulled by Nuxt UI). Если какой-то остаётся нужным (например, `tailwindcss` мы хотим оставить для утилитарных классов), — добавить в `dependencies` явно.

---

## 4. Breaking changes: Nuxt UI → PrimeVue API

Краткая сводка для быстрой ориентации при выполнении задачи 24.8. Полная таблица маппинга — в `epic-24-primevue-migration.md` раздел 4.

### 4.1. Props rename

| Nuxt UI | PrimeVue |
|---------|----------|
| `color="primary"` | `severity="primary"` |
| `variant="outline"` | `outlined` (boolean) |
| `loading` | `loading` |
| `icon="i-lucide-plus"` | через слот `#icon` или `<template #default>` |
| `size="xs"..."xl"` | `size="small" \| "large"` (2 варианта + default) |

### 4.2. Composables rename

| Nuxt UI | PrimeVue |
|---------|----------|
| `useToast()` | `useToast()` (от `primevue/usetoast`) — разный API |
| `useModal()` | `useDialog()` + `DynamicDialog` + `DialogService` plugin |
| `useOverlay()` | нет прямого аналога — `Drawer`/`Dialog` + `v-model:visible` |

### 4.3. Directives

| Nuxt UI (или Nuxt core) | PrimeVue |
|-------------------------|----------|
| отсутствует | `v-ripple` |
| отсутствует | `v-tooltip` |
| `v-click-outside` (VueUse) | `useClickOutside` VueUse — остаётся как есть |
| отсутствует | `v-focustrap` |
| отсутствует | `v-styleclass` (для анимаций скрытия/показа) |

### 4.4. Формы

| Nuxt UI | PrimeVue |
|---------|----------|
| `<UForm :schema="zodSchema" :state="state">` | `<Form :resolver="zodResolver(schema)" :initialValues="state">` |
| `<UFormGroup name="email" label="Email">` | `<FormField name="email" v-slot="$field">` + label отдельно |
| Автоматический error display | Ручной `<Message>` + `$field.invalid` |

Подробно — задача 24.13 (CreateDrawer) + 24.20 (Settings) содержат миграционные паттерны.

---

## 5. Архитектурные решения (зафиксированы)

### 5.1. Иконки: Lucide через `@nuxt/icon`, НЕ PrimeIcons

**Решение:** сохраняем `@nuxt/icon` + Lucide в проекте, **не ставим** `primeicons`.

**Обоснование:**
- Весь существующий проект + предоставленные React-макеты используют Lucide (`i-lucide-*`).
- PrimeVue принимает иконки через slots и `icon` props — любая CSS-класс-иконка работает.
- PrimeIcons добавил бы дополнительный CSS-бандл и несогласованность визуального языка.

**Практическое применение:**

```vue
<!-- В меню Sakai AppMenuItem — амендмент A1 задача 24.A2: -->
<Icon :name="item.icon" class="layout-menuitem-icon size-4" />

<!-- В кнопках: -->
<Button severity="primary" @click="onCreate">
  <template #icon>
    <Icon name="i-lucide-plus" class="size-4 mr-2" />
  </template>
  {{ t('qr.create') }}
</Button>
```

### 5.2. Dark mode selector: `.app-dark` (Sakai convention)

**Решение:** `darkModeSelector: '.app-dark'` (не `.p-dark` и не `system`).

**Обоснование:** совпадает с Sakai baseline (amendment A1), что упрощает перенос Sakai SCSS-файлов.

### 5.3. Theme configurator: ОТКЛЮЧЁН

**Решение:** `AppConfigurator.vue` из Sakai **не переносится** в проект; кнопка-шестерёнка в Topbar удаляется.

**Обоснование:** SPLAT QR — внутренний корпоративный инструмент, пользователи не должны менять preset/primary/surface в runtime.

**Защита контракта:**
- Поля `preset`/`primary`/`surface`/`menuMode` в `useLayout().layoutConfig` помечены `readonly` в TypeScript-типе.
- `find . -name AppConfigurator.vue` → 0 совпадений (проверяется в smoke-чеклисте).

### 5.4. menuMode: `static` hardcoded

**Решение:** `layoutConfig.menuMode = 'static'` зафиксировано. Нет runtime-переключения на `overlay`/`slim`.

**Обоснование:** см. amendment A1.

### 5.5. Primary color: red

**Решение:** `SplatPreset = definePreset(Aura, { semantic: { primary: { 50..950: '{red.*}' } } })`.

**Обоснование:** SPLAT-брендинг (закреплено с EPIC 23).

---

## 6. Package.json: целевое состояние

Итоговый фрагмент `package.json` после merge всех PR эпика. Используется как референс для проверки в задаче 24.39.

```jsonc
{
  "name": "splat-qr",
  "version": "0.16.0",
  "dependencies": {
    // НОВЫЕ:
    "primevue": "^4.5.0",
    "@primeuix/themes": "^1.0.0",
    "@primevue/forms": "^4.5.0",
    // БЕЗ ИЗМЕНЕНИЙ (из EPIC 23):
    "@asteasolutions/zod-to-openapi": "^7.3.4",
    "@pinia/nuxt": "^0.11.0",
    "@scalar/api-reference": "^1.52.3",
    "@sentry/node": "^9.0.0",
    "@vueuse/nuxt": "^12.0.0",
    "dotenv": "^16.4.0",
    "drizzle-orm": "^0.45.0",
    "echarts": "^5.5.0",
    "geoip-lite": "^1.4.0",
    "lru-cache": "^11.0.0",
    "nanoid": "^5.0.0",
    "node-cron": "^3.0.0",
    "nodemailer": "^6.9.0",
    "nuxt": "^4.0.0",
    "papaparse": "^5.4.0",
    "pdfkit": "^0.16.0",
    "pg": "^8.13.0",
    "pinia": "^3.0.0",
    "qrcode": "^1.5.0",
    "sharp": "^0.33.0",
    "ua-parser-js": "^1.0.0",
    "vue": "^3.5.0",
    "vue-echarts": "^7.0.0",
    "vue-router": "^4.5.0",
    "zod": "^3.25.0"
    // УДАЛЕНО: "@nuxt/ui"
  },
  "devDependencies": {
    // НОВЫЕ:
    "@primevue/nuxt-module": "^0.3.0",
    "sass": "^1.80.0",                    // требуется для Sakai SCSS (amendment A1)
    // БЕЗ ИЗМЕНЕНИЙ:
    "@axe-core/playwright": "^4.11.2",
    "@nuxt/eslint-config": "^1.0.0",
    "@nuxt/icon": "^1.13.0",
    "@nuxtjs/i18n": "^10.2.0",
    "@playwright/test": "^1.54.0",
    "@types/geoip-lite": "^1.4.0",
    "@types/node-cron": "^3.0.0",
    "@types/nodemailer": "^6.4.0",
    "@types/papaparse": "^5.5.2",
    "@types/pdfkit": "^0.13.0",
    "@types/pg": "^8.11.0",
    "@types/qrcode": "^1.5.0",
    "@types/ua-parser-js": "^0.7.0",
    "drizzle-kit": "^0.31.0",
    "eslint": "^9.18.0",
    "eslint-config-prettier": "^9.1.0",
    "prettier": "^3.4.0",
    "tsx": "^4.19.0",
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  },
  "packageManager": "pnpm@10.0.0"
}
```

**Примечание:** точные patch-версии фиксируются в `pnpm-lock.yaml`; в `package.json` — caret-диапазоны.

---

## 7. Проверка целостности после PR1 (24.1–24.5)

После первого PR по эпику (Foundation + Shell) прогнать:

```bash
# 1. Нет duplicate versions of the same package in lockfile
pnpm dedupe --check

# 2. Нет unused зависимостей (скриптом depcheck или knip)
pnpm dlx knip --dependencies

# 3. Lockfile синхронизирован с package.json
pnpm install --frozen-lockfile

# 4. Nuxt prepare проходит чисто
pnpm nuxt prepare

# 5. Размер node_modules (sanity check)
du -sh node_modules/
```

Ожидания:
- `pnpm dedupe --check` — clean
- `knip` — 0 unused (или задокументированы как ложноположительные)
- `node_modules` — не выросло резко (±20% относительно baseline из epic-24-baseline.md)

---

## 8. Матрица совместимости по фичам (sanity)

Короткая проверка, что все используемые фичи работают в новом стеке.

| Фича EPIC | Работает в новом стеке? | Проверяется в задаче |
|-----------|-------------------------|----------------------|
| EPIC 1: Nuxt SSR + runtimeConfig | ✅ (не затрагивается) | — |
| EPIC 2: OTP auth + sessions | ✅ (UI меняется, auth flow тот же) | 24.23 |
| EPIC 3: QR engine (SVG/PNG/PDF) | ✅ (не затрагивается) | — |
| EPIC 4: QR CRUD | ✅ | 24.12–24.15 |
| EPIC 5: Scan tracking + redirects | ✅ (не затрагивается) | — |
| EPIC 6: Analytics overview/geo/devices | ✅ | 24.18 |
| EPIC 7: Folders + tags | ✅ | 24.17 |
| EPIC 8: Custom styling (QR style editor) | ✅ | 24.13 (StyleEditor) |
| EPIC 9: A/B testing destinations | ✅ | 24.14 (Detail drawer) |
| EPIC 10: Bulk CSV import | ✅ (на PrimeVue Stepper) | 24.16 |
| EPIC 11: Team management | ✅ | 24.20 (Team tab) |
| EPIC 12: API keys | ✅ | 24.20 (API keys tab) |
| EPIC 13: Daily aggregation | ✅ (не затрагивается) | — |
| EPIC 14: i18n + dark + sentry + e2e | ✅ (i18n/sentry/e2e нетронуты; dark переезжает на `.app-dark`) | 24.32 |
| EPIC 15: Forms UX | ⚠️ migrated to `@primevue/forms` | 24.13, 24.15 |
| EPIC 16: Interactive shell (Cmd+K) | ✅ on `Listbox` + `Dialog` | 24.10 |
| EPIC 17: A11y baseline | ✅ (PrimeVue ARIA WCAG AA native) | 24.36 |
| EPIC 18: Design tokens `/docs-ui` | ⚠️ мигрирует на PrimeVue preset + bridge tokens.css | 24.2 |
| EPIC 19: QR visibility + departments | ✅ | 24.12, 24.22, 24.29 |
| EPIC 20: UX Pack (geo map, cards, onboarding) | ✅ | 24.18, 24.25, 24.26 |
| EPIC 21: Security hardening | ✅ (не затрагивается) | — |
| EPIC 22: MCP + Scalar API docs | ✅ | 24.31 |
| EPIC 23: Nuxt 4 migration | ✅ (predecessor) | — |

---

## 9. Sign-off

| Секция | Ответственный | Дата |
|--------|---------------|------|
| Версии определены | разработчик 24.1 | |
| Peer conflicts проверены | разработчик 24.3 | |
| Архитектурные решения утверждены | Tech Lead | |
| Матрица фич проверена | QA / Tech Lead | |

---

*Документ живёт через эпик: обновляется при каждом изменении `package.json` в рамках PR1–PR6.*