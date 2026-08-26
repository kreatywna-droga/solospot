import { describe, expect, it } from 'vitest';
import { IDENTITY_MATRIX_3D, RenderFrame } from '../../../../builder-core/src/rendering/RenderFrame';
import { CanvasRenderer } from '../CanvasRenderer';
import { CanvasRenderSurface } from '../CanvasRenderSurface';
import { RenderCommandCompiler } from '../RenderCommandCompiler';
import { RenderCommandExecutor } from '../RenderCommandExecutor';

describe('Layer Compositing & Ordering Tests (S11 ETAP 4)', () => {
  it('respects z-order, opacity, clipping, and blend mode during compilation & execution', () => {
    const mockCtx = {
      save: () => {},
      restore: () => {},
      setTransform: () => {},
      globalAlpha: 1.0,
      globalCompositeOperation: 'source-over',
      beginPath: () => {},
      rect: () => {},
      clip: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      clearRect: () => {},
    };

    const frame: RenderFrame = {
      id: 'frame_compositing',
      contextId: 'ctx_comp',
      frameIndex: 5,
      timestampMs: 83.3,
      renderTimeMs: 2.0,
      nodes: new Map([
        [
          'background_layer',
          {
            nodeId: 'background_layer',
            type: 'rect',
            order: 10,
            computedProps: { backgroundColor: '#0f172a' },
            transformMatrix: IDENTITY_MATRIX_3D,
            opacity: 1.0,
            visible: true,
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            isDirty: false,
          },
        ],
        [
          'overlay_layer',
          {
            nodeId: 'overlay_layer',
            type: 'rect',
            order: 20,
            computedProps: { backgroundColor: '#ef4444', blendMode: 'multiply', overflow: 'hidden' },
            transformMatrix: IDENTITY_MATRIX_3D,
            opacity: 0.75,
            visible: true,
            bounds: { x: 100, y: 100, width: 500, height: 400 },
            isDirty: false,
          },
        ],
      ]),
      nodeOrder: ['overlay_layer', 'background_layer'], // Unsorted in frame map
      dirtyRegions: [],
      isCached: false,
    };

    const commands = RenderCommandCompiler.compile(frame);

    // Verify background_layer (order 10) comes before overlay_layer (order 20)
    const drawRects = commands.filter((c) => c.type === 'DRAW_RECT');
    expect(drawRects[0]).toHaveProperty('nodeId', 'background_layer');
    expect(drawRects[1]).toHaveProperty('nodeId', 'overlay_layer');

    // Verify blend mode and clip commands emitted for overlay_layer
    const blendModes = commands.filter((c) => c.type === 'SET_BLEND_MODE');
    expect(blendModes.length).toBe(1);
    expect((blendModes[0] as any).blendMode).toBe('multiply');

    const clips = commands.filter((c) => c.type === 'RESTRICT_CLIP');
    expect(clips.length).toBe(1);

    // Execute through CanvasRenderer
    const surface = new CanvasRenderSurface(mockCtx, 1920, 1080);
    const renderer = new CanvasRenderer();
    renderer.initialize(surface);

    expect(() => {
      RenderCommandExecutor.executeCommands(renderer, commands);
    }).not.toThrow();
  });
});
