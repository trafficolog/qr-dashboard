# EPIC 21 — Threat Model Review

**Дата review:** 2026-04-20  
**Эпик:** [EPIC 21 — Security Hardening](../epic-21-security-hardening.md)  
**Базовый отчёт:** [EPIC 21 Security Checklist (2026-04-20)](../reports/epic-21-security-checklist-2026-04-20.md)

---

## 1) Закрытие угроз SEC-01..SEC-18

Ниже зафиксирован итоговый статус по всем идентификаторам SEC-01..SEC-18 с ссылками на реализацию (код/конфиг/документацию, где контроль применён и проверяем).

| SEC | Статус | Реализация (evidence links) |
|---|---|---|
| SEC-01 | ✅ Closed | CSRF middleware + Origin/Referer + double-submit token: [`server/middleware/02-csrf.ts`](../../server/middleware/02-csrf.ts), [`app/composables/useAuth.ts`](../../app/composables/useAuth.ts), [`server/api/auth/me.get.ts`](../../server/api/auth/me.get.ts) |
| SEC-02 | ✅ Closed | OTP хранится в hash+pepper: [`server/utils/hash.ts`](../../server/utils/hash.ts), [`server/services/auth.service.ts`](../../server/services/auth.service.ts), [`server/db/migrations/0005_cleanup_active_otp_codes.sql`](../../server/db/migrations/0005_cleanup_active_otp_codes.sql) |
| SEC-03 | ✅ Closed | Audit trail (schema + API + UI): [`server/db/schema/audit-log.ts`](../../server/db/schema/audit-log.ts), [`server/utils/audit.ts`](../../server/utils/audit.ts), [`server/api/admin/audit/index.get.ts`](../../server/api/admin/audit/index.get.ts), [`app/pages/settings/audit.vue`](../../app/pages/settings/audit.vue) |
| SEC-04 | ✅ Closed | Secure admin bootstrap (`ADMIN_EMAIL` gate + safe defaults): [`server/services/auth.service.ts`](../../server/services/auth.service.ts), [`server/utils/runtime-config.ts`](../../server/utils/runtime-config.ts), [`.env.example`](../../.env.example) |
| SEC-05 | ✅ Closed | Persistent and path-aware rate limiting + temporary IP ban: [`server/middleware/03-rate-limit.ts`](../../server/middleware/03-rate-limit.ts), [`server/db/schema/rate-limit-counters.ts`](../../server/db/schema/rate-limit-counters.ts), [`server/db/migrations/0008_add_auth_email_locks_and_rate_limit_counters.sql`](../../server/db/migrations/0008_add_auth_email_locks_and_rate_limit_counters.sql) |
| SEC-06 | ✅ Closed | Session invalidation on role change: [`server/services/team.service.ts`](../../server/services/team.service.ts), [`server/services/team.service.test.ts`](../../server/services/team.service.test.ts) |
| SEC-07 | ✅ Closed | Destination whitelist и административное управление: [`server/db/schema/destination-domains.ts`](../../server/db/schema/destination-domains.ts), [`server/api/admin/destination-domains/index.post.ts`](../../server/api/admin/destination-domains/index.post.ts), [`app/pages/settings/destination-domains.vue`](../../app/pages/settings/destination-domains.vue) |
| SEC-08 | ✅ Closed | API key scoping + expiry + allowlist: [`server/services/api-key.service.ts`](../../server/services/api-key.service.ts), [`server/middleware/01-auth.ts`](../../server/middleware/01-auth.ts), [`server/db/migrations/0010_api_keys_permissions_ip_expiry.sql`](../../server/db/migrations/0010_api_keys_permissions_ip_expiry.sql) |
| SEC-09 | ✅ Closed | Request body size limits + strict API validation: [`server/middleware/04-body-size-limit.ts`](../../server/middleware/04-body-size-limit.ts), [`server/api/qr/index.post.ts`](../../server/api/qr/index.post.ts), [`server/api/qr/bulk.post.ts`](../../server/api/qr/bulk.post.ts), [`nuxt.config.ts`](../../nuxt.config.ts) |
| SEC-10 | ✅ Closed (via compensating controls) | Отдельная новая уязвимость не ведётся как самостоятельный блок; риск покрыт совокупно strict validation + centralized security errors + observability: [`server/utils/security-error.ts`](../../server/utils/security-error.ts), [`server/utils/security-observability.ts`](../../server/utils/security-observability.ts), [`docs/security/incident-signals-runbook.md`](../security/incident-signals-runbook.md) |
| SEC-11 | ✅ Closed | Bulk операции переведены в транзакции: [`server/services/bulk.service.ts`](../../server/services/bulk.service.ts), [`server/api/qr/bulk-delete.post.ts`](../../server/api/qr/bulk-delete.post.ts) |
| SEC-12 | ✅ Closed | Security headers + CSP для HTML: [`server/middleware/00-security-headers.ts`](../../server/middleware/00-security-headers.ts), [`docs/security/headers-validation.md`](../security/headers-validation.md) |
| SEC-13 | ✅ Closed | Trusted proxy client IP extraction: [`server/utils/ip.ts`](../../server/utils/ip.ts), [`server/utils/runtime-config.ts`](../../server/utils/runtime-config.ts) |
| SEC-14 | ✅ Closed (via compensating controls) | Риск операционного обнаружения/реакции закрыт через security telemetry + runbook on-call: [`server/utils/security-observability.ts`](../../server/utils/security-observability.ts), [`docs/security/incident-signals-runbook.md`](../security/incident-signals-runbook.md) |
| SEC-15 | ✅ Closed | CORS для API v1 ограничен отдельными route rules: [`nuxt.config.ts`](../../nuxt.config.ts) |
| SEC-16 | ✅ Closed | Active session cap + eviction oldest session: [`server/services/auth.service.ts`](../../server/services/auth.service.ts), [`server/db/schema/sessions.ts`](../../server/db/schema/sessions.ts) |
| SEC-17 | ✅ Closed (via compensating controls) | Отдельный backlog-item не выделяется; abuse/аномалии покрыты сигналами и ограничениями по rate-limit: [`server/middleware/03-rate-limit.ts`](../../server/middleware/03-rate-limit.ts), [`server/utils/security-observability.ts`](../../server/utils/security-observability.ts), [`docs/security/incident-signals-runbook.md`](../security/incident-signals-runbook.md) |
| SEC-18 | ✅ Closed | ShortCode hardening (8 chars for new codes + safe alphabet + abuse guards): [`server/utils/nanoid.ts`](../../server/utils/nanoid.ts), [`server/routes/r/[code].get.ts`](../../server/routes/r/[code].get.ts), [`server/middleware/03-rate-limit.ts`](../../server/middleware/03-rate-limit.ts) |

