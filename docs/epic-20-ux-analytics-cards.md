# EPIC 20 — UX/UI Enhancement Pack: Analytics, Cards & Onboarding

**Статус:** 📋 Planned
**Целевая версия:** v0.14.0 (параллельно или после EPIC 16–18)
**Оценка:** 8–11 дней
**Зависимости:** Эпики 6 (аналитика), 4 (CRUD QR), 14 (i18n). Часть задач зависит от EPIC 18 (дизайн-токены).

---

## 1. Цель

Закрыть UX/UI-разрывы между SPLAT QR и лучшими практиками конкурентов (ME-QR и аналоги), которые **не покрыты запланированными EPIC 16–18**. Три направления:

1. **Расширенная визуализация аналитики** — карта сканирований, устройства, ОС, время суток, сравнение периодов. Данные уже собираются в `scan_events`, нужен только frontend.
2. **Информативные карточки QR** — больше полезной информации и быстрых действий без перехода в детали.
3. **Onboarding и визуальная обратная связь** — иллюстрации для empty states, подсказки для новичков, виджет использования.

### Что уже покрыто EPIC 16–18 (не дублируем)

| Уже в плане | EPIC |
|---|---|
| Global Search (Cmd+K) | 16.1–16.2 |
| Settings redesign (табы) | 16.3–16.4 |
| Toast с Undo | 16.5 |
| Skeleton loading | 16.6 |
| Sidebar active state fix | 16.7 |
| aria-labels, семантические таблицы, focus-trap | 17.* |
| CSS-токены, transitions, micro-animations | 18.1–18.3 |
| Responsive typography | 18.4 |
| docs-ui каталог компонентов | 18.5 |
| prefers-reduced-motion | 18.6 |
| Contrast check | 18.7 |

---

## 2. Задачи

---

### Задача 20.1 — Карта сканирований (Geo Map)

**Приоритет:** 🔴 Critical
**Зависимости:** Эпик 6 (analytics service)
**Оценка:** 2 дня

**Проблема:** SPLAT QR собирает `country`, `city`, `region`, `latitude`, `longitude` в каждом `scan_event`, но нигде не визуализирует географию. ME-QR показывает мировую карту с точками, таблицу Country/City и круговую диаграмму.

Для российской FMCG-компании приоритетнее **карта регионов РФ**, а не мировая карта.

**Новые файлы:**

```
server/api/analytics/geo.get.ts
app/components/analytics/GeoMap.vue
app/components/analytics/GeoTable.vue
```

**Изменяемые файлы:**

```
server/services/analytics.service.ts    — новый метод getGeoBreakdown()
app/pages/analytics/index.vue           — добавить секцию «География»
app/composables/useAnalytics.ts         — fetchGeo()
locales/ru.json, locales/en.json        — секция analytics.geo.*
```

**Backend — `analytics.service.ts`:**

```typescript
// getGeoBreakdown(filters: { userId?, qrCodeId?, dateRange })
//
// SQL:
// SELECT
//   country,
//   city,
//   COUNT(*) as total_scans,
//   COUNT(*) FILTER (WHERE is_unique) as unique_scans,
//   AVG(latitude) as lat,
//   AVG(longitude) as lng
// FROM scan_events
// WHERE scanned_at BETWEEN $from AND $to
//   AND ($qrCodeId IS NULL OR qr_code_id = $qrCodeId)
// GROUP BY country, city
// ORDER BY total_scans DESC
// LIMIT 100
//
// Returns: { countries: CountryAgg[], cities: CityAgg[], total: number }
```

**API-эндпоинт:**

```
GET /api/analytics/geo?dateFrom=...&dateTo=...&qrCodeId=...
→ { data: { countries: [...], cities: [...], totalCountries, totalCities } }
```

**Frontend — `GeoMap.vue`:**

- SVG-карта России (GeoJSON → inline SVG, ~50 регионов) с подсветкой по интенсивности сканирований
- Tooltip при hover: «Москва: 1,240 сканирований (68%)»
- Fallback для нероссийских сканирований: мировая мини-карта снизу или текстовый список
- Переключатель: «Россия / Мир» (по умолчанию Россия)
- Библиотека: SVG карта без внешних зависимостей (inline GeoJSON) или `vue-echarts` с map-серией

**Frontend — `GeoTable.vue`:**

