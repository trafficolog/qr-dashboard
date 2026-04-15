# Планируемые EPIC 15–18: UX/UI улучшения
 
**Ветка:** `claude/ux-ui-improvements-Kt0wI`
**Основание:** [UX/UI ревизия](./splat-qr-ux-ui-review.md)
 
Две итерации улучшений пользовательского интерфейса. Итерация 1 закрывает критические пробелы в формах и навигации, итерация 2 — accessibility и полировку дизайн-системы.
 
---
 
## Итерация 1 — базовое улучшение UX/UI
 
### EPIC 15 — Forms UX Enhancement *(реализуется первым)*
 
**Цель:** сделать все формы безопасными, предсказуемыми и локализованными.
 
| № | Задача | Файлы |
|---|--------|-------|
| 15.1 | Composable `useUnsavedChanges(isDirty)` с guard `onBeforeRouteLeave` + `beforeunload`; общий `UnsavedChangesDialog.vue` | `app/composables/useUnsavedChanges.ts`, `app/components/shared/UnsavedChangesDialog.vue`, `qr/create.vue`, `qr/[id]/edit.vue`, `settings/team.vue` |
| 15.2 | Composable `useFormValidation(zodSchema)` с reactive `errors`/`touched`/`validate()`/`setServerErrors()` | `app/composables/useFormValidation.ts` |
| 15.3 | Связать `UFormField :error` с input через `aria-describedby`, добавить hint и required-маркеры | все формы |
| 15.4 | Локализовать все строки форм в `forms.*` | `i18n/locales/ru.json`, `i18n/locales/en.json` |
| 15.5 | Composable `useFormDraft(key, state)` + `DraftRestoredBanner.vue` | `app/composables/useFormDraft.ts`, `app/components/shared/DraftRestoredBanner.vue`, `qr/create.vue` |
| 15.6 | Skeleton-покрытие `qr/[id]/edit.vue` при загрузке | `qr/[id]/edit.vue` |
| 15.7 | Server-side валидация с 422 + field map через `server/utils/zod-errors.ts` | `server/utils/zod-errors.ts`, `server/api/team/invite.post.ts`, `server/api/admin/domains/*.ts` |
 
Детализация — [epic-15-forms-ux.md](./epic-15-forms-ux.md).
 
---
 
### EPIC 16 — Interactive Shell & Settings Redesign
 
**Цель:** превратить поиск, настройки и интерактивные элементы в полноценные инструменты.
 
| № | Задача | Файлы |
|---|--------|-------|
| 16.1 | Функциональный Cmd+K через `UCommandPalette` — поиск по QR, папкам, страницам; debounce 250 ms | `app/components/app/GlobalSearch.vue`, `app/composables/useGlobalSearch.ts`, `Header.vue` |
| 16.2 | История поиска в `localStorage` (последние 10), подсветка совпадений через `<mark>` | `useGlobalSearch.ts` |
| 16.3 | Редизайн `/settings` на `UTabs` с боковой навигацией на ≥md; вложенные страницы как табы | `settings/index.vue`, `settings/team.vue`, `settings/domains.vue`, новые `settings/profile.vue`, `settings/general.vue` |
| 16.4 | Поиск внутри `/settings` (фильтрация ключей/лейблов настроек) | `settings/index.vue` |
| 16.5 | Toast с actions (Retry/Undo) для delete-операций | `qr/Table.vue`, `team.vue`, `domains.vue`, `folders/index.vue` |
| 16.6 | `NuxtLoadingIndicator` в `app.vue`; Skeleton для dashboard cards и списков | `app/app.vue`, `dashboard/index.vue`, `qr/index.vue` |
| 16.7 | Sidebar подсвечивает активный раздел на вложенных роутах (`/qr/123/edit` → «QR») | `Sidebar.vue` |
 
---
 
## Итерация 2 — расширение
 
### EPIC 17 — Accessibility (a11y) Baseline
 
**Цель:** достичь WCAG 2.1 AA в основных флоу.
 
| № | Задача | Файлы |
|---|--------|-------|
| 17.1 | `aria-label`/`title` на все icon-only кнопки | `qr/Table.vue`, `team.vue`, `domains.vue`, `Sidebar.vue`, `UserMenu.vue` |
| 17.2 | `role="table"` + `<th scope="col">` в таблицах | `qr/Table.vue`, `analytics/TopQrTable.vue` |
| 17.3 | Focus-trap и `Escape to close` проверены для всех модалей + dialog | все `UModal` |
| 17.4 | Видимый `:focus-visible` ring с бренд-цветом | `assets/css/main.css` |
| 17.5 | `aria-live="polite"` для toast-центра | plugin/компонент обёртка над `useToast()` |
| 17.6 | Status-бейджи дополнены иконкой + текстом (не только цвет) | `qr/Table.vue` |
| 17.7 | `alt`-текст на всех `<img>` (QR preview, аватары) | `QrPreview.vue`, `UAvatar` |
| 17.8 | axe-core интеграция в Playwright CI | `e2e/a11y.spec.ts`, `playwright.config.ts` |
 
---
 
### EPIC 18 — Design System Polishing & Motion
 
**Цель:** убрать цветовые несоответствия, добавить полированные переходы.
 
| № | Задача | Файлы |
|---|--------|-------|
| 18.1 | Миграция `gray-*`/`red-*`/`white` → CSS-переменные `--text-*`, `--surface-*`, `--color-primary-*` | `settings/domains.vue`, `dashboard/index.vue`, `components/shared/*` |
| 18.2 | Единый класс `transition-colors duration-150` на все hover-интерактивы | `qr/Card.vue`, `Sidebar.vue`, `Header.vue` |
| 18.3 | Микро-анимации hover/active (scale 1.02, translate) | `qr/Card.vue`, `folders/index.vue` |
| 18.4 | Адаптивная шкала шрифтов (`clamp`) для mobile | `main.css` |
| 18.5 | `/docs-ui` — страница-каталог UI-компонентов со всеми состояниями | `pages/docs-ui/index.vue` |
| 18.6 | `prefers-reduced-motion` guard вокруг анимаций | `main.css`, композы анимаций |
| 18.7 | Проверка контраста (4.5:1 для текста) через axe-core | `e2e/a11y.spec.ts` |
 
---
 
## Критерии готовности итерации 1
 
- ✅ EPIC 15 и 16 смержены в `main`; версия v0.12.0 в `CHANGELOG.md`.
- ✅ `npm run typecheck`, `npm run lint`, `npm run test:e2e` зелёные.
- ✅ Smoke-прогон в обоих языках (ru/en) + обеих темах (light/dark).
- ✅ Документация по каждому EPIC в `docs/epic-1X-*.md` актуальна.
 
## Критерии готовности итерации 2
 
- ✅ EPIC 17 и 18 смержены; версия v0.13.0.
- ✅ Автотест axe-core не падает на основных страницах.
- ✅ Нет прямых Tailwind-цветов вне `main.css` (`grep -r 'gray-[0-9]00' app/` пуст).
 
## Релизный план
 
| Версия | Содержимое | Цель |
|--------|------------|------|
| **v0.12.0** | EPIC 15 + EPIC 16 | Safe & searchable UX |
| **v0.13.0** | EPIC 17 + EPIC 18 | A11y & polish |

**Факт:** **v0.12.0** выпущен **2026-04-15** с полным объёмом **EPIC 15** (см. [CHANGELOG](../CHANGELOG.md)). **EPIC 16** остаётся в плане итерации 1 и не входит в этот тег, пока не будет готов отдельный объём работ.