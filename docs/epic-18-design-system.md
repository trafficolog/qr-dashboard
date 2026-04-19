# EPIC 18 — Design System Polishing & Motion
 
**Статус:** 📋 Planned
**Ветка:** `claude/ux-ui-improvements-Kt0wI` (итерация 2)
**Целевая версия:** v0.13.0 (в составе итерации 2)
 
---
 
## Цель
 
Устранить цветовые несоответствия между прямыми Tailwind-классами (`gray-900`, `red-500`) и CSS-переменными дизайн-токенов; добавить единые transitions и полированные микро-анимации для hover/active-состояний; обеспечить корректную работу с `prefers-reduced-motion`; ввести каталог компонентов для визуальной регрессии.
 
## Контекст
 
UX/UI-ревизия выявила (V-1…V-4 в [splat-qr-ux-ui-review.md](./splat-qr-ux-ui-review.md)):
 
- **V-1:** цветовые классы `gray-900/800/700`, `white`, `red-500` разбросаны по компонентам — при смене темы или ребрендинге придётся править десятки файлов.
- **V-2:** transitions несогласованы — где-то `transition-all duration-200`, где-то `transition-colors`, где-то вообще отсутствует.
- **V-3:** нет микро-анимаций (hover-lift, active-scale) — интерфейс ощущается «бумажным».
- **V-4:** нет адаптивной типографической шкалы — шрифты одинакового размера на мобильных и десктопе.
 
Частично задача 18.1 уже начата в EPIC 15 (settings/domains.vue мигрирован на токены) — здесь её нужно довести до 100 %.
 
## Задачи
 
### 18.1 Миграция прямых Tailwind-цветов на токены
 
**Аудит:**
```bash
grep -rn 'text-gray-\|bg-gray-\|border-gray-\|text-white\|bg-white\|text-red-\|bg-red-' app/ \
  --include='*.vue' --include='*.ts' \
  | grep -v 'node_modules\|dist'
```
 
**Замены (общий маппинг):**
 
| Tailwind | Токен |
|----------|-------|
| `text-gray-900`, `text-white` (основной текст) | `text-[color:var(--text-primary)]` |
| `text-gray-700`, `text-gray-600` | `text-[color:var(--text-secondary)]` |
| `text-gray-500`, `text-gray-400` | `text-[color:var(--text-muted)]` |
| `bg-white`, `bg-gray-50` | `bg-[color:var(--surface-0)]` |
| `bg-gray-100`, `bg-gray-800` (карточки) | `bg-[color:var(--surface-2)]` |
| `border-gray-200`, `border-gray-700` | `border-[color:var(--border)]` |
| `text-red-500`, `bg-red-50` | `text-[color:var(--color-error)]` / `bg-[color:var(--color-error-soft)]` |
| `text-green-500` | `text-[color:var(--color-success)]` |
 
**Изменённые файлы:** все `*.vue` и `*.ts` в `app/`, кроме тех, где цвета — часть иллюстраций/превью.
 
Добавить в `main.css` отсутствующие токены (`--color-error`, `--color-error-soft`, `--color-success`, `--color-warning`, `--color-info`).
 
### 18.2 Единый transition на интерактивных элементах
 
**Добавить в `main.css`:**
```css
@utility transition-interactive {
  transition-property: color, background-color, border-color, box-shadow, transform;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```
 
**Применение:**
- Все `UButton`, `UCard`, ссылки в `Sidebar.vue`, строки таблицы `qr/Table.vue`, тайлы `folders/index.vue`, `UserMenu` item-ы.
- Замена локальных `transition-colors duration-200` на `transition-interactive`.
 
### 18.3 Микро-анимации hover/active
 
**Card hover-lift:**
```vue
<!-- qr/Card.vue -->
<UCard class="hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 transition-interactive" />
```
 
**Button active-scale:**
```css
.btn-primary:active:not(:disabled) {
  transform: scale(0.98);
}
```
 
**List item hover-accent:**
```vue
<div class="hover:bg-[color:var(--surface-hover)] transition-interactive" />
```
 
**Изменённые файлы:** `qr/Card.vue`, `folders/index.vue`, `Sidebar.vue`, `settings/*` item-ы.
 
### 18.4 Адаптивная типография через clamp()
 
**Изменённый файл:** `app/assets/css/main.css`
 
```css
:root {
  --fs-xs: clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem);
  --fs-sm: clamp(0.875rem, 0.84rem + 0.18vw, 0.9375rem);
  --fs-base: clamp(1rem, 0.96rem + 0.2vw, 1.0625rem);
  --fs-lg: clamp(1.125rem, 1.05rem + 0.38vw, 1.25rem);
  --fs-xl: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);
  --fs-2xl: clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem);
  --fs-3xl: clamp(1.875rem, 1.65rem + 1.13vw, 2.5rem);
}
 
h1 { font-size: var(--fs-3xl); }
h2 { font-size: var(--fs-2xl); }
h3 { font-size: var(--fs-xl); }
body { font-size: var(--fs-base); }
```
 
Проверка: `375 px` (iPhone SE) и `1920 px` (desktop) — шрифты читаемы без изменения класса.

**Canonical naming update (final):**
- Использовать `--color-error`, `--color-error-soft`, `--color-success`, `--color-warning`, `--color-info` как единственные канонические semantic-токены.
- `--danger`, `--success`, `--warning`, `--info` оставить только как alias-слой обратной совместимости.
 
### 18.5 Каталог UI `/docs-ui`
 