```vue
<!-- Props: :items="geoData.cities" :loading="loading" -->
<!-- Колонки: Страна | Город | Сканирования ↕ | Уникальные ↕ -->
<!-- Сортировка по клику на заголовок -->
<!-- Skeleton при loading -->
```

**Размещение на странице аналитики:**

```
[Существующие виджеты: StatCards + ScanChart + TopQrTable]
                         ↓
[NEW: GeoMap (2/3 ширины) + GeoTable (1/3 ширины)]
```

**Критерии приёмки:**
- [ ] Карта РФ отображается с подсветкой регионов
- [ ] Tooltip при hover показывает город и количество сканирований
- [ ] Таблица Country/City с сортировкой работает
- [ ] Переключатель «Россия / Мир» корректно меняет визуализацию
- [ ] При отсутствии гео-данных — EmptyState с текстом «Нет данных о географии»
- [ ] DateRangePicker влияет на гео-данные
- [ ] Skeleton при загрузке

---

### Задача 20.2 — Устройства, ОС, браузеры (Device Analytics)

**Приоритет:** 🔴 Critical
**Зависимости:** Эпик 6
**Оценка:** 1.5 дня

**Проблема:** `scan_events` содержит `device_type`, `os`, `browser` (через ua-parser-js), но нет визуализации. ME-QR показывает donut-диаграммы Device и Operating System.

**Новые файлы:**

```
server/api/analytics/devices.get.ts
app/components/analytics/DevicePieChart.vue
app/components/analytics/DeviceBreakdown.vue
```

**Изменяемые файлы:**

```
server/services/analytics.service.ts    — getDeviceBreakdown()
app/pages/analytics/index.vue           — секция «Устройства»
app/composables/useAnalytics.ts         — fetchDevices()
locales/ru.json, locales/en.json
```

**Backend — `analytics.service.ts`:**

```typescript
// getDeviceBreakdown(filters)
//
// Три параллельных запроса:
// 1. SELECT device_type, COUNT(*) FROM scan_events WHERE ... GROUP BY device_type
// 2. SELECT os, COUNT(*) FROM scan_events WHERE ... GROUP BY os ORDER BY count DESC LIMIT 10
// 3. SELECT browser, COUNT(*) FROM scan_events WHERE ... GROUP BY browser ORDER BY count DESC LIMIT 10
//
// Returns: { devices: NameCount[], os: NameCount[], browsers: NameCount[] }
```

**Frontend — `DevicePieChart.vue`:**

```vue
<!-- Универсальный donut-компонент -->
<!-- Props: :data="[{name, value, color}]" :title="string" :loading="boolean" -->
<!-- vue-echarts donut (уже в deps) -->
<!-- Легенда справа: name + value + % -->
<!-- Цвета: mobile=#4CAF50, desktop=#2196F3, tablet=#FF9800 -->
```

**Frontend — `DeviceBreakdown.vue`:**

```vue
<!-- Три donut-чарта в ряд -->
<!-- Props: :devices :os :browsers :loading -->
<!-- Grid: lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 -->
<!-- Каждый = DevicePieChart с заголовком -->
```

**Размещение:**

```
[GeoMap + GeoTable]
        ↓
[NEW: DeviceBreakdown — три donut в ряд]
```

**Критерии приёмки:**
- [ ] Три donut-чарта отображают Device, OS, Browser
- [ ] Легенда с процентами рядом с каждым чартом
- [ ] При пустых данных — «Нет данных» вместо пустого donut
- [ ] Адаптивность: 3 → 2 → 1 колонка на разных breakpoints
- [ ] DateRangePicker влияет на данные

---

### Задача 20.3 — Распределение по часам и дням недели (Time Heatmap)

**Приоритет:** 🟡 Medium
**Зависимости:** Эпик 6
**Оценка:** 1 день

**Проблема:** ME-QR показывает «Scans By Daytime» — гистограмму по часам суток с переключателем Hour/Minute. Для FMCG это ценно: видно, в какое время покупатели сканируют QR с упаковки (утро vs вечер, будни vs выходные).

**Новые файлы:**

```
server/api/analytics/time-distribution.get.ts
app/components/analytics/HourlyChart.vue
app/components/analytics/WeekdayChart.vue
```

**Изменяемые файлы:**

```
server/services/analytics.service.ts    — getTimeDistribution()
app/pages/analytics/index.vue
app/composables/useAnalytics.ts
locales/ru.json, locales/en.json
```

**Backend:**

