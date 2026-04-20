# Security Signals Runbook (On-call)

## Scope

This runbook explains how to interpret new security telemetry and what actions on-call should take when alerts fire.

## Structured security rejection logs

Application now emits structured logs with `[security.reject]` and `eventCode` for key deny paths:

- `SEC_CSRF_*` — CSRF rejects (`403`) for missing/invalid Origin/Referer/token.
- `SEC_RATE_LIMIT_*` — rate-limit and temporary IP-ban rejects (`429`).
- `SEC_API_KEY_SCOPE_DENIED` — API key scope mismatch (`403`).
- `SEC_API_KEY_IP_DENIED` — API key IP allowlist deny (`403`).
- `SEC_AUTH_LOCKOUT_*` — OTP lockout active/triggered (`429`).
- `SEC_AUDIT_WRITE_FAILED` — audit write failed.

## Baseline alerts

Alerts are emitted as `[security.alert]` logs with dedicated `eventCode`:

- `SEC_ALERT_403_RATE` — too many `403` in 5 minutes.
- `SEC_ALERT_429_RATE` — too many `429` in 5 minutes.
- `SEC_ALERT_LOCKOUT_SPIKE` — lockout spike in 10 minutes.
- `SEC_ALERT_AUDIT_FAILURE_GROWTH` — audit failures growth in 10 minutes.

Each alert log contains: `severity`, `signal`, `count`, `threshold`, `windowMs`, `emittedAt`.

## On-call interpretation and actions

### 1) High `403` rate (`SEC_ALERT_403_RATE`)

Typical causes:
- frontend deploy sent broken CSRF headers;
- automated abuse scanning protected endpoints;
- client integration using wrong API-key scope/IP.

Actions:
1. Group by `eventCode` in `[security.reject]` logs.
2. If mostly `SEC_CSRF_*`: check latest deploy and CSRF header name/config in runtime env.
3. If mostly API-key denies: identify affected integration and confirm scope/IP allowlist.
4. Escalate to security if sudden unknown-source spike continues >15 minutes.

### 2) High `429` rate (`SEC_ALERT_429_RATE`)

Typical causes:
- legitimate traffic burst;
- bot traffic;
- OTP brute-force attempts.

Actions:
1. Split by path (`/api/auth/login`, `/api/v1/*`, `/r/*`).
2. Verify whether this aligns with known campaign/release traffic.
3. If concentrated on auth/OTP: treat as suspicious, notify security immediately.
4. If concentrated on single client integration: contact integrator and recommend retry/backoff compliance.

### 3) Lockout spike (`SEC_ALERT_LOCKOUT_SPIKE`)

Risk:
- active credential-stuffing or OTP guessing.

Actions:
1. Prioritize as security incident (critical).
2. Check recent source patterns via `ipHash` and request path.
3. Temporarily tighten access controls at edge/WAF if available.
4. Notify security owner and incident channel; track time-to-containment.

### 4) Audit failures growth (`SEC_ALERT_AUDIT_FAILURE_GROWTH`)

Risk:
- degraded forensic visibility / compliance gap.

Actions:
1. Check DB health and migration status.
2. Inspect `SEC_AUDIT_WRITE_FAILED` frequency and `errorMessage`.
3. If persistent >10 minutes, declare degraded-security-observability incident.
4. Restore audit writes before closing incident; document any data-loss window.

## Logging safety constraints

To avoid leaking secrets, logs must NOT include:
- bearer/session token values;
- OTP values;
- full `Authorization` header or full auth headers.

Current security logs intentionally include only minimal context: method, path, hashed client IP (`ipHash`), and safe diagnostic fields (e.g., `requiredPermission`, `apiKeyId`).
