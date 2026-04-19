# EPIC 16 — Interactive Shell & Settings Redesign
 
**Статус:** ✅ Done (документ синхронизирован с реализацией, ревизия 2026-04-17)
**Ветка:** `feat/epic-16-17-docs-update` (документационная синхронизация)
**Целевая версия:** **v0.12.1** (закрытие документации по EPIC 16 после релиза v0.12.0)
 
---
 

## Ревью и исправления (2026-04-17)

- Документ синхронизирован с реальной структурой Nuxt-страниц (`settings.vue` как parent-layout, `settings/index.vue` как redirect).
- Убраны упоминания `UTabs` как обязательного компонента, так как в реализации используется route-based навигация на `NuxtLink`.
- Уточнён scope поиска внутри настроек: текущая реализация фильтрует разделы, а не отдельные ключи формы.
- Списки «Новые/Изменённые файлы» выровнены с фактическим набором файлов в репозитории.
- Обновлены статус, ветка и целевая версия документа после фактического завершения EPIC 16.

---

## Цель
 
Превратить поиск, настройки и второстепенные интерактивные элементы (toast-центр, sidebar, loading-индикация) в полноценные рабочие инструменты. Сейчас Cmd+K открывает пустую строку, `/settings` — это две отдельные страницы без группировки, toast-уведомления не содержат actions (Undo/Retry).
 
## Контекст
 
UX/UI-ревизия выявила проблемы (см. [splat-qr-ux-ui-review.md](./splat-qr-ux-ui-review.md)):
 
- **S-1…S-5:** глобальный поиск не выполняет фактический поиск, нет истории, нет подсветки, не работает без мыши.
- **N-1…N-4:** `/settings` — две кнопки на главной, без табов/группировки/поиска по настройкам.
- **I-1…I-5:** toast'ы без Undo; `NuxtLoadingIndicator` отсутствует в `app.vue`; sidebar не подсвечивает активный раздел при вложенных роутах (`/qr/123/edit`).
 
## Задачи
 
### 16.1 Функциональный Cmd+K (Global Search)
 
**Новые файлы:**
- `app/components/app/GlobalSearch.vue`
- `app/composables/useGlobalSearch.ts`
 
**Сигнатура composable:**
```ts
function useGlobalSearch(): {
  query: Ref<string>
  results: ComputedRef<SearchResult[]>
  recent: Ref<SearchEntry[]>
  loading: Ref<boolean>
  open: () => void
  close: () => void
  select: (result: SearchResult) => void
}
 
type SearchResult =
  | { kind: 'qr', id: string, title: string, shortCode: string }
  | { kind: 'folder', id: string, name: string }
  | { kind: 'page', path: string, label: string, icon: string }
```
 
Поведение:
- `AppGlobalSearch` реализован как `UModal` с кастомным полем ввода и секциями `SearchSection`/`SearchItem` (без `UCommandPalette`).
- Trigger: кнопка поиска в `Header` + глобальный shortcut Cmd+K / Ctrl+K через `useMagicKeys` в `Header.vue`.
- Debounce 250 ms на `query` → `$fetch('/api/search?q=...')` с отменой предыдущего запроса через `AbortController`.
- Категории в палитре: **QR-коды**, **Папки**, **Страницы** (включая вложенные страницы `/settings/*`).
- Keyboard-first: ↑/↓ навигация, Enter — выбор, Esc — закрыть.
- Переход: `navigateTo()` на `/qr/{id}`, `/folders/{id}` или `path`.
 
**API-эндпоинт (новый):** `server/api/search.get.ts` — возвращает `{ qrs: [...], folders: [...] }` с `ILIKE` по title/shortCode/name, ограничение 10 результатов на категорию.
 
### 16.2 История поиска + подсветка совпадений
 
**Внутри `useGlobalSearch.ts`:**
- Shared-state на `useState` + хранение истории в `localStorage` (ключ `search:recent`) — 10 последних выбранных результатов.
- При пустом `query` показывается секция «Недавнее».
- При `select(result)` — запись добавляется в начало, дубли выкидываются, массив обрезается до 10.
- `discardRecent()` — кнопка «Очистить историю».
 
