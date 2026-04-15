# EPIC 16 — Interactive Shell & Settings Redesign
 
**Статус:** 📋 Planned
**Ветка:** `claude/ux-ui-improvements-Kt0wI` (продолжение итерации 1)
**Целевая версия:** v0.12.0 (в составе итерации 1, после EPIC 15)
 
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
- `UCommandPalette` из Nuxt UI v3 в обёртке `UModal` (trigger — Cmd+K / Ctrl+K через `useMagicKeys`).
- Debounce 250 ms на `query` → `$fetch('/api/search?q=...')` с отменой предыдущего запроса через `AbortController`.
- Категории в палитре: **QR-коды**, **Папки**, **Страницы** (список статических маршрутов: Дашборд, Аналитика, Настройки, Импорт, …).
- Keyboard-first: ↑/↓ навигация, Enter — переход, Esc — закрыть.
- Переход: `navigateTo()` на `/qr/{id}`, `/folders/{id}` или `path`.
 
**API-эндпоинт (новый):** `server/api/search.get.ts` — возвращает `{ qrs: [...], folders: [...] }` с `ILIKE` по title/shortCode/name, ограничение 10 результатов на категорию.
 
### 16.2 История поиска + подсветка совпадений
 
**Внутри `useGlobalSearch.ts`:**
- `useLocalStorage<SearchEntry[]>('search:recent', [])` — 10 последних выбранных результатов.
- При пустом `query` показывается секция «Недавнее».
- При `select(result)` — запись добавляется в начало, дубли выкидываются, массив обрезается до 10.
- `discardRecent()` — кнопка «Очистить историю».
 
**Подсветка:**
- Helper `highlightMatch(text: string, query: string): string` возвращает HTML с `<mark>…</mark>` (экранирование через `escapeHtml`).
- Использование через `v-html` только на результатах, где входной текст уже экранирован.
 
### 16.3 Settings redesign на табах
 
**Изменённые/новые файлы:**
- `app/pages/settings/index.vue` — каркас с `UTabs` и боковым меню.
- `app/pages/settings/general.vue` *(new)* — тема, язык, таймзона.
- `app/pages/settings/profile.vue` *(new)* — имя, email, смена пароля.
- `app/pages/settings/team.vue` — вставить в таб «Команда».
- `app/pages/settings/domains.vue` — в таб «Домены».
- `app/pages/settings/integrations.vue` *(new)* — API-ключи, webhooks.
 
Поведение:
- На ≥ `md`: левая колонка — вертикальное меню (`<aside>` с `role="navigation"`), справа — контент выбранного раздела. Ширина меню — 240 px.
- На `< md`: `UTabs` горизонтально, контент ниже.
- `NuxtPage` в `settings/index.vue` для вложенных путей `/settings/profile`, `/settings/team` и т.д.
- `Breadcrumbs` подтягивают текущий раздел.
 
### 16.4 Поиск внутри настроек
 
**В `settings/index.vue`:**
- `UInput` с `icon="i-lucide-search"` над меню (или как sticky-header таба).
- Индекс — массив `{ label: t('settings.theme.label'), tab: 'general', anchor: 'theme' }`.
- Фильтрация по `label.toLowerCase().includes(query.toLowerCase())`.
- При клике по результату — `navigateTo('/settings/general#theme')` + scroll к anchor.
- Запрос `/` в поле фокусирует input (как в GitHub-settings).
 
### 16.5 Toast с actions (Retry / Undo)
 
**Изменённые файлы:**
- `app/pages/qr/index.vue` (удаление) — Undo через локальный «graveyard».
- `app/pages/settings/team.vue` — Undo удаления инвайта.
- `app/pages/settings/domains.vue` — Retry при ошибке сохранения.
- `app/components/qr/Table.vue` — bulk-delete с Undo.
 
**Паттерн Undo:**
```ts
const deleted = { id, snapshot: { ...qr } }
await deleteQr(id) // soft-delete на сервере
 
toast.add({
  title: 'QR удалён',
  actions: [{
    label: 'Отменить',
    click: () => restoreQr(id),
  }],
  timeout: 10_000,
})
```
 
Серверные эндпоинты: `POST /api/qr/{id}/restore` (возвращает QR из soft-deleted).
 
### 16.6 Loading-индикация на shell-уровне
 
