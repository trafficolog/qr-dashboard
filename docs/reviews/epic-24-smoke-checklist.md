# EPIC 24 — Smoke E2E Checklist (ручной прогон)

**Дата прогона:** 2026-XX-XX *(заполняется исполнителем при выполнении задачи 24.37)*
**Версия проекта:** `0.16.0-rc` (перед финальным релизом 24.39)
**Ветка:** `feat/epic-24-primevue-migration`
**Исполнитель:** *(имя QA / разработчика)*
**Окружение:** Staging URL / Local dev
**Браузеры:** Chrome (latest), Safari (latest), Firefox (latest) — каждый пункт прогоняется во всех трёх

---

## Как пользоваться

1. Выполнять пункты **последовательно**, сверху вниз. Если какой-то падает — зафиксировать в «Найденные регрессии» и продолжать (не останавливаться).
2. Для каждого пункта отметить: ✅ pass / ⚠️ minor issue / ❌ fail + ссылка на issue/commit фикса.
3. Для визуальных проверок — сравнивать со скриншотами из `docs/reviews/epic-24-baseline-screenshots/` и с React-макетами в `/mnt/user-data/uploads/*.jsx`.
4. Все ❌ должны быть закрыты до merge PR6. Все ⚠️ — зафиксированы как follow-up в `epic-24-final-review.md` раздел 6.2 либо закрыты.

---

## 0. Pre-flight: Sakai baseline verification (amendment A1)

Критические проверки, что конфигуратор темы отключён и baseline соответствует amendment A1.

### 0.1. Файловая структура

- [ ] `find . -name 'AppConfigurator.vue'` → **0 совпадений**
- [ ] `grep -rn "AppConfigurator" app/` → 0 совпадений
- [ ] `grep -rn "pi-palette" app/` → 0 совпадений
- [ ] `grep -rn "configSidebarVisible" app/` → 0 совпадений
- [ ] `find app/assets/layout -name '*.scss' | wc -l` → **≥ 7** (перенесённые из Sakai SCSS файлы)
- [ ] `app/composables/useLayout.ts` существует и экспортирует `useLayout`
- [ ] `app/layouts/default.vue` использует Sakai-структуру (topbar + menu + main + footer)

### 0.2. Runtime конфигурация

Открыть консоль браузера на `/dashboard` и выполнить:

```js
// В DevTools Console:
const { layoutConfig } = window.__SPLAT_DEBUG__?.useLayout?.() || {}
console.log(layoutConfig)
```

- [ ] `layoutConfig.preset` === `'Aura'`
- [ ] `layoutConfig.primary` === `'red'`
- [ ] `layoutConfig.surface` === `'zinc'`
- [ ] `layoutConfig.menuMode` === `'static'`
- [ ] Попытка присвоить `layoutConfig.menuMode = 'overlay'` → TypeScript ошибка (локально в IDE) или runtime-предупреждение при `readonly` proxy

### 0.3. CSS / PrimeVue runtime

- [ ] `document.documentElement.classList.contains('app-dark')` при включённой тёмной теме — `true`; при светлой — `false`
- [ ] В `<head>` есть стиль с селектором `.app-dark .p-...` (grep по rendered CSS)
- [ ] `getComputedStyle(document.documentElement).getPropertyValue('--p-primary-500')` возвращает красный оттенок (`#ef4444` или близкий)
- [ ] Иконка-шестерёнка (`palette` / `settings` configurator trigger) в Topbar **отсутствует**

---

## 1. Общие shell-элементы

### 1.1. Layout (Sakai static menu)

