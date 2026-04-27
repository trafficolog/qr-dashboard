# EPIC 24 — Amendment A1: Sakai как baseline для app shell

**Статус:** 🚧 In Progress (дополнение к EPIC 24, updated 2026-04-27)
**Дата решения:** 2026-04-20
**Применяется к:** `docs/epic-24-primevue-migration.md`

---

## 1. Решение

В качестве базы для application shell (layout, sidebar menu, topbar) используется **официальный шаблон Sakai-Vue** от PrimeFaces, адаптированный под Nuxt 4.

### 1.1. Фиксированные настройки

| Настройка | Значение | Где задаётся |
|-----------|----------|--------------|
| PrimeVue preset | **Aura** | `nuxt.config.ts` → `primevue.options.theme.preset` |
| Primary color | **red** (SPLAT красный — `{red.*}` токены primitive уровня) | `app/themes/splat-preset.ts` через `definePreset` |
| Surface | `zinc` (нейтральная серая шкала) | то же место |
| Menu mode | **`static`** (sidebar всегда виден на desktop, не overlay) | `app/composables/useLayout.ts` → `layoutConfig.menuMode` |
| Dark mode selector | `.app-dark` (как в Sakai, **не** `.p-dark`) | `nuxt.config.ts` → `primevue.options.theme.options.darkModeSelector` |
| Theme configurator UI | **ОТКЛЮЧЁН** (не подключаем `AppConfigurator.vue` из Sakai, не показываем кнопку-шестерёнку в Topbar) | см. 24.A3 |
| Theme switcher | Оставляем **только** toggle light/dark, без выбора preset/primary/surface | см. 24.A3 |

### 1.2. Обоснование

1. **Sakai — официальный PrimeVue template**, уже интегрированный с Aura preset и `@primeuix/themes`. Даёт production-ready application shell с responsive behavior, outside-click handling, nested menu, SCSS-токенами.
2. **menuMode: static** вместо overlay соответствует enterprise admin-dashboard паттерну, который уже был в существующих React-макетах (постоянно видимый sidebar 232px / 68px collapsed).
3. **Отключение configurator'а** — это корпоративный внутренний инструмент Cenalasta, у пользователей не должно быть возможности менять preset/primary/surface/dark mode через runtime-панель. Конфигурация темы фиксируется на уровне кода.
4. **Primary: red** — закрепляет SPLAT-брендинг как единственно допустимую палитру, что согласуется с решением в EPIC 23/EPIC 24 (`app.config.ts` был переведён на `primary: splat` именно ради этого).

---

## 2. Что меняется в EPIC 24

### 2.1. Изменения в задачах

Ниже — дельта. Задачи, которые **не упомянуты**, остаются по плану EPIC 24 без изменений.

| Задача EPIC 24 | Что меняется |
|----------------|--------------|
| 24.2 «Custom preset + CSS token layer» | Добавляется требование: preset строится поверх Aura с primary mapped на primitive `red`-шкалу; dark mode selector переключается с `.p-dark` на `.app-dark` (Sakai convention). Bridge CSS-переменные из `tokens.css` остаются, но дополняются Sakai-токенами из `_light.scss`/`_dark.scss`. |
| 24.3 «Установка PrimeVue и конфигурация модуля» | Плюс: явное указание `darkModeSelector: '.app-dark'`, добавление `@primevue/auto-import-resolver` не нужно (Sakai не использует). |
| 24.4 «App shell» | **Полностью переопределяется** задачей 24.A1 (см. ниже) — копируем структуру Sakai, а не строим shell с нуля. |
| 24.6 «UI-примитивы» | Не меняется, но `AppCard` и прочие wrapper'ы теперь используют Sakai CSS-переменные (`--surface-card`, `--surface-border`, `--text-color`) вместо самодельных `--bg-elev`/`--line`/`--text`. Bridge tokens.css обеспечивает совместимость. |
| 24.9 «Sidebar» | **Полностью переопределяется** задачей 24.A2 — используем Sakai `AppMenu.vue` + `AppMenuItem.vue` с нашей моделью menuitems. |
| 24.10 «Topbar» | **Частично переопределяется** задачей 24.A3 — используем Sakai `AppTopbar.vue` с двумя удалёнными элементами: кнопка-шестерёнка configurator'а и `AppConfigurator.vue` overlay. Остаются: title block, theme toggle (light/dark), bell, create buttons, contextual search. |
| 24.32 «Theme switcher + persistence» | Упрощается: только light ↔ dark (без выбора preset/primary/surface). Реализуется через `useLayout().toggleDarkMode()` (Sakai встроенная функция). |

