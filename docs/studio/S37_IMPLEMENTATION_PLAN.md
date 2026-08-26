# S37 Implementation Plan — Playback Studio Integration & Timeline Interaction

> **Subsystem:** Authoring Studio — Playback Studio Integration & Timeline Interaction (Sprint S37 / PM37)  
> **Author:** Agent 1 — Senior Architect & Planning Agent  
> **Status:** PROPOSED — REVISED IMPLEMENTATION PLAN (S37-A REPAIR CYCLE FIXED)  
> **Target Package:** `packages/authoring-studio` (`src/timeline/`)

---

## 1. Goal & Objectives

Deliver the **Playback Studio Integration & Timeline Interaction** layer for Authoring Studio (`packages/authoring-studio/src/timeline/`). Connect and orchestrate the S36 Timeline Editor UI with frozen `builder-core` runtime engines (`AnimationPlaybackController`, `RuntimeScheduler`, `AnimationRuntimeBridge`, `AnimationRuntimePreviewAdapter`, `AnimationTriggerEngine`) using `AnimationPlaybackController` as the SINGLE OWNER OF TIME, real transport controller methods (`TimelineTransportController.play/pause/stop/seek`), real selection sync APIs (`syncInspectorSelectionToTimeline`), and Golden E2E integration verification (`TimelineStudioIntegrationE2E.test.ts`).

---

## 2. Technical Implementation Scope & Production Inventory

### Component 1: Single Owner of Time & Read-Only Session Projection
- **`TimelinePlaybackSession.ts` (Refactored / F-01 Fix):** Pure read-only state projection model snapshot (zero manual time arithmetic, zero modulo loop logic).
- **`TimelineStudioBridge.ts` (Refactored / F-01 Fix):** Single integration bridge owning `AnimationPlaybackController` from `builder-core` as single time engine.

### Component 2: Real Transport & Selection Sync APIs
- **`TimelineTransportController.ts` (Verified / F-02 Fix):** Real static transport controller (`TimelineTransportController.play(session)`, `pause`, `stop`, `seek`).
- **`TimelineSelectionSync.ts` (Verified / F-03 Fix):** Real selection sync (`syncInspectorSelectionToTimeline(state, doc, nodeId, clipId, trackId, keyframeId)`).

### Component 3: Golden E2E Integration Suite (F-04 Fix)
- **`TimelineStudioIntegrationE2E.test.ts` (Implemented / F-04 Fix):** Golden E2E integration test verifying full integration lifecycle:
  `BuilderDocument` $\rightarrow$ complex `AnimationTimeline` (2 clips, 2 tracks, 3 keyframes, `speed = 1.5`) $\rightarrow$ `TimelineStudioBridge.selectTimeline()` $\rightarrow$ `play()` $\rightarrow$ `pause()` $\rightarrow$ `seek(500)` $\rightarrow$ `advance(250)` $\rightarrow$ `stop()` $\rightarrow$ `evaluateCurrentFrame()` $\rightarrow$ `JSON.stringify(docBefore) === JSON.stringify(docAfter)` $\rightarrow$ 0 document mutations during playback.

---

## 3. Verification Plan & Acceptance Thresholds

### Automated Commands
```bash
# 1. Dedicated S37 TypeScript check
npm run typecheck:s37

# 2. Scope Vitest S37 Golden E2E suite
npx vitest run packages/authoring-studio/src/timeline/__tests__/TimelineStudioIntegrationE2E.test.ts

# 3. Production Build check
npm run build
```

### Acceptance Thresholds
- **Vitest S37 Golden E2E:** ✅ **100% PASS (1/1 test PASS)**
- **TypeScript:** 0 errors in S37 scope (`npm run typecheck:s37`).
- **Build:** Exit code 0 (`ignoreBuildErrors: false`).
- **Single Owner of Time:** `AnimationPlaybackController` is single time owner; 0 `currentTime +=` in `TimelinePlaybackSession.ts`.
- **SSOT Integrity:** `BuilderDocument.ts` remains 100% FROZEN; `JSON.stringify(docBefore) === JSON.stringify(docAfter)` during playback.

---

## 4. Governance Workflow

```
[Agent 1 Repo Discovery & Architecture Repair (Faza S37-A)]
                         │
                         ▼
[Agent 2 Focused Delta Audit F-01..F-04 (Faza S37-B)]
                         │
                  +------+------+
                  │             │
               (PASS)        (HOLD)
                  │             │
                  v             v
       [Architect Ratification] [Architecture Delta]
                  │
                  v
       [S37 Implementation Unlocked (Faza S37-C)]
```

*Agent 1 does not execute code implementation until Agent 2 and Architect approve the architecture.*
