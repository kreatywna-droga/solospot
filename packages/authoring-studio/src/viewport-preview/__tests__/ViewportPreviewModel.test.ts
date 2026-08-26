/**
 * ViewportPreviewModel.test.ts — Sprint S31 Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createViewportPreviewState,
  calculateFitScale,
  calculateEffectiveScale,
} from '../ViewportPreviewModel';

describe('ViewportPreviewModel', () => {
  it('calculates fit scale factor based on viewport and container bounds', () => {
    // Viewport 1440x900 inside container 1440x900 -> 1.0
    expect(calculateFitScale(1440, 900, 1440, 900)).toBe(1.0);

    // Viewport 1440x900 inside container 720x450 -> 0.5
    expect(calculateFitScale(1440, 900, 720, 450)).toBe(0.5);
  });

  it('calculates effective scale clamped to zoom limits', () => {
    expect(calculateEffectiveScale(1.0, 0.8)).toBe(0.8);
    expect(calculateEffectiveScale(2.0, 0.5)).toBe(1.0);
  });

  it('creates initial preview state with S21 camera and viewport configuration', () => {
    const state = createViewportPreviewState({ breakpointId: 'desktop', containerWidthPx: 1440, containerHeightPx: 900 });

    expect(state.activeBreakpointId).toBe('desktop');
    expect(state.viewportWidthPx).toBe(1440);
    expect(state.s21Camera.id).toBe('cam_preview_desktop');
    expect(state.s21ViewportConfig.id).toBe('vp_preview_desktop');
  });
});
