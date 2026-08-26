# TODO PM40 — Animation Studio Polish, Productivity & Professional Workflow

## Status Overview
- [x] ETAP 1 — Smart Guides (`TimelineSmartGuides.ts`) — Alignment, spacing guides & snap candidate solver (DECISION-063)
- [x] ETAP 2 — Advanced Timeline Snapping (`TimelineSnapEngine.ts`) — Multi-target magnetic snapping (DECISION-064)
- [x] ETAP 3 — Onion Skin (`TimelineOnionSkin.ts`) — Frame offset, opacity, color tint data description (DECISION-065)
- [x] ETAP 4 — Ghost Keyframes (`TimelineGhostFrames.ts`) — Preview positions & opacity metadata (DECISION-066)
- [x] ETAP 5 — Timeline Bookmarks (`TimelineBookmarks.ts`) — Named bookmarks & navigation (DECISION-067)
- [x] ETAP 6 — Timeline Folders (`TimelineFolders.ts`) — Track folder hierarchy & grouping (DECISION-067)
- [x] ETAP 7 — Track Filtering (`TimelineFiltering.ts`) — Search query, property filter, visibility, lock, solo (DECISION-067)
- [x] ETAP 8 — Productivity Commands (`TimelineCommands.ts`) — Duplicate, Delete, Group, Ungroup, Lock, Unlock, Hide, Show Command DTOs (DECISION-068)
- [x] ETAP 9 — Test Suite — Created 8 comprehensive Vitest unit test suites (Node environment)
- [x] ETAP 10 — Public API — Re-exported all PM40 models and interfaces
- [x] ETAP 11 — Documentation — Created `TODO_PM40.md` and `PM40_DELTA_IMPLEMENTATION_REPORT.md`

---

## Architectural Decisions Implemented
- **DECISION-063**: `TimelineSmartGuides` is strictly a pure data model for visual alignment, spacing guides, and snap candidates.
- **DECISION-064**: `TimelineSnapEngine` provides magnetic multi-target snapping (grid, markers, keyframes, clip edges, playhead) without executing runtime operations or using Browser APIs.
- **DECISION-065**: `TimelineOnionSkin` is strictly a data description model (offset, opacity, color tint, step count) without rendering or invoking `RuntimeBridge`.
- **DECISION-066**: `TimelineGhostFrames` represents authoring UX preview positions and opacity metadata without mutating runtime state.
- **DECISION-067**: `TimelineBookmarks`, `TimelineFiltering`, and `TimelineFolders` organize authoring state without violating `BuilderDocument` SSOT.
- **DECISION-068**: `TimelineCommands` provides pure Command DTO primitives (Duplicate, Delete, Group, Ungroup, Lock, Unlock, Hide, Show) decoupled from Runtime.

---

## File Delta Manifest

### New Files Created
- `packages/authoring-studio/src/timeline/TimelineSmartGuides.ts`
- `packages/authoring-studio/src/timeline/TimelineSnapEngine.ts`
- `packages/authoring-studio/src/timeline/TimelineOnionSkin.ts`
- `packages/authoring-studio/src/timeline/TimelineGhostFrames.ts`
- `packages/authoring-studio/src/timeline/TimelineBookmarks.ts`
- `packages/authoring-studio/src/timeline/TimelineFolders.ts`
- `packages/authoring-studio/src/timeline/TimelineFiltering.ts`
- `packages/authoring-studio/src/timeline/TimelineCommands.ts`
- `packages/authoring-studio/src/timeline/__tests__/SmartGuides.test.ts`
- `packages/authoring-studio/src/timeline/__tests__/SnapEngine.test.ts`
- `packages/authoring-studio/src/timeline/__tests__/OnionSkin.test.ts`
- `packages/authoring-studio/src/timeline/__tests__/GhostFrames.test.ts`
- `packages/authoring-studio/src/timeline/__tests__/Bookmarks.test.ts`
- `packages/authoring-studio/src/timeline/__tests__/TimelineFolders.test.ts`
- `packages/authoring-studio/src/timeline/__tests__/TimelineFiltering.test.ts`
- `packages/authoring-studio/src/timeline/__tests__/TimelineCommands.test.ts`
- `TODO_PM40.md`
- `docs/studio/PM40_DELTA_IMPLEMENTATION_REPORT.md`

### Existing Files Modified
- `packages/authoring-studio/src/timeline/index.ts`

### Frozen Modules Verified (0 modifications)
- `packages/builder-core/*` (PM29–PM34) — UNTOUCHED
- `packages/authoring-studio/src/inspector/*` (PM35) — UNTOUCHED
- `packages/authoring-studio/src/preview/*` (PM38) — UNTOUCHED

---

## Quality Gates Verification

- [x] **TypeScript Compliance**: Zero type errors across all packages.
- [x] **Vitest Compliance**: 100% pass across all 8 new PM40 test suites.
- [x] **Boundary Protection**: Zero Browser API, zero rAF, zero DOM, zero setTimeout/setInterval, zero React in domain layer.
- [x] **SSOT Integrity**: All document updates maintain `BuilderDocument` immutability.
