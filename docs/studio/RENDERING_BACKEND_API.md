# Visual Rendering Backend API Reference — Sprint S11

## Module: `packages/authoring-studio/src/rendering`

### Interfaces & Contracts

#### `RendererBackend`
Core interface contract for rendering backends.
- `initialize(surface: RendererSurface): void`
- `beginFrame(frameIndex: number, timestampMs: number): void`
- `executeCommands(commands: ReadonlyArray<RendererCommand>): void`
- `endFrame(): void`
- `getState(): RendererState`
- `destroy(): void`

#### `RendererSurface`
Abstraction wrapper for target canvas surface.
- `width: number`
- `height: number`
- `devicePixelRatio: number`
- `resize(width: number, height: number, dpr?: number): void`
- `getSurfaceContext(): RendererSurfaceContext`

#### `RendererCommand`
Union type of serializable drawing & state commands:
- `SAVE`
- `RESTORE`
- `SET_TRANSFORM` (Matrix2DAffine: `[a, b, c, d, e, f]`)
- `SET_OPACITY` (number 0..1)
- `SET_BLEND_MODE` (string e.g. `'source-over'`, `'multiply'`)
- `RESTRICT_CLIP` (bounds: `{ x, y, width, height }`)
- `CLEAR` (color?: string)
- `DRAW_RECT` (nodeId, bounds, fillStyle, strokeStyle, strokeWidth, cornerRadius)
- `DRAW_IMAGE` (nodeId, bounds, src, objectFit)
- `DRAW_TEXT` (nodeId, bounds, text, font, fontSize, fillStyle, align, baseline)

---

### Implementation Classes

#### `CanvasRenderer`
Implements `RendererBackend` executing instructions on a 2D Canvas context.

#### `CanvasRenderSurface`
Implements `RendererSurface` wrapping `HTMLCanvasElement`, `OffscreenCanvas`, or mock context.

#### `RenderCommandCompiler`
- `compile(frame: RenderFrame, options?: CompilerOptions): ReadonlyArray<RendererCommand>`
Translates S10 `RenderFrame` DTO into `RendererCommand[]`.

#### `RenderCommandExecutor`
- `executeCommands(backend: RendererBackend, commands: ReadonlyArray<RendererCommand>, frameIndex?: number, timestampMs?: number): void`
Dispatches command arrays to a `RendererBackend`.

#### `RenderCache`
- `get(keyDto: RenderCacheKeyDTO): ReadonlyArray<RendererCommand> | undefined`
- `set(keyDto: RenderCacheKeyDTO, commands: ReadonlyArray<RendererCommand>): void`
- `invalidateRevision(docRevision: string): number`
LRU caching for compiled command buffers.

#### `PreviewRendererConnector`
- `renderPlayheadTime(timestampMs: number, timelines?: ReadonlyArray<AnimationTimeline>): PreviewRenderResult`
Connects playhead changes directly to `RenderingEngine`, `RenderCommandCompiler`, `RenderCache`, and `CanvasRenderer`.

#### `RenderedFrameExporter`
- `exportRenderedFrames(document, timelines, job, backend?): RenderedFrameExportPackage`
Bridge connecting rendered visual outputs with S10 `ExportPipeline` and PM41 `AnimationExportPipeline`.
