import { describe, it, expect } from 'vitest';
import {
  createPreviewRenderingBridgeState,
  updateCanvasPreviewScale,
  seekPreviewToTime,
} from '../PreviewRenderingBridge';

describe('PreviewRenderingBridge (Sprint S4, ETAP 3)', () => {
  it('creates bridge state with defaults', () => {
    const state = createPreviewRenderingBridgeState();
    expect(state.isCanvasConnected).toBe(true);
    expect(state.viewportScale).toBe(1.0);
    expect(state.session.currentTime).toBe(0);
  });

  it('clamps viewport scale to [0.25, 4.0]', () => {
    const state = createPreviewRenderingBridgeState();
    expect(updateCanvasPreviewScale(state, 0.1).viewportScale).toBe(0.25);
    expect(updateCanvasPreviewScale(state, 100).viewportScale).toBe(4.0);
    expect(updateCanvasPreviewScale(state, 1.5).viewportScale).toBe(1.5);
  });

  it('seeks preview canvas to target time immutably', () => {
    const state = createPreviewRenderingBridgeState();
    const updated = seekPreviewToTime(state, 500);
    expect(updated.session.currentTime).toBe(500);
    expect(updated.playheadSync.lastSource).toBe('timeline');
    expect(updated).not.toBe(state);
  });
});
