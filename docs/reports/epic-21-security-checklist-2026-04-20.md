# EPIC 21 — Security Checklist / Report (2026-04-20)

**Эпик:** [EPIC 21 — Security Hardening](../epic-21-security-hardening.md)  
**Статус:** ✅ Completed (full scope)  
**Дата фиксации:** 2026-04-20

---

## 1) Статус по фазам

- ✅ **Фаза 0 (deploy blocker):** завершена.
- ✅ **Фаза 1:** завершена.
- ✅ **Фаза 2:** завершена.
- ✅ **EPIC 21 full scope:** завершён полностью.

---

## 2) Checklist по security-блокам

| Блок | Задача | Статус | Примечание |
|---|---|---|---|
| SEC-01 | 21.1 CSRF Protection | ✅ | CSRF middleware + token validation для cookie-auth |
| SEC-02 | 21.2 OTP Hashing | ✅ | OTP хранится в hashed/peppered виде |
| SEC-04 | 21.3 Admin bootstrap hardening | ✅ | `ADMIN_EMAIL` gate + безопасный default role |
| SEC-12 | 21.4 Security Headers | ✅ | Global headers + CSP только для HTML |
| SEC-03 | 21.5 Audit Log | ✅ | audit schema + API/UI для просмотра |
| SEC-05 | 21.6 Persistent Rate Limiting | ✅ | lockout и DB-backed/fallback механизмы |
| SEC-06 | 21.7 Session invalidation on role change | ✅ | при смене роли старые сессии сбрасываются |
| SEC-07 | 21.8 Destination whitelist | ✅ | whitelist + warning page для внешних доменов |
| SEC-08 | 21.9 API Key Scoping | ✅ | permissions + IP allowlist + expiry |
| SEC-09 | 21.10 Body/JSONB limits | ✅ | size limits + strict schema validation |
| SEC-11 | 21.11 Bulk transactions | ✅ | транзакционный bulk create/delete |
| SEC-13 / SEC-16 | 21.12 Trusted proxy + session limits | ✅ | hardened client IP + active session cap |
| SEC-15 / SEC-18 | 21.13 CORS + shortCode hardening | ✅ | targeted CORS for API v1 + abuse hardening |

---

## 3) Зафиксированные production-ready условия

Переход к `1.0.0` разрешён, так как:

1. Все фазы EPIC 21 закрыты.
2. Закрыты все security-блоки SEC-01…SEC-18 в объёме EPIC 21.
3. Security документация синхронизирована (`epic-21-security-hardening.md`, `completed-epics.md`, `planned-epics-15-18.md`, `CHANGELOG.md`).

