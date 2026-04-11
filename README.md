# SPLAT QR Service

Внутрикорпоративный сервис управления QR-кодами для маркетинговых активностей.

## Стек

- **Framework:** Nuxt 3 (SSR)
- **Database:** PostgreSQL 16
- **ORM:** Drizzle ORM
- **UI:** Nuxt UI v3 (Reka UI + Tailwind v4)
- **Language:** TypeScript (strict mode)

## Быстрый старт

```bash
# Установка зависимостей
pnpm install

# Копирование переменных окружения
cp .env.example .env

# Запуск PostgreSQL (docker)
docker compose up db -d

# Миграции
pnpm db:migrate

# Seed данные
pnpm db:seed

# Запуск dev-сервера
pnpm dev
```

## Docker

```bash
docker compose up
```

Приложение будет доступно на http://localhost:3000

## Скрипты

| Команда | Описание |
|---------|----------|
| `pnpm dev` | Dev-сервер |
| `pnpm build` | Production build |
| `pnpm lint` | Проверка ESLint |
| `pnpm lint:fix` | Автоисправление ESLint |
| `pnpm db:generate` | Генерация миграций |
| `pnpm db:migrate` | Применение миграций |
| `pnpm db:seed` | Заполнение тестовыми данными |
| `pnpm db:studio` | Drizzle Studio (GUI) |
| `pnpm typecheck` | Проверка типов |
