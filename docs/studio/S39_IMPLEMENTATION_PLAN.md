# S39 Implementation Plan — Multi-Timeline Preview Orchestration & Environmental Trigger Runtime Sync

> **Subsystem:** Authoring Studio — Multi-Timeline Preview Orchestration & Environmental Trigger Runtime Sync (Sprint S39 / PM39)  
> **Author:** Agent 1 — Senior Architect & Planning Agent  
> **Status:** PROPOSED — READ-ONLY IMPLEMENTATION PLAN (S39-A REVISED REPAIR)  
> **Dependencies:** `builder-core` (`BuilderDocument`, `SectionNode`, `AnimationTypes`, `AnimationTimeline`, `HistoryStack`, `AnimationPlaybackController`, `RuntimeScheduler`, `AnimationRuntimeBridge`, `AnimationRuntimePreviewAdapter`, `AnimationTriggerEngine`, `AnimationTriggerBridge`, `AnimationPreviewContract`), S36 Timeline Editor (`timelineDocumentBinding`), S37 Studio Single Time Owner (`TimelineStudioBridge`, `TimelinePlaybackSession`), S38 Live Canvas Sync (`PreviewRuntimeCoordinator`, `LiveScrubbingEngine`, `PreviewPlayheadSync`, `PreviewSelectionSync`)

---

## 1. Executive Summary & Sprint Goal

Sprint S39 extends Authoring Studio's animation preview capability from single-timeline preview playback (S38) to **document-wide multi-timeline orchestration driven by environmental triggers** (`onLoad`, `inView`, `hover`, `click`, `scroll`).

### Absolute Rules & Constraints:
1. **NO Production Code Edits in S39-A:** S39-A is 100% READ-ONLY discovery and architecture specification.
2. **ZERO Frozen Subsystem Edits:** `builder-core/*`, `BuilderDocument.ts`, `HistoryStack.ts`, `AnimationPlaybackController.ts`, `TimelineStudioBridge.ts`, `TimelinePlaybackSession.ts`, and S1–S38 subsystems remain 100% frozen (0 edits).
3. **ZERO Phantom APIs (F-39-01):** `AnimationPlaybackController` constructor signature is strictly `new AnimationPlaybackController(config: PlaybackControllerConfig)`. Every symbol referenced in S39 maps to verified existing exports or explicitly declared `[NEW]` S39 symbols.
4. **Single Owner of Time (DECISION-060):** Every active timeline delegates playback exclusively to its owning `AnimationPlaybackController` instance inside `TimelineStudioBridge`. S39 components **never** manage custom clock math or instantiate secondary controllers.
5. **Option B Render Dispatch Boundary (F-39-03):** `StudioMultiTimelineCoordinator` dispatches evaluated `RuntimeFrameBatch` objects to host-provided `onRenderFrame` callbacks (`(nodeId: string, batch: RuntimeFrameBatch) => void`). 0 DOM/CSS rendering engines and 0 canvas adapter classes created.
6. **SSOT Preservation:** `BuilderDocument` (`node.props['animationTimeline']`) is the single source of truth. All preview trigger evaluations and playhead scrubbing operate in 100% READ-ONLY mode (`JSON.stringify(docBefore) === JSON.stringify(docAfter)`).

---

## 2. Component & File Manifest (F-39-02 Harmonized)

### Component 1 — Foundation & SSOT Timeline Discovery (`StudioTimelineRegistry`)

#### `[NEW]` [StudioTimelineRegistry.ts](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/preview/StudioTimelineRegistry.ts)
- **Status:** `[NEW]`
- **Responsibility:** Immutably scans a `BuilderDocument` SSOT for all attached `AnimationTimeline` DTOs (`node.props['animationTimeline']`) across all pages and sections. Builds a read-only index mapping `nodeId` $\rightarrow$ `AnimationTimeline`.
- **Real APIs / Exports:**
  - `StudioTimelineEntry` `[NEW]`
  - `StudioTimelineRegistry` `[NEW]`
  - `createStudioTimelineRegistry` `[NEW]`
  - `scanDocumentTimelines` `[NEW]`
- **Dependencies:** `BuilderDocument`, `SectionNode` from `builder-core/src/BuilderDocument`, `inspectNodeAnimation` from `authoring-studio/src/inspector/animationDocumentBinding`.
- **Freeze Constraints:** 0 edits in `BuilderDocument.ts` or `animationDocumentBinding.ts`.

---

### Component 2 — Studio Environmental Trigger Orchestrator (`StudioTriggerOrchestrator`)

#### `[NEW]` [StudioTriggerOrchestrator.ts](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/preview/StudioTriggerOrchestrator.ts)
- **Status:** `[NEW]`
- **Responsibility:** Connects `builder-core` `AnimationRuntimePreviewAdapter` and `AnimationTriggerBridge` into Authoring Studio. Registers node timeline triggers, receives serializable environmental messages (`SCROLL_EVENT`, `HOVER_EVENT`, `CLICK_EVENT`, `INTERSECTION_EVENT`), evaluates trigger transitions (`WAITING` $\rightarrow$ `ACTIVE`), and triggers playback on owning `TimelineStudioBridge` controllers.
- **Real APIs / Exports:**
  - `StudioTriggerOrchestratorDependencies` `[NEW]`
  - `StudioTriggerOrchestrator` `[NEW]`
  - `createStudioTriggerOrchestrator` `[NEW]`