**Подсветка:**
- Helper `highlightMatch(text: string, query: string): string` возвращает HTML с `<mark>…</mark>` (экранирование через `escapeHtml`).
- Использование через `v-html` только на результатах, где входной текст уже экранирован.
 
### 16.3 Settings redesign на nested routes
 
**Изменённые/новые файлы:**
- `app/pages/settings.vue` *(new)* — основной каркас настроек с `<aside>` и `<NuxtPage />`.
- `app/pages/settings/index.vue` *(new)* — redirect `/settings` → `/settings/general`.
- `app/pages/settings/general.vue` *(new)* — тема, язык, таймзона.
- `app/pages/settings/profile.vue` *(new)* — имя, email, смена пароля.
- `app/pages/settings/team.vue` — раздел «Команда».
- `app/pages/settings/domains.vue` — раздел «Домены».
- `app/pages/settings/integrations.vue` *(new)* — API-ключи, webhooks.
 
Поведение:
- На ≥ `md`: левая колонка — вертикальное меню (`<aside>` с `role="navigation"`), справа — контент выбранного раздела. Ширина меню — 240 px.
- На `< md`: горизонтальная scrollable-навигация `NuxtLink` по разделам.
- `NuxtPage` размещён в `settings.vue` для вложенных путей `/settings/profile`, `/settings/team` и т.д.
- Список разделов формируется через `computed` и зависит от роли пользователя (`team/domains/departments/integrations` доступны только admin).
- `Breadcrumbs` подтягивают текущий раздел.
 
### 16.4 Поиск внутри настроек
 
**В `settings.vue`:**
- `UInput` с `icon="i-lucide-search"` над списком разделов.
- Фильтрация по названиям разделов (`general/profile` + admin-only `team/domains/departments/integrations`) через `label.toLowerCase().includes(query.toLowerCase())`.
- При клике — переход в соответствующий раздел `/settings/*`.
- Поиск по отдельным полям и anchor-навигация (`#theme`) вынесены в backlog EPIC 18 как расширение.
 
### 16.5 Toast с actions (Undo)
 
**Изменённые файлы:**
- `app/pages/qr/index.vue` — single-delete и bulk-delete с optimistic removal и action «Отменить» в toast.
- `app/components/qr/Table.vue` — bulk-delete с Undo.
 
**Паттерн Undo:**
```ts
const snapshot = current.find(q => q.id === id)
localList.value = current.filter(q => q.id !== id) // optimistic UI
 
toast.add({
  title: `QR «${snapshot.title}» удалён`,
  actions: [{
    label: 'Отменить',
    onClick: () => restoreSnapshot(),
  }],
})
```
 
Если Undo не нажали в течение 10 секунд, выполняется фактическое удаление через `deleteQr` / `bulkDeleteQr`.
 
### 16.6 Loading-индикация на shell-уровне
 
**Изменённые файлы:**
- `app/app.vue` — `<NuxtLoadingIndicator color="var(--color-primary-500)" :height="2" />`.
- `app/pages/dashboard/index.vue` — skeleton-карточки метрик (4 × `h-24`), skeleton-график (`h-72`).
- `app/pages/qr/index.vue` — skeleton строк таблицы (5 × `h-12`) до первой загрузки.
- `app/pages/analytics/index.vue` — skeleton графиков.
 
### 16.7 Активный раздел в Sidebar для вложенных роутов
 
**Изменённый файл:** `app/components/app/Sidebar.vue`
 
- Заменить `route.path === item.to` на `route.path.startsWith(item.to)` с нормализацией (чтобы `/qr` не матчил `/qrscan`).
- Фактическая реализация вынесена в `isActiveRoute(currentPath, targetPath)` и использует проверку `currentPath === targetPath || currentPath.startsWith(targetPath + '/')`.
- Для страниц `/qr/{id}` и `/qr/{id}/edit` — подсвечивать пункт «QR-коды».
- Для `/settings/*` — подсвечивать «Настройки».
 
## Критерии приёмки

