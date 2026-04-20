# EPIC 23 Baseline — до миграции на Nuxt 4

**Дата фиксации:** 2026-04-20  
**Ветка:** `feat/epic-23-nuxt4-migration`  
**Версия проекта:** `0.13.0`

---

## 1) Среда

- **Node.js:** `v22.21.1`
- **pnpm:** `10.17.1`
- **Nuxt (resolved):** `3.21.2`
- **Совместимость Nuxt:** `compatibilityVersion: 4` (из логов `nuxt typecheck`/`nuxt build`)

---

## 2) Snapshot зависимостей (`pnpm list --depth=0`)

### Dependencies

| Пакет | Версия |
|---|---|
| @asteasolutions/zod-to-openapi | 7.3.4 |
| @modelcontextprotocol/sdk | 1.29.0 |
| @pinia/nuxt | 0.9.0 |
| @scalar/api-reference | 1.52.3 |
| @sentry/node | 8.55.1 |
| @vueuse/nuxt | 12.8.2 |
| dotenv | 16.6.1 |
| drizzle-orm | 0.38.4 |
| echarts | 5.6.0 |
| geoip-lite | 1.4.10 |
| lru-cache | 11.3.5 |
| nanoid | 5.1.9 |
| node-cron | 3.0.3 |
| nodemailer | 6.10.1 |
| nuxt | 3.21.2 |
| papaparse | 5.5.3 |
| pdfkit | 0.16.0 |
| pg | 8.20.0 |
| pinia | 2.3.1 |
| qrcode | 1.5.4 |
| sharp | 0.33.5 |
| ua-parser-js | 1.0.41 |
| vue | 3.5.32 |
| vue-echarts | 7.0.3 |
| vue-router | 4.6.4 |
| zod | 3.25.76 |

### Dev dependencies

| Пакет | Версия |
|---|---|
| @axe-core/playwright | 4.11.2 |
| @nuxt/eslint-config | 0.7.6 |
| @nuxt/icon | 1.15.0 |
| @nuxt/ui | 3.3.7 |
| @nuxtjs/i18n | 9.5.6 |
| @playwright/test | 1.59.1 |
| drizzle-kit | 0.30.6 |
| eslint | 9.39.4 |
| prettier | 3.8.3 |
| typescript | 5.9.3 |
| vitest | 2.1.9 |

---

## 3) Baseline проверки

| Проверка | Статус | Результат |
|---|---:|---|
| `pnpm typecheck` | ❌ fail | 22 TS-ошибки (преимущественно `useClipboard`/`@vueuse/core` not found, несоответствия типов DTO, тестовые runtime зависимости). Время: `real 0m44.412s`. |
| `pnpm lint` | ❌ fail | 81 проблем: **21 errors**, **60 warnings**. Время: `real 0m11.338s`. |
| `pnpm test:unit` | ❌ fail | 22 test files: **18 failed**, **4 passed**; 14 tests: **3 failed**, **11 passed**. Время: `real 0m17.579s`. |
| `pnpm test:e2e` | ⚠️ env fail | **84 failed**. Основная причина: не установлены Playwright browsers (`pnpm exec playwright install`). Время: `real 1m20.955s`. |
| `pnpm build` | ❌ fail | Сбой сборки: `Can't resolve 'tailwindcss' in /workspace/qr-dashboard/assets/css/main.css`; дополнительно сетевые ошибки font providers (`@nuxt/fonts/unifont`). Время: `real 0m10.327s`. |
| `timeout 40s pnpm dev` | ⚠️ partial | Dev-сервер поднимается (`Local: http://localhost:3000/`), но есть pre-transform ошибка `Can't resolve 'tailwindcss'`. Измерение ограничено `timeout 40s`. |

---

## 4) Bundle size baseline

- `pnpm build` завершился с ошибкой, поэтому размер `.output/public` **не зафиксирован** на этом шаге.
- Нужно повторить метрику после исправления `tailwindcss` resolve и/или отключения проблемных font providers в CI-контуре.

---

## 5) Вывод

Текущий baseline показывает, что до старта миграции есть накопленный технический долг в тестовом и build-контурах. Для корректного сравнения `baseline -> post-migration` потребуется стабилизировать pipeline (build + e2e runtime prerequisites) либо учитывать эти ограничения как «known baseline issues» в финальном review.