- **Dependencies:** `AnimationRuntimePreviewAdapter`, `AnimationTriggerBridge`, `PreviewTriggerMessage` from `builder-core/src/animation/`, `TimelineStudioBridge` from `authoring-studio/src/timeline/TimelineStudioBridge`.
- **Freeze Constraints:** 0 edits in `AnimationRuntimePreviewAdapter.ts`, `AnimationTriggerBridge.ts`, or `TimelineStudioBridge.ts`.

---

### Component 3 — Multi-Timeline Live Canvas Coordinator (`StudioMultiTimelineCoordinator`)

#### `[NEW]` [StudioMultiTimelineCoordinator.ts](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/preview/StudioMultiTimelineCoordinator.ts)
- **Status:** `[NEW]`
- **Responsibility:** High-level orchestrator managing preview state across all document timelines. Evaluates active node frames via `AnimationRuntimeBridge.evaluateFrame()`, assembles a multi-node frame batch map (`nodeId` $\rightarrow$ `RuntimeFrameBatch`), and dispatches resolved frame batches to host-provided `onRenderFrame` callbacks (`(nodeId: string, batch: RuntimeFrameBatch) => void`).
- **Real APIs / Exports:**
  - `MultiNodeRenderFrameCallback` `[NEW]`
  - `StudioMultiTimelineCoordinatorDependencies` `[NEW]`
  - `StudioMultiTimelineCoordinator` `[NEW]`
  - `createStudioMultiTimelineCoordinator` `[NEW]`
- **Dependencies:** `StudioTimelineRegistry`, `StudioTriggerOrchestrator`, `AnimationRuntimeBridge`, `RuntimeFrameBatch` from `builder-core/src/animation/`.
- **Freeze Constraints:** 0 edits in `AnimationRuntimeBridge.ts`.

---

### Component 4 — Barrel Export & TypeScript Configuration

#### `[MODIFY]` [index.ts](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/preview/index.ts)
- **Status:** `[MODIFY]`
- **Responsibility:** Exports public S39 preview orchestrator types and classes alongside existing S38 preview exports.

#### `[NEW]` [tsconfig.s39.json](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/tsconfig.s39.json)
- **Status:** `[NEW PLAN]` (Prepared during S39-B/C implementation)
- **Responsibility:** Dedicated TypeScript configuration ensuring isolated, clean typecheck for S39 preview orchestration.

---

## 3. Existing & Reused API Reference Table (F-39-01 Constructor Corrected)

The following existing, ratified production APIs will be reused strictly as READ-ONLY dependencies:

| Existing Symbol | File Location | Exported Signature / Type | Usage in S39 |
|---|---|---|---|
| `BuilderDocument` | `packages/builder-core/src/BuilderDocument.ts` | `interface BuilderDocument { pages, version, metadata }` | SSOT Document reference |
| `inspectNodeAnimation` | `packages/authoring-studio/src/inspector/animationDocumentBinding.ts` | `(doc: BuilderDocument, nodeId: string): AnimationTimeline \| null` | Inspect node timelines |
| `AnimationTimeline` | `packages/builder-core/src/animation/AnimationTypes.ts` | `interface AnimationTimeline { id, targetNodeId, trigger, playback, clips }` | Animation DTO |
| `RuntimeFrameBatch` | `packages/builder-core/src/animation/AnimationRuntimeTypes.ts` | `interface RuntimeFrameBatch { clipId, time, values }` | Frame batch payload |
| `PlaybackControllerConfig` | `packages/builder-core/src/animation/AnimationPlaybackController.ts` | `interface PlaybackControllerConfig { duration: number; speed?: number; loop?: boolean; direction?: RuntimePlaybackDirection }` | Controller configuration interface |
| `AnimationPlaybackController` | `packages/builder-core/src/animation/AnimationPlaybackController.ts` | `new AnimationPlaybackController(config: PlaybackControllerConfig)` | Single Owner of Time engine owned by `TimelineStudioBridge` |
| `AnimationRuntimePreviewAdapter` | `packages/builder-core/src/animation/AnimationRuntimePreviewAdapter.ts` | `new AnimationRuntimePreviewAdapter(engine)` | Message mapper |
| `AnimationTriggerBridge` | `packages/builder-core/src/animation/AnimationTriggerBridge.ts` | `new AnimationTriggerBridge()` | Trigger to controller bridge |
| `PreviewTriggerMessage` | `packages/builder-core/src/animation/AnimationPreviewContract.ts` | `type PreviewTriggerMessage` | Environmental signal |
| `TimelineStudioBridge` | `packages/authoring-studio/src/timeline/TimelineStudioBridge.ts` | `new TimelineStudioBridge()` | Studio runtime bridge |

---

## 4. Golden E2E Test Suite Specification