**Изменённые файлы:**
- `app/app.vue` — добавить `<NuxtLoadingIndicator color="var(--accent)" :height="2" />`.
- `app/pages/dashboard/index.vue` — skeleton-карточки метрик (4 × `h-24`), skeleton-график (`h-72`).
- `app/pages/qr/index.vue` — skeleton строк таблицы (5 × `h-12`) до первой загрузки.
- `app/pages/analytics/index.vue` — skeleton графиков.
 
### 16.7 Активный раздел в Sidebar для вложенных роутов
 
**Изменённый файл:** `app/components/app/Sidebar.vue`
 
- Заменить `route.path === item.to` на `route.path.startsWith(item.to)` с нормализацией (чтобы `/qr` не матчил `/qrscan`).
- Для страниц `/qr/{id}` и `/qr/{id}/edit` — подсвечивать пункт «QR-коды».
- Для `/settings/*` — подсвечивать «Настройки».
- Unit-тест (vitest): `isActive('/qr', '/qr/abc/edit') === true`, `isActive('/qr', '/qrscan') === false`.
 
## Критерии приёмки
 
- [ ] Cmd+K / Ctrl+K открывает палитру, поиск по QR и папкам работает с debounce.
- [ ] История поиска сохраняется в `localStorage`, показывается при пустом запросе, кнопка «Очистить» работает.
- [ ] Совпадения подсвечены через `<mark>` в результатах.
- [ ] `/settings` — единый layout с табами, работает навигация между `/settings/general`, `/profile`, `/team`, `/domains`, `/integrations`.
- [ ] Поиск внутри настроек фильтрует ключи, скролл к anchor работает.
- [ ] Удаление QR показывает toast с «Отменить», Undo восстанавливает объект.
- [ ] `NuxtLoadingIndicator` виден при переходах между страницами.
- [ ] При заходе на `/qr/abc/edit` в sidebar активен пункт «QR-коды».
- [ ] `npm run typecheck` — зелёный.
- [ ] `npm run lint` — зелёный.
- [ ] E2E: `e2e/global-search.spec.ts`, `e2e/settings-tabs.spec.ts`, `e2e/toast-undo.spec.ts`.
 
## Изменённые/созданные файлы
 
### Новые
```
app/components/app/GlobalSearch.vue
app/composables/useGlobalSearch.ts
server/api/search.get.ts
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
app/pages/settings/index.vue
app/pages/settings/team.vue
app/pages/settings/domains.vue
app/pages/dashboard/index.vue
app/pages/qr/index.vue
app/pages/analytics/index.vue
i18n/locales/ru.json
i18n/locales/en.json
```
 
## Переиспользуемые утилиты
 
- **Nuxt UI v3:** `UCommandPalette`, `UModal`, `UTabs`, `USkeleton`, `UInput`, `UBreadcrumb`.
- **Nuxt:** `NuxtLoadingIndicator`, `NuxtPage`, `navigateTo`.
- **@vueuse/core:** `useMagicKeys`, `useLocalStorage`, `useDebounceFn`, `useFocus`.
- **Fetch:** `$fetch` с `AbortController` для отмены запроса.
 
## Тестирование
 
1. **Global Search (клавиатура):** `Cmd+K` → набрать название QR → `Enter` → переход на детальную страницу.
2. **История поиска:** открыть палитру → должен быть виден последний результат → кнопка «Очистить» убирает.
3. **Подсветка:** ввести подстроку — убедиться, что совпадения в `<mark>`.
4. **Settings navigation:** `/settings` → клик «Профиль» → URL `/settings/profile`, табы сохраняются; breadcrumb обновляется.
5. **Settings search:** ввести «theme» → остаётся только раздел «Общие» с anchor на `#theme`.
6. **Toast Undo:** удалить QR → в течение 10 s нажать «Отменить» → QR вернулся.
7. **Loading indicator:** замедлить сеть в devtools (3G) → перейти между страницами → тонкая полоска сверху.
8. **Sidebar active:** зайти на `/qr/{id}/edit` → «QR-коды» подсвечены.
9. **Localization:** переключить язык → все новые тексты на выбранном языке.
 
## Метрики успеха (после релиза)
 
- Median time-to-find-QR (через поиск) < 3 s.
- `% сессий с Cmd+K` > 15 % (измерять через простой analytics-event).
- Количество кликов «Undo» после delete > 5 % — сигнал, что функция полезна.