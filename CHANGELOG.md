# Changelog
 
Все значимые изменения в проекте документируются в этом файле.
Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/).
 
---
 
## [Unreleased]
 
### Fixed
- **Стили**: подключён `assets/css/main.css` в `nuxt.config.ts` — исправлено
  отсутствие Tailwind CSS и Nuxt UI на страницах авторизации
- **app.config.ts**: создан конфиг темы Nuxt UI (`primary: green`, `neutral: slate`)
- **Dockerfile**: исправлено использование `npm ci` вместо `pnpm install` (проект
  использует `package-lock.json`); выровнен порт приложения (3000); добавлен
  stage `migrator` для запуска миграций в Docker
 
### Added
- **Логика допустимых доменов**: если список пуст — разрешены все домены
  (открытый режим); как только администратор добавляет хотя бы один активный
  домен — включается режим белого списка
- **API управления доменами** (`/api/admin/domains`): CRUD-эндпоинты
  только для администраторов (GET, POST, PATCH, DELETE)
- **Страница настроек** (`/settings`): обзор разделов настроек с учётом роли
- **Страница управления доменами** (`/settings/domains`): UI для
  добавления/отключения/удаления email-доменов в белый список
- **Docker migrate-сервис**: `docker compose up` автоматически выполняет
  миграции перед запуском приложения (`service_completed_successfully`)
- **`server/db/migrate.ts`**: standalone-скрипт миграций через `drizzle-orm/migrator`
  (не требует drizzle-kit в production)
 
### Changed
- **`docker-compose.yml`**: убран `profiles: ["app"]` — приложение запускается
  по умолчанию; добавлен сервис `migrate`; выровнены порты; `app` зависит от
  `migrate`
- **README.md**: обновлены инструкции по запуску, добавлен раздел про домены
  и переменные окружения Docker
 
---
 
## [0.1.0] — 2026-04-11
 
### Added
- Эпик 1: Инфраструктура — Nuxt 3, PostgreSQL 16, Docker, 11 таблиц БД, seed-данные
- Эпик 2: Аутентификация — Email OTP, rate limiting, SHA-256 хеширование токенов, сессии 30 дней
- Эпик 3: Layout — sidebar (collapse 240/64px), header с breadcrumbs, мобильная навигация
- Эпик 4: CRUD QR-кодов — 11 API-эндпоинтов, SVG-рендеринг (5 стилей модулей × 4 стиля углов)