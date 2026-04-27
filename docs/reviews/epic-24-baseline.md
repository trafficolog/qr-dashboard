# EPIC 24 — Baseline Metrics (до миграции на PrimeVue)

**Дата фиксации:** 2026-04-22
**Ветка:** `feat/epic-24-primevue-migration` (свежесозданная от `main` после merge EPIC 23)
**Версия проекта:** `0.15.0` (post-EPIC 23)
**Заполняет:** разработчик, выполняющий задачу 24.1
**Цель:** зафиксировать состояние проекта ДО любых изменений, чтобы в задачах 24.33–24.38 и финальном review можно было корректно сравнить «было → стало» и оценить влияние миграции.

---

## 1. Окружение

| Параметр | Значение |
|----------|----------|
| Node.js | `v22.21.1` |
| pnpm | `10.17.1` |
| ОС снятия baseline | `Linux 2e421b329ca1 6.12.47 #1 SMP Mon Oct 27 10:01:15 UTC 2025 x86_64 GNU/Linux` |
| Git commit | `e5d2c03cfb51b021e5c9754b199c1400aaabac3b` |
| Git branch origin | `main` после merge EPIC 23 |

---

## 2. Версии зависимостей

### 2.1. Вывод `pnpm list --depth=0`

Скопировать вывод сюда без редактирования:

```
$ pnpm list --depth=0

splat-qr@0.15.0 /path/to/qr-dashboard
dependencies:
<paste here>

devDependencies:
<paste here>
```

### 2.2. Ключевые версии (резюме)

Заполняется ручным чтением из вывода выше. Эти цифры используются в `epic-24-deps-matrix.md` и в финальном review.

| Пакет | Версия |
|-------|--------|
| nuxt | |
| @nuxt/ui | |
| @nuxt/icon | |
| @nuxtjs/i18n | |
| @pinia/nuxt | |
| pinia | |
| @vueuse/nuxt | |
| drizzle-orm | |
| drizzle-kit | |
| zod | |
| vue | |
| vue-router | |
| vue-echarts | |
| echarts | |
| @sentry/node | |
| typescript | |
| vitest | |
| @playwright/test | |
| @axe-core/playwright | |
| @nuxt/eslint-config | |
| eslint | |
| prettier | |

---

## 3. Инвентаризация использования Nuxt UI

Эти цифры критичны: они показывают объём работы в задаче 24.8 (component mapping sweep) и служат критерием приёмки («0 совпадений после миграции»).

### 3.1. Импорты из `@nuxt/ui`

```bash
$ grep -rn "from '@nuxt/ui'" app/ server/ | wc -l
<number>
```

Значение: <N> *(например, 23)*

### 3.2. Теги Nuxt UI компонентов

```bash
$ grep -rn '<U[A-Z]' app/ --include='*.vue' | wc -l
<number>
```

Значение: <N> *(общее количество использований)*

### 3.3. Распределение по компонентам (top-20)

```bash
$ grep -rhoE '<U[A-Z][a-zA-Z]+' app/ --include='*.vue' | sort | uniq -c | sort -rn | head -20
```

Вставить вывод:

```
  XXX UButton
  XXX UInput
  XXX UIcon
  XXX UCard
  XXX UBadge
  XXX UModal
  XXX USlideover
  XXX USelect
  XXX UForm
  XXX UFormGroup
  XXX UTable
  XXX UAvatar
  XXX UPopover
  XXX UTextarea
  XXX UTooltip
  XXX UCheckbox
  XXX UTabs
  XXX UProgress
  XXX USkeleton
  XXX USwitch
```

### 3.4. Использование composables из Nuxt UI

```bash
$ grep -rn 'useToast\|useModal\|useSlideover\|useColorMode' app/ | wc -l
```

Значение: <N>

### 3.5. Обобщённая оценка

- **Файлов затронуто миграцией:** <N> *(грубая оценка по уникальным путям из 3.2)*
- **Уникальных Nuxt UI компонентов в проекте:** <N>
- **Использование composables:** <N>

---

## 4. Проверки качества кода

### 4.1. TypeScript

