# EPIC 18 — CI/Local verification checklist (2026-04-19)

## Run context

- Date: **2026-04-19 (UTC)**
- Environment: local container (`/workspace/qr-dashboard`)
- Base URL expected by Playwright: `http://localhost:3001`

## Checklist summary

- [x] `npm run typecheck` executed
- [x] `npm run lint` executed
- [x] `npm run test:e2e` executed
- [x] Separate `a11y.spec.ts` report generated for `color-contrast` in light/dark
- [x] Release blockers for EPIC 18 captured

## Results

| Check | Status | Notes | Log |
|---|---|---|---|
| `npm run typecheck` | ✅ PASS | Completed without type errors. | [artifacts/typecheck.log](../../artifacts/typecheck.log) |
| `npm run lint` | ⚠️ WARN | No lint errors; 6 warnings (`vue/no-v-html`). | [artifacts/lint.log](../../artifacts/lint.log) |
| `npm run test:e2e` | ❌ FAIL | 34 failed / 66 skipped. Main failure: `net::ERR_CONNECTION_REFUSED` on `http://localhost:3001` (app server not running). Auth-required tests were skipped due missing `PLAYWRIGHT_AUTH_COOKIE`. | [artifacts/test-e2e.log](../../artifacts/test-e2e.log) |

## a11y / color-contrast report (light/dark)

Command:

```bash
npx playwright test e2e/a11y.spec.ts --reporter=json > artifacts/a11y-report.json
```

Result summary:

- **Project coverage:** `chromium`, `mobile-chrome`
- **Light theme:** 10 tests, **10 skipped**, 0 passed, 0 failed
- **Dark theme:** 10 tests, **10 skipped**, 0 passed, 0 failed
- **`color-contrast` status:** **NOT EXECUTED** in this run (test suite skipped before axe analysis due missing `PLAYWRIGHT_AUTH_COOKIE`).

Detailed report: [artifacts/a11y-report.json](../../artifacts/a11y-report.json)

## EPIC 18 release blockers (фиксируем блокеры релиза)

1. **BLOCKER-EPIC18-001 — E2E environment not bootstrapped**
   - Symptom: Playwright cannot open app pages; `ERR_CONNECTION_REFUSED` on `http://localhost:3001`.
   - Impact: Core smoke flows and EPIC 18 acceptance E2E checks cannot pass.
   - Required action: start app server before E2E (`npm run dev -- --port 3001` or CI service container).

2. **BLOCKER-EPIC18-002 — Missing authenticated E2E context**
   - Symptom: Auth-gated specs (including `e2e/a11y.spec.ts`) skip because `PLAYWRIGHT_AUTH_COOKIE` is not set.
   - Impact: Cannot validate `color-contrast` for protected pages in light/dark themes.
   - Required action: provide valid CI secret/session cookie or implement deterministic test login/setup state.

## Follow-up subtasks

- [ ] **SUBTASK-EPIC18-ENV-01:** Add CI step to boot Nuxt app on `3001` before Playwright.
- [ ] **SUBTASK-EPIC18-ENV-02:** Add Playwright auth bootstrap (`PLAYWRIGHT_AUTH_COOKIE` secret + setup validation).
- [ ] **SUBTASK-EPIC18-A11Y-03:** Re-run `e2e/a11y.spec.ts` with valid auth and publish `color-contrast` pass/fail per route for light/dark.
- [ ] **SUBTASK-EPIC18-LINT-04:** Triage/resolve `vue/no-v-html` warnings or document accepted risk exceptions.
