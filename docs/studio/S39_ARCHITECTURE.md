# S39 Architecture Specification — Multi-Timeline Preview Orchestration & Environmental Trigger Runtime Sync

> **Subsystem:** Authoring Studio — Multi-Timeline Preview Orchestration & Environmental Trigger Runtime Sync (Sprint S39 / PM39)  
> **Author:** Agent 1 — Senior Architect & Planning Agent  
> **Status:** PROPOSED — READ-ONLY ARCHITECTURE SPECIFICATION (S39-A REVISED REPAIR)  
> **Dependencies:** `builder-core` (`BuilderDocument`, `SectionNode`, `AnimationTypes`, `AnimationTimeline`, `HistoryStack`, `AnimationPlaybackController`, `RuntimeScheduler`, `AnimationRuntimeBridge`, `AnimationRuntimePreviewAdapter`, `AnimationTriggerEngine`, `AnimationTriggerBridge`, `AnimationPreviewContract`), S36 Timeline Editor (`timelineDocumentBinding`), S37 Studio Single Time Owner (`TimelineStudioBridge`, `TimelinePlaybackSession`), S38 Live Canvas Sync (`PreviewRuntimeCoordinator`, `LiveScrubbingEngine`, `PreviewPlayheadSync`, `PreviewSelectionSync`)

---

## 1. Executive Summary & Core Objective

Sprint S39 delivers the **Multi-Timeline Preview Orchestration & Environmental Trigger Runtime Synchronization layer** within Authoring Studio (`packages/authoring-studio/src/preview/`).

While S38 established single-timeline live canvas playback and playhead scrubbing synchronization, real-world authoring documents contain **multiple animated nodes** (`heroNode`, `cardNode1`, `cardNode2`, `footerNode`) driven by diverse environmental triggers (`onLoad`, `inView`, `hover`, `click`, `scroll`).

S39 answers the central multi-node preview integration challenge:

$$\begin{matrix}
\text{BuilderDocument (SSOT)} \\
\downarrow \text{Scan node.props['animationTimeline']} \\
\text{StudioTimelineRegistry} \\
\downarrow \text{Binds timelines \& triggers} \\
\text{PreviewTriggerMessage} \longrightarrow \text{StudioTriggerOrchestrator} \xrightarrow{\text{AnimationTriggerEngine}} \text{Activated Triggers} \\
\downarrow \\
\text{StudioMultiTimelineCoordinator} \xrightarrow[\text{Single Owner of Time}]{\text{TimelineStudioBridge}} \text{AnimationRuntimeBridge} \xrightarrow{\text{evaluateFrame()}} \text{RuntimeFrameBatch} \\
\downarrow \\
\text{Live Canvas / Host Renderer (onRenderFrame Callback)}
\end{matrix}$$

### Key Architectural Pillars:

1. **Document-Wide Timeline Discovery (StudioTimelineRegistry [NEW]):** Scans `BuilderDocument` SSOT immutably for all `AnimationTimeline` DTOs attached to section nodes (`node.props['animationTimeline']`) and registers them in a central, pure lookup registry.
2. **Environmental Trigger Runtime Integration (StudioTriggerOrchestrator [NEW]):** Connects `builder-core` `AnimationRuntimePreviewAdapter` and `AnimationTriggerBridge` to Authoring Studio. Translates serializable environmental messages (`SCROLL_EVENT`, `HOVER_EVENT`, `CLICK_EVENT`, `INTERSECTION_EVENT`, `VIEWPORT_RESIZE_EVENT`) into trigger state transitions (`WAITING` $\rightarrow$ `ACTIVE` $\rightarrow$ `FINISHED`).
3. **Single Owner of Time Preservation (DECISION-042 / DECISION-056 / DECISION-060):** `AnimationPlaybackController` constructor signature is strictly `new AnimationPlaybackController({ duration, speed?, loop?, direction? })`. `TimelineStudioBridge` is the EXCLUSIVE owner of `AnimationPlaybackController` instances. `StudioTriggerOrchestrator` and `StudioMultiTimelineCoordinator` **never** construct secondary playback controllers and **never** run custom clock math.
4. **Dispatcher-Only Canvas Boundary (Option B Boundary / F-39-03):** `StudioMultiTimelineCoordinatorDependencies` defines `onRenderFrame?: MultiNodeRenderFrameCallback` (`(nodeId: string, batch: RuntimeFrameBatch) => void`). Evaluated `RuntimeFrameBatch` objects for all triggered nodes are dispatched directly to host-provided `onRenderFrame` callbacks. S39 creates ZERO DOM/CSS rendering engines and ZERO canvas adapter classes.
5. **Zero Document Mutation & Zero History Pollution:** Preview trigger evaluations and playhead scrubbing operate in 100% READ-ONLY mode. `JSON.stringify(docBefore) === JSON.stringify(docAfter)` and `HistoryStack` length remains completely unchanged during all preview interactions.