```bash
$ pnpm typecheck
```

- Результат: ✅ pass / ❌ fail
- Ошибок: **0** (после EPIC 23 должно быть 0)
- Длительность: <N> sec
- Warnings: <N>

Если есть ошибки — полный вывод зафиксировать в `docs/reviews/epic-24-baseline-typecheck.log`.

### 4.2. ESLint

```bash
$ pnpm lint
```

- Результат: ✅ pass / ❌ fail
- Errors: **0**
- Warnings: **0**
- Длительность: <N> sec

### 4.3. Unit-тесты

```bash
$ pnpm test:unit
```

- Результат: ✅ pass / ❌ fail
- Тестов всего: <N>
- Passed: <N>
- Failed: <N>
- Skipped: <N>
- Длительность: <N> sec
- Coverage (если включён): <N>%

Полный вывод → `docs/reviews/epic-24-baseline-unit.log`

### 4.4. E2E-тесты

```bash
$ pnpm test:e2e
```

- Результат: ✅ pass / ❌ fail
- Specs всего: <N>
- Passed: <N>
- Failed: <N>
- Skipped: <N>
- Длительность: <N> min
- Retries использовано: <N>

Полный отчёт → `docs/reviews/epic-24-baseline-e2e-report/` (HTML report из Playwright).

### 4.5. Security audit

```bash
$ pnpm audit --prod
```

- Critical: <N>
- High: <N>
- Moderate: <N>
- Low: <N>

Ожидание: Critical = 0, High = 0 (после EPIC 23).

---

## 5. Bundle size

### 5.1. Production build

```bash
$ rm -rf .output .nuxt
$ pnpm build
```

- Длительность сборки: <N> sec
- Ошибок: 0
- Warnings в выводе Vite/Nitro: <N>

### 5.2. Размеры артефактов

```bash
$ du -sh .output/
$ du -sh .output/public/
$ du -sh .output/server/
$ find .output/public -name '*.js' -exec du -b {} + | sort -rn | head -10
$ find .output/public -name '*.css' -exec du -b {} + | sort -rn | head -10
```

| Путь | Размер |
|------|--------|
| `.output/` (всё) | <X> MB |
| `.output/public/` (client assets) | <X> MB |
| `.output/server/` (Nitro bundle) | <X> MB |
| Top-1 JS chunk | `<filename>` — <X> KB |
| Top-2 JS chunk | | |
| Top-3 JS chunk | | |
| Main CSS | `<filename>` — <X> KB |

### 5.3. Gzip / brotli (если применимо)

```bash
$ find .output/public -name '*.js.gz' -exec du -b {} + | sort -rn | head -5
$ find .output/public -name '*.js.br' -exec du -b {} + | sort -rn | head -5
```

| Формат | Top chunk | Размер |
|--------|-----------|--------|
| gzip | | <X> KB |
| brotli | | <X> KB |

---

## 6. Dev cold start

### 6.1. Cold start времени

```bash
$ rm -rf .nuxt node_modules/.cache
$ time pnpm dev
```

Замеряем до появления строки `Local: http://localhost:3000`:

- **Cold start:** <N> sec *(холодный — без кэша)*

Повторить второй раз (уже с кэшем):

- **Warm start:** <N> sec

### 6.2. Hot reload (HMR)

Изменить `app/pages/dashboard/index.vue` (добавить комментарий) и зафиксировать время до обновления в браузере:

- **HMR latency:** <N> ms

---

## 7. Lighthouse (опционально, на локальном production)

```bash
$ pnpm preview  # запустить production-сборку
$ npx lighthouse http://localhost:3000/dashboard \
    --preset=desktop \
    --output=json --output=html \
    --output-path=./docs/reviews/epic-24-baseline-lighthouse
```

| Метрика (dashboard page, unauthenticated redirect → login) | Score |
|------------------------------------------------------------|-------|
| Performance | <N> |
| Accessibility | <N> |
| Best Practices | <N> |
| SEO | <N> |
| FCP | <N> ms |
| LCP | <N> ms |
| TBT | <N> ms |
| CLS | <N> |

