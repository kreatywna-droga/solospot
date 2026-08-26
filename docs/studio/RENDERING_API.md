# Rendering Engine API Reference — Sprint S10

## Public Surface

All classes and interfaces are exported from `packages/builder-core/src/rendering/index.ts` and re-exported via `packages/builder-core/src/index.ts`.

---

## 1. Core Rendering API

### `RenderingEngine`
```typescript
class RenderingEngine {
  constructor(document: BuilderDocument, options?: RenderingEngineOptions);
  renderFrame(timestampMs: number, timelines?: ReadonlyArray<AnimationTimeline>): RenderFrame;
  exportAnimation(timelines: ReadonlyArray<AnimationTimeline>, job: RenderExportJob): RenderExportResult;
  getSession(): RenderSession;
  getProfiler(): PerformanceProfiler;
  updateDocument(doc: BuilderDocument): void;
}
```

### `RenderSession`
```typescript
class RenderSession {
  constructor(document: BuilderDocument, options?: RenderSessionOptions);
  getDocument(): BuilderDocument;
  getContext(): RenderContext;
  getGraph(): RenderGraph;
  setContext(overrides: Partial<RenderContext>): void;
  updateDocument(document: BuilderDocument): void;
  switchPage(pageId: string): void;
  getCachedFrame(frameIndex: number): RenderFrame | undefined;
  cacheFrame(frameIndex: number, frame: RenderFrame): void;
  clearCache(): void;
}
```

---

## 2. Timeline Evaluation API

### `TimelineEvaluator`
```typescript
class TimelineEvaluator {
  static evaluateTimeline(timeline: AnimationTimeline, timestampMs: number): EvaluatedTimelineResult;
  static evaluateClip(clip: AnimationClip, timestampMs: number, playbackOptions?: AnimationTimeline['playback']): { propertyMap: Record<string, unknown>; isFinished: boolean };
}
```

### `KeyframeInterpolator`
```typescript
class KeyframeInterpolator {
  static interpolateTrack(track: PropertyAnimationTrack, timeOffsetMs: number): unknown;
  static interpolateValues(startVal: unknown, endVal: unknown, ratio: number): unknown;
}
```

### `CurveEvaluator`
```typescript
class CurveEvaluator {
  static evaluate(t: number, curve?: EasingCurve): number;
}
```

---

## 3. Scene Composition API

### `SceneComposer`
```typescript
class SceneComposer {
  static composeScene(graph: RenderGraph, animatedPropsMap: Map<string, Record<string, unknown>>, previousNodesMap?: Map<string, RenderNodeState>): ComposedScene;
}
```

### `TransformResolver`
```typescript
class TransformResolver {
  static multiplyMatrices(a: Matrix3D, b: Matrix3D): Matrix3D;
  static resolveTransformMatrix(nodeId: string, graph: RenderGraph, computedPropsMap: Map<string, Record<string, unknown>>): Matrix3D;
}
```

---

## 4. Export API

### `ExportPipeline`
```typescript
class ExportPipeline {
  static executeExport(document: BuilderDocument, timelines: ReadonlyArray<AnimationTimeline>, job: RenderExportJob): RenderExportResult;
}
```

### `SpriteSheetGenerator`
```typescript
class SpriteSheetGenerator {
  static calculateMetadata(frameCount: number, frameWidth: number, frameHeight: number, maxColumns?: number): SpriteSheetMetadata;
}
```

---

## 5. Performance Profiling API

### `PerformanceProfiler`
```typescript
class PerformanceProfiler {
  start(): void;
  stop(): SessionMetricsSummary;
  recordFrame(record: FrameMetricRecord): void;
  getRecords(): ReadonlyArray<FrameMetricRecord>;
  getSummary(cacheHitRatio?: number): SessionMetricsSummary;
  clear(): void;
}
```
