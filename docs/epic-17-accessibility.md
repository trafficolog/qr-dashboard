# EPIC 17 — Accessibility (a11y) Baseline
 
**Статус:** 🚧 In Progress (старт работ: 2026-04-17)
**Ветка:** `feat/epic-16-17-docs-update` (планирование и старт EPIC 17)
**Целевая версия:** v0.13.0 (в составе итерации 2)
 
---
 

## Старт EPIC 17 (2026-04-17)

На этом шаге зафиксирован старт реализации и порядок внедрения:

1. **Базовый аудит и быстрые фиксы** — `aria-label`, `alt`, `focus-visible`.
2. **Структурные изменения** — таблицы и модальные сценарии (`Esc`, возврат фокуса).
3. **A11y-инфраструктура** — `useA11yAnnouncer` + `axe-core` в e2e/CI.
4. **Финальная валидация** — manual keyboard/screen-reader smoke + e2e отчёт.

### Текущий чек-лист старта

- [x] Уточнены цели и критерии приёмки для WCAG 2.1 AA baseline.
- [x] Зафиксирован состав файлов и зависимостей для первой итерации.
- [x] Выполнен кодовый аудит `icon-only` кнопок и изображений по основным shell/QR/settings экранам.
- [x] Добавлены первые изменения в UI-компоненты (17.1, 17.2, 17.4, 17.6, 17.7).
- [x] Подключён `@axe-core/playwright` и создан `e2e/a11y.spec.ts`.

---

## Цель
 
Достичь уровня **WCAG 2.1 AA** в основных пользовательских флоу: список QR, создание/редактирование, аналитика, настройки. Приложение должно быть полноценно управляемо с клавиатуры, корректно озвучиваться screen-reader'ами и сохранять контраст/focus-ring во всех темах.
 
## Контекст
 
UX/UI-ревизия зафиксировала системный дефицит accessibility (A-1…A-6 в [splat-qr-ux-ui-review.md](./splat-qr-ux-ui-review.md)):
 
- icon-only кнопки без `aria-label` (ряд action-колонок в таблицах, header-кнопки);
- таблицы без `<th scope>` и `role="table"` (используется div-сетка, но без ARIA-ролей);
- модальные окна не закрываются по `Escape` и не возвращают фокус на триггер;
- focus-ring не виден — глобально снят `outline: none`;
- статус передаётся только цветом бейджа (fail WCAG 1.4.1);
- `<img>` без `alt`, в том числе на QR-preview.
 
Цель EPIC — закрыть пробелы без редизайна компонентов, выровнять разметку и ввести автоматическую проверку в CI.
 
## Задачи
 
### 17.1 aria-label / title на icon-only кнопки
 
**Изменённые файлы:**
- `app/components/qr/Table.vue` — action dropdown, sort-иконки, toggle selection.
- `app/pages/settings/team.vue`, `domains.vue` — удаление/редактирование строк.
- `app/components/app/Sidebar.vue` — collapse-кнопка, logout.
- `app/components/app/Header.vue` — Cmd+K trigger, theme toggle, UserMenu.
- `app/components/app/UserMenu.vue` — avatar-trigger.
 
Правило: у каждой `<UButton icon="..." />` без `label` должен быть `:aria-label="t('...')"`. Ключи — в секции `a11y.actions.*`.
 
### 17.2 Семантические таблицы
 
**Изменённые файлы:**
- `app/components/qr/Table.vue` — вынести в `<table role="table">` с `<thead><tr><th scope="col">...</th></tr></thead>` или добавить эквивалентные ARIA-атрибуты к существующим `<div>`-сеткам: `role="table"`, `role="rowgroup"`, `role="row"`, `role="columnheader"`, `role="cell"`.
- `app/components/analytics/TopQrTable.vue` — аналогично.
 
Проверка: NVDA должен объявлять заголовки колонок при переходе между ячейками.
 
### 17.3 Focus-trap и Escape для модалей
 
**Проверить/починить:** все `UModal` в проекте.
- `UModal` из Nuxt UI имеет встроенный focus-trap, но нужно убедиться, что `escape` закрывает (проп `:close-on-escape="true"`) и фокус возвращается на trigger после закрытия.
- Для кастомных диалогов (`unsavedChangesDialog.vue`, `ConfirmDeleteDialog.vue` если есть) — использовать `useFocusTrap` из `@vueuse/integrations`.
- `DialogFocusReturn.ts` — утилита сохраняет `document.activeElement` при открытии и восстанавливает при закрытии.
 
### 17.4 Видимый focus-ring
 
**Изменённый файл:** `assets/css/main.css`
 
```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}
 
button:focus-visible,
a:focus-visible,
[tabindex]:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 35%, transparent);
}
```
 
- Удалить глобальный `outline: none` (если есть).
- Учесть dark-тему: контраст ring против `--surface-0` и `--surface-2`.
 
### 17.5 aria-live для toast
 
**Изменённый файл:** `app/app.vue` (или обёртка над `UNotifications`).
 
- Добавить контейнер `<div role="status" aria-live="polite" aria-atomic="true" class="sr-only">` дублирующий текст текущего toast'а.
- Композабл `useA11yAnnouncer()` с методом `announce(text, priority?: 'polite' | 'assertive')`.
- Обернуть `useToast().add()` так, чтобы любое добавленное уведомление пробрасывалось в announcer.
 