Отчёт сохранить в `docs/reviews/epic-24-baseline-lighthouse.html`.

---

## 8. Доступные для миграции макеты

Цифры для контроля сверки «макет → реализация».

| React-макет | Есть в пакете | Контент полный |
|-------------|---------------|----------------|
| `app.jsx` | ✅ | ✅ |
| `sidebar.jsx` | ✅ | ✅ |
| `topbar.jsx` | ✅ | ✅ |
| `dashboard.jsx` | ✅ | ✅ |
| `qr-list.jsx` | ✅ | ❌ **имя есть, контент отсутствует** |
| `create-drawer.jsx` | ✅ | ❌ **имя есть, контент отсутствует** |
| `detail-drawer.jsx` | ✅ | ✅ |
| `folders.jsx` | ✅ | ✅ |
| `analytics.jsx` | ✅ | ✅ |
| `integrations.jsx` | ✅ | ✅ |
| `settings.jsx` | ✅ | ✅ |
| `notifications.jsx` | ✅ | ✅ |
| `tweaks.jsx` | ✅ | ✅ |
| `ui.jsx` | ✅ | ✅ |
| `icons.jsx` | ✅ | ✅ |
| `data.jsx` | ✅ | ✅ |

**Зафиксировано:** 2 макета без контента (`qr-list.jsx`, `create-drawer.jsx`) — структура для них восстанавливается в задачах 24.12, 24.13 по существующей `/qr/index.vue` и `/qr/create.vue`. Риск R-06 в плане EPIC 24.

---

## 9. Структура проекта (сжатый снимок)

Зафиксировать высокоуровневую структуру для контроля изменений в задаче 24.4 (структурная реорганизация уже сделана в EPIC 23, тут только снимок до миграции PrimeVue).

```
$ tree -L 2 -I 'node_modules|.nuxt|.output|docs|e2e' app/ server/ shared/ i18n/
```

Вставить вывод:

```
app/
├── app.vue
├── assets/
├── components/
│   ├── analytics/
│   ├── app/
│   ├── departments/
│   ├── folders/
│   ├── qr/
│   └── shared/
├── composables/
├── error.vue
├── layouts/
├── middleware/
├── pages/
├── plugins/
├── stores/
└── utils/

server/
├── api/
├── db/
├── middleware/
├── openapi/
├── plugins/
├── routes/
├── services/
└── utils/

shared/
└── types/

i18n/
└── locales/
```

---

## 10. Скриншоты ключевых страниц (pre-migration)

Сохранить в `docs/reviews/epic-24-baseline-screenshots/` для сравнения «до / после» в задаче 24.37 (smoke).

| Страница | Скриншот |
|----------|----------|
| `/auth/login` | `login.png` |
| `/dashboard` | `dashboard.png` |
| `/qr` (table view) | `qr-list-table.png` |
| `/qr` (grid view) | `qr-list-grid.png` |
| `/qr/create` | `qr-create.png` |
| `/qr/[id]` | `qr-detail.png` |
| `/qr/bulk` | `qr-bulk.png` |
| `/folders` | `folders.png` |
| `/analytics` | `analytics.png` |
| `/integrations` | `integrations.png` |
| `/settings` (все табы по одной) | `settings-*.png` |
| `/shared` | `shared.png` |
| `/not-found`, `/expired` | `scan-*.png` |
| Dark mode — дубли ключевых | `*-dark.png` |

Делаются в разрешении 1440×900 (desktop) и 375×812 (mobile) через Playwright `page.screenshot()` или DevTools.

---

## 11. Sign-off

| Роль | Имя | Дата | Подпись |
|------|-----|------|---------|
| Разработчик | | | |
| Tech Lead | | | |

Baseline считается зафиксированным, когда:
- [ ] Все секции 1–10 заполнены
- [ ] Все `.log` файлы лежат в `docs/reviews/`
- [ ] Скриншоты сняты и закоммичены
- [ ] Lighthouse-отчёт приложен
- [ ] PR1 задачи 24.1 merged в `feat/epic-24-primevue-migration`

---

*Шаблон. Подлежит заполнению при старте задачи 24.1.*
