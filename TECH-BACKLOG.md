# TECH Backlog

Technical debt and quality improvements that don't block releases but improve developer experience and test reliability.

---

## TECH-001 — Unified Supabase Test Mock

**Priority:** Medium  
**Status:** Open  
**Estimate:** 1–2 days  

### Problem

Six test files mock `@/lib/supabase` independently, each with a different subset of the Supabase query builder chain. The missing `isSupabaseConfigured` export caused test failures in Sprint 9.6. Several tests produce stderr noise:

```
Failed to log event to Timeline: Error: [vitest] No "isSupabaseConfigured" export is defined on the "@/lib/supabase" mock.
Failed to log event to Timeline: TypeError: supabase.from(...).insert(...).select is not a function
```

While all tests pass, the stderr noise masks real regressions and makes CI logs harder to read.

### Goal

Create a single, shared Supabase mock factory at `src/lib/__mocks__/supabase.ts` that:

- Exports `getServiceSupabase`, `supabase`, and `isSupabaseConfigured`
- Supports the full chain API:
  - `select()`, `insert()`, `update()`, `delete()`, `upsert()`
  - `eq()`, `neq()`, `gt()`, `gte()`, `lt()`, `lte()`, `like()`, `ilike()`, `in()`, `is()`
  - `order()`, `limit()`, `range()`, `maybeSingle()`, `single()`
  - `then()` (thenable) for direct `await`
- Uses a shared in-memory database so `insert` + `select` work across calls
- Is configurable per test via `beforeEach` (seed data, clear tables)

All test files should import from this shared mock instead of duplicating mock setup.

### Files to Update

- `src/lib/store/__tests__/store-isolation.test.ts`
- `src/lib/tenant/__tests__/na-dobranoc-tenant.test.ts`
- `src/lib/tenant/golden-flow.test.ts`
- `src/lib/security/security-audit.test.ts`
- `src/lib/webhooks/webhook-runtime.test.ts`
- `src/app/api/mission-control/mission-control.test.ts`
- `src/lib/supabase-isolation.test.ts`

### Acceptance Criteria

- [ ] Single shared mock factory created
- [ ] All 7 test files use the shared mock
- [ ] Zero stderr output during `npx vitest run`
- [ ] All 178+ tests still pass
- [ ] `npx tsc --noEmit` passes

---

## TECH-002 — TenantTheme CSS Variable Integration

**Priority:** Medium  
**Status:** Open  
**Estimate:** 0.5 day  

### Problem

`TenantTheme.ts` defines color palettes per tenant (primary, secondary, accent, etc.), but no UI component reads these values. All Tailwind color classes are hard-coded (e.g., `from-violet-600 to-fuchsia-600`), making tenant branding non-functional.

### Goal

Wire `getTenantTheme()` into the root CSS as CSS custom properties so components can use `var(--color-primary)` instead of hard-coded Tailwind classes.

### Acceptance Criteria

- [ ] `globals.css` defines `--color-primary`, `--color-secondary`, `--color-accent`, etc.
- [ ] `(tenant)/layout.tsx` reads tenant theme and applies CSS variables to a data-theme attribute or style tag
- [ ] At least 2 core components (`Button`, `Badge`) use CSS variables for primary/secondary colors
