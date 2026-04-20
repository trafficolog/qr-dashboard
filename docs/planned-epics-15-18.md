# Планируемые EPIC (активные и будущие)

**Ветка:** `claude/ux-ui-improvements-Kt0wI`
**Основание:** [UX/UI ревизия](./splat-qr-ux-ui-review.md)

**Актуальный план:** EPIC 17 (незавершённая часть) + будущие эпики, начиная с EPIC 23.
EPIC 16, 18, 19, 20, 21 и 22 закрыты и вынесены из раздела planned (история — в `docs/splat-qr-docs-done.md` и `docs/completed-epics.md`).

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

## Будущие planned-эпики (после закрытия 16–22)

| EPIC | Название | Статус | Документ |
|------|----------|--------|----------|
| **23** | Nuxt 4 migration | 📋 Planned | [epic-23-nuxt4-migration.md](./epic-23-nuxt4-migration.md) |

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
| **v0.13.0+** | EPIC 17 (остаток) | Закрытие оставшихся задач accessibility baseline |
| **TBD (после 1.0.0)** | EPIC 23 | Техническая миграция на Nuxt 4 |

**Факт:** EPIC 16, 18, 19, 20, 21 и 22 закрыты и больше не считаются planned. В актуальном плане остаётся незавершённый EPIC 17 и будущий EPIC 23.