- [ ] На desktop (≥ 992px) sidebar **всегда виден**, не сворачивается автоматически
- [ ] На mobile (≤ 991px) sidebar по умолчанию **скрыт**, появляется по hamburger-кнопке
- [ ] Mobile: тап по overlay (вне sidebar'а) — закрывает menu
- [ ] Mobile: тап по menu-item — закрывает menu после навигации
- [ ] Hamburger-кнопка в Topbar виден только на mobile

### 1.2. Topbar

- [ ] Logo slot слева ведёт на `/dashboard` при клике
- [ ] **Title block**: корректный `pageTitle` + `pageSubtitle` для каждого маршрута (см. раздел 1.5)
- [ ] Theme toggle (sun/moon icon) — единственная кнопка переключения темы
- [ ] Рядом с theme toggle **нет** кнопки-шестерёнки (configurator trigger)
- [ ] Bell button показывает badge с unread count, если `> 0`
- [ ] Divider vertical между действиями и create-button виден
- [ ] Создать QR primary button — всегда виден
- [ ] Массовое создание button — виден только на `/qr`
- [ ] Contextual search (280px InputText с лупой) — виден только на `/qr`, на desktop
- [ ] User menu avatar + chevron-down открывает dropdown: Profile + Logout

### 1.3. Sidebar menu (Sakai AppMenu)

Структура 3 секций с использованием Lucide иконок:

**Секция «Workspace»:**
- [ ] Дашборд (`/dashboard`)
- [ ] QR-коды (`/qr`) + badge с количеством
- [ ] Папки (`/folders`) + badge
- [ ] Общие QR (`/shared`) — EPIC 19
- [ ] Аналитика (`/analytics`)

**Секция «Integrations»:**
- [ ] Интеграции (`/integrations`)
- [ ] API-документация (`/api-docs`) — EPIC 22

**Секция «Admin»:**
- [ ] Настройки (`/settings`)
- [ ] Уведомления (`/notifications`) + badge unread

### 1.4. Active-route подсветка

- [ ] Клик по menu-item применяет класс `active-route` к li
- [ ] Прямой переход по URL (с закладки) — active подсветка сохраняется
- [ ] Nested routes (`/settings/team`) подсвечивают родительский пункт
- [ ] Active цвет соответствует `--p-primary-500` (красный SPLAT)

### 1.5. Title + Subtitle per route

Проверить, что правильные строки показываются в Topbar:

| URL | Title | Subtitle |
|-----|-------|----------|
| `/dashboard` | Обзор | Сводка активности и последние изменения |
| `/qr` | QR-коды | N кодов · X сканов всего |
| `/qr/create` | Создать QR-код | (пусто или описание типа) |
| `/qr/[id]` | Детали QR | короткая ссылка |
| `/qr/[id]/edit` | Редактирование | имя QR |
| `/qr/bulk` | Массовое создание | CSV импорт |
| `/folders` | Папки | Группировка кодов по проектам и кампаниям |
| `/folders/[id]` | имя папки | N QR · X сканов |
| `/analytics` | Аналитика | Сканы, источники, география |
| `/integrations` | Интеграции | Подключения к CRM, BI и сервисам |
| `/settings` | Настройки | Воркспейс, команда, безопасность |
| `/shared` | Общие QR-коды | Публичные QR компании |
| `/notifications` | Уведомления | N непрочитанных событий |
| `/api-docs` | API | Scalar документация |

Каждая пара «title/sub» — 1 тест. Отметить ✅ для каждой или единую ❌ если есть ошибки.

- [ ] Все 14 пар title/sub соответствуют ожидаемым

---

## 2. Auth flow (EPIC 2)

### 2.1. `/auth/login` — email stage

- [ ] Рендерится `auth` layout (центрированный контейнер, без sidebar)
- [ ] Brand logo 48x48 виден
- [ ] H1 «Вход в SPLAT QR» (или локализованная версия)
- [ ] `InputText` email имеет иконку mail слева (IconField)
- [ ] Валидация domain'а работает (allowed list, EPIC 2): ввод неверного домена → Message под полем
- [ ] Кнопка «Получить код» primary (красная)
- [ ] Кнопка loading state во время отправки
- [ ] После успешной отправки — переход к OTP stage
- [ ] Toast `success` «Код отправлен на ваш email» в нижнем правом углу

### 2.2. `/auth/login` — OTP stage

- [ ] `InputOtp` (PrimeVue) — 6 digits
- [ ] Клавиатурная навигация между digits работает (arrow keys, backspace)
- [ ] Paste 6-digit code распределяется по полям
- [ ] Кнопка «Подтвердить» primary
- [ ] «Отправить снова (Xs)» — counter обратного отсчёта работает, disabled пока не истёк
- [ ] Ошибка OTP (6 неверных попыток, EPIC 2) — Toast error + блок формы
- [ ] Rate limit (EPIC 21) → Toast error «Слишком много запросов»
- [ ] Успешный OTP → redirect на `/dashboard` + Toast «Добро пожаловать»

### 2.3. Session / Logout

- [ ] После login cookie `session_token` установлена (DevTools → Application → Cookies)
- [ ] Атрибуты cookie: `HttpOnly`, `SameSite=Strict`, `Path=/`, `Secure` (на production)
- [ ] Перезагрузка страницы не разлогинивает
- [ ] Закрытие вкладки + повторный вход в приложение — session сохраняется
- [ ] User menu → Logout — cookie удаляется, redirect на `/auth/login`

---

## 3. Dashboard (`/dashboard`, 24.11)

### 3.1. KPI Row

- [ ] 4 KPI карточки рендерятся в 1 ряд на desktop, 2x2 на tablet, 1x4 на mobile
- [ ] Каждая KPI карточка: 30x30 icon tile (цветной) + muted label + 28px value + delta + Sparkline
- [ ] «Всего QR-кодов»: значение из `qrStore.count`, delta «+N за неделю», sparkline accent (красный)
- [ ] «Активные»: значение, «X% всего» delta, sparkline ok (зелёный)
- [ ] «Сканов сегодня»: mono шрифт, sparkline info (синий)
- [ ] «Сканов за неделю»: mono шрифт, sparkline purple
- [ ] Sparkline на каждой карточке 80x22 с gradient fill
- [ ] Icon tile красивый: соответствующая SPLAT-палитра (`--p-{color}-soft` background + `--p-{color}-500` иконка)

### 3.2. Scan Chart Card

- [ ] Label «Сканы» (uppercase, dim color)
- [ ] Value (26px, mono, bold): реальное число из `useAnalytics()`
- [ ] Badge «+18.7% м/м» с tone ok
- [ ] Segmented control 24ч/7д/30д/90д в правом верхнем углу
- [ ] Выбранный период имеет elevation (`box-shadow`)
- [ ] Клик по периоду перезапрашивает данные + анимация перехода
- [ ] Area chart (vue-echarts) рендерит реальные 30-дневные данные
- [ ] Gradient fill под линией виден (linear gradient accent → transparent)
- [ ] X-axis labels (18 мар / 25 мар / 1 апр / 8 апр / 15 апр) внизу графика, mono font

### 3.3. Status Breakdown Card

- [ ] Header «По статусу» + H2 «Состояние кодов»
- [ ] Progress-rows для каждого статуса: active / paused / scheduled / expired / draft
- [ ] Dot (цвет) + название + count (mono)
- [ ] Thin progress bar (4px) под каждой строкой с шириной, пропорциональной доле

### 3.4. Top-5 QR Card

- [ ] Header с кнопкой «Все» → ведёт на `/qr`
- [ ] 5 рядов: index 01..05 + 32x32 QR mini-preview + название + thin progress bar + scan-count
- [ ] Отсортированы по scans desc
- [ ] Клик по ряду открывает DetailDrawer (не новую страницу)
- [ ] Mono шрифт для индексов и чисел

### 3.5. Activity Feed Card

- [ ] Header «Активность» + H2 «Недавние события» + кнопка «Журнал» → `/notifications`
- [ ] 6 последних событий, каждое: Avatar автора + текст действия + target + time + icon tile tone
- [ ] Корректные временные метки («5 мин назад», «вчера, 18:40»)
- [ ] Avatar имеет правильный hue (из `AUTHORS` data)

---

## 4. QR List (`/qr`, 24.12)

### 4.1. FilterBar

- [ ] Sticky под Topbar
- [ ] `Select` folder работает, меняет список
- [ ] `MultiSelect` статусы (5 значений) работает
- [ ] `MultiSelect` авторы работает
- [ ] `MultiSelect` теги работает
- [ ] `MultiSelect` visibility (EPIC 19) — private/department/public
- [ ] `SelectButton` scope tabs: Все / Мои / Отдел / Публичные (EPIC 19)
- [ ] URL query params обновляются при смене фильтров (`?scope=my&status=active`)
- [ ] Reload страницы с query params — фильтры применяются корректно
- [ ] `SelectButton` view (table/grid) переключает представление
- [ ] View persist'ится в localStorage

### 4.2. Table view (`DataTable`)

- [ ] Checkbox column (select all)
- [ ] QR preview column: 32x32 stylized
- [ ] Name + URL: 2 строки (name bold + URL mono muted)
- [ ] Folder column: chip с цветной точкой и именем папки
- [ ] Tags column: несколько chip'ов
- [ ] Status column: StatusBadge с tone + dot
- [ ] Visibility column: VisibilityBadge (EPIC 19, private/department/public)
- [ ] Scans column: mono font, right-aligned
- [ ] Author column: Avatar + name
- [ ] Created column: локализованная дата
- [ ] Actions column: icon button с dropdown Menu (Edit / Duplicate / Delete / Change visibility)
- [ ] Sortable columns работают (name, scans, created, status)
- [ ] Pagination: 20/50/100 per page selector
- [ ] Server-side pagination + sort работает через `useQr()`
- [ ] Клик по ряду (не по checkbox/action) — открывает DetailDrawer

### 4.3. Grid view

- [ ] Адаптивная сетка 3/4 колонки в зависимости от ширины
- [ ] Каждая карточка: QR preview + name + URL + folder chip + status badge + visibility + tags + author + scans
- [ ] Hover: elevation + hover-preview (крупный QR + action buttons)
- [ ] Клик по карточке — открывает DetailDrawer

### 4.4. Bulk actions

- [ ] Выделение 2+ rows показывает BulkActionsBar внизу / сверху
- [ ] «N выделено» счётчик
- [ ] Delete bulk → ConfirmDialog → после подтверждения: удаление + Toast с undo
- [ ] Change folder bulk → Dialog с Select → Apply
- [ ] Change visibility bulk → Dialog с VisibilitySelect → Apply (EPIC 19)
- [ ] Export bulk → скачивает CSV

---

## 5. QR Create Drawer + `/qr/create` (24.13)

### 5.1. CreateDrawer (слайдер справа 560px)

- [ ] Открытие по клику «Создать QR» в Topbar
- [ ] Header «Создать QR-код» + close button
- [ ] `SelectButton` type: URL / vCard / WiFi / Text / SMS / Email / Geo
- [ ] Destination field меняется по типу (URL / vCard form / WiFi form / etc.)
- [ ] Name — InputText
- [ ] Folder — Select с папками
- [ ] Tags — MultiSelect с auto-create тегов
- [ ] Visibility — SelectButton private/department/public (EPIC 19)
- [ ] Department Select появляется при visibility = department (EPIC 19)
- [ ] StyleEditor секция: цвета, форма модулей, error correction, логотип
- [ ] UTM Accordion свёрнут по умолчанию
- [ ] UTM поля: source / medium / campaign / content / term
- [ ] Live preview QR обновляется при изменении полей
- [ ] Zod-валидация показывает ошибки под полями
- [ ] «Отмена» закрывает drawer
- [ ] «Создать» отправляет на сервер, после успеха:
  - [ ] Drawer закрывается
  - [ ] Toast `success` «QR создан»
  - [ ] Список `/qr` обновляется (новый QR виден)

### 5.2. Full-page `/qr/create`

- [ ] Та же структура, в full-page layout
- [ ] Все поля работают идентично drawer-версии
- [ ] Unsaved changes guard (EPIC 15) работает: попытка уйти с изменениями → UnsavedChangesDialog
- [ ] Draft autosave (EPIC 15) — DraftRestoredBanner появляется при возврате

---

## 6. QR Detail Drawer + `/qr/[id]` (24.14)

### 6.1. DetailDrawer

- [ ] Открытие по клику на row / card в `/qr`
- [ ] Ширина 560px, анимация slide-in
- [ ] Header: 72x72 QR preview + StatusBadge + folder chip + H2 name + mono short URL + close
- [ ] Header background = `var(--{folderColor}-soft)` (цветной фон отдела)
- [ ] Actions bar sticky: Скачать (primary) / Копировать / Редактировать / Share / Pause / More menu
- [ ] Stats grid (3 cols): Всего / Уникальных / Последний скан
- [ ] Mini bar chart за 12 дней (`qr.trend`)
- [ ] Meta rows: Автор, Создан, Изменён, Тип, Короткая ссылка (mono + copy), Теги, EC level, Visibility (EPIC 19), Department (если применимо), A/B destinations (EPIC 9, если активно)

### 6.2. Interactions

- [ ] «Скачать» → dropdown с форматами SVG/PNG/PDF → скачивает файл
- [ ] «Копировать ссылку» → clipboard + Toast «Скопировано»
- [ ] «Редактировать» → navigate to `/qr/[id]/edit`
- [ ] «Share» → Popover с короткой ссылкой + «Скопировать»
- [ ] «Pause» → Confirm → смена статуса + Toast
- [ ] Esc — закрывает drawer
- [ ] Клик по backdrop — закрывает drawer

### 6.3. Full-page `/qr/[id]`

- [ ] Та же структура
- [ ] Дополнительно: полная аналитика по QR (графики за период, top locations, devices) — EPIC 6 адаптированный

---

## 7. QR Edit `/qr/[id]/edit` (24.15)

- [ ] Все поля предзаполнены данными QR
- [ ] Unsaved guard (EPIC 15)
- [ ] «Сохранить» — PATCH + Toast + redirect на `/qr/[id]`
- [ ] «Отмена» — возврат без сохранения

---

## 8. Bulk CSV `/qr/bulk` (24.16, PrimeVue Stepper)

### 8.1. Step 1 — Upload

- [ ] Stepper показывает 5 шагов: Upload / Preview / Validation / Confirm / Result
- [ ] Drop-zone с визуальным feedback при drag
- [ ] Accept только `.csv`
- [ ] «Скачать шаблон» скачивает template CSV с headers и примером
- [ ] Upload файла переходит на Step 2

### 8.2. Step 2 — Preview

- [ ] Первые 5 строк CSV в DataTable
- [ ] Column mapping если нужен
- [ ] «Назад» возвращает на Step 1
- [ ] «Далее» → Step 3

### 8.3. Step 3 — Validation

- [ ] DataTable со всеми строками
- [ ] Ошибочные строки подсвечены красным
- [ ] Tooltip с описанием ошибки на ячейке
- [ ] Counter «X valid / Y errors»

### 8.4. Step 4 — Confirm

- [ ] Карточки: «Будет создано: X», «Пропущено: Y», «Всего: Z»
- [ ] «Создать» → Step 5

### 8.5. Step 5 — Result

- [ ] ProgressBar во время импорта
- [ ] После завершения: Message success с counter created
- [ ] Таблица ошибок (первые 20)
- [ ] Кнопка «Перейти к QR» → `/qr`

---

## 9. Folders (`/folders`, 24.17)

- [ ] Grid `auto-fill, minmax(300px, 1fr)`
- [ ] Каждая FolderCard:
  - [ ] 110px top section с `--{color}-soft` background и абстрактным кругом
  - [ ] 40x40 icon tile сверху слева
  - [ ] 3 stacked QR-preview (32x32) сверху справа
  - [ ] Body: название + count/сканы + AvatarGroup + timestamp
- [ ] Hover: elevation + translateY(-2px)
- [ ] Клик по карточке → `/folders/[id]`
- [ ] Последняя карточка «+» (dashed border) — создать папку → открывает FolderDialog
- [ ] FolderDialog CRUD работает (name, color picker, icon, parent folder)
- [ ] На `/folders/[id]` — QR list с preset folder filter

---

## 10. Analytics (`/analytics`, 24.18)

### 10.1. Period + filters row

- [ ] Period Select: 30д / 7д / 90д / Всё время
- [ ] QR filter Select: Все / по папке / по конкретному QR
- [ ] «Обновить» button → refetch
- [ ] «Экспорт CSV» → скачивает файл

### 10.2. Big Scan Card

- [ ] Header: label «Сканы по дням» + 28px value + Badge «+22.4%» + legend
- [ ] BarChart (vue-echarts) рендерит scans + unique наложенными
- [ ] Tooltip на hover
- [ ] Legend interactive

### 10.3. 3-col grid

- [ ] **Geo card**: топ городов с progress bars, правильные цвета
- [ ] **Devices card**: donut 120px + legend (iOS/Android/Desktop/Другое)
- [ ] **Sources card**: stacked bar + legend (Упаковка/Промо/POS/Мероприятия/Онлайн)

### 10.4. Дополнения EPIC 20

- [ ] **GeoMap** (регионы РФ) — полноширинная карта с точками
- [ ] **Hourly chart** (24h bar)
- [ ] **Weekday chart** (7d horizontal bar)
- [ ] **Compare previous period** toggle — overlay на BigScanChart (dashed lines)

---

## 11. Integrations (`/integrations`, 24.19)

- [ ] **API-key card**: Lock icon tile + label + masked key + Copy + Rotate
- [ ] Copy → Toast «Скопировано»
- [ ] Rotate → Confirm → новый ключ показан один раз (можно скопировать) + старый инвалидирован
- [ ] **Подключённые** group: Google Analytics, 1С, Slack — с badge «Подключено»
- [ ] **Доступные** group: 6 сервисов с кнопкой «Подключить»
- [ ] Клик «Подключить» → Dialog с инструкцией (часть — placeholder «Coming soon»)

---

## 12. Settings (`/settings`, 24.20)

### 12.1. Settings layout

- [ ] Grid 200px sidebar + content
- [ ] Sidebar sticky top: 90px
- [ ] 9 табов (см. список ниже)
- [ ] Active таб: elevation + text color accent
- [ ] `/settings` redirect на `/settings/workspace`

### 12.2. Workspace tab

- [ ] Section «Общие»: Name / Короткий домен / Timezone / Default папка
- [ ] Section «Пресеты дизайна»: 4 карточки с QR preview, первая active
- [ ] Save button — PATCH + Toast

### 12.3. Team tab (EPIC 11)

- [ ] Search input + Invite button в header
- [ ] Invite Dialog: email + role Select (admin/editor/viewer) → submit
- [ ] Members table: Avatar + name/email + Role Badge + Last active + Actions menu
- [ ] Change role → Confirm → PATCH
- [ ] Remove → Confirm → DELETE + Toast undo

### 12.4. Departments tab (EPIC 19)

- [ ] Grid карточек departments
- [ ] Create department → Dialog с name/slug/description/color/head
- [ ] Edit department → Dialog prefilled
- [ ] Manage members → Dialog с search + member list
- [ ] Add/remove members работает
- [ ] Delete department → Confirm (предупреждение о связанных QR) → DELETE

### 12.5. Domains tab (EPIC 2 + EPIC 21)

- [ ] **Allowed Domains** subsection: DataTable с inline edit + isActive toggle + delete
- [ ] **Destination Domains** subsection (EPIC 21 SEC-07): аналогично

### 12.6. API Keys tab (EPIC 12 + EPIC 21)

- [ ] DataTable ключей: prefix (first 8 chars) + scopes + IP allowlist + expiry + last used
- [ ] Create key → Dialog с scopes MultiSelect + IP CIDR + expiry DatePicker → показать ключ один раз
- [ ] Revoke → Confirm → DELETE

### 12.7. Branding tab

- [ ] Field «Логотип в центре»: upload + preview + Replace / Remove
- [ ] Field «Основной цвет»: 5 swatch buttons (первый selected — red SPLAT) + ColorPicker custom
- [ ] Field «Форма модулей»: 4 SelectButton options (Квадраты/Скруглённые/Точки/Плавные)

### 12.8. Security tab

- [ ] Active sessions list (EPIC 21 SEC-14): device + IP + location + last active + Revoke
- [ ] Revoke session — Confirm → DELETE → session инвалидируется (если это current — logout)
- [ ] Audit log last 30 events (EPIC 21)
- [ ] 2FA toggle (placeholder «Coming soon»)

### 12.9. Notifications tab

- [ ] Settings для email/in-app notifications per event type
- [ ] Toggle'ы (ToggleSwitch) сохраняются через API

### 12.10. Billing tab

- [ ] Placeholder с текущим планом (для internal tool — «Internal: безлимит»)

---

## 13. Notifications (`/notifications`, 24.21)

- [ ] **Tabs**: Все (N) / Непрочитанные (X) / Упоминания / Интеграции / Безопасность
- [ ] Фильтрация по табам работает
- [ ] Each row: unread dot (если !read) + Avatar/icon tile + title + body + time + more menu
- [ ] Row hover: `--bg-sunken` background
- [ ] Unread row: `color-mix` подсветка accent 4%
- [ ] Click by row → открывает связанное действие (navigate / Dialog)
- [ ] «Отметить всё прочитанным» button — PATCH bulk
- [ ] Bell badge в Topbar обновляется
- [ ] Empty state (нет событий в категории) рендерится

---

## 14. Shared QR (`/shared`, 24.22, EPIC 19)

- [ ] Отображает только QR с `visibility = 'public'`
- [ ] Фильтр по автору работает
- [ ] Фильтр по отделу-атрибуции работает
- [ ] Empty state если нет public QR

---

## 15. Scan experience (24.24)

### 15.1. `/not-found` (invalid QR code URL)

- [ ] Scan layout (full-screen, centered, без sidebar/topbar)
- [ ] SPLAT logo
- [ ] H1 «QR-код не найден»
- [ ] Description
- [ ] Button «На главную» (для auth'd) или «Узнать о SPLAT» (для unauth)

### 15.2. `/expired`

- [ ] Та же структура, H1 «Срок QR-кода истёк»

### 15.3. `app/error.vue`

- [ ] Рендерится для unknown 404 маршрутов внутри auth'd части
- [ ] Рендерится для 500 runtime errors
- [ ] Branded: SPLAT logo + понятный текст + button «На главную»

---

## 16. API Docs (`/api-docs`, 24.31, EPIC 22)

- [ ] Scalar UI рендерится
- [ ] Тема применяется: accent red, surface zinc
- [ ] Dark mode: Scalar переключается вместе с приложением
- [ ] Все endpoints видны, группировка по tags
- [ ] «Authorize» работает: paste API key → endpoints выполняются
- [ ] `GET /api/openapi.json` возвращает валидный JSON

---

## 17. MCP Server (EPIC 22)

- [ ] `GET /mcp` (SSE-compat) отвечает 200
- [ ] `POST /mcp/capabilities` возвращает список tools + resources
- [ ] С корректным API key (scope `mcp:access`) вызов tool работает
- [ ] Без API key → 401
- [ ] API key без scope → 403
- [ ] `/mcp` endpoint не ломается визуально (это backend-only)

---

## 18. Global services

### 18.1. Toast (`useNotify`)

- [ ] Position: bottom-right
- [ ] Severity success (зелёный) — исчезает через 3s
- [ ] Severity error (красный) — исчезает через 5s
- [ ] Severity warn (жёлтый) — через 4s
- [ ] Severity info (синий) — через 3s
- [ ] Multiple toasts стакаются
- [ ] Close button работает
- [ ] Undo toast (для bulk delete): button «Отменить» в toast — восстанавливает

### 18.2. ConfirmDialog

- [ ] Destructive actions (delete QR / folder / member / key / session) защищены Confirm
- [ ] Accept button — severity danger (красный)
- [ ] Reject button — secondary
- [ ] Header + message локализованы
- [ ] Esc — закрывает без подтверждения
- [ ] Backdrop click — закрывает (dismissableMask)

### 18.3. DynamicDialog (useDialog)

- [ ] Открытие через `useDialog().open()` работает
- [ ] Данные передаются через `data` prop, возвращаются через `onClose callback`

---

## 19. Theme switcher (24.32)

### 19.1. Toggle light ↔ dark

- [ ] Клик по sun/moon в Topbar мгновенно переключает тему
- [ ] `.app-dark` class toggle'ится на `<html>`
- [ ] Все компоненты PrimeVue переключают токены корректно
- [ ] Custom SPLAT компоненты (из `app/components/ui/*`) переключают корректно
- [ ] Нет FOUC

### 19.2. Persistence

- [ ] Cookie `splat-theme` устанавливается с правильным значением
- [ ] Перезагрузка страницы сохраняет тему
- [ ] Открытие в новой вкладке применяет сохранённую тему (через SSR из cookie)

### 19.3. SSR correctness

- [ ] Первая загрузка отдаёт правильную тему без моргания
- [ ] View Transitions API работает (в Chrome) — плавный переход
- [ ] В браузерах без View Transitions (Safari/Firefox) — fallback без анимации, но корректно

### 19.4. Нет runtime-смены preset/primary/surface

- [ ] В Topbar отсутствует configurator button
- [ ] В Settings нет секции theme customization (только Branding с QR colors, не PrimeVue theme)
- [ ] В DevTools попытка вызвать `setPreset` / `updatePrimaryPalette` из `@primeuix/themes` — композаблом не экспонируется публично

---

## 20. Accessibility (24.36)

### 20.1. Keyboard navigation

- [ ] Tab order логичен (слева-направо, сверху-вниз)
- [ ] Все interactive elements доступны через Tab
- [ ] Focus visible (outline 2px `--p-primary-500`)
- [ ] Esc закрывает Drawers, Dialogs, Popovers
- [ ] Enter / Space активирует buttons

### 20.2. ARIA

- [ ] Drawer: `role="dialog"` + `aria-modal="true"` + focus trap
- [ ] Dialog: то же
- [ ] Toast: `role="status"` или `role="alert"` по severity
- [ ] DataTable: правильная семантика (thead/tbody/tr/th/td) + aria-labels

### 20.3. Screen reader (sanity, VoiceOver)

- [ ] Dashboard: заголовки и метрики читаются
- [ ] Form labels связаны с inputs (for/id или aria-labelledby)
- [ ] Buttons имеют текст или aria-label (иконочные кнопки)

### 20.4. axe-core (автоматический)

- [ ] Запущен axe-playwright на всех page objects
- [ ] 0 critical issues
- [ ] 0 serious issues
- [ ] Ссылка на отчёт: `docs/reviews/epic-24-axe-report/`

### 20.5. Color contrast

- [ ] Text / background pairs проверены на WCAG AA:
  - [ ] `--text` на `--bg` (≥ 4.5:1 normal, 3:1 large)
  - [ ] `--text-muted` на `--bg-elev`
  - [ ] accent-ink на accent (для primary button)
  - [ ] В обеих темах light / dark

---

## 21. Performance & Bundle

- [ ] `pnpm build` проходит без ошибок за ≤ baseline + 30%
- [ ] `du -sh .output/public` ≤ baseline + 30%
- [ ] `pnpm dev` cold start ≤ baseline + 20%
- [ ] Lighthouse Performance ≥ 85 (dev preview на `/dashboard`)
- [ ] Lighthouse A11y ≥ 95
- [ ] Top-5 JS chunks не содержат целиком `primevue` (tree-shaking работает)

---

## 22. Browser matrix

| Пункт | Chrome | Safari | Firefox | Mobile Safari | Chrome Android |
|-------|--------|--------|---------|---------------|----------------|
| Login flow | | | | | |
| Dashboard render | | | | | |
| DetailDrawer open | | | | | |
| Theme toggle | | | | | |
| View Transitions API | ✅ / — | ❌ fallback | ❌ fallback | ❌ fallback | ✅ / — |
| Backdrop blur на Topbar | | | | | |
| Scroll styling | | | | | |

(Отметить ✅ для каждой ячейки или ❌ с примечанием)

---

## 23. Найденные регрессии

Таблица заполняется по ходу прогона.

| # | Пункт чеклиста | Симптом | Severity | Fix commit / issue |
|---|----------------|---------|----------|--------------------|
| 1 | | | critical / major / minor | |
| 2 | | | | |
| … | | | | |

---

## 24. Sign-off

| Роль | Имя | Дата | Результат |
|------|-----|------|-----------|
| QA исполнитель | | | ✅ all pass / ⚠️ N issues / ❌ blocker |
| Tech Lead | | | approved / request changes |
| Дизайнер (визуальное соответствие макетам) | | | approved / request changes |

**Merge PR6 допускается только при:**
- Все critical и major — закрыты
- Minor — зафиксированы в follow-up (раздел 6.2 финального review)
- Sign-off от трёх ролей получен

---

*Шаблон заполняется исполнителем задачи 24.37 после прохождения задач 24.33–24.36.*