---

## 2. Scope Definition & Baseline Classification

### 2.1 Scope & Non-Goals

| In Scope for Sprint S39 | Non-Goals / Excluded from S39 |
|---|---|
| Multi-timeline discovery across `BuilderDocument` nodes | Production DOM/CSS keyframe animation rendering engine |
| Environmental trigger message routing (`SCROLL`, `HOVER`, `CLICK`, `INTERSECTION`, `RESIZE`) | Custom browser clock / `requestAnimationFrame` in domain layer |
| Trigger state lifecycle management (`WAITING` $\rightarrow$ `ACTIVE` $\rightarrow$ `FINISHED`) | Mutation of `BuilderDocument` during preview triggers |
| Multi-node frame evaluation & batch dispatching | Modification of frozen S1–S38 subsystems or `builder-core` |
| Tri-directional selection sync across multi-node documents | Secondary playback controllers or duplicate schedulers |

### 2.2 Formal Repository Baseline Classification (F-39-04 & F-39-05)

```
=====================================================================================
                      S39 REPOSITORY BASELINE CLASSIFICATION
=====================================================================================
  Target Directory:          packages/authoring-studio/src/preview/
  Frozen Subsystems:         packages/builder-core/* (PM29–PM34), S1–S38
  S39 Candidate Subsystem:   Multi-Timeline Preview Orchestration & Triggers
  S39 Dedicated Config:      packages/authoring-studio/tsconfig.s39.json [NEW PLAN]
  Git Status Governance:     animation/, timeline/, preview/ directories contain
                             pre-existing untracked files (contractual baseline).
                             S39 produces 0 edits on frozen baseline files.
=====================================================================================
```

- **Tier 1 — S1–S38 Frozen Subsystems (READ-ONLY / FROZEN):**
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
- **Tier 2 — Pre-Existing Legacy Utility Classification:**
  PM39 authoring UX modules (`TimelineEasingEditor.ts`, `TimelineKeyframeAuthoring.ts`, `TimelineMultiSelection.ts`, `TimelineClipboard.ts`, etc.) and PM40 productivity modules (`TimelineSmartGuides.ts`, `TimelineSnapEngine.ts`, `TimelineOnionSkin.ts`, etc.) in `packages/authoring-studio/src/timeline/` are classified as **LEGACY / PM39 / PM40 AUTHORING UTILITIES** and remain untouched.
- **Tier 3 — S39-Owned Modules [NEW]:**
  - `packages/authoring-studio/src/preview/StudioTimelineRegistry.ts` `[NEW]`
  - `packages/authoring-studio/src/preview/StudioTriggerOrchestrator.ts` `[NEW]`
  - `packages/authoring-studio/src/preview/StudioMultiTimelineCoordinator.ts` `[NEW]`
  - `packages/authoring-studio/src/preview/index.ts` `[MODIFY]`

---

## 3. Subsystem Architecture & Multi-Timeline Data Flow