### 2.2. Новые задачи

Добавляются три новые задачи **перед 24.6**:

- **24.A1** — Копирование и адаптация Sakai AppLayout под Nuxt 4
- **24.A2** — Копирование и адаптация Sakai AppMenu / AppMenuItem
- **24.A3** — Копирование и адаптация Sakai AppTopbar (с удалением configurator-триггера)

### 2.3. Корректировка оценки

Оценка EPIC 24 **не меняется** (14–18 дней): задачи 24.A1/A2/A3 заменяют объём задач 24.4, 24.9, 24.10. Фактически работа становится **немного проще** (Sakai даёт готовый рабочий код, его нужно адаптировать, а не писать с нуля), но требует аккуратной миграции SCSS в структуру Nuxt.

### 2.4. Фактические обновления реализации (на 2026-04-27)

- `AppMenu` приведён к item-level role filtering: для non-admin скрывается только пункт `Settings`, но секция `Admin` и пункт `Notifications` сохраняются.
- Маршрут пункта `Settings` в sidebar унифицирован как `/settings` (вместо вложенного `/settings/general`), чтобы соответствовать shell-навигации уровня раздела.

---

## 3. Задача 24.A1 — Sakai AppLayout (заменяет 24.4 частично)

**Приоритет:** 🔴 Critical · Фаза 1
**Зависимости:** 24.2, 24.3
**Оценка:** 0.75 дня

