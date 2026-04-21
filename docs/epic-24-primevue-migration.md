# EPIC 24 — Миграция на PrimeVue UI и редизайн интерфейса

**Статус:** 📋 Planned
**Целевая версия:** v0.16.0
**Оценка:** 14–18 дней (включая QA и исправления)
**Ветка:** `feat/epic-24-primevue-migration`
**Зависимости:**
- **Обязательно:** EPIC 23 (Миграция на Nuxt 4) завершён и смержен в `main`
- EPIC 1–22 завершены (функциональность сохраняется в полном объёме)
**Норматив (обязательно):** [docs/epic-24-amendment-a1-sakai-baseline.md](./epic-24-amendment-a1-sakai-baseline.md) — baseline для app shell и theme
**Приоритет:** 🟡 High — стратегическая смена UI-стека

---

**Прогресс реализации (обновлено 2026-04-21):**
- ✅ Базовый PrimeVue bootstrap + Sakai shell: коммиты `1c50d2e`, `d928dfb`
- ✅ Глобальные PrimeVue сервисы Toast/Confirm: коммит `fd13824`
- ✅ Миграция auth login на PrimeVue controls: коммит `12b0bfa`
- ⚠️ In progress: массовый component mapping (`Nuxt UI -> PrimeVue`) по страницам `/qr`, `/dashboard`, `/settings`
- ✅ Topbar + Command Palette: AppUserMenu и GlobalSearch переведены на PrimeVue
- ⚠️ Dashboard migration in progress: page primitives + `AnalyticsStatCard` + `DateRangePicker/TopQrTable/ScanChart` переведены на PrimeVue (ожидается визуальный sign-off)
- ✅ QR List migration: `/qr` shell + `Table/Card/QuickActions/ExportDialog` переведены на PrimeVue pattern
- ✅ QR Create migration: `/qr/create` page переведена на PrimeVue controls/patterns (в текущем репо отдельный `CreateDrawer` отсутствует)
- ⚠️ QR Detail migration in progress: `/qr/[id]` page shell/cards/actions/skeleton переведены на PrimeVue pattern; связанные drawer/edit flows ещё в работе
- ⚠️ UI primitives migration: `TagInput` переведён на PrimeVue InputText/Tag
- ✅ Scan experience (`error.vue`, `/not-found`, `/expired`) переведён на новый PrimeVue action-pattern
- ✅ Toast pipeline переведён на PrimeVue (`useA11yToast` -> `primevue/usetoast`, group `app`)
- ✅ Empty states: `app/components/shared/EmptyState.vue` очищен от Nuxt UI (`UIcon` -> `Icon`)

### Checkpoint 24.1–24.12 (2026-04-21)
- ✅ Done: 24.2, 24.3, 24.4, 24.5, 24.7, 24.9, 24.10
- ⚠️ In progress: 24.1, 24.6, 24.8, 24.11, 24.14
- ⬜ Not started: 24.15+

## 1. Проблема и обоснование

После завершения EPIC 23 проект работает на Nuxt 4 + Nuxt UI v4. Команда приняла решение перейти на **PrimeVue 4.x** как основную UI-библиотеку по следующим причинам:

1. **Ширина компонентной базы.** PrimeVue 4 предоставляет 80+ production-ready компонентов: DataTable с фильтрами/сортировкой/экспортом, Stepper для wizard-форм (bulk CSV), Tree/TreeTable (иерархии папок и отделов), Timeline (активность), OrgChart (структура команды), полный набор Form-компонентов, которые в Nuxt UI отсутствуют или требуют кастомной реализации.
2. **Design-token архитектура.** PrimeVue 4 построен на трёхуровневой системе токенов (primitive → semantic → component), которая точно ложится на наш существующий подход из EPIC 18 (`/docs-ui/`). Кастомный preset через `definePreset(Aura, {...})` позволит декларативно зафиксировать SPLAT-палитру (красный accent, дополнительные семантические цвета `ok`/`warn`/`info`/`purple`) для всех компонентов сразу.
3. **Референсный дизайн от стейкхолдера.** Предоставлен пакет React/JSX-макетов (16 файлов) с новым визуальным языком: collapsible sidebar с быстрыми папками, enriched cards, inline-аналитика с донат-диаграммами и sparkline'ами, drawer'ы для create/detail, notifications с табами, tweaks-панель для разработчика. Эти макеты разрабатывались под design-token архитектуру PrimeVue.
4. **Унификация с Figma UI Kit и Theme Designer.** PrimeVue поставляется с официальным Figma-китом и визуальным Theme Designer'ом, что упрощает передачу дизайнов между дизайнером и разработчиком и устраняет расхождения.

### 1.1. Что НЕ входит в объём эпика

- **Перенос функциональности с нуля.** Все сервисы, API, Drizzle-схемы, composables, stores, бизнес-логика остаются без изменений. Эпик касается только UI-слоя (`app/components/**`, `app/pages/**`, `app/layouts/**`, стили, иконки).
- **Замена существующих нефункциональных модулей.** Sentry, Drizzle, i18n, Pinia, валидация через Zod — всё это продолжает работать как есть (обновлено в EPIC 23).
- **Изменения в MCP Server (EPIC 22).** MCP API + tools + resources не затрагиваются — это чисто backend.
- **Редизайн landing/marketing страниц.** У SPLAT QR их нет, инструмент только внутренний.
- **Переход на PrimeIcons.** Сохраняем `@nuxt/icon` + Lucide (`i-lucide-*`), потому что Lucide вписан во все макеты и используется везде в проекте. PrimeVue допускает кастомные иконки через `icon` props и `#icon` слоты.

---

## 2. Цель

1. Заменить **Nuxt UI v4 → PrimeVue 4.x** по всему приложению.
2. Реализовать UI-структуру **точно по предоставленным React-макетам** (16 компонентов: `App`, `Sidebar`, `Topbar`, `Dashboard`, `QRList`, `Folders`, `Analytics`, `Integrations`, `Settings`, `Notifications`, `CreateDrawer`, `DetailDrawer`, `Tweaks`, `UI primitives`, `Icons`, `Data`).
3. **Сохранить 100% функциональности Эпиков 1–22**, в том числе страницы, которых нет в макетах (auth, scan-страницы, bulk CSV, shared QR, API docs, departments и т.д.) — они адаптируются под новый визуальный язык.
4. Построить кастомный PrimeVue preset с дизайн-токенами SPLAT (красный accent + `ok/warn/info/purple`), совместимый с light/dark темой.
5. Провести полный post-redesign review (typecheck, lint, unit/E2E, A11y, smoke).
6. Выпустить релиз `0.16.0`.

---

## 3. Архитектурный анализ

### 3.1. Текущее состояние (после EPIC 23)

Приложение работает на следующем UI-стеке:
- `@nuxt/ui` v4 — основная библиотека (Button, Input, Select, Modal, Slideover, Form, Table, Badge, Card, …)
- `@nuxt/icon` v1 + Lucide icon set
- `@nuxtjs/i18n` v10 — локализация RU/EN
- Tailwind v4 (подтянутый через `@nuxt/ui`)
- Кастомные дизайн-токены в `app/assets/css/main.css` (EPIC 18): `--primary-*`, `--surface-*`, `--accent-*`, motion tokens
- Compound components (EPIC 20): `EmptyState`, `OnboardingOverlay`, enriched QR cards, `GeoMap`, `DeviceBreakdown`

### 3.2. Референсный дизайн (из приложенных макетов)

Предоставленные React-макеты описывают целевой UX/UI. Ключевые архитектурные решения:

**Дизайн-токены (видны по использованию `var(--*)` в макетах):**

| Слой | Токены |
|------|--------|
| Поверхности | `--bg`, `--bg-elev`, `--bg-sunken`, `--bg-hover` |
| Текст | `--text`, `--text-muted`, `--text-dim` |
| Линии/границы | `--line`, `--line-strong` |
| Акцент | `--accent`, `--accent-soft`, `--accent-strong`, `--accent-ink` |
| Семантика | `--ok`, `--ok-soft`, `--warn`, `--warn-soft`, `--info`, `--info-soft`, `--purple`, `--purple-soft` |
| Тени | `--shadow-sm`, `--shadow-md`, `--shadow-lg` |
| Типографика | Inter Tight (UI), JetBrains Mono (числа/моноширинное) |

**Структурные паттерны:**
- `Card` базовая: `background: var(--bg-elev)`, `border-radius: 14px`, `box-shadow: inset 0 0 0 1px var(--line), var(--shadow-sm)`.
- Малые лейблы: `font-size: 11px`, `text-transform: uppercase`, `letter-spacing: 0.06em`, `font-weight: 600`, `color: var(--text-dim)`.
- Основные заголовки: `font-family: Inter Tight`, `letter-spacing: -0.01em..-0.025em`, `font-weight: 600`.
- Числовые значения: `font-family: JetBrains Mono`, `font-weight: 600`.
- Sidebar ширина: 232px (expanded) / 68px (collapsed).
- Detail Drawer: 560px.
- Tweaks: 280px, fixed bottom-right (dev-only).

### 3.3. PrimeVue 4.x — что берём

- **`primevue`** — сама библиотека (v4.5.x stable).
- **`@primevue/nuxt-module`** — официальная интеграция для Nuxt 4, авто-импорт компонентов с tree-shaking, регистрация директив и composables.
- **`@primeuix/themes`** — пакет с пресетами (Aura/Material/Lara/Nora) + `definePreset` для кастомизации.
- **Base preset:** `Aura` (современный, хорошо согласуется с макетами).
- **Кастомизация:** через `definePreset(Aura, { semantic: { primary: { ... }, colorScheme: { light: {...}, dark: {...} } } })`.
- **Dark mode:** через `darkModeSelector: '.p-dark'` + синхронизация с `useColorMode` (Pinia-store `ui`).

### 3.4. Disclaimer по предоставленным макетам

В пакете из 16 JSX-файлов **отсутствуют содержимое `qr-list.jsx` и `create-drawer.jsx`** (приложены как имена файлов, но без кода). Их структура восстанавливается по косвенным данным:
- `qr-list.jsx` — принимает `onOpenDetail` и `query`, должен иметь view-toggle (table/grid), фильтры (folder, status, author, tags), pagination, bulk-actions.
- `create-drawer.jsx` — drawer создания QR: type → URL/destination → name → folder/tags → style (colors, logo, error correction) → preview → create.

Для этих страниц структура берётся из **существующего SPLAT QR** (Эпики 4, 10): `app/pages/qr/index.vue`, `app/pages/qr/create.vue`, `app/components/qr/StyleEditor.vue` — они и ложатся в скоуп EPIC 24 с адаптацией под PrimeVue.

---

## 4. Маппинг Nuxt UI → PrimeVue

Таблица используется разработчиками как справочник при замене компонентов по всему проекту (задача 24.8).

