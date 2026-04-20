# Database migrations

## Canonical migration chain

The active SQL migration chain is:

1. `0000_omniscient_matthew_murdock.sql`
2. `0001_add_scan_daily_stats.sql`
3. `0002_add_departments_and_qr_visibility.sql` ← EPIC 19 canonical migration
4. `0003_tags_name_lower_unique.sql`

`server/db/migrations/meta/_journal.json` tracks the same tags (`0000` → `0001` → `0002_add_departments_and_qr_visibility`).

## Archived duplicates

The following duplicate/experimental EPIC 19 drafts are archived and **must not** be used by migrator:

- `archive/0002_add_departments_and_visibility.sql`
- `archive/0002_add_qr_visibility_and_user_departments.sql`

Reason: they diverge from current schema truth (`department_role` enum + `user_departments` composite PK + full departments/visibility DDL).