```typescript
// getTimeDistribution(filters)
//
// 1. Часы:
//    SELECT EXTRACT(HOUR FROM scanned_at) as hour, COUNT(*) as scans
//    FROM scan_events WHERE ...
//    GROUP BY hour ORDER BY hour
//
// 2. Дни недели:
//    SELECT EXTRACT(DOW FROM scanned_at) as dow, COUNT(*) as scans
//    FROM scan_events WHERE ...
//    GROUP BY dow ORDER BY dow
//
// Returns: { hourly: {hour, scans}[], weekly: {dow, scans}[] }
```

**Frontend — `HourlyChart.vue`:**

- Bar chart (vue-echarts), ось X: 0–23 часа, ось Y: кол-во сканирований
- Подсветка пикового часа (самый высокий bar — акцентный цвет)
- Tooltip: «10:00 — 245 сканирований»

**Frontend — `WeekdayChart.vue`:**

- Horizontal bar chart: Пн–Вс
- Localized day names из `i18n`
- Подсветка максимума

**Размещение:**

```
[DeviceBreakdown]
        ↓
[NEW: HourlyChart (1/2) + WeekdayChart (1/2)]
```

**Критерии приёмки:**
- [ ] Bar chart по часам 0–23 отображается корректно
- [ ] Horizontal bar по дням Пн–Вс (локализованные названия)
- [ ] Пиковые значения визуально выделены
- [ ] Skeleton при загрузке

---

### Задача 20.4 — Сравнение с предыдущим периодом на графике

**Приоритет:** 🟡 Medium
**Зависимости:** Эпик 6
**Оценка:** 0.5 дня

**Проблема:** SPLAT QR уже считает `% change` в `StatCard`, но нет визуального наложения предыдущего периода на `ScanChart`. ME-QR имеет toggle «Compare with Previous Period».

**Изменяемые файлы:**

```
server/services/analytics.service.ts
app/components/analytics/ScanChart.vue
app/pages/analytics/index.vue
app/composables/useAnalytics.ts
```

**Backend:**

```typescript
// getScansTimeSeries теперь принимает опцию comparePrevious: boolean
// Если true — запрашивает тот же период, сдвинутый назад:
//   previous = { from: from - diff, to: to - diff }
// Returns: { current: Point[], previous?: Point[] }
```

**Frontend — `ScanChart.vue`:**

- Toggle-переключатель «Сравнить с предыдущим периодом» (UToggle)
- При включении — третья и четвёртая линия (dashed, с opacity 0.5):
  - `previousTotalScans` (dashed primary)
  - `previousUniqueScans` (dashed lighter)
- Tooltip показывает оба значения: «15 апреля: 120 (vs 85 в предыдущем)»
- Легенда обновляется: добавляются пункты «Все (пред. период)» и «Уникальные (пред. период)»

**Критерии приёмки:**
- [ ] Toggle «Сравнить» отображается рядом с DateRangePicker
- [ ] При включении — dashed-линии предыдущего периода появляются на графике
- [ ] Tooltip корректно показывает current vs previous
- [ ] При выключении — линии исчезают без перезагрузки данных

---

### Задача 20.5 — Обогащённые карточки QR в списке

**Приоритет:** 🔴 Critical
**Зависимости:** Эпик 4
**Оценка:** 1.5 дня

**Проблема:** Сейчас карточка QR в grid-режиме показывает превью, title, status badge, scans, tags и actions dropdown. Для получения URL или скачивания нужно переходить в детали. ME-QR показывает URL, тип, дату, размер, кнопки Download и Options прямо на карточке.

**Изменяемые файлы:**

```
app/components/qr/Card.vue
app/components/qr/Table.vue
app/components/qr/PreviewMini.vue
```

**Новые файлы:**

```
app/components/qr/QuickActions.vue
app/components/qr/HoverPreview.vue
```

**Card.vue — обогащение grid-карточки:**

```
Текущая карточка:
┌──────────────────┐
│  [QR Preview]     │
│  Title            │
│  Status   Scans   │
│  [tag] [tag]      │
│  [⋯ Actions]      │
└──────────────────┘

Обогащённая карточка:
┌──────────────────────────┐
│  [QR Preview]  Title     │
│                Status    │
│  ─────────────────────── │
│  🔗 https://dest.c…/path │  ← truncated URL с copy-on-click
│  📅 15.04.26 · 📊 142    │  ← дата + сканы
│  [tag] [tag]              │
│  ─────────────────────── │
│  [⬇ Download] [📋 Copy] [⋯]│  ← inline quick actions
└──────────────────────────┘
```