| Nuxt UI v4 | PrimeVue 4.x | Комментарий |
|------------|---------------|-------------|
| `UButton` | `Button` | `severity` вместо `color`; `text` вместо `ghost`; иконки через `icon` prop или слоты |
| `UInput` | `InputText` | Wrapper'нуть в `IconField` + `InputIcon` для префиксов/суффиксов |
| `UTextarea` | `Textarea` | `autoResize` prop |
| `USelect` (single) | `Select` | `optionLabel` / `optionValue` для объектных option'ов |
| `USelect` (multiple) | `MultiSelect` или `Listbox` | `MultiSelect` в формах, `Listbox` для command palette |
| `UBadge` | `Badge` или `Tag` | `Tag` для статусов с icon; `Badge` для счётчиков |
| `UCard` | Кастомный `<AppCard>` + `Panel` | PrimeVue `Card` менее гибкий — делаем wrapper из `Panel` или div с токенами |
| `UModal` | `Dialog` | `modal`, `dismissable-mask`, `header` слот |
| `USlideover` | `Drawer` | `position="right"`, `size` — px или проценты |
| `UPopover` | `Popover` (v4) | Императивный `show()/hide()` |
| `UTooltip` | `v-tooltip` директива | Директива, не компонент |
| `UAvatar` | `Avatar` + кастомный `<AuthorAvatar>` | `shape="circle"`; для инициалов — `label` + цветной фон |
| `UAvatarGroup` | `AvatarGroup` | Нативно поддерживается |
| `UToast` / `useToast` | `Toast` + `useToast` (ToastService) | Регистрация через `ToastService` плагин |
| `UConfirmModal` | `ConfirmDialog` + `useConfirm` (ConfirmationService) | Глобальный сервис, императивный вызов |
| `UTable` | `DataTable` + `Column` | Мощный — фильтры, сортировки, пагинация, экспорт "из коробки" |
| `UPagination` | `Paginator` | Либо встроенная пагинация `DataTable` |
| `UTabs` | `Tabs` + `TabList`/`Tab`/`TabPanels`/`TabPanel` | Новая API в v4 |
| `UAccordion` | `Accordion` + `AccordionTab` | — |
| `USwitch` | `ToggleSwitch` | `v-model` |
| `UCheckbox` | `Checkbox` | `binary` для boolean |
| `URadioGroup` | `RadioButton` + кастомная группа | Либо `SelectButton` для cегментированного выбора |
| `UProgress` (bar) | `ProgressBar` | — |
| `USkeleton` | `Skeleton` | `shape="rectangle"`/`"circle"` |
| `UCommandPalette` | `Listbox` + `Dialog` + `useMagicKeys` | Собираем composite: Dialog + IconField + Listbox с фильтрацией |
| `UForm` (Zod) | `@primevue/forms` + Zod resolver | Новый пакет `@primevue/forms` (v4.3+) поддерживает Zod через `zodResolver` |
| `UIcon` (Lucide) | `<Icon>` из `@nuxt/icon` | Сохраняем `@nuxt/icon`; PrimeVue `icon` props принимают класс иконки, передаём `pi-*` или `i-lucide-*` |
| `UStepper` / wizard | `Stepper` + `StepList`/`Step`/`StepPanels`/`StepPanel` | Для bulk CSV wizard |
| `UColorPicker` | `ColorPicker` | — |
| `UFileUpload` | `FileUpload` (advanced/basic) | Для bulk CSV, brand logo |

**PrimeIcons vs Lucide:**
- PrimeVue ждёт `pi pi-*` по умолчанию, но принимает любой className через `icon` prop.
- Мы **сохраняем Lucide через `@nuxt/icon`** и в местах, где PrimeVue хочет icon, передаём:
  ```vue
  <Button label="Сохранить">
    <template #icon>
      <Icon name="i-lucide-save" class="size-4 mr-2" />
    </template>
  </Button>
  ```
- Это позволяет оставить единый визуальный язык иконок Lucide, уже заложенный во всё приложение.

---

## 5. План работ (фазы)

```
Фаза 0 — Подготовка и дизайн-токены (1 день)
  24.1 Аудит, ветка, baseline
  24.2 Custom preset + CSS token layer (мост SPLAT ↔ PrimeVue) [A1 priority]

Фаза 1 — Установка PrimeVue и global shell (2 дня)
  24.3 pnpm add primevue @primeuix/themes @primevue/nuxt-module + конфиг [A1 priority]
  24.4 App shell: app.vue, error.vue, layouts/default.vue, layouts/auth.vue [A1 priority]
  24.5 Global styles: fonts, main.css с токенами, ripple

Фаза 2 — UI-примитивы и библиотечный wrapper-слой (2 дня)
  24.6 Components/ui/*: AppCard, AuthorAvatar, AvatarGroup, Sparkline, Kbd, Divider, StatusBadge, VisibilityBadge, LegendDot, MiniStat, Section, Field
  24.7 Global services: useToast, useConfirm, useDialog + обёртки
  24.8 Component mapping sweep: замена Nuxt UI → PrimeVue по всему проекту

Фаза 3 — Навигация (Sidebar + Topbar) (1.5 дня)
  24.9 Sidebar (collapsible, brand, folders quick-list, user card, Cmd+K) [A1 priority]
  24.10 Topbar (title+sub, contextual search, theme toggle, bell + unread, create buttons) [A1 priority]

Фаза 4 — Страницы по макетам + адаптация существующих (7 дней)
  24.11 Dashboard: KPI row + Scan chart + Status breakdown + Top-5 + Activity
  24.12 QR List: filter bar + table/grid views + bulk
  24.13 QR Create Drawer + адаптация /qr/create.vue (full page)
  24.14 QR Detail Drawer + адаптация /qr/[id]/index.vue
  24.15 QR Edit /qr/[id]/edit.vue
  24.16 Bulk CSV /qr/bulk.vue (PrimeVue Stepper)
  24.17 Folders: grid + /folders/[id].vue
  24.18 Analytics: period + big chart + geo/devices/sources (интеграция EPIC 20 компонентов)
  24.19 Integrations: API-key + connected/available grids
  24.20 Settings: tab-nav (200px sidebar) + workspace/team/branding/security/billing
  24.21 Notifications: tabs + list
  24.22 Shared QR /shared/index.vue (EPIC 19)
  24.23 Auth /auth/login.vue (email → OTP, single screen)
  24.24 Scan experience: error.vue, /not-found, /expired

Фаза 5 — Дополнения, не покрытые макетами (1.5 дня)
  24.25 Onboarding overlay (EPIC 20 — перенос)
  24.26 Empty states с иллюстрациями (EPIC 20 — перенос)
  24.27 Toast notifications (success/error/info + undo)
  24.28 ConfirmDialog для destructive actions
  24.29 Departments management (EPIC 19) — tab в Settings
  24.30 Allowed/Destination Domains (EPIC 21 SEC-07) — tab в Settings
  24.31 API Docs page (Scalar, EPIC 22) — тема под SPLAT palette

Фаза 6 — Dark/Light theme + persistence (0.5 дня)
  24.32 Theme switcher (prefers-color-scheme + user override), SSR-safe [A1 priority]

Фаза 7 — QA и фиксы (2 дня)
  24.33 Typecheck sweep
  24.34 Lint sweep
  24.35 Unit + E2E фиксы (селекторы под новую DOM-структуру)
  24.36 A11y sweep — axe-core на всех ключевых страницах
  24.37 Smoke ручной (чеклист)
  24.38 Bundle size + tree-shaking audit

Фаза 8 — Релиз (0.5 дня)
  24.39 CHANGELOG, README, completed-epics, финальный review, bump до 0.16.0

Итого: 14–16 рабочих дней
```

---

## 6. Задачи

> Примечание: задачи 24.2, 24.3, 24.4, 24.9, 24.10 и 24.32 выполняются с приоритетом требований amendment A1.

---

### Задача 24.1 — Аудит и baseline

**Приоритет:** 🔴 Critical · Фаза 0
**Оценка:** 0.25 дня

**Действия:**

1. Создать ветку `feat/epic-24-primevue-migration` от актуального `main` (после мержа EPIC 23).
2. Зафиксировать baseline в `docs/reviews/epic-24-baseline.md`:
   - Версии пакетов (`pnpm list --depth=0`).
   - Размер bundle до миграции (`pnpm build` → `.output/public` total size).
   - Cold start dev-сервера.
   - Количество используемых Nuxt UI компонентов (grep по `app/` — `U[A-Z]` pattern).
   - Результаты `pnpm test:unit`, `pnpm test:e2e`, `pnpm lint`, `pnpm typecheck` (должны быть зелёными после EPIC 23).
3. Инвентаризация React-макетов: список файлов и страниц, какие блоки куда ложатся.

**Критерии приёмки:**
- [ ] Ветка создана
- [ ] `docs/reviews/epic-24-baseline.md` заполнен

---

### Задача 24.2 — Custom preset и CSS token layer

**Приоритет:** 🔴 Critical · Фаза 0
**Зависимости:** 24.1
**Оценка:** 0.75 дня

**Обоснование:** Прежде чем менять компоненты, нужно зафиксировать единый язык дизайн-токенов. Создаём мост между SPLAT-токенами из макетов (`--accent`, `--ok`, и т.д.) и PrimeVue-токенами (`--p-primary-*`, `--p-surface-*`). Это позволит: (а) писать компоненты через привычные SPLAT-токены; (б) PrimeVue-компоненты автоматически подхватят красную палитру.

**Создаваемые файлы:**

```
app/themes/splat-preset.ts            — definePreset(Aura, {...}) с SPLAT primary + semantic scales
app/themes/splat-preset.d.ts          — типы для кастомных токенов
app/assets/css/tokens.css             — SPLAT-токены на уровне :root/.p-dark (мост к PrimeVue)
app/assets/css/main.css               — обновление импортов, убираем Tailwind @source из Nuxt UI
```

**Реализация `app/themes/splat-preset.ts`:**

```typescript
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

const SplatPreset = definePreset(Aura, {
  semantic: {
    primary: {
      // SPLAT red, маппинг на Tailwind red-*
      50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca',
      300: '#fca5a5', 400: '#f87171', 500: '#ef4444',
      600: '#dc2626', 700: '#b91c1c', 800: '#991b1b',
      900: '#7f1d1d', 950: '#450a0a',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7',
          300: '#d4d4d8', 400: '#a1a1aa', 500: '#71717a',
          600: '#52525b', 700: '#3f3f46', 800: '#27272a',
          900: '#18181b', 950: '#09090b',
        },
      },
      dark: {
        surface: {
          0: '#09090b',
          50: '#18181b', 100: '#27272a', 200: '#3f3f46',
          300: '#52525b', 400: '#71717a', 500: '#a1a1aa',
          600: '#d4d4d8', 700: '#e4e4e7', 800: '#f4f4f5',
          900: '#fafafa', 950: '#ffffff',
        },
      },
    },
  },
})

export default SplatPreset
```

