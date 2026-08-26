import { describe, expect, it } from 'vitest';
import { CanvasRenderer } from '../CanvasRenderer';
import { CanvasRenderSurface } from '../CanvasRenderSurface';
import { createInitialRendererState } from '../RendererState';

describe('RendererBackend & CanvasRenderSurface Contracts (S11)', () => {
  it('creates default renderer state with initial viewport and identity transform', () => {
    const state = createInitialRendererState(1920, 1080, 1.0);
    expect(state.viewportWidth).toBe(1920);
    expect(state.viewportHeight).toBe(1080);
    expect(state.devicePixelRatio).toBe(1.0);
    expect(state.currentOpacity).toBe(1.0);
    expect(state.currentBlendMode).toBe('source-over');
    expect(state.currentTransform).toEqual([1, 0, 0, 1, 0, 0]);
    expect(state.stackDepth).toBe(0);
  });

  it('initializes CanvasRenderer with a surface and updates initialized state', () => {
    const mockCtx = {
      save: () => {},
      restore: () => {},
      clearRect: () => {},
    };
    const surface = new CanvasRenderSurface(mockCtx, 1280, 720, 2.0);
    const renderer = new CanvasRenderer();

    expect(renderer.isInitialized).toBe(false);
    renderer.initialize(surface);
    expect(renderer.isInitialized).toBe(true);

    const state = renderer.getState();
    expect(state.viewportWidth).toBe(1280);
    expect(state.viewportHeight).toBe(720);
    expect(state.devicePixelRatio).toBe(2.0);

    renderer.destroy();
    expect(renderer.isInitialized).toBe(false);
  });
});