```
+-----------------------------------------------------------------------------------+
|                           BuilderDocument (SSOT)                                  |
|   node.props['animationTimeline'] -> AnimationTimeline DTOs (Immutable Config)     |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (Discovers All Timelines)
+-----------------------------------------------------------------------------------+
|             StudioTimelineRegistry (packages/authoring-studio/src/preview/)       |
|   - Maps nodeId -> AnimationTimeline                                              |
|   - Provides immutable timeline index snapshot                                    |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (Registers Triggers & Timelines)
+-----------------------------------------------------------------------------------+
|           StudioTriggerOrchestrator (packages/authoring-studio/src/preview/)      |
|   - AnimationRuntimePreviewAdapter (builder-core: Message Mapper)                 |
|   - AnimationTriggerBridge (builder-core: Trigger -> Controller Binding)          |
|   - Processes PreviewTriggerMessages (SCROLL, HOVER, CLICK, INTERSECTION)          |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (Triggers Playback on Owning Controllers)
+-----------------------------------------------------------------------------------+
|               TimelineStudioBridge Instances (Per-Node Single Owner of Time)       |
|   - AnimationPlaybackController.play() -> status: 'playing'                       |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (Evaluates Frame Batches)
+-----------------------------------------------------------------------------------+
|         StudioMultiTimelineCoordinator (packages/authoring-studio/src/preview/)   |
|   - Evaluates active node frames via AnimationRuntimeBridge                       |
|   - Assembles multi-node RuntimeFrameBatch Map                                    |
|   - Dispatches batches to host-provided onRenderFrame callback                    |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                     Live Canvas / Host Renderer (Callback)                        |
+-----------------------------------------------------------------------------------+
```

---

## 4. Governance & Architectural Decisions

### DECISION-060 — Single Time Owner Ownership & Controller Construction (F-39-01)
`AnimationPlaybackController` constructor signature is strictly `new AnimationPlaybackController(config: PlaybackControllerConfig)` (`{ duration: number, speed?: number, loop?: boolean, direction?: RuntimePlaybackDirection }`).
`TimelineStudioBridge` is the EXCLUSIVE owner of `AnimationPlaybackController` instances (`bridge.selectTimeline(timeline)` instantiates `new AnimationPlaybackController({ duration, speed, loop })`).
`StudioTriggerOrchestrator` and `StudioMultiTimelineCoordinator` **never** construct `AnimationPlaybackController` instances directly and **never** manage secondary playback engines or clock math.

### DECISION-061 — Zero Document Mutation & Zero History Pollution
Evaluating triggers, processing environmental preview messages (`SCROLL`, `HOVER`, `CLICK`, `INTERSECTION`), and dispatching runtime frame batches MUST NOT mutate `BuilderDocument` (`JSON.stringify(docBefore) === JSON.stringify(docAfter)`) and MUST NOT push transactions onto `HistoryStack`.

### DECISION-062 — Strict Dependency Injection & Option B Consumer Boundary (F-39-03)
All orchestrators (`StudioTimelineRegistry`, `StudioTriggerOrchestrator`, `StudioMultiTimelineCoordinator`) receive dependencies via constructor interfaces. Global singletons and ambient state are strictly forbidden. `StudioMultiTimelineCoordinatorDependencies` defines `onRenderFrame?: MultiNodeRenderFrameCallback` as the sole external consumer boundary.

---

## 5. Verified Existing API Inventory & Real Export Signatures (F-39-01 Verification)

Every symbol referenced in S39 has been verified directly against existing production source code:

| Symbol Name | Source File Path | Verified Signature / Type | Responsibilities & Status |
|---|---|---|---|
| `BuilderDocument` | `packages/builder-core/src/BuilderDocument.ts` | `interface BuilderDocument { id, tenantId, metadata, pages, version, updatedAt }` | SSOT Document model (**FROZEN**) |
| `SectionNode` | `packages/builder-core/src/BuilderDocument.ts` | `interface SectionNode { id, type, label, props, children }` | Node hierarchy model (**FROZEN**) |
| `inspectNodeAnimation` | `packages/authoring-studio/src/inspector/animationDocumentBinding.ts` | `(doc: BuilderDocument, nodeId: string): AnimationTimeline \| null` | SSOT timeline extractor (**REUSE / READ-ONLY**) |
| `AnimationTimeline` | `packages/builder-core/src/animation/AnimationTypes.ts` | `interface AnimationTimeline { id, targetNodeId, trigger, playback, clips }` | Timeline domain DTO (**FROZEN**) |
| `RuntimeFrameBatch` | `packages/builder-core/src/animation/AnimationRuntimeTypes.ts` | `interface RuntimeFrameBatch { clipId, time, values }` | Resolved frame payload (**FROZEN**) |
| `PlaybackControllerConfig` | `packages/builder-core/src/animation/AnimationPlaybackController.ts` | `interface PlaybackControllerConfig { duration: number; speed?: number; loop?: boolean; direction?: RuntimePlaybackDirection }` | Controller configuration interface (**FROZEN**) |
| `AnimationPlaybackController` | `packages/builder-core/src/animation/AnimationPlaybackController.ts` | `new AnimationPlaybackController(config: PlaybackControllerConfig)` | Single Owner of Time engine owned by `TimelineStudioBridge` (**FROZEN**) |
| `AnimationRuntimePreviewAdapter` | `packages/builder-core/src/animation/AnimationRuntimePreviewAdapter.ts` | `new AnimationRuntimePreviewAdapter(engine)` | Preview trigger message mapper (**FROZEN**) |
| `AnimationTriggerBridge` | `packages/builder-core/src/animation/AnimationTriggerBridge.ts` | `new AnimationTriggerBridge()` | Trigger-to-playback controller bridge (**FROZEN**) |
| `PreviewTriggerMessage` | `packages/builder-core/src/animation/AnimationPreviewContract.ts` | `type PreviewTriggerMessage = Scroll \| Hover \| Click \| Intersection \| ViewportResize` | Environmental message contract (**FROZEN**) |
| `TimelineStudioBridge` | `packages/authoring-studio/src/timeline/TimelineStudioBridge.ts` | `new TimelineStudioBridge()` | Studio runtime integration bridge (**FROZEN**) |
| `PreviewRuntimeCoordinator` | `packages/authoring-studio/src/preview/PreviewRuntimeCoordinator.ts` | `new PreviewRuntimeCoordinator(deps)` | Single-timeline live canvas coordinator (**FROZEN**) |

---

## 6. Public API Manifest for Sprint S39 `[NEW]` (F-39-02 Harmonized)

The following new symbols will be introduced in `packages/authoring-studio/src/preview/`:

```typescript
// S39 Multi-Timeline Preview Orchestration & Environmental Triggers Manifest

// Component 1 — StudioTimelineRegistry
export interface StudioTimelineEntry {
  readonly nodeId: string;
  readonly timeline: AnimationTimeline;
}

export class StudioTimelineRegistry {
  constructor();
  scanDocument(doc: BuilderDocument): ReadonlyMap<string, AnimationTimeline>;
  getTimelineForNode(nodeId: string): AnimationTimeline | null;
  getAllTimelines(): ReadonlyArray<StudioTimelineEntry>;
}

export function createStudioTimelineRegistry(): StudioTimelineRegistry;
export function scanDocumentTimelines(doc: BuilderDocument): ReadonlyMap<string, AnimationTimeline>;

// Component 2 — StudioTriggerOrchestrator
export interface StudioTriggerOrchestratorDependencies {
  registry: StudioTimelineRegistry;
  previewAdapter: AnimationRuntimePreviewAdapter;
  triggerBridge: AnimationTriggerBridge;
}

export class StudioTriggerOrchestrator {
  constructor(deps: StudioTriggerOrchestratorDependencies);
  bindNodeController(nodeId: string, controller: AnimationPlaybackController): void;
  processPreviewMessage(message: PreviewTriggerMessage): ReadonlyArray<string>;
  resetAllTriggers(): void;
}

export function createStudioTriggerOrchestrator(
  deps: StudioTriggerOrchestratorDependencies
): StudioTriggerOrchestrator;

// Component 3 — StudioMultiTimelineCoordinator
export interface MultiNodeRenderFrameCallback {
  (nodeId: string, batch: RuntimeFrameBatch): void;
}

export interface StudioMultiTimelineCoordinatorDependencies {
  document: BuilderDocument;
  registry: StudioTimelineRegistry;
  triggerOrchestrator: StudioTriggerOrchestrator;
  bridges: ReadonlyMap<string, TimelineStudioBridge>;
  onRenderFrame?: MultiNodeRenderFrameCallback;
}

export class StudioMultiTimelineCoordinator {
  constructor(deps: StudioMultiTimelineCoordinatorDependencies);
  updateDocument(doc: BuilderDocument): void;
  processEnvironmentSignal(message: PreviewTriggerMessage): Map<string, RuntimeFrameBatch>;
  evaluateAllActiveFrames(): Map<string, RuntimeFrameBatch>;
}

export function createStudioMultiTimelineCoordinator(
  deps: StudioMultiTimelineCoordinatorDependencies
): StudioMultiTimelineCoordinator;
```

---

## 7. Golden E2E Workflow Design (`StudioMultiTimelinePreviewE2E.test.ts`)

The Golden E2E Integration Test for Sprint S39 proves multi-timeline discovery, environmental trigger routing, and zero document mutation:

```
 1. Create BuilderDocument with 2 SectionNodes (heroNode, footerNode) via canonical production factories.
 2. Attach distinct AnimationTimeline DTOs to each node:
    - heroNode: trigger type 'onLoad', opacity track (0ms -> 1000ms).
    - footerNode: trigger type 'inView' (threshold 0.5), scale track (0ms -> 500ms).
 3. Instantiate StudioTimelineRegistry and scan document -> verify 2 timelines discovered.
 4. Instantiate TimelineStudioBridge for heroNode and footerNode (Single Owners of Time via selectTimeline).
 5. Instantiate StudioTriggerOrchestrator & StudioMultiTimelineCoordinator injecting registry, bridges, and host onRenderFrame callback.
 6. Dispatch 'INTERSECTION_EVENT' message for footerNode (visibilityRatio: 0.8 >= threshold 0.5).
 7. Verify footerNode trigger transitions to 'ACTIVE' and footerNode controller status === 'playing'.
 8. Advance time by 250ms -> evaluate multi-node frame batches via coordinator.
 9. Verify heroNode batch evaluated at time 0 (waiting) and footerNode batch evaluated at 250ms with scaled transform value.
10. Dispatch frame batch map to host-provided onRenderFrame callback harness.
11. VERIFY SSOT INTEGRITY & ZERO DOCUMENT MUTATION:
    JSON.stringify(docBefore) === JSON.stringify(docAfter) and HistoryStack length is 100% unchanged.
```

---

## 8. Summary of Architectural Guarantees & Quality Gates

- **0 Code Modifications in S39-A:** READ-ONLY specification phase complete.
- **0 Phantom APIs (F-39-01 / F-39-02):** `AnimationPlaybackController` signature updated to `new AnimationPlaybackController(config)`. All `[NEW]` symbols 100% harmonized.
- **Single Owner of Time Preserved (DECISION-060):** All playback delegates to `AnimationPlaybackController` inside `TimelineStudioBridge`.
- **Quality Gates & Fresh-Gate Procedure (F-39-04 / F-39-07):**
  - Fresh-gate script: Clear tsconfig.s39.tsbuildinfo and Vitest cache $\rightarrow$ `typecheck:s39` (0 errors) $\rightarrow$ Golden E2E (1/1 PASS) $\rightarrow$ `npm run build` (exit 0).
  - Subsystem Freeze Gate: Verified against explicit file list (0 edits on frozen files).