### 17.6 Статус-бейджи — иконка + текст
 
**Изменённые файлы:**
- `app/components/qr/Table.vue` — колонка «Статус».
- `app/components/qr/StatusBadge.vue` *(new)* — единый компонент.
 
```vue
<UBadge :color="statusColor" variant="subtle">
  <UIcon :name="statusIcon" class="size-3.5 mr-1" />
  {{ t(`qr.status.${status}`) }}
</UBadge>
```
 
Маппинг: `active → i-lucide-circle-check`, `paused → i-lucide-pause-circle`, `archived → i-lucide-archive`, `expired → i-lucide-clock-off`.
 
### 17.7 alt-тексты на изображения
 
**Изменённые файлы:**
- `app/components/qr/Preview.vue` — `<img :alt="t('qr.preview.alt', { title })">`.
- `app/components/app/UserMenu.vue` — `<UAvatar :alt="user.name || user.email">`.
- `app/pages/qr/[id]/index.vue` — превью на детальной.
 
Если картинка декоративная — `alt=""` (пустая строка), а не удалять атрибут.
 
### 17.8 axe-core в CI
 
**Новые файлы:**
- `e2e/a11y.spec.ts`
- Update `playwright.config.ts`.
 
```ts
import AxeBuilder from '@axe-core/playwright'
 
test('dashboard has no a11y violations', async ({ page }) => {
  await page.goto('/dashboard')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .disableRules(['color-contrast']) // вынесено в 18.7
    .analyze()
  expect(results.violations).toEqual([])
})
```
 
- Покрыть: `/dashboard`, `/qr`, `/qr/create`, `/settings/profile`, `/analytics`.
- В CI падает PR, если `violations.length > 0`.
 
## Критерии приёмки
 
- [ ] Каждая icon-only кнопка имеет `aria-label` (audit через `grep 'UButton' -A3`).
- [ ] Таблицы озвучиваются NVDA/VoiceOver с заголовками колонок.
- [ ] Все модали закрываются по `Esc`, фокус возвращается на триггер.
- [ ] `:focus-visible` ring виден на tab-навигации в обеих темах.
- [ ] Screen-reader получает текст toast'а через `aria-live`.
- [ ] Каждый статус-бейдж содержит иконку + текст (проверка: убрать цвет — значение всё ещё понятно).
- [ ] Все `<img>` имеют `alt` (пустой или осмысленный).
- [ ] `npm run test:e2e -- a11y.spec.ts` зелёный.
- [ ] `npm run typecheck`, `npm run lint` — зелёные.
 
## Изменённые/созданные файлы
 
### Новые
```
app/components/qr/StatusBadge.vue
app/composables/useA11yAnnouncer.ts
app/utils/dialog-focus-return.ts
e2e/a11y.spec.ts
```
 
### Изменённые
```
assets/css/main.css
app/app.vue
app/components/qr/Table.vue
app/components/qr/Preview.vue
app/components/app/Sidebar.vue
app/components/app/Header.vue
app/components/app/UserMenu.vue
app/components/analytics/TopQrTable.vue
app/pages/settings/team.vue
app/pages/settings/domains.vue
app/pages/qr/[id]/index.vue
app/components/shared/unsavedChangesDialog.vue
playwright.config.ts
package.json (deps: @axe-core/playwright, @vueuse/integrations/useFocusTrap)
i18n/locales/ru.json
i18n/locales/en.json
```
 
## Переиспользуемые утилиты
 
- **@axe-core/playwright** — автоматическая проверка WCAG.
- **@vueuse/integrations:** `useFocusTrap`.
- **Nuxt UI v3:** `UModal` (встроенный focus-trap + escape-to-close), `UBadge`, `UButton`, `UIcon`.
- **Web APIs:** `document.activeElement`, `HTMLElement.focus()`.
 
## Тестирование
 
1. **Keyboard-only:** отключить мышь, пройти флоу «создать QR → редактировать → удалить с Undo → открыть настройки → сменить тему». Всё доступно с `Tab` / `Shift+Tab` / `Enter` / `Esc`.
2. **Screen-reader:** NVDA (Windows) или VoiceOver (macOS) — озвучиваются заголовки колонок таблицы, toast-уведомления, заголовки модалей.
3. **Focus-ring:** `Tab` по dashboard — везде видно ring с контрастом ≥ 3:1.
4. **Status без цвета:** DevTools → Rendering → Emulate vision deficiency → Achromatopsia — статусы всё ещё различимы.
5. **Escape в модали:** открыть `unsavedChangesDialog` → `Esc` → диалог закрыт, фокус на «Сохранить».
6. **axe-core:** `npm run test:e2e -- a11y` — 0 violations на покрытых страницах.
 
## Метрики успеха
 
- **axe-core violations:** 0 на `/dashboard`, `/qr`, `/qr/create`, `/settings/*`, `/analytics`.
- **Lighthouse Accessibility score:** ≥ 95 (замерять на тех же страницах).
- **Keyboard-trap:** 0 (не должно быть мест, где Tab «залипает»).