**Реализация `app/assets/css/tokens.css`:**

```css
/* SPLAT design tokens — bridge to PrimeVue CSS variables */
:root {
  /* Surfaces */
  --bg: var(--p-surface-0);
  --bg-elev: var(--p-surface-0);
  --bg-sunken: var(--p-surface-50);
  --bg-hover: var(--p-surface-100);

  /* Text */
  --text: var(--p-surface-900);
  --text-muted: var(--p-surface-600);
  --text-dim: var(--p-surface-400);

  /* Lines */
  --line: var(--p-surface-200);
  --line-strong: var(--p-surface-300);

  /* Accent (primary — SPLAT red) */
  --accent: var(--p-primary-600);
  --accent-soft: color-mix(in srgb, var(--p-primary-500) 12%, transparent);
  --accent-strong: var(--p-primary-700);
  --accent-ink: #ffffff;

  /* Semantic — fixed scales, not tied to scheme where possible */
  --ok: #10b981;        --ok-soft:     color-mix(in srgb, #10b981 12%, transparent);
  --warn: #f59e0b;      --warn-soft:   color-mix(in srgb, #f59e0b 12%, transparent);
  --info: #3b82f6;      --info-soft:   color-mix(in srgb, #3b82f6 12%, transparent);
  --purple: #8b5cf6;    --purple-soft: color-mix(in srgb, #8b5cf6 12%, transparent);

  /* Shadows */
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.04);
  --shadow-md: 0 4px 12px rgb(0 0 0 / 0.06);
  --shadow-lg: 0 16px 40px rgb(0 0 0 / 0.12);
}

.p-dark {
  --bg: var(--p-surface-50);
  --bg-elev: var(--p-surface-100);
  --bg-sunken: var(--p-surface-50);
  --bg-hover: var(--p-surface-200);

  --text: var(--p-surface-900);
  --text-muted: var(--p-surface-500);
  --text-dim: var(--p-surface-400);

  --line: var(--p-surface-200);
  --line-strong: var(--p-surface-300);

  --accent-soft: color-mix(in srgb, var(--p-primary-400) 16%, transparent);

  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 12px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 16px 40px rgb(0 0 0 / 0.5);
}

/* Typography */
:root {
  --font-ui: 'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace;
}

body {
  font-family: var(--font-ui);
  background: var(--bg);
  color: var(--text);
}

.mono { font-family: var(--font-mono); }
```

**Критерии приёмки:**
- [ ] `SplatPreset` экспортируется и проходит типизацию
- [ ] `tokens.css` покрывает все SPLAT-токены из макетов
- [ ] Светлая и тёмная схемы синхронизированы с `.p-dark` селектором

---

### Задача 24.3 — Установка PrimeVue и конфигурация модуля

**Приоритет:** 🔴 Critical · Фаза 1
**Зависимости:** 24.2
**Оценка:** 0.5 дня

**Изменяемые/создаваемые файлы:**

```
package.json                 — + primevue, @primeuix/themes, @primevue/nuxt-module, primeicons (опц.)
                              — − @nuxt/ui (после завершения миграции, задача 24.8)
nuxt.config.ts               — добавить '@primevue/nuxt-module' в modules, убрать '@nuxt/ui'
                              — primevue: { options, autoImport, importTheme, composables }
app/plugins/primevue-services.ts  — регистрация ToastService, ConfirmationService, DialogService
```

**Установка:**

```bash
pnpm add primevue @primeuix/themes
pnpm add -D @primevue/nuxt-module
pnpm add @primevue/forms  # для Zod-based форм
```

**`nuxt.config.ts` — ключевые секции:**

```typescript
import SplatPreset from './app/themes/splat-preset'

export default defineNuxtConfig({
  modules: [
    '@primevue/nuxt-module',
    '@nuxt/icon',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    // НЕ ставим '@nuxt/ui' — удалено в 24.8
  ],
  primevue: {
    options: {
      ripple: true,
      inputVariant: 'outlined',
      theme: {
        preset: SplatPreset,
        options: {
          prefix: 'p',
          darkModeSelector: '.p-dark',
          cssLayer: false,
        },
      },
      locale: {
        // RU-локаль PrimeVue из PrimeLocale
        // подгружаем динамически через i18n hook (см. 24.4)
      },
    },
    autoImport: true,
    components: {
      include: '*',
      exclude: ['Editor'], // Editor тянет Quill — не нужен
    },
    directives: {
      include: ['Ripple', 'Tooltip', 'StyleClass', 'FocusTrap'],
    },
    composables: {
      include: ['useStyle', 'usePrimeVue'],
    },
  },
  css: [
    '~/assets/css/tokens.css',
    '~/assets/css/main.css',
    // примечание: primeicons НЕ подключаем — используем @nuxt/icon + Lucide
  ],
})
```

**`app/plugins/primevue-services.ts`:**

```typescript
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import DialogService from 'primevue/dialogservice'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(ToastService)
  nuxtApp.vueApp.use(ConfirmationService)
  nuxtApp.vueApp.use(DialogService)
})
```

**Критерии приёмки:**
- [ ] `pnpm install` проходит
- [ ] `pnpm dev` стартует без ошибок
- [ ] Тест-компонент `<Button label="Test" />` рендерится с красным primary (SPLAT)
- [ ] `useToast()`, `useConfirm()`, `useDialog()` доступны в компонентах

---

### Задача 24.4 — App shell, layouts, error page

**Приоритет:** 🔴 Critical · Фаза 1
**Зависимости:** 24.3
**Оценка:** 0.75 дня

**Обоснование:** Макет `app.jsx` диктует структуру: `<Sidebar /> + <main> { <Topbar /> + <Page /> }` + глобальные оверлеи (CreateDrawer, DetailDrawer, Tweaks). Плюс нужны layout'ы для `/auth/*` (центрированная карточка) и scan-экранов (без шеллов).

**Изменяемые/создаваемые файлы:**

```
app/app.vue                          — корневой shell, слоты для overlays, глобальный Toast + ConfirmDialog
app/layouts/default.vue              — Sidebar + TopBar + <slot />
app/layouts/auth.vue                 — centered container + theme toggle
app/layouts/scan.vue                 — full-screen для /not-found, /expired (branded QR experience)
app/error.vue                        — универсальная error-страница (404/500) с branded дизайном
app/components/overlays/CreateDrawer.vue    — placeholder, full body в 24.13
app/components/overlays/DetailDrawer.vue    — placeholder, full body в 24.14
app/components/dev/Tweaks.vue        — dev-only панель переключения темы (import.meta.dev)
```

**`app/app.vue`:**

```vue
<template>
  <div :class="{ 'p-dark': isDark }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- Глобальные сервисы -->
    <Toast position="bottom-right" />
    <ConfirmDialog />
    <DynamicDialog />
    <!-- Dev-only tweaks -->
    <Tweaks v-if="isDev" />
  </div>
</template>

<script setup lang="ts">
const ui = useUiStore()
const isDark = computed(() => ui.theme === 'dark')
const isDev = import.meta.dev
</script>
```

**Критерии приёмки:**
- [ ] `/` рендерится с Sidebar + Topbar + Dashboard-заглушкой
- [ ] `/auth/login` рендерится с auth-layout (без Sidebar)
- [ ] `/not-found` использует scan layout
- [ ] `Toast`, `ConfirmDialog`, `DynamicDialog` глобально доступны

---

### Задача 24.5 — Global styles и шрифты

**Приоритет:** 🔴 Critical · Фаза 1
**Зависимости:** 24.3
**Оценка:** 0.25 дня

**Изменяемые файлы:**

```
app/assets/css/main.css              — глобальные стили (body, focus-visible, scroll), удаление Nuxt UI импортов
public/fonts/*                       — self-hosted Inter Tight + JetBrains Mono (variable)
```

**Подключение шрифтов:**

```css
@font-face {
  font-family: 'Inter Tight';
  src: url('/fonts/InterTight-Variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/JetBrainsMono-Variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap;
}
```

**Глобальные focus/scroll стили:**

```css
*:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}

::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 5px; }
::-webkit-scrollbar-track { background: transparent; }
```

**Критерии приёмки:**
- [ ] Шрифты подгружаются без FOUT
- [ ] Focus visible работает на всех интерактивных элементах (клавиатурная навигация)
- [ ] Скроллы стилизованы в обеих темах

---

### Задача 24.6 — UI-примитивы (wrapper-слой)

**Приоритет:** 🔴 Critical · Фаза 2
**Зависимости:** 24.4, 24.5
**Оценка:** 1 день

**Обоснование:** Макеты используют набор небольших переиспользуемых компонентов, которые в React/JSX были просто функциями (`Avatar`, `Badge`, `Card`, `Sparkline`, `Kbd`, `Divider`, `MiniStat`, `Field`, `Section`, `LegendDot`). В Vue делаем их как `<SplatCard>` и т.п. с привязкой к SPLAT-токенам, поверх PrimeVue примитивов.

**Создаваемые файлы:**

```
app/components/ui/AppCard.vue          — базовая карточка (var(--bg-elev) + inset ring + shadow-sm)
app/components/ui/AuthorAvatar.vue     — круглый аватар с инициалами + hue (из макета: oklch(0.92 0.06 $hue))
app/components/ui/AuthorAvatarGroup.vue — стэк аватаров с «+N»
app/components/ui/StatusBadge.vue      — wrapper Tag с tone ok/warn/info/purple/accent/dim + dot
app/components/ui/VisibilityBadge.vue  — для private/department/public (EPIC 19 — перенос в новый стиль)
app/components/ui/Sparkline.vue        — инлайн SVG sparkline (80x22)
app/components/ui/Kbd.vue              — «⌘K» keyboard hint
app/components/ui/Divider.vue          — vertical/horizontal разделитель
app/components/ui/MiniStat.vue         — маленькая stat-карточка (label + value + sub)
app/components/ui/LegendDot.vue        — легенда чарта (color dot + label)
app/components/ui/SectionTitle.vue     — заголовок секции (uppercase label + H2 + optional sub)
app/components/ui/Field.vue            — grid-ряд «label | control» для settings
app/components/ui/QrPreview.vue        — SVG-превью QR (уже есть как app/utils/qr-svg.ts, переносим в компонент)
```

**Пример `AppCard.vue`:**

```vue
<template>
  <div
    :class="['splat-card', { padded, hoverable }]"
    @click="emit('click', $event)"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  padded?: boolean
  hoverable?: boolean
}
withDefaults(defineProps<Props>(), { padded: true, hoverable: false })
const emit = defineEmits<{ click: [MouseEvent] }>()
</script>

<style scoped>
.splat-card {
  background: var(--bg-elev);
  border-radius: 14px;
  box-shadow: inset 0 0 0 1px var(--line), var(--shadow-sm);
  transition: all 150ms ease;
}
.splat-card.padded { padding: 20px; }
.splat-card.hoverable { cursor: pointer; }
.splat-card.hoverable:hover {
  box-shadow: inset 0 0 0 1px var(--line-strong), var(--shadow-md);
  transform: translateY(-1px);
}
</style>
```