- [x] Cmd+K / Ctrl+K открывает палитру, поиск по QR и папкам работает с debounce.
- [x] История поиска сохраняется в `localStorage`, показывается при пустом запросе, кнопка «Очистить» работает.
- [x] Совпадения подсвечены через `<mark>` в результатах.
- [x] `/settings` — единый layout на nested routes, работает навигация между `/settings/general`, `/settings/profile`, `/settings/team`, `/settings/domains`, `/settings/integrations`.
- [x] Поиск внутри настроек фильтрует разделы меню (поиск по полям и anchor-навигация запланированы отдельно).
- [x] Удаление QR показывает toast с «Отменить», Undo восстанавливает объект.
- [x] `NuxtLoadingIndicator` виден при переходах между страницами.
- [x] При заходе на `/qr/abc/edit` в sidebar активен пункт «QR-коды».
- [x] `npm run typecheck` — зелёный.
- [x] `npm run lint` — зелёный.
- [x] E2E: `e2e/global-search.spec.ts`, `e2e/settings-tabs.spec.ts`, `e2e/toast-undo.spec.ts`.
 
## Изменённые/созданные файлы
 
### Новые
```
app/components/app/GlobalSearch.vue
app/components/app/SearchItem.vue
app/components/app/SearchSection.vue
app/composables/useGlobalSearch.ts
server/api/search.get.ts
app/pages/settings.vue
app/pages/settings/index.vue
app/pages/settings/general.vue
app/pages/settings/profile.vue
app/pages/settings/integrations.vue
server/api/qr/[id]/restore.post.ts
e2e/global-search.spec.ts
e2e/settings-tabs.spec.ts
e2e/toast-undo.spec.ts
```
 
### Изменённые
```
app/app.vue
app/components/app/Header.vue
app/components/app/Sidebar.vue
app/components/qr/Table.vue
app/pages/settings/team.vue
app/pages/settings/domains.vue
app/pages/dashboard/index.vue
app/pages/qr/index.vue
app/pages/analytics/index.vue
i18n/locales/ru.json
i18n/locales/en.json
```
 
## Переиспользуемые утилиты

- **Nuxt UI v3:** `UModal`, `USkeleton`, `UInput`, `UBreadcrumb`, `UKbd`, `UButton`, `USelect`, `UToggle`, `UAlert`.
- **Nuxt/Vue composable-паттерн:** `useState`, `computed`, `watch`, `ref`, `NuxtPage`, `NuxtLoadingIndicator`, `navigateTo`.
- **@vueuse/core:** `useMagicKeys` (shortcut Cmd/Ctrl+K).
- **Локальные утилиты:** `createDialogFocusReturn`, `isActiveRoute`.
- **Fetch:** `$fetch` + `AbortController` для отмены предыдущего запроса.
- **Storage:** `localStorage` для истории поиска (`search:recent`).
 
## Тестирование

1. **Global Search (shortcut + modal):** на `/dashboard` нажать `Cmd+K`/`Ctrl+K` → открывается modal с `data-testid="global-search-input"`; `Esc` закрывает.
2. **Global Search (поиск и выбор):** ввести запрос → после debounce появляются секции QR/Folder/Page; `Enter` выбирает текущий focused-result.
3. **История поиска:** при пустом `query` показывается «Недавнее»; кнопка «Очистить» удаляет записи `search:recent`.
4. **Settings navigation:** `/settings` редиректит на `/settings/general`; клик по `settings-nav-profile` ведёт на `/settings/profile`.
5. **Settings search:** фильтрация работает по label разделов в боковом меню; anchor-навигация (`#theme`) не входит в EPIC 16 и остаётся в backlog EPIC 18.
6. **Toast Undo:** удалить QR (single/bulk) → в течение 10 s доступно действие «Отменить», возвращающее объект(ы) в UI.
7. **Loading indicator:** при переходах между страницами отображается верхний `NuxtLoadingIndicator`.
8. **Sidebar active:** на `/qr/{id}/edit` активен пункт «QR-коды», на `/settings/*` — пункт «Настройки».
9. **E2E smoke:** сценарии покрыты файлами `e2e/global-search.spec.ts`, `e2e/settings-tabs.spec.ts`, `e2e/toast-undo.spec.ts` (с учётом редиректа на логин).
 
## Метрики успеха (после релиза)
 
- Median time-to-find-QR (через поиск) < 3 s.
- `% сессий с Cmd+K` > 15 % (измерять через простой analytics-event).
- Количество кликов «Undo» после delete > 5 % — сигнал, что функция полезна.
