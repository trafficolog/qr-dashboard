# EPIC 24 — ревью незавершённых задач (обновлено после фактических прогонов)

**Дата ревью:** 2026-04-24  
**Цель:** не просто перечислить хвосты, а дожать оставшиеся задачи до максимально возможного статуса в текущем окружении.

## Что сделано в рамках закрытия хвостов сегодня

1. Восстановлена рабочая среда для проверок качества:
   - `pnpm install` (подтянулись актуальные PrimeVue-зависимости по lockfile).
   - Установлены браузеры Playwright: `pnpm exec playwright install chromium`.
   - Установлены системные runtime-зависимости браузера: `pnpm exec playwright install --with-deps chromium`.
2. Перепроверены quality gates:
   - `pnpm lint` — **pass**.
   - `pnpm typecheck` — **pass** (есть non-blocking warning от Volar plugin path).
   - `pnpm test:unit` — **pass** (13/13 файлов, 33/33 тестов).
   - `pnpm build` — **pass** (есть warnings по css minify/chunk size).
3. Перезапущен E2E after environment fix:
   - Полный `pnpm test:e2e` теперь стартует, но не green.
   - Диагностический прогон `pnpm playwright test e2e/auth.spec.ts --project=chromium --workers=1` показал частичный прогресс: 2 pass / 2 fail.

## Актуальный статус хвостов EPIC 24

| Задача | Статус на 2026-04-24 | Комментарий |
|---|---|---|
| 24.21 Notifications | ⚠️ Partial | UI реализован, backend уведомлений по-прежнему pending. |
| 24.35 Unit + E2E фиксы | ⚠️ In progress | Unit green, E2E не green: после снятия env-блокера остались функциональные/стабилизационные падения тестов. |
| 24.36 A11y sweep | ⚠️ In progress | A11y-спеки запускаются, но входят в общий не-green контур E2E. |
| 24.37 Smoke ручной | ⬜ Not done | Требуется отдельный ручной прогон чеклиста и фиксация статусов по пунктам. |
| 24.38 Bundle size audit | ⚠️ Partial | Build прошёл, собраны фактические метрики, но финальный comparison baseline→post ещё не внесён в финальный review. |
| 24.39 Финальный релиз и документация | ⬜ Not done | До полного green QA и final sign-off релиз закрывать рано. |

## Снятые блокеры

- Блокер «браузер не запускается (missing libs)» закрыт.
- До фикса был `libatk-1.0.so.0`; после установки базовых пакетов оставался `libXcomposite.so.1`; после `--with-deps` браузер запускается и тесты реально исполняются.

## Текущие релизные риски (актуально)

1. **E2E нестабильность / функциональные расхождения** — главный blocker для 24.35/24.36/24.37.
2. **Security gate**: `pnpm audit --prod` сейчас не green (в т.ч. 1 high по `nodemailer`).
3. **Bundle warnings**: есть предупреждения `css-syntax-error` и `Some chunks are larger than 500 kB` — не блокеры сборки, но требуют решения/документирования в 24.38.

## Измерения для 24.38 (черновик)

- `.output/public`: **7.3M**
- `.output/server`: **252M**
- Файлов в `.output/public`: **309**
- Топ-5 JS чанков в `.output/public/_nuxt`:
  - `CtvWFwGA.js` — **2959.0 KB**
  - `DFQVdJ0D.js` — **521.0 KB**
  - `BKu5CrOe.js` — **483.1 KB**
  - `CrNTJkU3.js` — **204.3 KB**
  - `CjDZBFkj.js` — **140.5 KB**

## Что нужно сделать, чтобы реально закрыть EPIC 24

1. Дожать E2E до green (стабилизация auth/navigation/selectors/ожиданий).
2. После green E2E прогнать и зафиксировать A11y/Smoke checklist с фактами.
3. Закрыть/зафиксировать security audit (обновления или accept-risk с owner+deadline).
4. Заполнить в `epic-24-final-review.md` финальные статусы 24.37–24.39 и численные метрики 24.38.
5. Только после этого делать release closure (24.39): версия `0.16.0`, CHANGELOG, matrix/completed-epics.
