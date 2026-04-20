# Security headers: ручная валидация

Проверки после добавления `server/middleware/security-headers.ts`.

## 1) HTML-роуты получают полный набор headers + CSP

```bash
curl -I http://localhost:3001/dashboard
```

Ожидаем в ответе:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: ...`

## 2) API-эндпоинты получают security headers, но **без CSP**

```bash
curl -I http://localhost:3001/api/auth/me
```

Ожидаем:
- есть `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`
- **нет** заголовка `Content-Security-Policy`

## 3) Redirect `/r/**` получает security headers, но **без CSP**

```bash
curl -I http://localhost:3001/r/test
```

Ожидаем:
- есть `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`
- **нет** заголовка `Content-Security-Policy`

## 4) Быстрая проверка CSP-директив

```bash
curl -sI http://localhost:3001/dashboard | rg '^Content-Security-Policy:'
```

Ожидаем, что `Content-Security-Policy` содержит минимум:
- `script-src 'self' 'unsafe-inline'`
- `style-src 'self' 'unsafe-inline'`
- `connect-src 'self' ws: wss:`

