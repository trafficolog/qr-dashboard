# CI Gates

## 2026-04-19

- ✅ `npm run typecheck`: 0 errors (gate closed).
- ✅ `npm run lint`: 0 errors, 10 warnings (warnings allowed by current policy).

## 2026-04-20

- ✅ Добавлен обязательный prerequisite для Playwright перед e2e: `pnpm e2e:install-browsers` (`playwright install --with-deps chromium`).
- ✅ В CI workflow `playwright-a11y` шаг установки браузеров выполняется до `pnpm test:e2e`.
- ✅ Базовый e2e baseline перепроверен после prerequisite: теперь среда готова, оставшиеся падения относятся к тестовой логике/конфигурации (`PLAYWRIGHT_AUTH_COOKIE`, assertions).

