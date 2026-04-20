# Security middleware order

Ниже зафиксирован **обязательный порядок** `server/middleware/*.ts`, который чувствителен к эффектам каждого шага.

## Порядок выполнения

1. `00-security-headers.ts`
2. `01-auth.ts`
3. `02-csrf.ts`
4. `03-rate-limit.ts`
5. `04-body-size-limit.ts`

> Почему `security-headers` идёт первым: чтобы даже ошибки авторизации/CSRF/rate-limit возвращались с защитными заголовками.

## Ожидаемые исключения (bypass)

- `/api/v1/**`:
  - `01-auth.ts`: допускает Bearer API key flow.
  - `02-csrf.ts`: полностью bypass, потому что CSRF применяется только к cookie-auth mutating запросам.
- `/api/auth/login`, `/api/auth/verify`:
  - `01-auth.ts`: публичные маршруты.
  - `02-csrf.ts`: исключены из CSRF.
- `/r/**`:
  - `01-auth.ts`: bypass для redirect endpoint.
  - `03-rate-limit.ts`: отдельный redirect limiter и временный ban по подозрительной активности.

## Таблица: middleware → область → причина

| Middleware | Область | Причина |
|---|---|---|
| `00-security-headers.ts` | Все ответы (API, SSR, ошибки) | Базовые security headers должны присутствовать всегда; CSP только для HTML-маршрутов. |
| `01-auth.ts` | `/api/**` кроме публичных/auth bypass и `/r/**` | Идентификация контекста (`event.context.user`, `event.context.apiKeyId`) до downstream-проверок. |
| `02-csrf.ts` | Cookie-auth mutating (`POST/PUT/PATCH/DELETE`) для API, кроме bypass-путей | Защита от CSRF только для сессий на cookies; не нужна для Bearer `/api/v1/**`. |
| `03-rate-limit.ts` | `/api/auth/login`, `/r/**`, `/api/v1/**` (при `apiKeyId`) | Лимитирование после идентификации контекста: для API v1 ключ лимита привязан к `apiKeyId`. |
| `04-body-size-limit.ts` | Mutating API-запросы с телом (`POST/PUT/PATCH`) | Ранний отказ для слишком больших payload (`413`) до дорогостоящей бизнес-логики. |

## Smoke-покрытие

Смоук-проверки порядка и исключений находятся в `server/middleware/order.integration.test.ts`:

- auth перед api-v1 rate-limit,
- csrf только для cookie-auth mutating,
- rate-limit после идентификации контекста,
- security headers присутствуют даже в error-ответах.