**Источник кода:** [primefaces/sakai-vue](https://github.com/primefaces/sakai-vue), ветка `master`.

**Файлы, переносимые из Sakai → SPLAT QR (с адаптацией):**

| Sakai-Vue (Vite) | SPLAT QR (Nuxt 4) |
|------------------|-------------------|
| `src/layout/AppLayout.vue` | `app/layouts/default.vue` (body = `<Topbar/> + <Menu/> + <main><NuxtPage /></main> + <Footer/>`) |
| `src/layout/AppFooter.vue` | `app/components/app/AppFooter.vue` |
| `src/layout/composables/layout.js` | `app/composables/useLayout.ts` (TypeScript + адаптация под Nuxt) |
| `src/assets/layout/layout.scss` | `app/assets/layout/layout.scss` |
| `src/assets/layout/_core.scss` | `app/assets/layout/_core.scss` |
| `src/assets/layout/_topbar.scss` | `app/assets/layout/_topbar.scss` |
| `src/assets/layout/_menu.scss` | `app/assets/layout/_menu.scss` |
| `src/assets/layout/_footer.scss` | `app/assets/layout/_footer.scss` |
| `src/assets/layout/_responsive.scss` | `app/assets/layout/_responsive.scss` |
| `src/assets/layout/variables/_light.scss` | `app/assets/layout/variables/_light.scss` |
| `src/assets/layout/variables/_dark.scss` | `app/assets/layout/variables/_dark.scss` |
| `src/assets/styles.scss` | объединяется с `app/assets/css/main.css` |

**НЕ переносится (намеренно):**

- `src/layout/AppConfigurator.vue` → **удаляем**. Это UI-панель для runtime-изменения темы; нам не нужна (см. 24.A3).
- `src/views/**` (demo pages — CRUD, UIKit, landing) — не трогаем, у нас свои страницы по EPIC 24.

**Адаптации, которые обязательно внести при переносе:**

1. **`layoutConfig.menuMode = 'static'`** жёстко (не меняется runtime):
   ```typescript
   // app/composables/useLayout.ts
   const layoutConfig = reactive({
     preset: 'Aura',
     primary: 'red',       // SPLAT красный
     surface: 'zinc',
     darkTheme: false,
     menuMode: 'static',   // ЗАФИКСИРОВАНО
   })
   ```
   Удалить все публичные методы, меняющие `preset` / `primary` / `surface` / `menuMode` — оставить только `toggleDarkMode()`.

2. **Dark mode selector `.app-dark`** — совпадает с Sakai default. Применение: через `document.documentElement.classList.toggle('app-dark')` в `toggleDarkMode()`.

3. **Vue Router → Nuxt Router:** все `useRoute()`/`useRouter()` остаются как есть (Nuxt оборачивает их в composables с тем же API). `<router-view>` → `<NuxtPage />`.

4. **SSR-safe**:
   - `window.innerWidth` в `toggleMenu()` обернуть в `if (import.meta.client)`.
   - Начальное состояние `darkTheme` читать из cookie (SSR), синхронизировать с `matchMedia('(prefers-color-scheme: dark)')` на клиенте.

5. **SCSS → Nuxt css pipeline:** подключить `app/assets/layout/layout.scss` через `nuxt.config.ts` → `css: [...]`. Убедиться, что sass работает (`pnpm add -D sass`).

6. **Outside click handling** (оригинал использует `@primeuix/utils/dom` — остаётся как есть, пакет уже придёт с `primevue`).

7. **Удаление импорта `AppConfigurator`** из `AppLayout.vue`:
   ```diff
   - import AppConfigurator from '@/layout/AppConfigurator.vue'
   ...
   - <AppConfigurator />
   ```

**Критерии приёмки:**

- [ ] `app/layouts/default.vue` рендерит Sakai shell: Topbar (sticky top) + AppSidebar + main content + Footer
- [ ] Static menu виден на desktop (>991px), скрыт/toggle на mobile
- [ ] Mobile: тап по overlay закрывает menu
- [ ] `useLayout().toggleDarkMode()` переключает `.app-dark` на `<html>` и меняет PrimeVue preset tokens
- [ ] `menuMode` нельзя изменить программно через публичный API composable'а
- [ ] SCSS компилируется без ошибок
- [ ] SSR: нет обращений к `window` на сервере

---

## 4. Задача 24.A2 — Sakai AppMenu + AppMenuItem (заменяет 24.9)

**Приоритет:** 🔴 Critical · Фаза 3
**Зависимости:** 24.A1
**Оценка:** 0.5 дня

**Источник:** `src/layout/AppMenu.vue` + `src/layout/AppMenuItem.vue` из Sakai.

**Файлы:**

| Sakai | SPLAT QR |
|-------|----------|
| `src/layout/AppMenu.vue` | `app/components/app/AppMenu.vue` |
| `src/layout/AppMenuItem.vue` | `app/components/app/AppMenuItem.vue` |

**Модель menuitems (SPLAT-специфичная):**

```typescript
// внутри AppMenu.vue
const { t } = useI18n()
const qrStore = useQrStore()            // для counters
const foldersStore = useFoldersStore()
const notificationsStore = useNotificationsStore()

const model = computed(() => [
  {
    label: t('nav.workspace'),
    items: [
      { label: t('nav.dashboard'), icon: 'pi pi-fw pi-home', to: '/dashboard' },
      {
        label: t('nav.qr'),
        icon: 'pi pi-fw pi-qrcode',
        to: '/qr',
        badge: qrStore.count,
      },
      {
        label: t('nav.folders'),
        icon: 'pi pi-fw pi-folder',
        to: '/folders',
        badge: foldersStore.count,
      },
      { label: t('nav.shared'), icon: 'pi pi-fw pi-globe', to: '/shared' },       // EPIC 19
      { label: t('nav.analytics'), icon: 'pi pi-fw pi-chart-line', to: '/analytics' },
    ],
  },
  {
    label: t('nav.integrations_section'),
    items: [
      { label: t('nav.integrations'), icon: 'pi pi-fw pi-link', to: '/integrations' },
      { label: t('nav.api_docs'), icon: 'pi pi-fw pi-book', to: '/api-docs' },     // EPIC 22
    ],
  },
  {
    label: t('nav.admin'),
    items: [
      { label: t('nav.settings'), icon: 'pi pi-fw pi-cog', to: '/settings' },
      {
        label: t('nav.notifications'),
        icon: 'pi pi-fw pi-bell',
        to: '/notifications',
        badge: notificationsStore.unread,
      },
    ],
  },
])
```

**Адаптации при переносе:**

1. **Иконки:** Sakai использует PrimeIcons (`pi pi-*`) в модели. В нашем проекте UI-язык — Lucide через `@nuxt/icon`.
   - **Решение:** в `AppMenuItem.vue` заменить рендер иконки:
     ```vue
     <!-- Было (Sakai): -->
     <i :class="item.icon"></i>
     <!-- Стало: -->
     <Icon :name="item.icon" class="layout-menuitem-icon size-4" />
     ```
   - Модель переписать с Lucide-формата: `icon: 'i-lucide-home'` вместо `'pi pi-fw pi-home'`.

2. **Badge (счётчик):** Sakai поддерживает `item.badge`. Оставляем как есть.

3. **Active-route подсветка** работает через Nuxt Router нативно (Sakai уже использует `useRoute()`).

4. **i18n:** все lables обёрнуты в `t()` (`@nuxtjs/i18n` v10).

5. **Role-based фильтрация:** проверка роли пользователя перед показом пунктов (admin-only для `/settings/team`, `/settings/domains`, `/settings/departments` — это уже делается на уровне страниц через middleware, но дополнительно можно скрыть пункты из menu):
   ```typescript
   const auth = useAuthStore()
   const model = computed(() => [...].filter(section =>
     !section.adminOnly || auth.user?.role === 'admin'
   ))
   ```

**Критерии приёмки:**

- [ ] Sidebar menu рендерит 3 секции (Workspace / Integrations / Admin)
- [ ] Active route подсвечивается (`active-route` class)
- [ ] Иконки Lucide отображаются корректно
- [ ] Счётчики (QR count, folders count, unread notifications) обновляются реактивно
- [ ] Клик по item'у с `to: '/path'` роутит через Nuxt без полной перезагрузки
- [ ] Локализация EN/RU работает
- [ ] Меню-пункты, недоступные роли, скрыты

---

## 5. Задача 24.A3 — Sakai AppTopbar без configurator'а (заменяет 24.10 частично)

**Приоритет:** 🔴 Critical · Фаза 3
**Зависимости:** 24.A1
**Оценка:** 0.5 дня

**Источник:** `src/layout/AppTopbar.vue` из Sakai.

**Файлы:**

| Sakai | SPLAT QR |
|-------|----------|
| `src/layout/AppTopbar.vue` | `app/components/app/AppTopbar.vue` |

**Что переносим как есть (Sakai):**

- Logo block слева (с hamburger для mobile + brand).
- Menu toggle button для mobile (триггер `useLayout().onMenuToggle()`).
- Responsive behavior (decklop / mobile).

**Что удаляем из Sakai (КРИТИЧНО):**

```diff
  <!-- app/components/app/AppTopbar.vue -->
  <div class="layout-topbar-actions">
    <div class="layout-config-menu">
      <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
        <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
      </button>
-     <div class="relative">
-       <button
-         v-styleclass="{
-           selector: '@next',
-           enterFromClass: 'hidden',
-           enterActiveClass: 'animate-scalein',
-           leaveToClass: 'hidden',
-           leaveActiveClass: 'animate-fadeout',
-           hideOnOutsideClick: true
-         }"
-         type="button"
-         class="layout-topbar-action layout-topbar-action-highlight"
-       >
-         <i class="pi pi-palette"></i>
-       </button>
-       <AppConfigurator />
-     </div>
    </div>
    ...
  </div>
```

Плюс удалить импорт `AppConfigurator` и все его упоминания.

**Что добавляем (SPLAT-специфично, по React-макету `topbar.jsx`):**

Topbar SPLAT-дизайна уже включает больше элементов, чем Sakai default:

1. **Title + Subtitle block** (per-page через `usePageMeta` composable или breadcrumb из route meta).
2. **Contextual search** (только `/qr`, только на desktop) — `IconField` + `InputText`, 280px.
3. **Cmd+K trigger** — запускает CommandPalette (EPIC 16).
4. **Bell button** с `Badge severity="danger"` (unread count).
5. **Divider vertical**.
6. **Массовое создание** (только на `/qr`).
7. **Создать QR** — primary button.
8. **User menu** (Avatar + chevron → dropdown: Profile, Logout).

**Финальная структура `AppTopbar.vue`:**

```vue
<template>
  <div class="layout-topbar">
    <!-- Left block: Sakai-оригинал -->
    <div class="layout-topbar-logo-container">
      <button class="layout-menu-button layout-topbar-action" @click="onMenuToggle">
        <Icon name="i-lucide-menu" class="size-5" />
      </button>
      <NuxtLink to="/dashboard" class="layout-topbar-logo">
        <!-- SPLAT brand -->
      </NuxtLink>
    </div>

    <!-- Center: Title block (новое) -->
    <div class="layout-topbar-title">
      <h1>{{ pageTitle }}</h1>
      <span class="muted">{{ pageSubtitle }}</span>
    </div>

    <!-- Right actions -->
    <div class="layout-topbar-actions">
      <!-- Contextual search (новое, только /qr) -->
      <QrSearchInput v-if="route.path === '/qr'" />

      <!-- Dark mode toggle (Sakai-оригинал, но БЕЗ configurator'а рядом) -->
      <button class="layout-topbar-action" @click="toggleDarkMode">
        <Icon :name="isDarkTheme ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-5" />
      </button>

      <!-- Bell + unread (новое) -->
      <NotificationBell :unread="notificationsStore.unread" />

      <Divider layout="vertical" class="!mx-2 !h-6" />

      <!-- Actions (новое) -->
      <Button
        v-if="route.path === '/qr'"
        severity="secondary"
        outlined
        @click="onMassCreate"
      >
        <Icon name="i-lucide-upload" class="size-4 mr-2" />
        {{ t('qr.bulk_create') }}
      </Button>
      <Button severity="primary" @click="onCreate">
        <Icon name="i-lucide-plus" class="size-4 mr-2" />
        {{ t('qr.create') }}
      </Button>

      <Divider layout="vertical" class="!mx-2 !h-6" />

      <!-- User menu (новое) -->
      <AppUserMenu />
    </div>
  </div>
</template>

<script setup lang="ts">
const { toggleDarkMode, isDarkTheme, onMenuToggle } = useLayout()
const route = useRoute()
const { t } = useI18n()
const notificationsStore = useNotificationsStore()
const { pageTitle, pageSubtitle } = usePageMeta()
const onCreate = () => { /* open CreateDrawer */ }
const onMassCreate = () => navigateTo('/qr/bulk')
</script>
```

**Критерии приёмки:**

- [ ] Topbar не содержит кнопки-шестерёнки / `pi-palette` / «Theme Configurator»
- [ ] `AppConfigurator.vue` не существует в проекте (grep даёт 0)
- [ ] Dark mode toggle работает (кнопка sun/moon)
- [ ] Title + subtitle меняются per route
- [ ] Contextual search появляется только на `/qr`
- [ ] Create / Mass Create buttons показываются в нужных местах
- [ ] User menu dropdown открывается, содержит Profile + Logout
- [ ] Mobile: menu hamburger виден, остальные action'ы сворачиваются в overflow-menu

---

## 6. `app/composables/useLayout.ts` — финальный код

Полный файл (адаптация `src/layout/composables/layout.js` из Sakai под Nuxt 4 + TypeScript + hardcoded `menuMode: 'static'` + отключенный configurator):

```typescript
// app/composables/useLayout.ts
import { $dt } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import { updatePreset, updateSurfacePalette } from '@primeuix/themes'

interface LayoutConfig {
  readonly preset: 'Aura'           // readonly — не меняется
  readonly primary: 'red'           // readonly — не меняется
  readonly surface: 'zinc'          // readonly — не меняется
  readonly menuMode: 'static'       // readonly — не меняется
  darkTheme: boolean                // mutable через toggleDarkMode()
}

interface LayoutState {
  staticMenuDesktopInactive: boolean
  overlayMenuActive: boolean
  profileSidebarVisible: boolean
  staticMenuMobileActive: boolean
  menuHoverActive: boolean
  activeMenuItem: string | null
}

const layoutConfig = reactive<LayoutConfig>({
  preset: 'Aura',
  primary: 'red',
  surface: 'zinc',
  menuMode: 'static',
  darkTheme: false,
})

const layoutState = reactive<LayoutState>({
  staticMenuDesktopInactive: false,
  overlayMenuActive: false,
  profileSidebarVisible: false,
  staticMenuMobileActive: false,
  menuHoverActive: false,
  activeMenuItem: null,
})

export function useLayout() {
  const setActiveMenuItem = (item: string | { value: string }) => {
    layoutState.activeMenuItem = typeof item === 'string' ? item : item.value
  }

  const toggleDarkMode = () => {
    if (!import.meta.client) return

    const apply = () => {
      layoutConfig.darkTheme = !layoutConfig.darkTheme
      document.documentElement.classList.toggle('app-dark')
    }

    // View Transitions API, если доступно
    if (typeof (document as any).startViewTransition === 'function') {
      ;(document as any).startViewTransition(apply)
    } else {
      apply()
    }

    // Persist через cookie (SSR-safe)
    useCookie('splat-theme', { maxAge: 60 * 60 * 24 * 365 }).value =
      layoutConfig.darkTheme ? 'dark' : 'light'
  }

  const onMenuToggle = () => {
    // menuMode всегда 'static', проверку 'overlay' убрали
    if (!import.meta.client) return
    if (window.innerWidth > 991) {
      layoutState.staticMenuDesktopInactive = !layoutState.staticMenuDesktopInactive
    } else {
      layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive
    }
  }

  const isSidebarActive = computed(
    () => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive,
  )
  const isDarkTheme = computed(() => layoutConfig.darkTheme)

  return {
    layoutConfig: readonly(layoutConfig),   // readonly снаружи
    layoutState,
    setActiveMenuItem,
    toggleDarkMode,
    onMenuToggle,
    isSidebarActive,
    isDarkTheme,
  }
}

// Plugin для восстановления темы из cookie на hydration
// app/plugins/theme-restore.client.ts:
//
// export default defineNuxtPlugin(() => {
//   const saved = useCookie('splat-theme').value
//   if (saved === 'dark') {
//     layoutConfig.darkTheme = true
//     document.documentElement.classList.add('app-dark')
//   }
// })
```

**Ключевые отличия от Sakai оригинала:**

1. `preset`/`primary`/`surface`/`menuMode` помечены readonly в типе — их нельзя менять извне composable'а. Значит, Configurator (если его случайно всё же захотят вернуть) физически не сможет влиять на эти поля.
2. Убрана функция `toggleMenu()` в старом виде — переименована в `onMenuToggle` и упрощена (нет ветки `overlay`).
3. Добавлен SSR-safe wrapper + cookie persist.
4. Убраны `getPrimary` / `getSurface` computed (не используются при отключенном configurator'е).

---

## 7. Конфигурация PrimeVue в `nuxt.config.ts` (обновлённая)

Полный блок `primevue` с Sakai-совместимостью:

```typescript
// nuxt.config.ts
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

const SplatPreset = definePreset(Aura, {
  semantic: {
    primary: {
      // Маппинг primary → red primitive-шкала PrimeUIX
      50: '{red.50}',   100: '{red.100}', 200: '{red.200}',
      300: '{red.300}', 400: '{red.400}', 500: '{red.500}',
      600: '{red.600}', 700: '{red.700}', 800: '{red.800}',
      900: '{red.900}', 950: '{red.950}',
    },
  },
})

export default defineNuxtConfig({
  modules: [
    '@primevue/nuxt-module',
    '@nuxt/icon',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],
  primevue: {
    options: {
      ripple: true,
      inputVariant: 'outlined',
      theme: {
        preset: SplatPreset,
        options: {
          prefix: 'p',
          darkModeSelector: '.app-dark',    // Sakai convention
          cssLayer: false,
        },
      },
    },
    autoImport: true,
    components: {
      include: '*',
      exclude: ['Editor'],                   // Quill не нужен
    },
    directives: {
      include: ['Ripple', 'Tooltip', 'StyleClass', 'FocusTrap'],
    },
  },
  css: [
    '~/assets/layout/layout.scss',           // Sakai SCSS shell
    '~/assets/css/tokens.css',               // Bridge SPLAT tokens
    '~/assets/css/main.css',                 // SPLAT-специфичное
  ],
})
```

---

## 8. Проверочный чеклист для 24.A1/A2/A3

Добавляется в `docs/reviews/epic-24-smoke-checklist.md`:

**Sakai baseline verification:**

- [ ] `AppConfigurator.vue` файл не существует в проекте (`find . -name AppConfigurator.vue` → пусто)
- [ ] `grep -rn "pi-palette" app/` → 0 совпадений
- [ ] `grep -rn "configSidebarVisible" app/` → 0 совпадений
- [ ] `useLayout().layoutConfig.menuMode` === `'static'` и readonly (TypeScript не даёт присвоить)
- [ ] `useLayout().layoutConfig.primary` === `'red'` и readonly
- [ ] Topbar содержит ровно **одну** кнопку переключения темы (sun/moon), без кнопки-шестерёнки рядом
- [ ] Переключение темы работает (`.app-dark` class toggles on `<html>`)
- [ ] Cookie `splat-theme` сохраняет выбор
- [ ] SSR отдаёт правильную тему на первой загрузке (нет FOUC)
- [ ] Sidebar виден на desktop (>991px) всегда (menuMode static)
- [ ] На mobile (≤991px) sidebar выезжает по hamburger-кнопке, overlay закрывается по тапу снаружи

---

## 9. Как этот amendment связан с основным EPIC 24

| EPIC 24 раздел | Применение amendment |
|----------------|----------------------|
| Раздел 5 «План работ (фазы)» | В Фазу 1 добавляется задача 24.A1; в Фазу 3 — задачи 24.A2 и 24.A3. Задачи 24.4, 24.9, 24.10 корректируются по указаниям выше. |
| Раздел 6 «Задачи» | Задача 24.32 (Theme switcher) упрощается: убирается выбор preset/primary/surface, остаётся только light/dark через `useLayout().toggleDarkMode()`. |
| Раздел 9 «Риски» | Добавляются новые риски: R-14 (расхождение Sakai SCSS с Tailwind v4 токенами), R-15 (сложность миграции Sakai View Transitions API в SSR-среде). |
| Раздел 10 «Сводка файлов» | Новые файлы: `app/assets/layout/*.scss` (~8 файлов из Sakai), `app/composables/useLayout.ts`, `app/components/app/AppMenu.vue`, `AppMenuItem.vue`, `AppTopbar.vue`, `AppFooter.vue`. |
| Раздел 11 «Метрики успеха» | Без изменений. |
| Раздел 12 «Соответствие макетов → страницам» | Без изменений. Sakai отвечает за **shell** (layout + nav), а контент страниц (Dashboard, QR List и т.д.) — по React-макетам, как в EPIC 24. |

---

## 10. Новые риски (дополняют раздел 9 EPIC 24)

| ID | Риск | Вероятность | Импакт | Митигация |
|----|------|-------------|--------|-----------|
| R-14 | Sakai использует собственный SCSS + Tailwind config — возможен конфликт с tokens.css из задачи 24.2 | Средняя | Medium | Bridge layer: tokens.css переопределяет нужные Sakai SCSS-переменные через CSS custom properties. SCSS переменные Sakai используются только для компиляции, runtime-override идёт через CSS vars. Тестирование — smoke визуальный. |
| R-15 | View Transitions API (используется в `toggleDarkMode`) может вызвать FOUC на SSR | Низкая | Low | Wrapped в `if (import.meta.client)` + fallback на простое переключение класса без transition. |
| R-16 | Sakai AppMenuItem использует PrimeIcons (`pi pi-*`), но у нас Lucide | Фактическое (планируемое) | Low | В задаче 24.A2 явно заменяем рендер иконки на `<Icon name="i-lucide-*">`. Модель menuitems переписывается с Lucide-именами. |
| R-17 | Sakai community-форки под Nuxt (`who-jonson/sakai-nuxt`, `suprimpoudel/sakai-nuxt`) отстают от официального Sakai-Vue | Высокая | Low | **Не** используем community-форки. Берём официальный `primefaces/sakai-vue` (Vite) и адаптируем под Nuxt 4 вручную (задачи 24.A1-A3). Это даёт самый свежий код + контроль над каждым изменением. |
| R-18 | Runtime изменение темы через любой путь (вдруг в коде останется) нарушит «configurator OFF» контракт | Низкая | Medium | TypeScript `readonly` на полях `layoutConfig` + ESLint правило «no-direct-access к `layoutConfig.preset/primary/surface/menuMode`» (custom rule). |

---

## 11. Источники

- [primefaces/sakai-vue](https://github.com/primefaces/sakai-vue) — основной официальный репозиторий, ветка `master`
- [Sakai Vue demo](https://sakai.primevue.org/) — живое демо
- [DeepWiki: Sakai-Vue Layout System](https://deepwiki.com/primefaces/sakai-vue/3.3-layout-system) — подробный разбор архитектуры
- [DeepWiki: Layout Composables](https://deepwiki.com/primefaces/sakai-vue/3.3.2-layout-composables) — `useLayout` composable
- [PrimeVue Nuxt integration](https://primevue.org/nuxt/) — официальная документация модуля

---

*Документ подготовлен как дополнение (amendment) к EPIC 24.*
*Дата: 2026-04-20.*
*Автор: команда Cenalasta.*
