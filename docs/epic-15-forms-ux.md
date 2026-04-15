# EPIC 15 — Forms UX Enhancement
 
**Статус:** ✅ Выпущено в **v0.12.0** (2026-04-15)
**Ветка:** `claude/ux-ui-improvements-Kt0wI` (история разработки)
**Версия релиза:** v0.12.0
 
---
 
## Цель
 
Сделать все формы приложения безопасными (не теряют данные), предсказуемыми (единая валидация и серверные ошибки на полях) и полностью локализованными.
 
## Контекст
 
UX/UI-ревизия выявила системные проблемы форм (F-1…F-8 в [splat-qr-ux-ui-review.md](./splat-qr-ux-ui-review.md)):
- данные теряются при случайной навигации или перезагрузке;
- сообщения об ошибках захардкожены на русском и ломают английскую локаль;
- клиентская и серверная валидация живут независимо;
- ошибки с сервера не привязаны к полям формы;
- нет связи `aria-describedby` между input и текстом ошибки.
 
## Задачи
 
### 15.1 Unsaved Changes Guard
 
**Новые файлы:**
- `app/composables/useUnsavedChanges.ts`
- `app/components/shared/UnsavedChangesDialog.vue`
 
**Сигнатура:**
```ts
function useUnsavedChanges(isDirty: Ref<boolean> | ComputedRef<boolean>): {
  showDialog: Ref<boolean>
  pendingNavigation: Ref<(() => void) | null>
  confirm: () => void
  cancel: () => void
}
```
 
Поведение:
- `onBeforeRouteLeave((to, from, next)) => { if (!isDirty.value) return next(); showDialog = true; pendingNavigation = () => next() }`.
- `useEventListener('beforeunload', e => { if (isDirty.value) e.preventDefault() })`.
- Диалог: локализован (`forms.unsaved.title`, `forms.unsaved.description`, `forms.unsaved.stay`, `forms.unsaved.leave`).
 
**Точки подключения:**
- `qr/create.vue` — dirty = любое поле формы непустое.
- `qr/[id]/edit.vue` — dirty = форма отличается от загруженного QR (deep compare).
- `settings/team.vue` — модалка приглашения: dirty = есть email.
 
### 15.2 Unified Form Validation
 
**Новый файл:** `app/composables/useFormValidation.ts`
 
**Сигнатура:**
```ts
function useFormValidation<T extends z.ZodTypeAny>(schema: T): {
  errors: Reactive<Record<string, string>>
  touched: Reactive<Record<string, boolean>>
  validate: (data: unknown) => boolean
  validateField: (name: string, value: unknown) => boolean
  setServerErrors: (fieldErrors: Record<string, string>) => void
  reset: () => void
}
```
 
Поведение:
- `validate()` прогоняет Zod `safeParse` и заполняет `errors` из `error.issues[].path`.
- `validateField()` делает `schema.pick({ [name]: true })` (если Zod-объект) и валидирует поле.
- `setServerErrors()` принимает 422-ответ `{ field: message }` и проставляет в `errors`.
- `touched` — помечает поле как «тронутое» при `@blur`.
 
### 15.3 Accessibility-wiring форм
 
В каждой `UFormField` с `:error`:
- Добавить `:ui="{ error: 'id-error-' + field }"` (или использовать slot `error` с `:id`).
- Связать `<UInput :aria-describedby="errors.field ? 'id-error-field' : undefined" :aria-invalid="!!errors.field">`.
- `required` поле: `<UFormField required aria-required="true">`.
- Добавить `hint`-prop с поясняющим текстом (из `forms.hints.*`).
 
### 15.4 Локализация форм
 
Новые ключи в `i18n/locales/{ru,en}.json`:
```
forms.errors.required
forms.errors.url
forms.errors.email
forms.errors.domain
forms.errors.minLength
forms.errors.generic
forms.errors.serverGeneric
forms.hints.qrTitle
forms.hints.destinationUrl
forms.hints.utmCampaign
forms.unsaved.title
forms.unsaved.description
forms.unsaved.stay
forms.unsaved.leave
forms.draft.restored
forms.draft.discard
forms.draft.keep
forms.draft.savedAt
forms.actions.save
forms.actions.cancel
```
 
### 15.5 Draft Autosave
 
**Новые файлы:**
- `app/composables/useFormDraft.ts`
- `app/components/shared/DraftRestoredBanner.vue`
 
**Сигнатура:**
```ts
function useFormDraft<T extends object>(
  key: string,
  state: T,
  opts?: { debounceMs?: number, exclude?: (keyof T)[] }
): {
  hasDraft: Ref<boolean>
  draftSavedAt: Ref<string | null>
  restore: () => void
  discard: () => void
  clear: () => void
}
```
 