### Test File Path:
`packages/authoring-studio/src/preview/__tests__/StudioMultiTimelinePreviewE2E.test.ts`

### Test Workflow Steps:
1. **Document Setup:** Create `BuilderDocument` with `heroNode` and `footerNode` via canonical factories.
2. **Timeline Attachment:** Attach `onLoad` timeline to `heroNode` and `inView` timeline (threshold 0.5) to `footerNode`.
3. **Registry Discovery:** Instantiate `StudioTimelineRegistry` and run `scanDocument(doc)` $\rightarrow$ verify 2 timelines discovered.
4. **Bridge & Orchestrator Instantiation:** Create `TimelineStudioBridge` instances for both nodes (which own the `AnimationPlaybackController` instances) and inject into `StudioTriggerOrchestrator` & `StudioMultiTimelineCoordinator` with host `onRenderFrame` callback.
5. **Environmental Trigger Signal:** Send `INTERSECTION_EVENT` (visibilityRatio: 0.8) for `footerNode`.
6. **Trigger Lifecycle Verification:** Verify `footerNode` trigger transitions to `'ACTIVE'` and `footerNode` playback controller status === `'playing'`.
7. **Multi-Node Frame Evaluation:** Advance playhead by 250ms $\rightarrow$ evaluate frame batches for all active nodes.
8. **Payload Evidence Verification:** Verify `heroNode` batch at 0ms and `footerNode` batch at 250ms (with exact interpolated transform scale).
9. **SSOT Integrity Verification:** Confirm `JSON.stringify(docBefore) === JSON.stringify(docAfter)` and `HistoryStack` length is completely unchanged.

---

## 5. Quality Gates & Freeze Boundaries (F-39-04 & F-39-05)

### Explicit Frozen Baseline File List:
S39 implementation MUST produce 0 edits on the following frozen baseline files:
- `packages/builder-core/src/BuilderDocument.ts`
- `packages/builder-core/src/HistoryStack.ts`
- `packages/builder-core/src/animation/AnimationPlaybackController.ts`
- `packages/builder-core/src/animation/AnimationRuntimeBridge.ts`
- `packages/builder-core/src/animation/AnimationTriggerEngine.ts`
- `packages/builder-core/src/animation/AnimationRuntimePreviewAdapter.ts`
- `packages/builder-core/src/animation/AnimationTriggerBridge.ts`
- `packages/authoring-studio/src/timeline/TimelineStudioBridge.ts`
- `packages/authoring-studio/src/timeline/TimelinePlaybackSession.ts`
- `packages/authoring-studio/src/preview/PreviewRuntimeCoordinator.ts`
- `packages/authoring-studio/src/preview/LiveScrubbingEngine.ts`
- `packages/authoring-studio/src/preview/PreviewPlayheadSync.ts`
- `packages/authoring-studio/src/preview/PreviewSelectionSync.ts`
- `packages/authoring-studio/src/preview/KeyframeDragPreview.ts`

Note: Pre-existing untracked files in `packages/builder-core/src/animation/`, `packages/authoring-studio/src/timeline/`, and `packages/authoring-studio/src/preview/` constitute contractual baseline. S39 produces 0 changes on these files.

---

## 6. Fresh-Gate Execution Procedure (F-39-07)

To ensure that results are 100% fresh and un-cached, Agent 2 and automated gate runners MUST execute the following exact sequence:

```powershell
# Step 1: Invalidate S39 build info cache
Remove-Item packages/authoring-studio/tsconfig.s39.tsbuildinfo -Force -ErrorAction SilentlyContinue

# Step 2: Clean Vitest/Vite cache
Remove-Item node_modules/.vitest -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item node_modules/.vite -Recurse -Force -ErrorAction SilentlyContinue

# Step 3: Execute dedicated S39 Typecheck Gate
npm run typecheck:s39
# EXPECTED RESULT: Exit code 0 (0 errors)

# Step 4: Execute S39 Golden E2E Test Suite
npx vitest run packages/authoring-studio/src/preview/__tests__/StudioMultiTimelinePreviewE2E.test.ts
# EXPECTED RESULT: Exit code 0 (1/1 PASS)

# Step 5: Execute S39 Preview Subsystem Regression
npx vitest run packages/authoring-studio/src/preview/__tests__/
# EXPECTED RESULT: Exit code 0 (100% PASS)

# Step 6: Execute Production Monorepo Build Gate
npm run build
# EXPECTED RESULT: Exit code 0
```

> **Governance Principle:** A result obtained from cache is NOT evidence ("Cached GREEN != Evidence"). Each gate step must report its actual exit code.

---

## 7. Governance & Hand-Off Status

- **S39-A Status:** FOCUSED DELTA REPAIR COMPLETED — READ-ONLY ARCHITECTURE & DISCOVERY
- **Code Edits in S39-A:** 0 production files modified, 0 test files created.
- **Next Governance Step:** Submit updated documentation package (`docs/studio/S39_ARCHITECTURE.md`, `docs/studio/S39_IMPLEMENTATION_PLAN.md`) to **Agent 2** for **Focused Delta Re-Audit F-39-01 $\rightarrow$ F-39-07**.
