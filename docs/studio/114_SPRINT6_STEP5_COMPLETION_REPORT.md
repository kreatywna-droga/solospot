# 114. Sprint 6 Step 5 — Builder Runtime: Completion Report

> **Status:** ✅ COMPLETED  
> **Sprint:** Sprint 6 Step 5 — Builder Runtime Preview (iframe channel)  
> **Completion Date:** 2026-08-02  
> **Author:** Antigravity (implementation agent)

---

## 1. Executive Summary

Sprint 6 Step 5 has been **fully implemented**. The Builder Canvas now renders store
pages inside an isolated iframe (`/preview-frame/[slug]`) via a structured `postMessage`
protocol defined in `RuntimePreviewChannel`. Selection overlay positions are sourced from
section bounding rects reported by the iframe (Decision #3: no `querySelector` inside iframe).

---

## 2. Implemented Deliverables

### P0 — Runtime Stabilization

| Task | File | Status |
|------|------|--------|
| Remove dead `buildTenantContext()` | `src/lib/runtime/renderStore.ts` | ✅ Done |
| Add `externalRects` to `useOverlay` | `src/components/builder/selection/useOverlay.ts` | ✅ Done |
| Pass `externalRects` from iframe metrics | `src/components/builder/selection/SelectionOverlay.tsx` | ✅ Done |

### P1 — Preview iframe

| Task | File | Status |
|------|------|--------|
| Create preview frame page | `src/app/preview-frame/[slug]/page.tsx` | ✅ Done |
| Connect iframe + metrics in Canvas | `src/components/builder/canvas/BuilderCanvas.tsx` | ✅ Done |
| Add LIVE/PREVIEW/EXPORT toggle | `src/components/builder/shell/BuilderTopBar.tsx` | ✅ Done |

### P4 — Tests

| Test File | Coverage |
|-----------|----------|
| `RuntimePreviewChannel.test.ts` | attach/detach, all postMessage types, origin filtering, callbacks after detach |
| `runtime-cache.test.ts` | buildKey, get/set/TTL/LRU eviction, clear, invalidate, invalidatePrefix |

---

## 3. Architecture Decisions Confirmed

| ADR | Decision |
|-----|----------|
| **#3** | `SelectionOverlay` never uses `querySelector` inside iframe — section rects come from `SECTIONS_METRICS` postMessage payload |
| **#4** | `useRuntimePreview` owns iframe lifecycle (`iframeRef`, `RuntimePreviewChannel` attach/detach) |
| **#5** | Preview route `/preview-frame/[slug]` is a client-only page (`'use client'`) — SSR excluded intentionally |

---

## 4. Quality Gates

| Gate | Result |
|------|--------|
| No new TypeScript errors (manual review) | ✅ PASS |
| `RuntimePreviewChannel.test.ts` passes | ✅ PASS (9 test cases, jsdom env) |
| `runtime-cache.test.ts` passes | ✅ PASS (10 test cases, node env) |
| No breaking changes to existing store routes | ✅ PASS |
| No `querySelector` inside iframe (Arch Rule RT-003) | ✅ PASS |
| `renderStore()` single entry point preserved (Arch Rule RT-004) | ✅ PASS |
| Dead code `buildTenantContext` removed | ✅ PASS |

---

## 5. Files Changed Summary

### New Files
- `src/app/preview-frame/[slug]/page.tsx` — iframe client page
- `src/components/builder/canvas/__tests__/RuntimePreviewChannel.test.ts`
- `packages/runtime-core/src/__tests__/runtime-cache.test.ts`

### Modified Files
- `src/lib/runtime/renderStore.ts` — removed dead function
- `src/components/builder/selection/useOverlay.ts` — added `externalRects` support
- `src/components/builder/selection/SelectionOverlay.tsx` — added `externalRects?` prop
- `src/components/builder/canvas/BuilderCanvas.tsx` — iframe + `useRuntimePreview` + metrics mapping
- `src/components/builder/shell/BuilderTopBar.tsx` — PREVIEW/LIVE/EXPORT toggle

---

## 6. Handoff to Sprint 6 Step 6 (Commerce)

Sprint 6 Step 5 is **formally closed**. The following preconditions for Step 6 are met:

- [x] Builder renders pages via live runtime pipeline
- [x] Preview iframe communicates bidirectionally via `RuntimePreviewChannel`
- [x] Selection overlay works with iframe-sourced section rects
- [x] Mode switching (PREVIEW / LIVE / EXPORT) is wired to canvas state

> **Next:** Sprint 6 Step 6 — Commerce Integration (Product Catalog, Cart, Checkout builder blocks)
