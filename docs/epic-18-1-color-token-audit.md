# EPIC 18.1 — Color token audit (app/**/*.vue, app/**/*.ts)

## Scope
- `app/**/*.vue`
- `app/**/*.ts`

## Replaced legacy classes
- `text-gray-900`, `text-white` → `text-[color:var(--text-primary)]`
- `text-gray-700|600` → `text-[color:var(--text-secondary)]`
- `text-gray-500|400` → `text-[color:var(--text-muted)]`
- `bg-white|bg-gray-50` → `bg-[color:var(--surface-0)]`
- `bg-gray-100|bg-gray-800` → `bg-[color:var(--surface-2)]`
- `border-gray-200|700` → `border-[color:var(--border)]`
- `text-red-*`, `bg-red-*` → danger tokens (`--danger`)
- `text-green-*`, `bg-green-*` → success tokens (`--success`)

## Allowed exceptions (for clean grep-audit)
The following categories are intentionally allowed and are **not** part of this audit rule set:

1. Illustration-only colors and SVG/preview palettes (brand/semantic drawing colors).
2. Component-specific hover/accent shades not in EPIC 18.1 replacement matrix.
3. Legacy colors outside `app/**/*.vue` and `app/**/*.ts` (e.g. external styles, docs, snapshots).

## Audit command
Use this command to validate EPIC 18.1 in-scope classes:

```bash
rg -n "text-gray-(900|700|600|500|400)|text-white|bg-white|bg-gray-50|bg-gray-100|bg-gray-800|border-gray-(200|700)|text-red-[^\\s\"']+|bg-red-[^\\s\"']+|text-green-[^\\s\"']+|bg-green-[^\\s\"']+" app --glob '**/*.vue' --glob '**/*.ts'
```

Expected result: no matches.