**Критерии приёмки:**
- [ ] Все 12+ примитивов созданы, документированы, покрыты сторибуками в `/docs-ui` (EPIC 18)
- [ ] Каждый компонент имеет корректные TS props
- [ ] Визуальный вид совпадает с React-макетами

---

### Задача 24.7 — Глобальные сервисы (Toast, Confirm, Dialog)

**Приоритет:** 🟡 High · Фаза 2
**Зависимости:** 24.3
**Оценка:** 0.5 дня

**Создаваемые файлы:**

```
app/composables/useNotify.ts         — обёртка над useToast (success/error/info/warning + undo slot)
app/composables/useSplatConfirm.ts   — обёртка над useConfirm с SPLAT-стилем (severity, header, acceptLabel)
```

**Пример `useNotify.ts`:**

```typescript
import { useToast } from 'primevue/usetoast'

export function useNotify() {
  const toast = useToast()
  return {
    success: (summary: string, detail?: string) =>
      toast.add({ severity: 'success', summary, detail, life: 3000 }),
    error: (summary: string, detail?: string) =>
      toast.add({ severity: 'error', summary, detail, life: 5000 }),
    info: (summary: string, detail?: string) =>
      toast.add({ severity: 'info', summary, detail, life: 3000 }),
    warning: (summary: string, detail?: string) =>
      toast.add({ severity: 'warn', summary, detail, life: 4000 }),
    undo: (summary: string, onUndo: () => void) =>
      toast.add({
        severity: 'info', summary, life: 5000,
        group: 'undo', closable: false,
        // компонент Toast с custom slot — см. 24.27
      }),
  }
}
```

**Критерии приёмки:**
- [ ] `useNotify` работает на всех страницах
- [ ] `useSplatConfirm` корректно показывает модалку с красным accept для destructive

---

### Задача 24.8 — Component mapping sweep

**Приоритет:** 🔴 Critical · Фаза 2
**Зависимости:** 24.6, 24.7
**Оценка:** 0.75 дня

**Обоснование:** Механическая замена всех Nuxt UI компонентов на PrimeVue по всему проекту. После этого шага `@nuxt/ui` можно **удалить из dependencies**.

**Действия:**

1. По таблице маппинга из раздела 4 идти файл-за-файлом через `app/components/**`, `app/pages/**`, `app/layouts/**`.
2. Для каждого файла:
   - Заменить `<UButton>` → `<Button>` и т.д.
   - Адаптировать props (`color` → `severity`, `loading` → `:loading`, icon через slots).
   - Удалить импорты, которые теперь auto-импортируются PrimeVue-модулем.
3. После прохода — удалить `@nuxt/ui` из `package.json` и `nuxt.config.ts`.
4. Прогнать `pnpm build` — собирать итеративно, фиксить проблемы.

**Критерии приёмки:**
- [ ] `grep -rn "^import.*@nuxt/ui\|<U[A-Z]" app/` — 0 совпадений
- [ ] `@nuxt/ui` удалён из `package.json`
- [ ] `pnpm build` проходит
- [ ] Приложение рендерится (визуальные регрессии ожидаемы, фиксятся в задачах 24.9+)

---

### Задача 24.9 — Sidebar

**Приоритет:** 🔴 Critical · Фаза 3
**Зависимости:** 24.8
**Оценка:** 1 день

**Соответствие макету:** `sidebar.jsx`.

**Создаваемые/изменяемые файлы:**

```
app/components/app/Sidebar.vue
app/stores/ui.ts               — уже есть, добавить `collapsed: boolean` + persist
```

**Блоки (точно по макету):**

1. **Brand** (18px padding; 32x32 красный тайл с QR-иконкой + «QR Service» + «Splat Global · Internal»). В collapsed — только тайл.
2. **Collapse toggle** — круглая кнопка 22x22, позиционирована `absolute, right: -12px, top: 22px`, chevron left/right.
3. **Search trigger** (только expanded) — серая «кнопка» с иконкой лупы + «Поиск» + `<Kbd>⌘K</Kbd>`. Клик → открывает Command Palette (задача 24.10).
4. **Nav** (6 пунктов):
   - Дашборд (Ic.Dashboard)
   - QR-коды (Ic.QR + count из `QR_DATA.length`)
   - Папки (Ic.Folder + count)
   - Аналитика (Ic.Analytics)
   - Интеграции (Ic.Integrations + badge '3')
   - Настройки (Ic.Settings)
   Active: `background: var(--accent-soft)`, `color: var(--accent)`, `font-weight: 600`.
5. **Folders quick list** (только expanded) — top-5 папок со swatch-точкой + название + счётчик.
6. **User card** (bottom) — `AuthorAvatar` + имя + роль + chevron-down (меню: профиль/logout).

**Использует PrimeVue:**
- `v-tooltip` для подсказок при `collapsed`.
- `Menu` компонент (overlay) для user dropdown.

**Дополнения из существующего приложения (НЕ в макетах, но нужны):**
- Пункт «Общие QR» (EPIC 19 — `/shared`) с иконкой `i-lucide-globe` после «Папки».
- Пункт «Уведомления» не в sidebar — остаётся в Topbar (как в макете).

**Критерии приёмки:**
- [ ] Визуальное соответствие макету (screenshot-diff в ручном review)
- [ ] Collapse работает, состояние persist'ится в `ui.ts`
- [ ] Cmd+K открывает Command Palette
- [ ] Active state корректно подсвечивает текущий раздел
- [ ] User dropdown открывает меню с пунктами «Профиль», «Выйти»

---

### Задача 24.10 — Topbar + Command Palette

**Приоритет:** 🔴 Critical · Фаза 3
**Зависимости:** 24.9
**Оценка:** 0.5 дня

**Соответствие макету:** `topbar.jsx`.

**Создаваемые/изменяемые файлы:**

```
app/components/app/Topbar.vue
app/components/app/CommandPalette.vue     — Cmd+K global search (EPIC 16 — адаптация под PrimeVue)
```

**Блоки (точно по макету):**

1. **Title block** (слева) — H1 (22px, -0.02em) + subtitle (13px muted). Титул/сабтитул per-page:
   - `/dashboard` → «Обзор», «Сводка активности и последние изменения»
   - `/qr` → «QR-коды», «N кодов · X сканов всего»
   - `/folders` → «Папки», «Группировка кодов по проектам и кампаниям»
   - `/analytics` → «Аналитика», «Сканы, источники, география»
   - `/integrations` → «Интеграции», «Подключения к CRM, BI и сервисам»
   - `/settings` → «Настройки», «Воркспейс, команда, безопасность»
   - `/notifications` → «Уведомления», «N непрочитанных событий»
   - `/shared` → «Общие QR-коды», «Публичные QR компании» (EPIC 19 — дополнение)
2. **Contextual search** (только на `/qr`) — `InputText` 280px с `IconField` (лупа слева + Kbd справа).
3. **Theme toggle** — icon-button с солнцем/луной, клик → смена темы.
4. **Bell button** — с `Badge value="3" severity="danger"` в правом верхнем углу (unread counter).
5. **Divider vertical** (24px, mid-grey).
6. **Массовое создание** (только на `/qr`) — secondary button с иконкой upload.
7. **Создать QR** — primary button (accent red).

**Backdrop blur:** `backdrop-filter: saturate(1.5) blur(10px)`, `background: color-mix(in srgb, var(--bg) 85%, transparent)`.

**Критерии приёмки:**
- [ ] Title/sub per route корректны (включая `/shared`, `/bulk`, `/api-docs`, которых нет в макете)
- [ ] Contextual search появляется только на `/qr`
- [ ] Unread badge обновляется при смене состояния notifications store
- [ ] Theme toggle переключает `.p-dark` class через `ui.store`
- [ ] Backdrop blur работает в Safari/Chrome

---

### Задача 24.11 — Dashboard

**Приоритет:** 🔴 Critical · Фаза 4
**Зависимости:** 24.10
**Оценка:** 1 день

**Соответствие макету:** `dashboard.jsx`.

**Изменяемые файлы:**

```
app/pages/dashboard/index.vue
app/components/dashboard/KpiCard.vue          — новый (из KPI macro в макете)
app/components/dashboard/ScanChart.vue        — адаптация существующего + новая стилистика
app/components/dashboard/StatusBreakdown.vue  — новый
app/components/dashboard/TopQrCard.vue        — новый
app/components/dashboard/ActivityFeed.vue     — новый
```

**Блоки (точно по макету):**

1. **KPI Row** (4 колонки, gap 16):
   - Всего QR-кодов → value + «+4 за неделю» + sparkline accent
   - Активные → value + «X% всего» + sparkline ok
   - Сканов сегодня → value + «+12.4%» + sparkline info
   - Сканов за неделю → value + «+5.2%» + sparkline purple
   KPI card: 30x30 цветной тайл иконка + muted label + 28px value + delta + Sparkline (80x22).

2. **Main row** (1fr 340px, gap 16):
   - **Scan chart Card** — label «Сканы» + 26px value + Badge «+18.7% м/м» + segmented control (24ч/7д/30д/90д) + area chart 240px.
   - **Status breakdown Card** — label «По статусу» + H2 «Состояние кодов» + progress-rows per статус (dot + название + count + thin bar).

3. **Bottom row** (1fr 1fr):
   - **Top-5 QR Card** — header с кнопкой «Все» → `/qr`. Rows: индекс 01..05 + QR mini-preview 32x32 + название + thin progress-bar + scan-count (mono).
   - **Activity Feed Card** — header с кнопкой «Журнал» → `/notifications`. Rows: Avatar + текст («{имя} {действие} {target}») + иконка tone в правом углу.

**Данные берутся из:** `useAnalytics().fetchOverview()` + `useQr().list()` + реальных событий через API (EPIC 6).

**Критерии приёмки:**
- [ ] 4 KPI карточки с корректными данными и спарклайнами
- [ ] Scan chart рендерит реальные 30-дневные данные (ECharts/Chart.js — берём через vue-echarts, уже в зависимостях)
- [ ] Segmented control переключает период без перезагрузки
- [ ] Top-5 отсортирован по scans desc и ссылается на детальный drawer
- [ ] Activity feed показывает 6 последних событий

---

### Задача 24.12 — QR List page

**Приоритет:** 🔴 Critical · Фаза 4
**Зависимости:** 24.10
**Оценка:** 1.5 дня

**Соответствие макету:** `qr-list.jsx` (контент не предоставлен, восстанавливаем по app.jsx + существующей `/qr` странице).

**Изменяемые файлы:**

