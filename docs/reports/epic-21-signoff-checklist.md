# EPIC 21 — Final Sign-off Checklist

**Epic:** [EPIC 21 — Security Hardening](../epic-21-security-hardening.md)  
**Report date:** 2026-04-20  
**Status:** Ready for formal sign-off after evidence review

---

## Blockers for prod (Phase 0 must-pass)

> 🚫 **Release rule (mandatory):** если покрытие **Phase 0** не равно **100% (all must-pass items complete + validated evidence attached)**, деплой в production **строго запрещён**.

- [x] **21.1 — CSRF Protection**
  - Owner: Security / Backend
  - Date: 2026-04-20
  - Evidence: middleware + validation tests/logs (attach links)
  - PR/Commit: [PR #95](https://github.com/trafficolog/qr-dashboard/pull/95), [df98449](https://github.com/trafficolog/qr-dashboard/commit/df98449)

- [x] **21.2 — OTP Hashing**
  - Owner: Security / Backend
  - Date: 2026-04-20
  - Evidence: hash/pepper verification tests, auth logs
  - PR/Commit: [PR #96](https://github.com/trafficolog/qr-dashboard/pull/96), [2102a91](https://github.com/trafficolog/qr-dashboard/commit/2102a91)

- [x] **21.3 — Admin bootstrap hardening**
  - Owner: Backend
  - Date: 2026-04-20
  - Evidence: bootstrap policy checks, env validation logs
  - PR/Commit: [PR #97](https://github.com/trafficolog/qr-dashboard/pull/97), [2a0a004](https://github.com/trafficolog/qr-dashboard/commit/2a0a004)

- [x] **21.4 — Security Headers**
  - Owner: Security / Platform
  - Date: 2026-04-20
  - Evidence: response headers snapshot / integration tests
  - PR/Commit: [PR #99](https://github.com/trafficolog/qr-dashboard/pull/99), [342970f](https://github.com/trafficolog/qr-dashboard/commit/342970f)

---

## Should-pass before 1.0.0 (rest of EPIC 21)

- [x] **21.5 — Audit Log**
  - Owner: Backend + Admin UI
  - Date: 2026-04-20
  - Evidence: audit API/UI checks, DB records sample
  - PR/Commit: [PR #100](https://github.com/trafficolog/qr-dashboard/pull/100), [196e3bd](https://github.com/trafficolog/qr-dashboard/commit/196e3bd)

- [x] **21.6 — Persistent Rate Limiting**
  - Owner: Backend
  - Date: 2026-04-20
  - Evidence: lockout tests, fallback logs
  - PR/Commit: [PR #101](https://github.com/trafficolog/qr-dashboard/pull/101), [824e362](https://github.com/trafficolog/qr-dashboard/commit/824e362)

- [x] **21.7 — Session invalidation on role change**
  - Owner: Backend
  - Date: 2026-04-20
  - Evidence: session invalidation test logs
  - PR/Commit: [PR #102](https://github.com/trafficolog/qr-dashboard/pull/102), [3132490](https://github.com/trafficolog/qr-dashboard/commit/3132490)

- [x] **21.8 — Destination whitelist**
  - Owner: Backend + Product Security
  - Date: 2026-04-20
  - Evidence: whitelist CRUD/API tests, redirect warning screenshots
  - PR/Commit: [PR #103](https://github.com/trafficolog/qr-dashboard/pull/103), [4d85fbb](https://github.com/trafficolog/qr-dashboard/commit/4d85fbb)

- [x] **21.9 — API Key Scoping**
  - Owner: Backend / Integrations
  - Date: 2026-04-20
  - Evidence: scope/allowlist/expiry validation tests
  - PR/Commit: [PR #104](https://github.com/trafficolog/qr-dashboard/pull/104), [72db6f7](https://github.com/trafficolog/qr-dashboard/commit/72db6f7)

- [x] **21.10 — Body/JSONB limits**
  - Owner: Backend
  - Date: 2026-04-20
  - Evidence: payload limit tests, schema validation logs
  - PR/Commit: [PR #105](https://github.com/trafficolog/qr-dashboard/pull/105), [d2df43b](https://github.com/trafficolog/qr-dashboard/commit/d2df43b)

- [x] **21.11 — Bulk transactions**
  - Owner: Backend
  - Date: 2026-04-20
  - Evidence: transaction rollback tests, API contract checks
  - PR/Commit: [PR #106](https://github.com/trafficolog/qr-dashboard/pull/106), [8d53991](https://github.com/trafficolog/qr-dashboard/commit/8d53991)

- [x] **21.12 — Trusted proxy + session limits**
  - Owner: Platform + Backend
  - Date: 2026-04-20
  - Evidence: trusted proxy/IP parsing tests, concurrent session logs
  - PR/Commit: [PR #107](https://github.com/trafficolog/qr-dashboard/pull/107), [5b830d2](https://github.com/trafficolog/qr-dashboard/commit/5b830d2)

- [x] **21.13 — CORS + shortCode hardening**
  - Owner: Backend + Security
  - Date: 2026-04-20
  - Evidence: CORS policy tests, abuse hardening checks
  - PR/Commit: [PR #108](https://github.com/trafficolog/qr-dashboard/pull/108), [0049b58](https://github.com/trafficolog/qr-dashboard/commit/0049b58)

---

## Final sign-off approvers

Финальный sign-off по EPIC 21 считается утверждённым только при наличии всех трёх подтверждений:

1. **Tech Lead** — подтверждает техническую полноту и отсутствие регрессий.
2. **Security Owner (AppSec / Security Lead)** — подтверждает закрытие security-рисков и достаточность evidence.
3. **Product Owner / Product Manager** — подтверждает бизнес-готовность к релизу.

---

## Sign-off record

- Tech Lead approval: ☐ Pending / ☐ Approved (name, date, link)
- Security approval: ☐ Pending / ☐ Approved (name, date, link)
- Product approval: ☐ Pending / ☐ Approved (name, date, link)
- Final release decision: ☐ NO-GO / ☐ GO