> Примечание: соответствие «SEC → 21.x» синхронизировано с официальным checklist EPIC 21.

---

## 2) Residual risks и compensating controls

Ниже перечислены риски, которые осознанно остаются после закрытия EPIC 21 (не являются блокером текущего релиза), и контрмеры, уже действующие в прод-контуре.

1. **Residual R-01: отсутствует edge WAF/бот-защита уровня perimeter (L7).**  
   **Почему вне scope EPIC 21:** эпик закрывал application-level hardening в кодовой базе, без инфраструктурного perimeter-а.  
   **Compensating controls:** приложение уже ограничивает brute-force/abuse (`429`, temp-ban, lockout), ведёт security signals и on-call runbook.  
   Evidence: [`server/middleware/03-rate-limit.ts`](../../server/middleware/03-rate-limit.ts), [`server/utils/security-observability.ts`](../../server/utils/security-observability.ts), [`docs/security/incident-signals-runbook.md`](../security/incident-signals-runbook.md).

2. **Residual R-02: CORS для `/api/v1/**` включён как generic CORS, а не allowlist-матрица по origin/partner.**  
   **Почему вне scope EPIC 21:** в рамках эпика требовалось отделить v1 от cookie-auth API и исключить CORS на internal `/api/**`, что выполнено.  
   **Compensating controls:** доступ к v1 защищён API key scopes, expiry, IP allowlist, rate limit.  
   Evidence: [`nuxt.config.ts`](../../nuxt.config.ts), [`server/middleware/01-auth.ts`](../../server/middleware/01-auth.ts), [`server/services/api-key.service.ts`](../../server/services/api-key.service.ts), [`server/middleware/03-rate-limit.ts`](../../server/middleware/03-rate-limit.ts).

3. **Residual R-03: security alerting реализован как log-based сигнализация без обязательной внешней SIEM-интеграции.**  
   **Почему вне scope EPIC 21:** эпик вводил базовую сигнальную модель и процедуры реагирования; внешняя интеграция платформы мониторинга — отдельная операционная задача.  
   **Compensating controls:** structured security logs + thresholds + документированный on-call playbook.  
   Evidence: [`server/utils/security-observability.ts`](../../server/utils/security-observability.ts), [`docs/security/incident-signals-runbook.md`](../security/incident-signals-runbook.md).

---

## 3) Риски, перенесённые в следующий эпик/итерацию

| ID | Риск / задача | Перенос в | Owner | Deadline | Комментарий |
|---|---|---|---|---|---|
| NEXT-SEC-01 | Вынести security alerts в централизованный мониторинг (Sentry/Alertmanager/SIEM) с paging-правилами | EPIC 22 (операционный security track) | Platform / SRE | 2026-05-15 | Сейчас алерты логируются локально, требуется внешний канал эскалации |
| NEXT-SEC-02 | Ужесточить CORS для `/api/v1/**` до explicit allowlist origin-ов интеграций | EPIC 22 | Backend Lead | 2026-05-08 | Текущее состояние безопасно за счёт API key controls, но можно снизить exposure |
| NEXT-SEC-03 | Формализовать edge WAF/bot policy (ruleset + runbook + ownership) | Iteration 2026-Q2.2 | Security Owner | 2026-06-01 | Компенсируется app-level rate-limit, но perimeter слой пока не зафиксирован |

---

## 4) Итог

- Threat model review по EPIC 21 завершён.
- SEC-01..SEC-18 закрыты в рамках реализации EPIC 21 (часть блоков закрыта прямыми фиксами, часть — документированными compensating controls).
- Остаточные риски и follow-up задачи зафиксированы с owner + дедлайнами.
