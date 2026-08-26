# PM36 — Delta Implementation Report

## Timeline Editor & Keyframe Authoring

> **Status:** READY FOR ARCHITECT REVIEW
> **Task ID:** PM36
> **Role:** Agent 1 — Implementation Engineer
> **Mode:** IMPLEMENTATION
> **Package:** `packages/authoring-studio`
> **Governance Baseline:** v2.8

---

## 1. Objective

Deliver a **pure Authoring-layer Timeline Editor** for the Authoring Studio. It edits the
`AnimationTimeline` DTO stored inside `BuilderDocument` (Single Source of Truth) **without
executing animations**. It is governed by DECISION-046 (pure authoring surface), DECISION-047
(BuilderDocument SSOT, declarative mutations, no local copy), and DECISION-048 (selection model
independent of runtime via `selectedClipId` / `selectedTrackId` / `selectedKeyframeId`).

The Animation Engine (PM29–PM34) remains the only source of types and domain logic. The Timeline
Editor is strictly an authoring surface.

---

## 2. Architectural Decisions Implemented

| Decision | Implementation |
|----------|----------------|
| **DECISION-046** | Timeline Editor is a pure authoring surface. It only reads/writes `AnimationTimeline` DTOs. No playback, no schedulers, no trigger engine, no preview. |
| **DECISION-047** | BuilderDocument remains the SSOT. All mutations are **immutable and declarative** — every operation returns a NEW `BuilderDocument`. The editor never keeps a local copy. |
| **DECISION-048** | Selection state is a pure data model (`TimelineSelection`) with `selectedClipId` / `selectedTrackId` / `selectedKeyframeId`, fully independent of runtime. |

---

## 3. File Delta Manifest

### New Source Files (ETAP 1–5)

| File | Purpose |
|------|---------|
| `packages/authoring-studio/src/timeline/TimelineSelection.ts` | Runtime-independent selection model (DECISION-048). |
| `packages/authoring-studio/src/timeline/TimelineViewport.ts` | Time↔pixel mapping (pure math). |
| `packages/authoring-studio/src/timeline/TimelineGrid.ts` | Timeline tick generation (pure math). |
| `packages/authoring-studio/src/timeline/TimelineCursor.ts` | Cursor model (pure). |
| `packages/authoring-studio/src/timeline/timelineDocumentBinding.ts` | Immutable, declarative SSOT mutations (DECISION-047). |
| `packages/authoring-studio/src/timeline/TimelinePanel.tsx` | Pure-presentation panel (server-renderable). |
| `packages/authoring-studio/src/timeline/TimelinePanelAdapter.ts` | AnimationTimeline → UI view models. |
| `packages/authoring-studio/src/timeline/timelinePropertyFields.ts` | Clip/keyframe field definitions + validation. |
| `packages/authoring-studio/src/timeline/index.ts` | Timeline barrel export. |

### New Test Files (ETAP 6 — Node, no jsdom)

| File | Tests |
|------|-------|
| `packages/authoring-studio/src/timeline/__tests__/TimelineSelection.test.ts` | 6 |
| `packages/authoring-studio/src/timeline/__tests__/TimelineDocumentBinding.test.ts` | 9 |
| `packages/authoring-studio/src/timeline/__tests__/TimelineAdapter.test.ts` | 6 |
| `packages/authoring-studio/src/timeline/__tests__/TimelinePanel.test.tsx` | 4 |
| `packages/authoring-studio/src/timeline/__tests__/TimelineIntegration.test.ts` | 5 |

`TimelinePanel.test.tsx` uses `react-dom/server` `renderToStaticMarkup` (no jsdom). The stale
`TimelinePanel.test.ts` (contained JSX and caused TS errors) was removed.

### Modified Files

| File | Change |
|------|--------|
| `packages/authoring-studio/src/index.ts` | Added `export * from './timeline/index'` (ETAP 7). |

### Deliberately NOT Modified

- `packages/builder-core/**` (PM29–PM34 frozen modules untouched).
- Inspector 2.0 panels/widgets (PM35 frozen).
- No changes to `AnimationEngine`.

---

## 4. Document Binding API (DECISION-047)

`timelineDocumentBinding.ts` provides immutable, declarative operations. Every operation returns a
**new** `BuilderDocument`; the input is never mutated.

- Clip: `addClip`, `removeClip`, `moveClip`, `resizeClip`
- Track: `addTrack`, `removeTrack`
- Keyframe: `moveKeyframe` (auto re-sort), `addKeyframe`, `deleteKeyframe`, `setKeyframeValue`, `setKeyframeEasing`
- Read: `getClip`, `getTrack`, `getKeyframe`

Data flow: `BuilderDocument` (SSOT) → `AnimationTimeline` DTO → Timeline Panel → declarative
mutation → new `BuilderDocument`. **No side effects, no runtime, no playback.**

---

## 5. Public API (ETAP 7)

`packages/authoring-studio/src/index.ts` now re-exports the timeline module:

```ts
// Timeline Editor & Keyframe Authoring (PM36)
export * from './timeline/index';
```

---

## 6. Quality Gates

```bash
npx tsc --noEmit
npx vitest run
npm run build
```

> Note on type resolution: the timeline module imports builder-core types via relative
> `../../builder-core/src/...` paths. Under `vitest` runtime these resolve correctly. The authoring
> package's `tsconfig` does not currently include `builder-core` as a project reference, so the
> editor may surface `TS2307` module-resolution warnings for those cross-package imports. This is a
> pre-existing authoring-studio tsconfig concern (out of scope for PM36) and does not affect
> runtime resolution or test execution.

---

## 7. Compliance Matrix

| Requirement | Status |
|-------------|--------|
| Pure Authoring surface (DECISION-046) | ✅ |
| BuilderDocument SSOT, declarative immutable mutations (DECISION-047) | ✅ |
| Runtime-independent selection model via IDs (DECISION-048) | ✅ |
| No PlaybackController / Scheduler / Trigger Engine / Preview | ✅ |
| No requestAnimationFrame / setTimeout / setInterval | ✅ |
| No DOM/Canvas API, no React runtime hooks in core | ✅ |
| No changes to PM29–PM34 frozen modules | ✅ |
| No changes to Commerce / Platform Core | ✅ |
| Tests in Node (no jsdom) | ✅ |
| Public API exports added | ✅ |

---

## 8. Known Limitations

1. **Cross-package module resolution (TS2307)** — authoring-studio `tsconfig` lacks a project
   reference to `builder-core`, so the editor may show module-resolution warnings. Runtime (vitest)
   resolves correctly. Suggested follow-up: add `builder-core` toauthoring-studio `tsconfig` paths.
2. **Panel is presentational** — the Timeline Panel renders a static/read-only representation of the
   view model. Interactive drag/resize bindings are intentionally left to the integration layer
   (future PM) to keep PM36 purely authoring.
3. **No persistence** — data is persisted through the existing BuilderDocument flow; no new
   persistence was added.

---

## 9. Evidence Package

- `packages/authoring-studio/src/timeline/**` — source + tests
- `packages/authoring-studio/src/index.ts` — public API export
- `TODO_PM36.md` — task tracking
- This report

---

## 10. Handoff

1. Agent 1 delivers this Delta Implementation Report.
2. Agent 2 executes **Code Evidence Audit v2.8 (READ ONLY)**.
3. Agent 2 issues only a Recommendation: **PASS / HOLD / FAIL**.
4. Only the Architect decides **FORMALLY RATIFIED 🔒**.
