# Планируемые EPIC 15–21: UX/UI, продукт, security
 
**Ветка:** `claude/ux-ui-improvements-Kt0wI`
**Основание:** [UX/UI ревизия](./splat-qr-ux-ui-review.md)
 
**Итерации 1–2 (EPIC 15–18):** формы и shell, затем accessibility и дизайн-система.  
**EPIC 19–20:** отдельные продуктовые спецификации (видимость QR, аналитика/cards).  
**EPIC 21:** security hardening (основание и чеклист — в [epic-21-security-hardening.md](./epic-21-security-hardening.md)) — приоритет выше feature-эпиков до production.
 
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
 
## EPIC 19–21 — вне итераций UX (продукт и безопасность)

Эти эпики не входят в таблицу задач итераций 1–2 выше; полные ТЗ — в отдельных файлах.

| EPIC | Название | Целевая версия (из спеки) | Документ |
|------|----------|---------------------------|----------|
| **19** | Области видимости QR (Public / Private / Department) | v0.14.0 | [epic-19-qr-visibility.md](./epic-19-qr-visibility.md) |
| **20** | Analytics, карточки QR, onboarding | v0.14.0 (параллельно или после 16–18) | [epic-20-ux-analytics-cards.md](./epic-20-ux-analytics-cards.md) |
| **21** | Security Hardening | **1.0.0** (после полной реализации EPIC 21) | [epic-21-security-hardening.md](./epic-21-security-hardening.md) |

**Зависимости:** EPIC 19 требует завершённых эпиков 1, 4, 7, 11 (все сделаны). EPIC 20 опирается на 6, 4, 14 и частично на 18. EPIC 21 — до production deploy (фаза 0 блокирует выкат).

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
 
| Версия | Содержимое (план) | Примечание |
|--------|-------------------|------------|
| **v0.12.0** | EPIC 15 | ✅ Выпущено 2026-04-15 — см. [CHANGELOG](../CHANGELOG.md) |
| **v0.12.1 / v0.13.0** | EPIC 16 | Следующий после 15; точная версия — по объёму |
| **v0.13.0** | EPIC 17 + EPIC 18 | A11y & design system (как в спеках) |
| **v0.14.0** | EPIC 19 и/или EPIC 20 | Отдельные продуктовые вехи (до или после 1.0.0 — по приоритету команды) |
| **1.0.0** | EPIC 21 (полный объём) | Первый stable/production semver после security hardening — см. [epic-21-security-hardening.md](./epic-21-security-hardening.md) |
 
**Факт:** **v0.12.0** содержит только **EPIC 15**. **EPIC 16** в плане итерации 1, отдельный релиз. **EPIC 21 фаза 0** — блокер первого production deploy; **тег 1.0.0** — после полной реализации EPIC 21 (см. спеку).