# SPLAT QR Service

Внутрикорпоративный сервис управления QR-кодами для маркетинговых активностей.

**Версия:** 0.2.0 — см. [CHANGELOG](./CHANGELOG.md).

## Стек

| Компонент | Технология | Версия |
|-----------|-----------|--------|
| Framework | Nuxt 3 (SSR) | ^3.16.0 |
| Database | PostgreSQL | 16 |
| ORM | Drizzle ORM | ^0.38.0 |
| UI Kit | Nuxt UI v3 (Reka UI + Tailwind v4) | ^3.0.0 |
| Language | TypeScript (strict mode) | ^5.7.0 |
| State | Pinia | ^2.3.0 |
| i18n | @nuxtjs/i18n | ^9.0.0 |

## Быстрый старт

```bash
# Установка зависимостей
corepack pnpm install

# Копирование переменных окружения
cp .env.example .env

# Запуск PostgreSQL (docker)
docker compose up postgres -d

# Генерация миграций (при первом запуске или после изменений схемы)
corepack pnpm db:generate

# Применение миграций
corepack pnpm db:migrate
 
# Seed-данные (опционально)
corepack pnpm db:seed

# Запуск dev-сервера
corepack pnpm dev
```

Приложение будет доступно на `http://localhost:3001` с текущим `.env`
или на порту из `APP_PORT`, если вы его измените.

## Тема и цвета (SPLAT)

- **`app.config.ts`**: для Nuxt UI задано `ui.colors.primary → 'splat'` и палитра
  `neutral`; в `brand` лежат основные hex-цвета бренда.
- **`assets/css/main.css`**: в директиве Tailwind v4 `@theme` описана шкала
  `--color-splat-*` (красно-розовая) и **алиасы `--color-primary` /
  `--color-primary-50`…`950` на те же значения**. Без алиасов утилиты Tailwind
  (`text-primary`, `bg-primary`, `ring-primary/50` и т.д.) остаются на
  зелёном primary по умолчанию, даже при `primary: 'splat'` в конфиге UI.
- **`app/app.vue`**: корень обёрнут в `<UApp>`, чтобы тема Nuxt UI применялась
  ко всему приложению.

Светлая и тёмная схема: переменные `--surface-*`, `--text-*`, `--accent` в
`:root` и `html.dark` в том же `main.css`.

## Docker (production)
 
```bash
# Запуск всего стека (postgres + migrate + app)
docker compose up
 
# Только база данных (для локальной разработки)
docker compose up postgres -d
```

Порядок запуска сервисов:
1. **postgres** — база данных (ждёт health-check)
2. **migrate** — применяет все pending-миграции (one-shot, завершается)
3. **app** — запускается после успешной миграции
 
Приложение будет доступно на порту из `APP_PORT` (по умолчанию `3000`,
в текущем локальном `.env` используется `3001`).
 
### Переменные окружения (docker-compose)
 
| Переменная | По умолчанию | Описание |
|------------|-------------|---------|
| `POSTGRES_USER` | `splat_qr` | Пользователь БД |
| `POSTGRES_PASSWORD` | `secret` | Пароль БД |
| `POSTGRES_DB` | `splat_qr` | Имя БД |
| `POSTGRES_PORT` | `5434` | Внешний порт PostgreSQL |
| `APP_PORT` | `3000` | Внешний порт приложения |
| `SMTP_HOST` | — | SMTP-сервер |
| `SMTP_PORT` | `587` | Порт SMTP |
| `SMTP_USER` | — | Логин SMTP |
| `SMTP_PASSWORD` | — | Пароль SMTP |
| `SMTP_FROM` | `noreply@splatglobal.com` | Адрес отправителя |
 
## Управление доменами (авторизация)
 
По умолчанию вход разрешён с **любого** email-домена (открытый режим).
 
Когда администратор добавляет хотя бы один активный домен в разделе
**Настройки → Допустимые домены**, включается **режим белого списка** —
принимаются только email-адреса из указанных доменов.

## Скрипты

| Команда | Описание |
|---------|----------|
| `corepack pnpm dev` | Dev-сервер |
| `corepack pnpm build` | Production build |
| `corepack pnpm preview` | Превью production-сборки |
| `corepack pnpm lint` | Проверка ESLint |
| `corepack pnpm lint:fix` | Автоисправление ESLint |
| `corepack pnpm db:generate` | Генерация SQL-миграций из схемы |
| `corepack pnpm db:migrate` | Применение миграций |
| `corepack pnpm db:seed` | Заполнение тестовыми данными |
| `corepack pnpm db:studio` | Drizzle Studio (GUI для БД) |
| `corepack pnpm typecheck` | Проверка типов TypeScript |

## Актуальные хотфиксы

- Авторизация переведена в единый экран `app/pages/auth/login.vue`: email и OTP живут на одной странице, а `app/pages/auth/verify.vue` сохранён как совместимый redirect.
- Корневой shell обёрнут в `UApp`, поэтому Nuxt UI использует красную `splat`-палитру как primary theme.
- В `@theme` в `assets/css/main.css` шкала Tailwind **`primary` привязана к `splat`**, чтобы `text-primary`, `bg-primary`, `ring-primary/*` и `color="primary"` у компонентов Nuxt UI не оставались зелёными (дефолт Tailwind).
- Добавлены `app/error.vue` и `app/pages/analytics/index.vue`, поэтому навигация по `/analytics` и неизвестным URL больше не уходит в неоформленный дефолтный экран.
- SSR-auth bootstrap в `app/composables/useAuth.ts` теперь пробрасывает cookie в `/api/auth/me`, из-за чего защищённые маршруты корректно открываются после входа.
 
## Документация
 
- [CHANGELOG](./CHANGELOG.md) — история изменений
- [Выполненные задачи (Эпики 1–4)](./docs/splat-qr-docs-done.md)
- [Инвентарь файлов](./docs/completed-epics.md)
- [План разработки (Эпики 5–14)](./docs/splat-qr-cursor-plan.md)
- [Code Review (Эпики 1–4)](./docs/reviews/epics-1-4-review.md)
- [Hotfix Review (Auth, Nav, Error)](./docs/reviews/auth-nav-hotfix-review.md)