```
app/pages/qr/index.vue
app/components/qr/FilterBar.vue            — панель фильтров
app/components/qr/QrTable.vue              — DataTable view
app/components/qr/QrGrid.vue               — card view
app/components/qr/QrCard.vue               — enriched card (существует, редизайн)
app/components/qr/HoverPreview.vue         — существует, адаптация
app/components/qr/BulkActionsBar.vue       — появляется при выделении нескольких
```

**Структура страницы:**

1. **FilterBar** (sticky под Topbar):
   - `Select` папка (all + all FOLDERS) — 180px
   - `MultiSelect` статусы (active/paused/scheduled/expired/draft) — 180px
   - `MultiSelect` автор — 180px
   - `MultiSelect` теги — 180px
   - `MultiSelect` visibility (private/department/public) — 180px (EPIC 19)
   - `SelectButton` scope tabs (Все / Мои / Отдел / Публичные) — EPIC 19
   - Справа: `SelectButton` view (table/grid)
2. **Bulk actions bar** (появляется при выделении) — «N выделено» + «Удалить» + «Сменить папку» + «Сменить видимость» + «Экспорт» + «Отмена».
3. **Table view** (`DataTable` PrimeVue):
   - Columns: чекбокс, QR preview (32x32), Название + URL (2 строки), Папка (chip), Теги, Status Badge, Visibility Badge, Сканы (mono), Автор (Avatar), Создано, Actions (`<Button icon severity="secondary" rounded text>` + menu).
   - Sortable по name/scans/created/status.
   - Filters поверх колонок (search через header).
   - Pagination: 20/50/100 per page.
4. **Grid view** — `<QrCard>` в адаптивной сетке (3/4 кол в зависимости от ширины), enriched с hover-preview.

**Дополнения из существующего приложения:**
- Scope tabs (EPIC 19) — отсутствуют в макете, добавляем.
- Visibility column и фильтр (EPIC 19).
- Bulk visibility change (EPIC 19).
- «Массовое создание» кнопка в Topbar ведёт на `/qr/bulk` (EPIC 10).

**Критерии приёмки:**
- [ ] Переключение table/grid работает, состояние persist'ится
- [ ] Все фильтры применяются через URL query params
- [ ] DataTable поддерживает серверную пагинацию через `useQr()`
- [ ] Bulk actions работают (delete, change folder, change visibility)
- [ ] Клик по строке открывает DetailDrawer (24.14)

---

### Задача 24.13 — QR Create Drawer + `/qr/create` page

**Приоритет:** 🔴 Critical · Фаза 4
**Зависимости:** 24.12
**Оценка:** 1 день

**Соответствие макету:** `create-drawer.jsx` (контент не предоставлен, делаем по аналогии с DetailDrawer + существующей страницей create).

**Создаваемые/изменяемые файлы:**

```
app/components/overlays/CreateDrawer.vue    — новый (ранее placeholder из 24.4)
app/pages/qr/create.vue                     — существующая страница-мастер, редизайн под PrimeVue
app/components/qr/StyleEditor.vue           — существующий, адаптация (цвета, форма модулей, логотип)
app/components/qr/Preview.vue               — существующий, адаптация
```

**Блоки CreateDrawer (вертикальный стек, 560px ширина):**

1. **Header** — «Создать QR-код» + close button.
2. **Type selector** (SelectButton) — URL / vCard / WiFi / Text / SMS / Email / Geo (из существующего кода, EPIC 4).
3. **Destination** — InputText для URL / форма per type.
4. **Основное** — Name, Folder (Select), Tags (MultiSelect с auto-create), Visibility (SelectButton из EPIC 19).
5. **Дизайн** — `<StyleEditor>` (цвет переднего плана, фона, форма модулей square/rounded/dots, error correction L/M/Q/H, логотип-центр).
6. **UTM** (Accordion — свёрнуто по умолчанию) — source, medium, campaign, term, content.
7. **Preview** (фиксирован в футере) — живой превью QR + кнопки «Отмена» + «Создать».

**Страница `/qr/create.vue`** — тот же UI в full-page layout (для быстрого создания по прямой ссылке + массового создания из шаблонов), уровень вложенности такой же.

**Критерии приёмки:**
- [ ] Все 7 типов QR поддерживаются (EPIC 4)
- [ ] Визуализация обновляется live при редактировании
- [ ] Zod-валидация показывает ошибки под полями
- [ ] После успешного создания — Toast «QR создан» + закрытие drawer'а + обновление списка
- [ ] `/qr/create` full-page работает идентично drawer-версии

---

### Задача 24.14 — QR Detail Drawer + `/qr/[id]` page

**Приоритет:** 🔴 Critical · Фаза 4
**Зависимости:** 24.12
**Оценка:** 0.75 дня

**Соответствие макету:** `detail-drawer.jsx`.

**Создаваемые/изменяемые файлы:**

```
app/components/overlays/DetailDrawer.vue    — новый (раньше placeholder из 24.4)
app/pages/qr/[id]/index.vue                 — адаптация существующей (full page версия детали)
```

**Блоки (точно по макету):**

1. **Header** (`background: var(--{folderColor}-soft)`): 72x72 QR preview + status badge + folder label + H2 название + mono короткая URL + close.
2. **Actions bar** (sticky под header): Скачать (primary), Копировать ссылку, Редактировать + справа share/pause/more.
3. **Body** (scroll):
   - **Stats grid 3 cols**: Всего сканов + delta / Уникальных + % / Последний скан + гео/устройство.
   - **Mini chart card** — 12-day bars (из `qr.trend`).
   - **Meta rows**: Автор, Создан, Изменён, Тип, Короткая ссылка (mono + copy), Теги (Tag chips), Исправление ошибок (L/M/Q/H).

**Дополнения из существующего приложения:**
- Visibility row (EPIC 19) — private/department/public с иконкой.
- Departments assignment (EPIC 19) — если visibility=department.
- А/B destinations list (EPIC 9 — если активно).

**`/qr/[id]/index.vue`** — та же структура в full-page, дополнительно полная аналитика по QR (графики за период, top locations, devices) из EPIC 6.

**Критерии приёмки:**
- [ ] Drawer открывается по клику на строку `/qr` или по маршруту
- [ ] Full-page version `/qr/[id]` имеет тот же UI (header/actions/stats + расширенный аналитический блок)
- [ ] Все действия (Download, Copy, Edit, Pause, Share) работают
- [ ] Copy URL показывает Toast «Скопировано»

---

### Задача 24.15 — QR Edit `/qr/[id]/edit`

**Приоритет:** 🟡 High · Фаза 4
**Зависимости:** 24.13
**Оценка:** 0.5 дня

**Изменяемый файл:** `app/pages/qr/[id]/edit.vue`

Тот же UI, что и CreateDrawer, но в full-page. Поля предзаполнены из QR. Кнопка «Сохранить» + «Отмена» → назад.

**Критерии приёмки:**
- [ ] Все поля предзаполняются
- [ ] Сохранение работает, после — редирект на `/qr/[id]` + Toast
- [ ] «Отмена» не сохраняет изменения

---

### Задача 24.16 — Bulk CSV `/qr/bulk` (PrimeVue Stepper)

**Приоритет:** 🟡 High · Фаза 4
**Зависимости:** 24.7
**Оценка:** 0.75 дня

**Отсутствует в макетах, адаптируем под новый стиль.**

**Изменяемый файл:** `app/pages/qr/bulk.vue`

**Компоненты:**

- `Stepper` + `Step`/`StepPanel` (5 шагов: Upload → Preview → Validation → Confirm → Result).
- `FileUpload` для CSV (drop-zone style).
- `DataTable` для preview + validation (ошибочные строки подсвечены).
- `ProgressBar` во время импорта.
- `Message` для результата (success/error summary).

**Критерии приёмки:**
- [ ] Все 5 шагов работают
- [ ] Drop-zone принимает CSV
- [ ] Template CSV скачивается
- [ ] Errors summary показывает первые 20 ошибочных строк

---

### Задача 24.17 — Folders page + `/folders/[id]`

**Приоритет:** 🟡 High · Фаза 4
**Зависимости:** 24.8
**Оценка:** 0.75 дня

**Соответствие макету:** `folders.jsx`.

**Изменяемые файлы:**

```
app/pages/folders/index.vue
app/pages/folders/[id].vue
app/components/folders/FolderCard.vue
app/components/folders/FolderDialog.vue  — адаптация (create/edit через Dialog)
```

**Блоки (точно по макету):**

Grid `auto-fill, minmax(300px, 1fr)`:
- **FolderCard**: 110px top section (цветной `--{folder.color}-soft` фон + абстрактный круг + 40x40 icon tile + стэк 3 QR-preview в правом углу) + body (название, count/сканы, AvatarGroup + timestamp).
- **Create folder card**: dashed border, центрированный «+» + «Создать папку».

**`/folders/[id]`** — переиспользует `QrTable` + `FilterBar` из 24.12 с preset folder filter.

**Критерии приёмки:**
- [ ] Клик по карточке папки → `/folders/[id]`
- [ ] Create folder открывает Dialog
- [ ] Edit / Delete через контекстное меню на карточке

---

### Задача 24.18 — Analytics page

**Приоритет:** 🔴 Critical · Фаза 4
**Зависимости:** 24.10
**Оценка:** 1 день

**Соответствие макету:** `analytics.jsx`.

**Изменяемые файлы:**

```
app/pages/analytics/index.vue
app/components/analytics/PeriodSelector.vue
app/components/analytics/BigScanChart.vue       — BarChart (scans over unique)
app/components/analytics/GeoTop.vue             — top-cities progress list
app/components/analytics/DeviceDonut.vue        — donut + legend
app/components/analytics/SourceBreakdown.vue    — stacked bar + legend
```

**Плюс из EPIC 20 (перенос и адаптация):**

```
app/components/analytics/GeoMap.vue             — карта регионов РФ (уже есть из EPIC 20)
app/components/analytics/HourlyChart.vue        — EPIC 20
app/components/analytics/WeekdayChart.vue       — EPIC 20
app/components/analytics/CompareChart.vue       — period-over-period (EPIC 20)
```

**Структура (по макету + расширения):**

1. **Period row** — period select (30д/7д/90д/все) + QR filter + Refresh + Export CSV.
2. **Big Scan Card** — header (label + 28px value + +22.4% badge + legend), BarChart с `scans` (accent) и `unique` (info) сверху.
3. **3-col grid**:
   - **Geo card** — top cities list с progress bars (из макета).
   - **Devices card** — donut 120px + legend (iOS/Android/Desktop/Другое).
   - **Sources card** — stacked bar + legend (Упаковка/Промо/POS/Мероприятия/Онлайн).
4. **[Дополнение EPIC 20]** **Geo Map** — полноширинная карта регионов РФ с точками сканирования.
5. **[Дополнение EPIC 20]** **Time distribution** — 2-col: HourlyChart (24h) + WeekdayChart (7d).
6. **[Дополнение EPIC 20]** **Compare previous period** — toggle + overlay на BigScanChart.