Поведение:
- `useLocalStorage<{ savedAt: string, data: T }>('draft:' + key, null)`.
- `watch(state, useDebounceFn(() => save(), debounceMs ?? 1000), { deep: true })`.
- На mount проверяет наличие черновика → выставляет `hasDraft = true`.
- `discard()` очищает `localStorage`.
- `restore()` копирует поля из `draft.data` в `state` через `Object.assign`.
 
**DraftRestoredBanner:**
- `UAlert` с `color="info"`, показывает `forms.draft.restored` + «X мин назад».
- Кнопки «Восстановить» (`restore`) и «Отменить» (`discard`).
 
**Подключение:** `qr/create.vue` — key = `'qr-create:' + user.id`.
 
### 15.6 Skeleton на Edit
 
`qr/[id]/edit.vue` уже имеет `v-else` с двумя skeleton-блоками. Расширить:
- Skeleton header (`h-8 w-64`), 3 секционных карточки (`h-64 w-full`), превью справа (`aspect-square w-full`).
 
### 15.7 Server-side валидация с 422 + field map
 
**Новый файл:** `server/utils/zod-errors.ts`
 
```ts
export function zodToFieldErrors(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of err.issues) {
    const field = issue.path.join('.')
    if (!(field in out)) out[field] = issue.message
  }
  return out
}
 
export function validateBody<T>(event: H3Event, schema: ZodSchema<T>): Promise<T> {
  return readValidatedBody(event, (body) => {
    const result = schema.safeParse(body)
    if (!result.success) {
      throw createError({
        statusCode: 422,
        statusMessage: 'Validation failed',
        data: { fieldErrors: zodToFieldErrors(result.error) },
      })
    }
    return result.data
  })
}
```
 
**Применение:**
- `server/api/team/invite.post.ts` — заменить `readValidatedBody(event, bodySchema.parse)` на `validateBody(event, bodySchema)`.
- `server/api/admin/domains/index.post.ts`, `[id].patch.ts` — аналогично.
 
## Критерии приёмки
 
- [x] `useUnsavedChanges` ловит переходы router и beforeunload.
- [x] `useFormValidation` валидирует объект и поле, принимает server errors.
- [x] Все тексты форм в `forms.*` ключах; `grep -n "'Email обязателен'"` возвращает ноль.
- [x] `useFormDraft` восстанавливает черновик при повторном открытии `/qr/create`.
- [x] `qr/[id]/edit.vue` показывает skeleton вместо мигающего пустого экрана.
- [x] 422-ответы от `/api/team/invite` и `/api/admin/domains` рендерятся на полях.
- [ ] `npm run typecheck` — зелёный.
- [ ] `npm run lint` — зелёный.
- [ ] Ручной прогон в обоих языках (ru/en).
 
## Изменённые/созданные файлы
 
### Новые
```
app/composables/useUnsavedChanges.ts
app/composables/useFormValidation.ts
app/composables/useFormDraft.ts
app/components/shared/UnsavedChangesDialog.vue
app/components/shared/DraftRestoredBanner.vue
server/utils/zod-errors.ts
```
 
### Изменённые
```
app/pages/qr/create.vue
app/pages/qr/[id]/edit.vue
app/pages/settings/team.vue
app/pages/settings/domains.vue
server/api/team/invite.post.ts
server/api/admin/domains/index.post.ts
server/api/admin/domains/[id].patch.ts
i18n/locales/ru.json
i18n/locales/en.json
```
 
## Переиспользуемые утилиты
 
- `@vueuse/core`: `useLocalStorage`, `useDebounceFn`, `useEventListener`.
- `vue-router`: `onBeforeRouteLeave`.
- `zod` (уже в deps).
- Nuxt UI: `UModal`, `UAlert`, `UFormField`, `USkeleton`, `UButton`.
 
## Тестирование
 
1. **Unsaved guard:** открыть `/qr/create`, ввести title → кликнуть «Дашборд» в sidebar → увидеть диалог.
2. **Draft restore:** ввести title+URL → `F5` → увидеть баннер «Восстановлен черновик» и заполненную форму.
3. **Unsaved guard (beforeunload):** ввести title → закрыть вкладку → получить нативный browser-prompt.
4. **Server validation:** в `/settings/domains` ввести `not-a-domain` → получить ошибку `forms.errors.domain` из сервера (422), привязанную к полю.
5. **Localization:** переключить язык на EN в UserMenu → убедиться, что ошибки и хинты на английском.
6. **A11y:** через devtools убедиться, что `aria-describedby` совпадает с `id` текста ошибки; `aria-invalid="true"` при ошибке.