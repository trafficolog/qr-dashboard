# Код-ревью: Hotfix Auth, Navigation, Error

**Дата:** 2026-04-13
**Файлов создано:** 3
**Файлов изменено:** 14

## Проверка безопасности
- ✅ Cookie-based auth: SSR `fetchUser()` теперь пробрасывает `cookie` headers в `/api/auth/me`, поэтому серверно рендеримые защищённые страницы корректно определяют сессию.
- ✅ Access control: `server/utils/auth.ts` и `server/middleware/auth.ts` используют общий тип `User` из корневого `types/`.
- ✅ 404 и runtime errors: неизвестные маршруты не перехватываются client middleware и корректно попадают в `app/error.vue`.

## Проверка качества
- ✅ `corepack pnpm typecheck` проходит без ошибок.
- ✅ Shared-type imports приведены к единому виду `~~/types/*` в клиентских и серверных файлах.
- ✅ `app/composables/useQr.ts` корректно перезапрашивает список при смене поиска с любой страницы пагинации.
- ✅ Auth UI использует one-page flow: `app/pages/auth/login.vue`, а `app/pages/auth/verify.vue` сохранён как compatibility redirect.

## Проверка производительности
- ✅ Лишние SSR-redirect loops устранены: после логина защищённые маршруты больше не уводят пользователя обратно на `/auth/login`.
- ⚠️ `auth.global.ts` по-прежнему не делает принудительную revalidate сессии на каждом клиентском переходе; это осознанный компромисс ради отсутствия flicker.

## Проверка UX
- ✅ `UApp` подключён в `app/app.vue`, поэтому primary theme Nuxt UI теперь совпадает с `splat`.
- ✅ Добавлен `app/error.vue` с branded 404/general error состояниями.
- ✅ Добавлен placeholder `app/pages/analytics/index.vue`, поэтому target в sidebar/mobile nav не ведёт на пустой route.
- ✅ В `app/pages/auth/login.vue` поле email и primary CTA визуально выровнены.

## Найденные проблемы
1. Поиск QR не обновлял список при `page > 1` → исправлено в `app/composables/useQr.ts`.
2. Auth UI не вытаскивал `data.error.message` из API-ошибок → исправлено в `app/pages/auth/login.vue`.
3. SSR-auth bootstrap не пробрасывал cookie в `/api/auth/me` → исправлено в `app/composables/useAuth.ts`.

## Ручная проверка
1. `corepack pnpm typecheck`
2. `corepack pnpm exec eslint "app/composables/useAuth.ts" "app/composables/useQr.ts" "app/error.vue"`
3. Smoke-check маршрутов после входа:
   `/dashboard`, `/qr`, `/folders`, `/analytics`, `/settings` → `200`
4. `/auth/login` для авторизованного пользователя → redirect на `/dashboard`
5. Неизвестный URL → `404` через `app/error.vue`

## Остаточные риски
- SVG logo clipping в `app/utils/qr-svg.ts` стоит визуально проверить в целевых браузерах, если начнётся активное использование логотипов в QR.
