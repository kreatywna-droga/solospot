import { describe, expect, it, vi } from 'vitest';
import { CanvasRenderer } from '../CanvasRenderer';
import { CanvasRenderSurface } from '../CanvasRenderSurface';
import { RendererCommand } from '../RendererCommand';

describe('CanvasRenderer Adapter Execution (S11)', () => {
  it('executes rect, text, transform, opacity, clip and save/restore commands', () => {
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      setTransform: vi.fn(),
      globalAlpha: 1.0,
      globalCompositeOperation: 'source-over',
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      clearRect: vi.fn(),
      font: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
    };

    const surface = new CanvasRenderSurface(mockCtx, 800, 600);
    const renderer = new CanvasRenderer();
    renderer.initialize(surface);

    renderer.beginFrame(0, 0);

    const commands: RendererCommand[] = [
      { type: 'CLEAR', color: '#000000' },
      { type: 'SAVE' },
      { type: 'SET_TRANSFORM', transform: [2, 0, 0, 2, 50, 100] },
      { type: 'SET_OPACITY', opacity: 0.5 },
      { type: 'SET_BLEND_MODE', blendMode: 'multiply' },
      { type: 'RESTRICT_CLIP', bounds: { x: 0, y: 0, width: 200, height: 200 } },
      { type: 'DRAW_RECT', nodeId: 'node1', bounds: { x: 10, y: 20, width: 100, height: 50 }, fillStyle: '#ff0000' },
      { type: 'DRAW_TEXT', nodeId: 'node2', bounds: { x: 10, y: 80, width: 100, height: 20 }, text: 'Hello S11' },
      { type: 'RESTORE' },
    ];

    renderer.executeCommands(commands);
    renderer.endFrame();

    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 50, 100);
    expect(mockCtx.globalAlpha).toBe(0.5);
    expect(mockCtx.globalCompositeOperation).toBe('multiply');
    expect(mockCtx.clip).toHaveBeenCalled();
    expect(mockCtx.fillRect).toHaveBeenCalled();
    expect(mockCtx.fillText).toHaveBeenCalledWith('Hello S11', 10, 80);
    expect(mockCtx.restore).toHaveBeenCalled();
  });
});
