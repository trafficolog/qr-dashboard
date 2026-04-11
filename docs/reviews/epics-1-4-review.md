# Код-ревью: Эпики 1–4 — Начальная реализация

**Дата:** 2026-04-08
**Файлов создано:** 90+
**Реализовано:** Инфраструктура, Аутентификация, Layout, CRUD QR-кодов

## Проверка безопасности
- ✅ Валидация: все POST/PUT эндпоинты покрыты Zod
- ✅ Доступ: checkAccess в каждом методе qr.service (owner или admin)
- ✅ Токены: SHA-256 hash в БД, plaintext только в cookie
- ✅ Cookie: httpOnly, secure (prod), sameSite: lax
- ✅ Rate limiting: auth 5/15min, redirect 1000/min
- ✅ OTP: 6 цифр, TTL 10 мин, max 5 attempts, одноразовый
- ✅ Первый пользователь → admin автоматически

## Проверка качества
- ✅ TypeScript strict mode включён
- ✅ Утилиты вынесены: nanoid, hash, ip, response, auth
- ✅ Паттерны соблюдены: тонкие хэндлеры → сервисы
- ⚠️ `any` типы: используются в некоторых компонентах для QR style props (допустимо, JSONB)
- ⚠️ Import path `~/app/utils/qr-svg` может потребовать проверки в Nuxt 4 compat mode

## Проверка производительности
- ✅ DB pool: max 20 connections
- ✅ Пагинация: все списки с limit/offset
- ✅ Индексы: 5 на qr_codes, 4 на scan_events (вкл. composite)
- ✅ LRU-cache подготовлен (будет использоваться в Эпике 5)
- ✅ Debounce 300ms на клиентском поиске

## Проверка UX
- ✅ Loading: USkeleton на списке QR, dashboard
- ✅ Errors: toast уведомления с русскими сообщениями
- ✅ Empty states: SharedEmptyState на списке QR
- ✅ Confirm: SharedConfirmDialog перед удалением
- ✅ Responsive: sidebar collapse, mobile slideover

## Найденные проблемы
1. Export endpoint отсутствует на сервере → TODO в Эпике 5
2. Folder/Tag fetch в формах QR → placeholder → TODO в Эпике 7
3. Search modal в Header → placeholder → низкий приоритет

## Рекомендации для Эпика 5
- Дублировать логику qr-svg.ts на сервер (app/utils недоступен из server/)
- Добавить invalidateQrCache() вызовы в updateQr/deleteQr
- GeoIP на localhost вернёт null — обрабатывать gracefully