**Критерии приёмки:**
- [ ] Период и фильтры меняют данные через `useAnalytics()`
- [ ] Экспорт CSV работает (server endpoint, есть в EPIC 6)
- [ ] Все графики рисуются через vue-echarts
- [ ] Compare previous period overlay корректно показывает разницу

---

### Задача 24.19 — Integrations page

**Приоритет:** 🟡 High · Фаза 4
**Зависимости:** 24.8
**Оценка:** 0.5 дня

**Соответствие макету:** `integrations.jsx`.

**Изменяемый файл:** `app/pages/integrations/index.vue`

**Блоки:**

1. **API-key card** — Lock icon tile + «API-ключ воркспейса» + subtitle + mono-ключ с **«••••••••••••_3f7a»** placeholder + Copy + Rotate button.
2. **Group «Подключённые»** (grid auto-fill 300px):
   - Google Analytics 4 — «Подключено» badge + «Настроить»
   - 1С:Предприятие
   - Slack
3. **Group «Доступные»**:
   - Bitrix24, Yandex Metrica, Google Sheets, Webhook/REST, Power BI, Telegram Bot — «Подключить» button.

**Дополнения из существующего приложения:**
- Страница `/settings/api-keys` (EPIC 12) — список активных ключей с IP allowlist (EPIC 21) и expiry.

**Критерии приёмки:**
- [ ] API-key можно скопировать и ротировать (Toast подтверждения)
- [ ] Connect/Configure buttons открывают соответствующие Dialog'и (для большинства — placeholder «Coming soon»)

---

### Задача 24.20 — Settings page

**Приоритет:** 🔴 Critical · Фаза 4
**Зависимости:** 24.8
**Оценка:** 1.5 дня

**Соответствие макету:** `settings.jsx`.

**Структура:**

```
app/pages/settings.vue                       — layout (200px sidebar + content)
app/pages/settings/index.vue                 — redirect на /settings/workspace
app/pages/settings/workspace.vue             — Workspace panel
app/pages/settings/team.vue                  — Team panel (существует, редизайн)
app/pages/settings/billing.vue               — Billing placeholder
app/pages/settings/security.vue              — Security (API keys, sessions, audit log)
app/pages/settings/branding.vue              — Branding panel
```

**Дополнения из существующего приложения** (отдельные табы в sidebar):

```
app/pages/settings/domains.vue               — Allowed Domains (whitelist для входа, EPIC 2)
app/pages/settings/destination-domains.vue   — Destination Domains (EPIC 21 SEC-07)
app/pages/settings/departments.vue           — Departments (EPIC 19)
app/pages/settings/api-keys.vue              — API Keys management (EPIC 12 + EPIC 21)
```

**Sidebar таб-список (итого 9):**

1. Воркспейс
2. Команда (count badge)
3. Подразделения (EPIC 19 — дополнение)
4. Домены (allowed + destination, EPIC 2, EPIC 21 — дополнение)
5. API-ключи (EPIC 12 — дополнение)
6. Брендинг
7. Безопасность (sessions, audit, 2FA)
8. Уведомления (настройки email/in-app)
9. Тариф и оплата

**Workspace panel** (по макету):
- Name, Короткий домен, Timezone, Default папка для новых QR.
- Пресеты дизайна — grid 4 карточек (первая — active).

**Team panel**:
- Search + Invite button.
- Members table: Avatar + имя/email + Role badge + Last active + menu. Roles: Owner/Admin/Editor/Viewer.

**Branding panel**:
- Логотип в центре (upload PNG/SVG 512x512).
- Основной цвет (5 swatch buttons + custom).
- Форма модулей (Квадраты/Скруглённые/Точки/Плавные).

**Security panel** (существующая функциональность):
- Active sessions list с revoke (EPIC 21 SEC-14).
- 2FA toggle (future).
- Audit log last 30 events (EPIC 21).

**Критерии приёмки:**
- [ ] 9 табов в sidebar, каждая страница работает
- [ ] Workspace settings сохраняются в БД
- [ ] Team management работает (invite, change role, remove)
- [ ] Departments CRUD (EPIC 19)
- [ ] Domains (allowed + destination) управляются
- [ ] API keys can be created/revoked/scoped (EPIC 21)

---

### Задача 24.21 — Notifications page

**Приоритет:** 🟡 High · Фаза 4
**Зависимости:** 24.8
**Оценка:** 0.5 дня

**Соответствие макету:** `notifications.jsx`.

**Изменяемый файл:** `app/pages/notifications/index.vue` (новая страница — в текущем SPLAT QR нет)

**Блоки:**

1. **Tabs border-bottom** — Все (N) / Непрочитанные (3) / Упоминания / Интеграции / Безопасность.
2. **Mark all read** + **Settings** в правом углу.
3. **List card**:
   - Row: unread dot + Avatar/icon tile + title + body + time + more.
   - Hover: `background: var(--bg-sunken)`, unread highlight `color-mix(in srgb, var(--accent) 4%, transparent)`.

**Backend:**
- Сейчас нотификаций нет — добавляем схему `notifications` (новая таблица) + service + API `/api/notifications/*`.
- **Этот backend — отдельный under-epic**, но минимальная реализация (список + mark as read) входит в 24.21.

**Критерии приёмки:**
- [ ] Tabs фильтруют список
- [ ] Mark all read работает
- [ ] Unread counter в Topbar синхронизируется

---

### Задача 24.22 — Shared QR `/shared`

**Приоритет:** 🟡 High · Фаза 4
**Зависимости:** 24.12
**Оценка:** 0.25 дня

**Отсутствует в макетах, перенос из EPIC 19.**

**Изменяемый файл:** `app/pages/shared/index.vue`

Переиспользует `QrTable` / `QrGrid` с `scope = 'public'`, доп фильтры: автор + department.

**Критерии приёмки:**
- [ ] Отображает только public QR
- [ ] Фильтры по автору/отделу работают

---

### Задача 24.23 — Auth `/auth/login`

**Приоритет:** 🔴 Critical · Фаза 4
**Зависимости:** 24.4
**Оценка:** 0.5 дня

**Отсутствует в макетах, редизайн существующей страницы.**

**Изменяемый файл:** `app/pages/auth/login.vue`

**Layout:** `auth.vue` (центрированный 400px контейнер + theme toggle top-right).

**Структура (email → OTP single screen, EPIC 2):**

1. Brand logo (крупный, 48x48).
2. H1 «Вход в SPLAT QR».
3. Subtitle «Введите рабочий email для получения кода».
4. `InputText` email + inline validation (domain из allowed list).
5. Stage 1 button: «Получить код».
6. Stage 2 (после отправки): `InputOtp` (PrimeVue component, 6 digits) + «Подтвердить» + «Отправить снова (Xs)».

**Критерии приёмки:**
- [ ] Validation домена работает (EPIC 2)
- [ ] OTP flow: email → code → redirect на `/dashboard`
- [ ] Rate limit (EPIC 21) обрабатывается с показом Toast

---

### Задача 24.24 — Scan experience (error/not-found/expired)

**Приоритет:** 🟡 High · Фаза 4
**Зависимости:** 24.4
**Оценка:** 0.5 дня

**Отсутствует в макетах, редизайн существующих страниц.**

**Изменяемые файлы:**

```
app/error.vue              — универсальная 404/500 с SPLAT-брендингом
app/pages/not-found.vue    — «QR-код не найден» (публичная, scan layout)
app/pages/expired.vue      — «Срок QR-кода истёк» (публичная, scan layout)
```

**Layout scan:** full-screen, centered, SPLAT logo, H1, описание, кнопка «На главную» (для авторизованных) или «Узнать о SPLAT» (для unauthenticated).

**Критерии приёмки:**
- [ ] Все 3 страницы рендерятся с правильным layout
- [ ] Навигация работает

---

### Задача 24.25 — Onboarding overlay (EPIC 20 — перенос)

**Приоритет:** 🟢 Medium · Фаза 5
**Зависимости:** 24.11
**Оценка:** 0.25 дня

**Отсутствует в макетах, перенос существующего.**

**Изменяемый файл:** `app/components/shared/OnboardingOverlay.vue`

Адаптация под PrimeVue `Dialog` (modal, dismissable) + 3 шага: создайте QR → организуйте в папки → смотрите аналитику.

**Критерии приёмки:**
- [ ] Показывается только при первом входе (`useOnboarding` composable — EPIC 20)
- [ ] Skip/complete состояния сохраняются

---

### Задача 24.26 — Empty states (EPIC 20 — перенос)

**Приоритет:** 🟢 Medium · Фаза 5
**Зависимости:** 24.6
**Оценка:** 0.25 дня

**Существует, адаптация стилистики.**

**Изменяемый файл:** `app/components/shared/EmptyState.vue`

SVG-иллюстрации (EPIC 20) + title + description + CTA button. Используется на пустых листах QR, папок, команды.

**Критерии приёмки:**
- [ ] Все 6+ empty states на своих местах (QR list, folder page, analytics no-data, search no-results, notifications empty, shared empty)

---

### Задача 24.27 — Toast notifications (replacement)

**Приоритет:** 🟡 High · Фаза 5
**Зависимости:** 24.7
**Оценка:** 0.25 дня

Toast уже зарегистрирован в 24.3 и 24.7. В этой задаче — замена всех `useToast()` из Nuxt UI на новый `useNotify()` composable во всех местах, где вызывался (CRUD QR, auth, bulk import, team invite, и т.д.).

**Критерии приёмки:**
- [ ] `grep -rn "useToast\(\)" app/` — только использует `useNotify` wrapper
- [ ] Undo toast работает для bulk delete (EPIC 4)

---

### Задача 24.28 — ConfirmDialog для destructive actions

**Приоритет:** 🟡 High · Фаза 5
**Зависимости:** 24.7
**Оценка:** 0.25 дня

Замена всех `UModal` с confirm-use-case на `useConfirm()` / `useSplatConfirm()`.

**Места использования:**
- Удаление QR (single + bulk)
- Удаление папки
- Удаление participant из department (EPIC 19)
- Удаление member из team
- Удаление allowed domain
- Revoke API key
- Revoke session

**Критерии приёмки:**
- [ ] Все destructive actions защищены confirm-диалогом
- [ ] Accept button — red severity, Reject — secondary

---

### Задача 24.29 — Departments management (EPIC 19)

**Приоритет:** 🟡 High · Фаза 5
**Зависимости:** 24.20
**Оценка:** 0.5 дня

**Изменяемые файлы:** `app/pages/settings/departments.vue`, `DepartmentDialog.vue`, `MembersDialog.vue` (существуют из EPIC 19, редизайн).

Grid departments card + Dialog для create/edit + Dialog для member management. Использует PrimeVue `Dialog` + `DataTable` для members.

