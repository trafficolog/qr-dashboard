# EPIC 23 — Smoke Checklist (ручной)

**Commit SHA:** `HEAD (local, 2026-04-21)`  
**Environment URL:** `http://localhost:3001` (ожидался), фактически недоступен во время smoke  
**Tester:** `Codex (local run)`  
**Date/Time:** `2026-04-21 08:28 UTC`  
**Окружение:** local  
**Цель:** быстрый ручной прогон критических пользовательских флоу после миграции на Nuxt 4.

> Статусы: `⬜ not run` · `✅ pass` · `❌ fail` · `⚠️ blocked`

---


## 0) Prerequisite (обязательный перед smoke/e2e)

- [x] `✅` Выполнена установка Playwright browser binaries + системных зависимостей: `pnpm e2e:install-browsers`.
- [ ] `⚠️ blocked` Для auth-gated e2e сценариев задан `PLAYWRIGHT_AUTH_COOKIE` (или выполнен bootstrap, который его создаёт).
- **Evidence:** `pnpm e2e:install-browsers` завершился успешно; `pnpm test:e2e` падает по `PLAYWRIGHT_AUTH_COOKIE must be set` и `ERR_CONNECTION_REFUSED` на `http://localhost:3001`.

## 1) Auth & Session

- [ ] `⬜` Логин по email/OTP: успешный вход и редирект на `/dashboard`.
- [ ] `⬜` Невалидный OTP: отображается понятная ошибка, без 500.
- [ ] `⬜` Перезагрузка страницы сохраняет сессию.
- [ ] `⬜` Logout очищает сессию и редиректит на `/auth/login`.
- [ ] `⬜` Защищённый роут без сессии редиректит на логин.
- **Evidence:** `❌ fail/⚠️ blocked` — в `e2e/auth.spec.ts` зафиксированы `ERR_CONNECTION_REFUSED` и ошибка куки `Cookie should have either url or path`.

## 2) QR CRUD (основной флоу)

- [ ] `⬜` Создание QR (минимальный payload) успешно.
- [ ] `⬜` Создание QR с расширенными параметрами (UTM/кастомизация) успешно.
- [ ] `⬜` Редактирование QR сохраняет изменения.
- [ ] `⬜` Просмотр QR preview/карточки корректен.
- [ ] `⬜` Удаление QR работает, список обновляется.
- [ ] `⬜` Bulk-операции (если доступны) работают без регрессий.
- **Evidence:** `⚠️ blocked` — smoke по CRUD не выполнен из-за отсутствия авторизованной сессии (`PLAYWRIGHT_AUTH_COOKIE`) и недоступного base URL.

## 3) Visibility / Scope / ACL

- [ ] `⬜` Смена visibility `private -> public` работает.
- [ ] `⬜` Смена visibility `private -> department` требует/валидирует department.
- [ ] `⬜` ACL: попытка изменения чужого QR возвращает 403/4xx.
- [ ] `⬜` Фильтры scope (`mine/public/department`) возвращают ожидаемые записи.
- **Evidence:** `⚠️ blocked` — API/e2e сценарии visibility/scope в основном `skipped` без auth-cookie.

## 4) Folders / Tags

- [ ] `⬜` Создание/редактирование/удаление папки работает.
- [ ] `⬜` Привязка QR к папке и перемещение между папками работает.
- [ ] `⬜` Создание/редактирование тегов работает.
- **Evidence:** `⚠️ blocked` — разделы folders/tags не прогнаны без валидной auth-сессии.

## 5) Analytics

- [ ] `⬜` Страница `/analytics` открывается без runtime ошибок.
- [ ] `⬜` Графики/карточки метрик рендерятся.
- [ ] `⬜` Переключение периода (дата/диапазон) обновляет данные.
- [ ] `⬜` Empty-state корректен при отсутствии данных.
- **Evidence:** `⚠️ blocked` — `analytics.spec.ts` скипается без auth-cookie; ручной проход не выполнялся.

## 6) MCP / Integrations

- [ ] `⬜` Страница интеграции MCP открывается.
- [ ] `⬜` Инструкции/ключи/endpoint отображаются корректно.
- [ ] `⬜` Тестовый запрос к `/mcp` проходит happy-path.
- [ ] `⬜` Ограничения rate-limit работают предсказуемо (ожидаемый 429 при превышении).
- **Evidence:** `⚠️ blocked` — MCP smoke не выполнялся (нет подготовленной auth/test-среды).

## 7) Settings

- [ ] `⬜` Навигация по `/settings/*` разделам без битых роутов.
- [ ] `⬜` Формы настроек сохраняются (profile/general/integrations).
- [ ] `⬜` Поиск/фильтрация в настройках (если есть) работают.
- **Evidence:** `❌ fail/⚠️ blocked` — `settings-tabs.spec.ts` падает из-за отсутствия `PLAYWRIGHT_AUTH_COOKIE`.

## 8) UI/UX sanity

- [ ] `⬜` Нет критичных визуальных поломок в key-экранах (`dashboard`, `qr`, `analytics`, `settings`).
- [ ] `⬜` Тёмная тема / светлая тема (если поддерживаются) визуально корректны.
- [ ] `⬜` Основные action-кнопки доступны и активируются в нужных состояниях.
- [ ] `⬜` Консоль браузера не содержит критичных runtime ошибок.
- **Evidence:** `⚠️ blocked` — визуальный sanity-check не валидирован из-за срыва smoke-прогона.

## 9) Результат smoke-прогона

- **Итог:** `❌ fail (с environment blockers)`
- **Дата/время прогона:** `2026-04-21 08:28 UTC`
- **Исполнитель:** `Codex`
- **Найденные дефекты:**
  - **Дефект:** `PLAYWRIGHT_AUTH_COOKIE не задан для auth-gated сценариев`
    - **Severity:** `High`
    - **Owner:** `QA/Automation`
    - **ETA fix:** `перед повторным smoke`
  - **Дефект:** `E2E base URL недоступен (ERR_CONNECTION_REFUSED http://localhost:3001)`
    - **Severity:** `High`
    - **Owner:** `DevOps/Frontend`
    - **ETA fix:** `поднять приложение перед test:e2e`
  - **Дефект:** `Некорректная постановка cookie в auth.spec.ts (Cookie should have either url or path)`
    - **Severity:** `Medium`
    - **Owner:** `QA/Automation`
    - **ETA fix:** `в рамках e2e follow-up`
- **Критерий финального pass:** нет открытых high/critical дефектов.
- **Решение по релизу:** `Не готово к sign-off до устранения blocker'ов окружения и повторного smoke.`

---

## Примечание

Этот чеклист предназначен для post-migration проверки (задача 23.15) и должен быть заполнен перед финальным sign-off в `docs/reviews/epic-23-final-review.md`.