**QuickActions.vue:**

```vue
<!-- Inline-кнопки для карточки и строки таблицы -->
<!-- Props: :qrId :shortCode :title -->
<!-- Действия: -->
<!--   Download → открывает ExportDialog -->
<!--   Copy URL → clipboard + toast «Ссылка скопирована» -->
<!--   ⋯ More → dropdown (Edit, Duplicate, Pause, Delete) -->
```

**Table.vue — обогащение строк таблицы:**

- Добавить колонку «URL» (truncated, с иконкой copy рядом)
- Вынести Download и Copy URL из dropdown в inline icon-buttons (как в ME-QR)
- В dropdown оставить: Edit, Duplicate, Pause/Resume, Delete

**HoverPreview.vue:**

```vue
<!-- Появляется при наведении на PreviewMini в таблице -->
<!-- UPopover с увеличенным QR (200×200) + metadata -->
<!-- Content: QR Preview + Title + URL + Status + Scans -->
<!-- Delay: 300ms на появление, 100ms на скрытие -->
```

**Критерии приёмки:**
- [ ] Grid-карточка показывает URL (truncated), дату, сканирования
- [ ] Кнопки Download и Copy URL видны на карточке без раскрытия dropdown
- [ ] Copy URL → clipboard + toast
- [ ] Hover на миниатюру QR в таблице → увеличенный preview в popover
- [ ] Inline icon-buttons в таблице для Download и Copy URL
- [ ] Мобильная адаптивность: на <768px кнопки stack вертикально

---

### Задача 20.6 — SVG-иллюстрации для пустых состояний

**Приоритет:** 🟡 Medium
**Зависимости:** нет
**Оценка:** 1 день

**Проблема:** `EmptyState.vue` использует Lucide-иконку + текст. ME-QR использует кастомные иллюстрации (шестерёнки-QR на странице API, чат-пузыри на Support). Иллюстрации значительно улучшают восприятие — интерфейс ощущается «живым» и «готовым», а не «пустым» и «сломанным».

**Новые файлы:**

```
app/components/shared/EmptyIllustration.vue
public/illustrations/empty-qr.svg
public/illustrations/empty-analytics.svg
public/illustrations/empty-folders.svg
public/illustrations/empty-search.svg
public/illustrations/error-404.svg
public/illustrations/error-expired.svg
public/illustrations/welcome.svg
```

**Изменяемые файлы:**

```
app/components/shared/EmptyState.vue    — добавить slot/prop для illustration
app/pages/qr/index.vue                 — empty-qr.svg
app/pages/analytics/index.vue           — empty-analytics.svg
app/pages/folders/index.vue             — empty-folders.svg
app/pages/not-found.vue                 — error-404.svg
app/pages/expired.vue                   — error-expired.svg
```

**EmptyState.vue — обновление:**

```vue
<!-- Добавить prop :illustration="string" (путь к SVG) -->
<!-- Если illustration передан — показать SVG вместо иконки -->
<!-- Размер: max-w-48 mx-auto mb-6 -->
<!-- Сохранить fallback на :icon для backward compatibility -->
```

**Стиль иллюстраций:**

- Монохромные с одним акцентным цветом (primary/splat)
- Использовать CSS-переменные для цвета: `fill: var(--color-primary)` — работает в обеих темах
- Тематика: QR-коды, графики, папки — узнаваемые формы, не generic clipart
- Размер: viewBox 200×200, оптимизированные через SVGO

**Карта иллюстраций:**

| Контекст | Файл | Описание |
|---|---|---|
| Пустой список QR | `empty-qr.svg` | QR-код с пунктирным контуром + стрелка «создать» |
| Пустая аналитика | `empty-analytics.svg` | График с нулевыми данными + лупа |
| Пустые папки | `empty-folders.svg` | Папка с QR-кодом внутри |
| Пустой поиск | `empty-search.svg` | Лупа с вопросительным знаком |
| 404 QR не найден | `error-404.svg` | Сломанный QR-код |
| QR истёк | `error-expired.svg` | QR-код с песочными часами |
| Первый вход | `welcome.svg` | Приветственная иллюстрация с QR |