**Новые файлы:**
- `app/pages/docs-ui/index.vue` — главная с навигацией по секциям.
- `app/pages/docs-ui/buttons.vue` — все варианты `UButton` (все `color`, `variant`, `size`, loading/disabled).
- `app/pages/docs-ui/forms.vue` — `UInput`, `UFormField`, `USelect`, `UTextarea` с error/hint/disabled.
- `app/pages/docs-ui/feedback.vue` — `UAlert`, `UBadge`, `StatusBadge` (из EPIC 17), toast-примеры.
- `app/pages/docs-ui/overlays.vue` — `UModal`, `UPopover`, `UTooltip`, `UCommandPalette`.
- `app/pages/docs-ui/navigation.vue` — `UTabs`, `UBreadcrumb`, `UPagination`.
 
**Доступ:** только для роли `admin` (через `definePageMeta({ middleware: 'admin' })`). В production можно отключить через env-флаг `NUXT_DOCS_UI=0`.
 
### 18.6 prefers-reduced-motion guard
 
**`main.css`:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
 
  .hover\:-translate-y-0\.5:hover,
  .active\:scale-95:active {
    transform: none !important;
  }
}
```
 
**Композабл `useReducedMotion()`:**
```ts
export function useReducedMotion(): Ref<boolean> {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
```
 
Использовать для JS-анимаций (number tickers, confetti, если такое появится).
 
### 18.7 Проверка контраста через axe-core
 
**Изменённый файл:** `e2e/a11y.spec.ts` (создан в EPIC 17).
 
- Включить правило `color-contrast` (в 17.8 оно было отключено).
- Прогнать на обеих темах (`light` / `dark`) через `page.emulateMedia({ colorScheme: 'dark' })`.
- Критерий: все тексты ≥ 4.5:1, крупный текст ≥ 3:1, UI-элементы ≥ 3:1.
 
**Если токены не проходят:** скорректировать значения `--text-muted`, `--accent` в `main.css` до соответствия WCAG.
 
## Критерии приёмки
 
- [ ] Команда `grep -rn 'gray-[0-9]\|text-white\|bg-white\|red-[0-9]' app/ --include='*.vue'` возвращает только целевые исключения (иллюстрации/превью) — список зафиксирован в PR.
- [ ] Все интерактивные элементы имеют `transition-interactive` (или эквивалент); `grep 'transition-all' app/` пуст.
- [ ] Hover-анимации видны на карточках QR, папках, элементах sidebar.
- [ ] На `375 px` ширине текст читаем (кегль ≥ 14 px), на `1920 px` — заголовки не «теряются».
- [ ] `/docs-ui` доступна под admin-сессией, все секции рендерятся.
- [ ] С включенным `prefers-reduced-motion` анимации выключены (проверка в devtools).
- [ ] axe-core `color-contrast` правило проходит на `light` и `dark` темах для покрытых страниц.
- [ ] `npm run typecheck`, `npm run lint`, `npm run test:e2e` — зелёные.
 
## Изменённые/созданные файлы
 
### Новые
```
app/pages/docs-ui/index.vue
app/pages/docs-ui/buttons.vue
app/pages/docs-ui/forms.vue
app/pages/docs-ui/feedback.vue
app/pages/docs-ui/overlays.vue
app/pages/docs-ui/navigation.vue
app/composables/useReducedMotion.ts
server/middleware/docs-ui-guard.ts (если отдельный middleware)
```
 
### Изменённые
```
app/assets/css/main.css
app/components/qr/Card.vue
app/components/qr/Table.vue
app/components/app/Sidebar.vue
app/components/app/Header.vue
app/components/app/UserMenu.vue
app/components/folders/*.vue
app/pages/dashboard/index.vue
app/pages/qr/*.vue
app/pages/settings/*.vue
app/pages/analytics/*.vue
e2e/a11y.spec.ts
nuxt.config.ts (env NUXT_DOCS_UI)
```
 
## Переиспользуемые утилиты
 
- **CSS:** `clamp()`, `@media (prefers-reduced-motion)`, `color-mix()`, custom `@utility`.
- **@vueuse/core:** `useMediaQuery`.
- **@axe-core/playwright:** `color-contrast` rule.
- **Nuxt UI v3:** все примитивы для `/docs-ui`.
 
## Тестирование
 
1. **Цветовой аудит:** `grep` по старым Tailwind-цветам — в результате только известные исключения.
2. **Темы:** переключить light/dark в `UserMenu` — переходы плавные, контрасты сохраняются.
3. **Hover-анимации:** навести на карточку QR → lift + shadow; убрать мышь → плавный возврат.
4. **Responsive typography:** DevTools → 375 px — `h1` ~`1.875rem`; 1920 px — `h1` ~`2.5rem`.
5. **docs-ui:** зайти под admin, открыть `/docs-ui/buttons` → все варианты видны; под обычным юзером — 403 или redirect.
6. **Reduced motion:** DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce` → анимаций нет.
7. **Contrast:** `npm run test:e2e -- a11y.spec.ts` с включенным color-contrast — violations = 0.
 
## Метрики успеха
 
- **Цветовой аудит:** 0 «сырых» `gray-*` / `red-*` в prod-коде (исключая SVG и иллюстрации).
- **Lighthouse Best Practices:** ≥ 95.
- **Visual regression (если подключить Chromatic/Percy):** разница между темами < 1 % пикселей в ожидаемых местах.
- **First Contentful Paint:** не ухудшается относительно v0.12.0 (transitions не должны тормозить первый рендер).
 
## Зависимости от других EPIC
 
- **EPIC 17 (a11y):** добавляет `StatusBadge.vue` и `e2e/a11y.spec.ts` — EPIC 18 расширяет их (color-contrast rule, visual polish).
- **EPIC 15 (forms):** уже мигрировал `settings/domains.vue` на токены — служит эталоном для остальных страниц.