**Критерии приёмки:**
- [ ] CRUD departments работает (EPIC 19)
- [ ] Members management работает
- [ ] Access control сохранён (только admin)

---

### Задача 24.30 — Allowed + Destination Domains

**Приоритет:** 🟡 High · Фаза 5
**Зависимости:** 24.20
**Оценка:** 0.25 дня

**Изменяемые файлы:** `app/pages/settings/domains.vue`, `destination-domains.vue`.

Две DataTable с inline edit + isActive toggle + delete.

**Критерии приёмки:**
- [ ] Allowed Domains CRUD работает (EPIC 2)
- [ ] Destination Domains whitelist работает (EPIC 21 SEC-07)

---

### Задача 24.31 — API Docs page (Scalar, EPIC 22)

**Приоритет:** 🟢 Medium · Фаза 5
**Зависимости:** 24.4
**Оценка:** 0.25 дня

**Изменяемый файл:** `app/pages/api-docs/index.vue`

Scalar UI уже встроен (EPIC 22). Обновить `customCss` на новые SPLAT-токены.

**Критерии приёмки:**
- [ ] Scalar рендерится с SPLAT palette (accent red)
- [ ] Работает в light/dark

---

### Задача 24.32 — Theme switcher + persistence

**Приоритет:** 🟡 High · Фаза 6
**Зависимости:** 24.4
**Оценка:** 0.5 дня

**Изменяемые файлы:**

```
app/stores/ui.ts                 — theme: 'light' | 'dark' | 'auto', persist
app/composables/useTheme.ts      — theme logic + SSR-safe
app/components/app/Topbar.vue    — icon-button (sun/moon)
```

**Логика:**
1. SSR: initial theme = `auto` → читаем `Sec-CH-Prefers-Color-Scheme` заголовок, если нет — `dark` (тёмная по умолчанию для dashboard-style приложений).
2. Client: гидратация + `matchMedia('(prefers-color-scheme: dark)')` + `useColorMode`.
3. User override сохраняется в cookie (для SSR) и localStorage.
4. Toggle: light ↔ dark (auto выбирается только через settings).
5. `.p-dark` class на `<html>` включает PrimeVue dark scheme.

**Критерии приёмки:**
- [ ] Нет FOUC при hydration
- [ ] Smooth transition (0.2s) при смене темы
- [ ] User preference persist'ится между сессиями
- [ ] SSR отдаёт правильную тему на первой загрузке

---

### Задача 24.33 — Typecheck sweep

**Приоритет:** 🔴 Critical · Фаза 7
**Зависимости:** все предыдущие
**Оценка:** 0.5 дня

Прогон `pnpm typecheck` — фикс всех новых ошибок, появившихся от замены компонентов. PrimeVue компоненты имеют строгие props types, часть Nuxt UI API могла быть менее строгой.

**Критерии приёмки:**
- [ ] `pnpm typecheck` — 0 ошибок
- [ ] Нет `@ts-ignore` без TODO-ссылки

---

### Задача 24.34 — Lint sweep

**Приоритет:** 🔴 Critical · Фаза 7
**Зависимости:** 24.33
**Оценка:** 0.25 дня

**Критерии приёмки:**
- [ ] `pnpm lint` — 0 ошибок, 0 warnings

---

### Задача 24.35 — Unit + E2E фиксы

**Приоритет:** 🔴 Critical · Фаза 7
**Зависимости:** 24.33, 24.34
**Оценка:** 0.75 дня

**Ожидаемые категории регрессий:**
- Playwright-селекторы: `.u-button` → `.p-button`, `[role="dialog"]` DOM отличается в PrimeVue Dialog.
- Unit-тесты компонентов: `findComponent({ name: 'UButton' })` → `{ name: 'Button' }`.
- Form tests: если использовался `UForm` + Zod, теперь `@primevue/forms`.

**Критерии приёмки:**
- [ ] `pnpm test:unit` — 100% зелёное
- [ ] `pnpm test:e2e` — 100% зелёное
- [ ] Все критические user flow (auth, QR create/edit/delete, bulk, analytics, settings, MCP) проходят

---

### Задача 24.36 — A11y sweep

**Приоритет:** 🟡 High · Фаза 7
**Зависимости:** 24.35
**Оценка:** 0.5 дня

**Действия:**
1. Прогон `@axe-core/playwright` на всех основных страницах.
2. Ручная проверка клавиатурной навигации (Tab, Shift+Tab, Esc, Enter, Space).
3. Проверка screen reader (VoiceOver/NVDA) на dashboard, QR list, Detail drawer.
4. Проверка contrast ratio всех pairs token'ов (`--text` на `--bg`, `--text` на `--bg-elev`, accent-ink на accent — WCAG AA).

**Критерии приёмки:**
- [ ] axe-core: 0 critical, 0 serious issues
- [ ] Все interactive elements фокусируются и активируются с клавиатуры
- [ ] Все Drawer'ы и Dialog'и имеют focus-trap (PrimeVue нативно)

---

### Задача 24.37 — Smoke E2E ручной прогон

**Приоритет:** 🔴 Critical · Фаза 7
**Зависимости:** 24.35, 24.36
**Оценка:** 0.25 дня

**Чеклист в `docs/reviews/epic-24-smoke-checklist.md`** покрывает:
- Auth flow (login → OTP → dashboard)
- Sidebar collapse/expand
- Topbar search (Cmd+K palette)
- Theme toggle (light ↔ dark)
- Dashboard все блоки
- QR CRUD (create drawer + full page + detail drawer + edit page)
- Bulk CSV 5-step wizard
- Folders (grid + внутри)
- Analytics все блоки
- Integrations (API key copy + rotate)
- Settings все 9 табов
- Notifications
- Shared QR (EPIC 19)
- Scan pages (not-found, expired)
- MCP работает (EPIC 22)
- A11y клавиатурная навигация

**Критерии приёмки:**
- [ ] Все пункты отмечены
- [ ] Регрессии исправлены или задокументированы как follow-up

---

### Задача 24.38 — Bundle size + tree-shaking audit

**Приоритет:** 🟢 Medium · Фаза 7
**Зависимости:** 24.35
**Оценка:** 0.25 дня

**Действия:**
1. `pnpm build` → анализ `.output/public/` через `vite-bundle-analyzer`.
2. Сравнить с baseline из 24.1.
3. Ожидание: bundle может немного увеличиться (PrimeVue сам по себе больше Nuxt UI), но на production build — tree-shaking активно работает; ожидаем ±15% относительно baseline.
4. Если bundle вырос больше чем на 30% — ищем проблему (случайный full-import, не исключённые компоненты).

**Критерии приёмки:**
- [ ] Bundle не больше baseline + 30%
- [ ] Tree-shaking работает (`Editor`, `OrgChart`, `Terminal` и подобные не-используемые компоненты — не в бандле)

---

### Задача 24.39 — Финальный релиз и документация

**Приоритет:** 🔴 Critical · Фаза 8
**Зависимости:** все
**Оценка:** 0.5 дня

**Изменяемые файлы:**

```
package.json                                 — version 0.15.0 → 0.16.0
CHANGELOG.md                                 — запись [0.16.0]
README.md                                    — бейдж UI library, актуальные скриншоты
docs/completed-epics.md                      — раздел «Эпик 24»
docs/epic-24-primevue-migration.md           — status Done
docs/reviews/epic-24-final-review.md         — финальный отчёт (отдельный шаблон)
```

**CHANGELOG запись:**

```markdown
## [0.16.0] - 2026-XX-XX

### Changed
- **BREAKING (UI):** Миграция с Nuxt UI v4 на PrimeVue 4.5.x
- Полный редизайн интерфейса по предоставленным макетам (16 компонентов)
- Новая система дизайн-токенов с кастомным preset'ом на базе Aura
- Custom component library (AppCard, AuthorAvatar, StatusBadge, etc.)

### Added
- Notifications page с табами и фильтрацией
- Enriched QR cards + hover-preview
- Dashboard KPI row с sparkline'ами
- Command palette (Cmd+K) via Listbox + Dialog
- Bulk CSV через PrimeVue Stepper
- Tweaks панель (dev-only)

### Removed
- @nuxt/ui пакет полностью удалён
```

**Критерии приёмки:**
- [ ] Все 39 задач эпика закрыты
- [ ] Release tag `v0.16.0` создан
- [ ] Staging deploy прошёл smoke
- [ ] Production deploy запланирован

---

## 7. Зависимости между задачами

**Критический путь:**

```
24.1 → 24.2 → 24.3 → 24.4 → 24.5 → 24.6 → 24.7 → 24.8
                                              → 24.9 → 24.10 → 24.11
                                              → 24.12 → 24.13 + 24.14 + 24.15 + 24.16
                                              → 24.17, 24.18, 24.19
                                              → 24.20 → 24.29, 24.30
                                              → 24.21, 24.22, 24.23, 24.24
                                              → 24.25–24.31
                                              → 24.32
                                              → 24.33 → 24.34 → 24.35 → 24.36 → 24.37 → 24.38 → 24.39
```

Длина критического пути: ~15 рабочих дней при последовательной работе одного разработчика. С параллелизацией задач 24.11–24.24 — 11–12 дней.

---

## 8. Стратегия PR-серии

Эпик разбивается на **6 последовательных PR** для упрощения ревью и возможности rollback:

| PR | Скоуп | Задачи | Размер |
|----|-------|--------|--------|
| **PR1** | Foundation | 24.1–24.5 | ~800 LOC + package.json |
| **PR2** | Primitives & services | 24.6–24.8 | ~1500 LOC (mass sweep) |
| **PR3** | Navigation shell | 24.9, 24.10 | ~600 LOC |
| **PR4** | Pages redesign (часть 1) | 24.11–24.18 | ~3500 LOC |
| **PR5** | Pages redesign (часть 2) + дополнения | 24.19–24.32 | ~2500 LOC |
| **PR6** | QA и релиз | 24.33–24.39 | ~500 LOC + docs |

---

## 9. Риски и митигация