**Критерии приёмки:**
- [ ] 7 SVG-иллюстраций создано и оптимизировано
- [ ] EmptyState.vue поддерживает prop `:illustration`
- [ ] Иллюстрации корректно отображаются в light и dark theme
- [ ] Размер каждого SVG < 5 KB (SVGO)
- [ ] Страницы `not-found.vue` и `expired.vue` используют иллюстрации вместо plain text

---

### Задача 20.7 — Onboarding при первом входе

**Приоритет:** 🟢 Low
**Зависимости:** Эпик 14 (i18n)
**Оценка:** 1 день

**Проблема:** Новый пользователь попадает на пустой дашборд без объяснений. ME-QR не решает эту проблему, но для корпоративного инструмента onboarding важнее — сотрудники не выбирали этот инструмент сами.

**Новые файлы:**

```
app/components/shared/OnboardingOverlay.vue
app/composables/useOnboarding.ts
```

**Изменяемые файлы:**

```
app/pages/dashboard/index.vue    — показать overlay при первом входе
locales/ru.json, locales/en.json — секция onboarding.*
```

**`useOnboarding.ts`:**

```typescript
// Composable для управления onboarding-состоянием
export function useOnboarding() {
  const completed = useLocalStorage<boolean>('onboarding:completed', false)
  const step = ref(0)

  const steps = [
    {
      target: '[data-onboarding="create-qr"]',
      title: 'onboarding.step1.title',       // «Создайте первый QR»
      description: 'onboarding.step1.desc',   // «Нажмите сюда...»
      position: 'bottom',
    },
    {
      target: '[data-onboarding="my-qr"]',
      title: 'onboarding.step2.title',       // «Ваши QR-коды»
      description: 'onboarding.step2.desc',
      position: 'right',
    },
    {
      target: '[data-onboarding="analytics"]',
      title: 'onboarding.step3.title',       // «Аналитика сканирований»
      description: 'onboarding.step3.desc',
      position: 'right',
    },
  ]

  function next() { step.value++ }
  function skip() { completed.value = true }
  function finish() { completed.value = true }

  return { completed, step, steps, next, skip, finish }
}
```

**`OnboardingOverlay.vue`:**

- Overlay с затемнением экрана и spotlight на целевом элементе
- Tooltip рядом с элементом: заголовок + описание + кнопки «Далее» / «Пропустить»
- Индикатор шагов: `1 / 3`
- Анимация перехода между шагами
- `data-onboarding` атрибуты добавляются на целевые элементы в Sidebar и Header

**Критерии приёмки:**
- [ ] При первом входе нового пользователя — overlay с 3 шагами
- [ ] Spotlight выделяет целевой элемент
- [ ] «Пропустить» закрывает overlay и помечает `completed`
- [ ] При повторном входе overlay не показывается
- [ ] Локализован на ru/en

---

### Задача 20.8 — Виджет использования системы (Usage Stats)

**Приоритет:** 🟢 Low
**Зависимости:** Эпики 4, 6
**Оценка:** 0.5 дня

**Проблема:** ME-QR показывает Storage Information (прогресс-бар), Monthly Limit (0% → 10,000). Для корпоративного инструмента полезно видеть общие показатели использования — это даёт ощущение «живого» инструмента и обоснование для руководства.

**Новые файлы:**

```
server/api/analytics/usage.get.ts
app/components/analytics/UsageWidget.vue
```

**Изменяемые файлы:**

```
app/pages/dashboard/index.vue
```

**Backend:**

```typescript
// GET /api/analytics/usage
// Returns:
// {
//   totalQr: number,           // Всего QR в системе
//   activeQr: number,          // Со статусом 'active'
//   totalScansAllTime: number,  // Сумма totalScans из qr_codes
//   totalUsers: number,         // Кол-во пользователей
//   totalFolders: number,       // Кол-во папок
//   storageUsed: string,        // Размер uploads/ в human-readable
//   lastScanAt: string | null,  // Время последнего скана
// }
```

**Frontend — `UsageWidget.vue`:**

```vue
<!-- Компактная карточка на dashboard -->
<!-- Размещение: под StatCards, перед ScanChart -->
<!-- Grid из 4-6 мини-метрик: -->
<!--   📊 Всего QR: 142 (⚡ 128 активных) -->
<!--   📈 Сканирований: 12,450 -->
<!--   👥 Пользователей: 24 -->
<!--   📂 Папок: 8 -->
<!--   🕐 Последний скан: 2 минуты назад -->
<!-- Стиль: compact bar с bg-surface-2, inline -->
```

