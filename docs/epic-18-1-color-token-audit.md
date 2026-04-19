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

## Allowed exceptions (EPIC 18 registry)
Document only explicit, justified exclusions from this audit scope.

### Current exceptions list
- No active exceptions in `app/**/*.vue` and `app/**/*.ts`.

### Out of scope by definition
1. Legacy colors outside `app/**/*.vue` and `app/**/*.ts` (e.g. external styles, docs, snapshots).
2. Non-class color values in TS/JS objects (for chart palettes, preview/illustration drawing).

## Audit command
Use this command to validate EPIC 18.1 in-scope classes:

```bash
rg -n --glob 'app/**/*.vue' --glob 'app/**/*.ts' \
  -e "gray-[^[:space:]\\\"']+" \
  -e "text-white" \
  -e "bg-white" \
  -e "red-[^[:space:]\\\"']+" \
  -e "green-[^[:space:]\\\"']+"
```

Expected result: no matches.