| ID | Риск | Вероятность | Импакт | Митигация |
|----|------|-------------|--------|-----------|
| R-01 | PrimeVue token system несовместим с SPLAT CSS vars | Низкая | High | Задача 24.2 — точный мост через `color-mix()` и `var()`. Proto на stackblitz до начала. |
| R-02 | `@primevue/nuxt-module` конфликтует с `@nuxt/icon` auto-import | Средняя | Medium | Use `prefix` в primevue.components если нужно. Icon slot содержит `<Icon name="i-lucide-*">`, а не PrimeIcons. |
| R-03 | `@primevue/forms` + Zod 3.25 не дружит | Средняя | Medium | Fallback на ручную валидацию через `useForm` composable если `zodResolver` не работает. |
| R-04 | Bundle size взрыв из-за авто-импорта всех PrimeVue компонентов | Высокая | Medium | `components.exclude: ['Editor', 'OrgChart', 'Terminal', ...]` + tree-shaking verify. 24.38 закрывает. |
| R-05 | Макеты не покрывают часть существующих страниц (auth, scan, bulk, shared, api-docs) | Фактическая | Low | Отдельные задачи 24.23, 24.24, 24.16, 24.22, 24.31 явно адаптируют существующие страницы под новый стиль. |
| R-06 | `qr-list.jsx` и `create-drawer.jsx` отсутствуют в пакете макетов | Фактическая | Medium | Структура восстанавливается по `app.jsx` + существующему `/qr/index.vue` + `/qr/create.vue`. Ручной sign-off от дизайнера перед merge PR4. |
| R-07 | E2E тесты массово ломаются из-за смены селекторов | Высокая | Medium | Задача 24.35 с бюджетом 0.75 дня. Рекомендация: переходим на `data-testid`-селекторы вместо классов. |
| R-08 | A11y регрессии в новых компонентах | Средняя | High | Задача 24.36 с axe-core + ручной review. PrimeVue нативно WCAG AA-совместимая. |
| R-09 | Dark mode в PrimeVue не синхронизируется с `useColorMode` | Низкая | Low | Используем `.p-dark` selector, а не `media` — полный контроль через `ui.store`. |
| R-10 | Ripple анимация тяжёлая на мобильных | Низкая | Low | Можем отключить через `ripple: false` если профилирование покажет проблемы. |
| R-11 | PrimeVue locale RU неполная (aria labels) | Средняя | Low | Подгружаем кастомную локаль через PrimeLocale repo + patch'им недостающие aria строки. |
| R-12 | Сильное расхождение дизайна backend-зависимых страниц (MCP, API docs, Scalar UI) | Низкая | Medium | 24.31 — кастомизация Scalar темы. MCP endpoint не имеет UI, рисков нет. |
| R-13 | Рост длительности эпика из-за масштаба (15+ дней) | Высокая | High | Явная стратегия PR-серии (раздел 8), каждый PR независимо deployable (feature flag или ветка). |

---

## 10. Сводка изменённых/созданных файлов

### Новые файлы (~60)

```
app/themes/splat-preset.ts
app/themes/splat-preset.d.ts
app/assets/css/tokens.css
app/plugins/primevue-services.ts
app/composables/useNotify.ts
app/composables/useSplatConfirm.ts
app/composables/useTheme.ts
app/layouts/scan.vue
app/components/ui/AppCard.vue
app/components/ui/AuthorAvatar.vue
app/components/ui/AuthorAvatarGroup.vue
app/components/ui/StatusBadge.vue
app/components/ui/VisibilityBadge.vue  (обновление из EPIC 19)
app/components/ui/Sparkline.vue
app/components/ui/Kbd.vue
app/components/ui/Divider.vue
app/components/ui/MiniStat.vue
app/components/ui/LegendDot.vue
app/components/ui/SectionTitle.vue
app/components/ui/Field.vue
app/components/ui/QrPreview.vue
app/components/overlays/CreateDrawer.vue
app/components/overlays/DetailDrawer.vue
app/components/dev/Tweaks.vue
app/components/app/Sidebar.vue
app/components/app/Topbar.vue
app/components/app/CommandPalette.vue
app/components/dashboard/KpiCard.vue
app/components/dashboard/StatusBreakdown.vue
app/components/dashboard/TopQrCard.vue
app/components/dashboard/ActivityFeed.vue
app/components/qr/FilterBar.vue
app/components/qr/QrTable.vue
app/components/qr/QrGrid.vue
app/components/qr/BulkActionsBar.vue
app/components/folders/FolderCard.vue
app/components/analytics/PeriodSelector.vue
app/components/analytics/BigScanChart.vue
app/components/analytics/GeoTop.vue
app/components/analytics/DeviceDonut.vue
app/components/analytics/SourceBreakdown.vue
app/pages/notifications/index.vue
app/pages/settings.vue
app/pages/settings/workspace.vue
app/pages/settings/billing.vue
app/pages/settings/security.vue
app/pages/settings/branding.vue
app/pages/settings/api-keys.vue
public/fonts/InterTight-Variable.woff2
public/fonts/JetBrainsMono-Variable.woff2
docs/epic-24-primevue-migration.md         — этот документ
docs/reviews/epic-24-baseline.md
docs/reviews/epic-24-deps-matrix.md
docs/reviews/epic-24-smoke-checklist.md
docs/reviews/epic-24-final-review.md
```

### Удалённые файлы / пакеты

```
package.json: - "@nuxt/ui"
Удалить все импорты @nuxt/ui по проекту (реализуется задачей 24.8)
```

### Модифицированные файлы (~40)

```
package.json
nuxt.config.ts
app/app.vue
app/error.vue
app/layouts/default.vue
app/layouts/auth.vue
app/stores/ui.ts
app/pages/dashboard/index.vue
app/pages/qr/index.vue
app/pages/qr/create.vue
app/pages/qr/bulk.vue
app/pages/qr/[id]/index.vue
app/pages/qr/[id]/edit.vue
app/pages/folders/index.vue
app/pages/folders/[id].vue
app/pages/analytics/index.vue
app/pages/integrations/index.vue
app/pages/settings/index.vue
app/pages/settings/team.vue
app/pages/settings/domains.vue
app/pages/settings/destination-domains.vue
app/pages/settings/departments.vue
app/pages/shared/index.vue
app/pages/auth/login.vue
app/pages/not-found.vue
app/pages/expired.vue
app/pages/api-docs/index.vue
app/components/qr/Card.vue
app/components/qr/StyleEditor.vue
app/components/qr/HoverPreview.vue
app/components/qr/Preview.vue
app/components/qr/QuickActions.vue
app/components/folders/FolderDialog.vue
app/components/departments/DepartmentDialog.vue
app/components/departments/MembersDialog.vue
app/components/shared/EmptyState.vue
app/components/shared/OnboardingOverlay.vue
app/assets/css/main.css
CHANGELOG.md
README.md
docs/completed-epics.md
```

---

## 11. Метрики успеха

| Метрика | Baseline (до) | Target (после) | Критерий |
|---------|---------------|----------------|----------|
| UI Library | `@nuxt/ui` v4 | `primevue` v4.5 | Must |
| `@nuxt/ui` в `package.json` | присутствует | отсутствует | Must |
| Bundle size | baseline | ≤ baseline + 30% | Must |
| `pnpm typecheck` | 0 errors | 0 errors | Must |
| `pnpm lint` | 0 errors | 0 errors | Must |
| `pnpm test:unit` | 100% pass | 100% pass | Must |
| `pnpm test:e2e` | 100% pass | 100% pass | Must |
| axe-core critical issues | 0 | 0 | Must |
| Функциональность EPIC 1–22 | 100% | 100% | Must |
| Визуальное соответствие макетам | — | ≥ 95% (sign-off дизайнера) | Should |
| Lighthouse Performance (dev) | — | ≥ 85 | Should |
| Lighthouse A11y | — | ≥ 95 | Must |

---

## 12. Соответствие макетов → страницам SPLAT QR

| Макет (React) | Страница SPLAT QR | Задача |
|---------------|-------------------|--------|
| `sidebar.jsx` | `app/components/app/Sidebar.vue` | 24.9 |
| `topbar.jsx` | `app/components/app/Topbar.vue` | 24.10 |
| `dashboard.jsx` | `/dashboard` | 24.11 |
| `qr-list.jsx` (нет content) | `/qr` | 24.12 |
| `create-drawer.jsx` (нет content) | `CreateDrawer` + `/qr/create` | 24.13 |
| `detail-drawer.jsx` | `DetailDrawer` + `/qr/[id]` | 24.14 |
| `folders.jsx` | `/folders` | 24.17 |
| `analytics.jsx` | `/analytics` + EPIC 20 доп. | 24.18 |
| `integrations.jsx` | `/integrations` | 24.19 |
| `settings.jsx` | `/settings/*` + EPIC 19/21 табы | 24.20 |
| `notifications.jsx` | `/notifications` (новая) | 24.21 |
| `tweaks.jsx` | `app/components/dev/Tweaks.vue` (dev-only) | 24.4 |
| `ui.jsx` | `app/components/ui/*` (адаптация) | 24.6 |
| `icons.jsx` | сохраняем Lucide через `@nuxt/icon` | 24.6 |
| `data.jsx` | mock data for Storybook (опционально) | — |
| `app.jsx` | `app/app.vue` + `layouts/default.vue` | 24.4 |

### Страницы SPLAT QR, отсутствующие в макетах (адаптируются под новый стиль):

| Страница | Происхождение | Задача |
|----------|---------------|--------|
| `/auth/login` | EPIC 2 | 24.23 |
| `/not-found`, `/expired` | EPIC 5 (scan UX) | 24.24 |
| `/qr/[id]/edit` | EPIC 4 | 24.15 |
| `/qr/bulk` (wizard) | EPIC 10 | 24.16 |
| `/shared` (публичные QR) | EPIC 19 | 24.22 |
| `/settings/departments` | EPIC 19 | 24.29 |
| `/settings/domains` | EPIC 2 | 24.30 |
| `/settings/destination-domains` | EPIC 21 SEC-07 | 24.30 |
| `/settings/api-keys` | EPIC 12 + 21 | 24.20 |
| `/api-docs` (Scalar) | EPIC 22 | 24.31 |
| Onboarding overlay | EPIC 20 | 24.25 |
| Empty states (SVG illustrations) | EPIC 20 | 24.26 |

---

## 13. Follow-up (планируется после эпика)

Задачи, которые **не входят** в scope EPIC 24, но фиксируются как будущее направление:

- **NEXT-24-01:** Notifications backend — реальная таблица `notifications` + рассылка событий (сейчас minimal UI + моки).
- **NEXT-24-02:** Storybook/Histoire для `app/components/ui/*` — каталог компонентов, заменит docs-ui (EPIC 18).
- **NEXT-24-03:** Visual regression testing (Chromatic / Percy) для предотвращения visual drift в будущих эпиках.
- **NEXT-24-04:** Мобильный адаптив — макеты десктопные, мобильная версия требует отдельной проработки (drawer на swipe, collapsed sidebar, responsive DataTable).
- **NEXT-24-05:** Theme Designer для SPLAT preset — использовать PrimeVue Theme Designer + Figma plugin для синхронизации дизайнеров и разработчиков.
- **NEXT-24-06:** Figma Kit integration — передача дизайнов через PrimeVue Figma UI Kit.
- **NEXT-24-07:** Volt UI — рассмотреть переход на PrimeVue's Volt UI (styled mode с полной кастомизацией через Tailwind) если потребуется ещё больше контроля.

---

*Документ подготовлен в рамках планирования EPIC 24.*
*Дата: 2026-04-20.*
*Автор плана: команда Cenalasta.*