**Критерии приёмки:**
- [ ] UsageWidget отображается на dashboard
- [ ] Показывает актуальные цифры из БД
- [ ] «Последний скан: N минут назад» обновляется relative-time
- [ ] Skeleton при загрузке
- [ ] Не отвлекает от основных StatCards (compact стиль)

---

## 3. Порядок реализации

```
Фаза 1 — Аналитика (4 дня)
  20.1 Geo Map                     — 2 дня
  20.2 Device/OS/Browser Charts    — 1.5 дня
  20.3 Hourly + Weekday Charts     — 0.5 дня (параллельно с 20.2)

Фаза 2 — Cards & Comparison (2 дня)
  20.4 Compare Previous Period     — 0.5 дня
  20.5 Enriched QR Cards           — 1.5 дня

Фаза 3 — Visual Polish (2–3 дня)
  20.6 SVG Illustrations           — 1 день
  20.7 Onboarding Overlay          — 1 день
  20.8 Usage Widget                — 0.5 дня

Суммарно: 8–11 дней
```

---

## 4. Новые API-эндпоинты (сводка)

| Метод | URL | Auth | Описание |
|---|---|---|---|
| GET | `/api/analytics/geo` | User | Breakdown по country/city с координатами |
| GET | `/api/analytics/devices` | User | Breakdown по device_type, OS, browser |
| GET | `/api/analytics/time-distribution` | User | Breakdown по часам суток и дням недели |
| GET | `/api/analytics/usage` | User | Общие показатели использования системы |

Все эндпоинты поддерживают query-параметры `dateFrom`, `dateTo`, `qrCodeId` (опционально). Access control: editor видит только свои данные, admin — все.

---

## 5. Изменённые/созданные файлы (сводка)

### Новые файлы (~20)

```
server/api/analytics/geo.get.ts
server/api/analytics/devices.get.ts
server/api/analytics/time-distribution.get.ts
server/api/analytics/usage.get.ts
app/components/analytics/GeoMap.vue
app/components/analytics/GeoTable.vue
app/components/analytics/DevicePieChart.vue
app/components/analytics/DeviceBreakdown.vue
app/components/analytics/HourlyChart.vue
app/components/analytics/WeekdayChart.vue
app/components/analytics/UsageWidget.vue
app/components/qr/QuickActions.vue
app/components/qr/HoverPreview.vue
app/components/shared/OnboardingOverlay.vue
app/composables/useOnboarding.ts
public/illustrations/empty-qr.svg
public/illustrations/empty-analytics.svg
public/illustrations/empty-folders.svg
public/illustrations/empty-search.svg
public/illustrations/error-404.svg
public/illustrations/error-expired.svg
public/illustrations/welcome.svg
```

### Изменённые файлы (~12)

```
server/services/analytics.service.ts
app/composables/useAnalytics.ts
app/pages/analytics/index.vue
app/pages/dashboard/index.vue
app/components/analytics/ScanChart.vue
app/components/qr/Card.vue
app/components/qr/Table.vue
app/components/shared/EmptyState.vue
app/pages/qr/index.vue
app/pages/not-found.vue
app/pages/expired.vue
app/pages/folders/index.vue
locales/ru.json
locales/en.json
```

---

## 6. Зависимости и библиотеки

| Библиотека | Использование | Статус |
|---|---|---|
| `vue-echarts` | Donut charts, bar charts, geo map | ✅ Уже в deps |
| `echarts` | Под капотом vue-echarts | ✅ Уже в deps |
| `echarts/map` | Для GeoMap (если SVG-карта через echarts) | ⚠️ Нужно подключить данные карты РФ |

**Альтернатива для GeoMap:** Inline SVG карта России без зависимостей — SVG-файл с `<path>` для каждого региона, data-binding через CSS-переменные. Это легче и быстрее, чем echarts/map.

---

## 7. Метрики успеха

- **Аналитика:** 4 новых виджета (Geo, Devices, Hours, Weekdays) отображают реальные данные.
- **Карточки:** время от «увидел QR в списке» до «скопировал ссылку» сократилось на 2 клика.
- **Визуальное впечатление:** SVG-иллюстрации на всех empty states; error-страницы с иллюстрациями.
- **Onboarding:** новый пользователь за 3 шага понимает основные точки входа.
- **Типизация:** `npm run typecheck` — 0 ошибок.
- **Линтинг:** `npm run lint` — 0 ошибок.